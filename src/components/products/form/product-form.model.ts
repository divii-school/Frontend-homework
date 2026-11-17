import type {
  ProductDetails,
  ProductFormPayload,
  ProductOptionsType,
  ProductSetInput,
  TaxType,
} from "@/api-services/ProductService.types";
import type { ApiError, YesNo } from "@/types/api";
import { PRODUCT_RULES } from "@/utils/constants";

// Everything the 4-step product form needs that is not UI: the form values, which step owns which
// field, the rules' messages, and the two mappings (API details → form values, form values → API body).

export type FormMode = "create" | "edit";
export type StepNumber = 1 | 2 | 3 | 4;

/** An uploaded image: `filePath` (S3 key) goes to the API, `preview` (public URL) is shown. */
export interface ProductImageValue {
  filePath: string;
  preview: string;
  name: string;
}

/** One single-item option row (design 8.1.1 #12 / 8.1.3): another product sold with this one. */
export interface ProductOptionRow {
  optionId: number;
  optionCode: string;
  optionName: string;
  price: number | null;
}

/** All four steps live in this ONE object (one useForm), so going back / forward never loses a value. */
export interface ProductFormValues {
  // Step 1 — basic info
  productName: string;
  productCode: string;
  price: number | null;
  unitPrice: number | null;
  description: string;
  // Step 2 — images & status
  images: ProductImageValue[];
  isVisible: YesNo | null;
  onSale: YesNo | null;
  // Step 3 — category & options
  categoryId: number | null;
  subCategoryId: number | null;
  childCategoryId: number | null;
  options: ProductOptionRow[];
  optionsRequired: boolean;
  // Step 4 — ERP
  erpName: string;
  quantity: number | null;
  taxType: TaxType | null;
  erpUnitPrice: number | null;
}

export type ProductFormField = keyof ProductFormValues;

export const STEPS: ReadonlyArray<{ step: StepNumber; label: string }> = [
  { step: 1, label: "Basic info" },
  { step: 2, label: "Images & status" },
  { step: 3, label: "Category & options" },
  { step: 4, label: "ERP & review" },
];

export const LAST_STEP: StepNumber = 4;

/** "Next" validates only these fields (react-hook-form `trigger(STEP_FIELDS[step])`). */
export const STEP_FIELDS: Record<StepNumber, ProductFormField[]> = {
  1: ["productName", "productCode", "price", "unitPrice", "description"],
  2: ["images", "isVisible", "onSale"],
  3: ["categoryId", "subCategoryId", "childCategoryId", "options", "optionsRequired"],
  4: ["erpName", "quantity", "taxType", "erpUnitPrice"],
};

export function stepOfField(field: ProductFormField): StepNumber {
  const found = STEPS.find(({ step }) => STEP_FIELDS[step].includes(field));
  return found ? found.step : 1;
}

/** `?step=` from the URL → 1..4 (anything else is step 1). */
export function parseStep(raw: string | null): StepNumber {
  const value = Number(raw);
  return value === 2 || value === 3 || value === 4 ? value : 1;
}

export const SINGLE_VOLUME: ProductOptionsType = "SINGLE_VOLUME";

/** Limits: design 8.1.2 (name ≤ 100) + the DB (price / quantity columns are MySQL INT, names VARCHAR(255)). */
export const FORM_LIMITS = {
  productNameMax: 100,
  erpNameMax: 255,
  intMax: 2_147_483_647,
} as const;

export const TAX_TYPE_OPTIONS: ReadonlyArray<{ label: string; value: TaxType }> = [
  { label: "Taxable", value: "tax" },
  { label: "Tax-exempt", value: "tax_free" },
];

export const YES_NO_OPTIONS: ReadonlyArray<{ label: string; value: YesNo }> = [
  { label: "Yes", value: "yes" },
  { label: "No", value: "no" },
];

export const FORM_MESSAGES = {
  productNameRequired: "Enter the product name.",
  productNameTooLong: `The product name can be up to ${FORM_LIMITS.productNameMax} characters.`,
  productCodeMissing: "The product code could not be generated. Press Regenerate.",
  priceRequired: "Enter the unit price.",
  pricePositive: "The unit price must be greater than ₩0.",
  unitPriceRequired: "Enter the selling price.",
  unitPricePositive: "The selling price must be greater than ₩0.",
  unitPriceNotLower: "The selling price must be lower than the unit price.",
  moneyTooLarge: "The amount can be up to ₩2,147,483,647.",
  descriptionRequired: "Enter the detailed description.",
  imagesRequired: "Add at least one image.",
  imagesTooMany: `Up to ${PRODUCT_RULES.images.max} images can be registered. Remove the extra images.`,
  imagesUploading: "Wait until the images finish uploading.",
  isVisibleRequired: "Select the exposure status.",
  onSaleRequired: "Select the sales status.",
  categoryRequired: "Select a major category.",
  subCategoryRequired: "Select a medium category.",
  childCategoryRequired: "Select a minor category.",
  optionPriceRequired: "Enter the option price (₩0 or more).",
  optionsRequired: "Add at least one option, or turn off “Required option for purchase”.",
  erpNameRequired: "Enter the ERP product name.",
  erpNameTooLong: `The ERP product name can be up to ${FORM_LIMITS.erpNameMax} characters.`,
  quantityRequired: "Enter the quantity.",
  quantityPositive: "The quantity must be greater than 0.",
  quantityTooLarge: "The quantity is too large.",
  taxTypeRequired: "Select the tax type.",
  erpUnitPriceRequired: "Enter the ERP unit price (₩0 or more).",
  // Notice above the edit form when a saved draft is thrown away (see the draft restore in ProductForm)
  draftOutdated: "Your saved draft was not restored: this product was changed after the draft was saved. The form shows the current data.",
} as const;

export const EMPTY_PRODUCT_VALUES: ProductFormValues = {
  productName: "",
  productCode: "",
  price: null,
  unitPrice: null,
  description: "",
  images: [],
  isVisible: null,
  onSale: null,
  categoryId: null,
  subCategoryId: null,
  childCategoryId: null,
  options: [],
  optionsRequired: false,
  erpName: "",
  quantity: null,
  taxType: null,
  erpUnitPrice: null,
};

// ---- API details → form values (edit mode) ------------------------------------------------------

function toNumberOrNull(value: unknown): number | null {
  const numeric = typeof value === "number" ? value : Number(value);
  return value === null || value === undefined || value === "" || Number.isNaN(numeric) ? null : Math.trunc(numeric);
}

/**
 * Details sends every image as a full URL (`IMG_AWS` + S3 key, e.g.
 * https://bucket.s3.ap-northeast-2.amazonaws.com/products/abc/photo.png). The API wants the key back,
 * so we cut the origin off. A value that is already a key (no http) is kept as it is.
 */
export function imageFromStored(value: string): ProductImageValue {
  const isUrl = /^https?:\/\//i.test(value);
  const filePath = isUrl ? value.replace(/^https?:\/\/[^/]+\//i, "").split(/[?#]/)[0] : value;
  return { filePath, preview: isUrl ? value : "", name: filePath.split("/").pop() || filePath };
}

export function valuesFromDetails(product: ProductDetails): ProductFormValues {
  const singleRows = (product.productOptions ?? [])
    .filter((set) => set.type === SINGLE_VOLUME)
    .flatMap((set) =>
      set.option.map<ProductOptionRow>((option) => ({
        optionId: option.optionId,
        optionCode: option.optionCode ?? "",
        optionName: option.optionName ?? "",
        price: toNumberOrNull(option.price),
      })),
    );
  const taxType = product.taxType === "tax" || product.taxType === "tax_free" ? product.taxType : null;

  return {
    productName: product.productName ?? "",
    productCode: product.productCode ?? "",
    price: toNumberOrNull(product.price),
    unitPrice: toNumberOrNull(product.unitPrice),
    description: product.description ?? "",
    images: (product.images ?? []).filter((image) => typeof image === "string" && image).map(imageFromStored),
    isVisible: product.isVisible ? "yes" : "no",
    onSale: product.onSale ? "yes" : "no",
    categoryId: product.category?.id ?? null,
    subCategoryId: product.subCategory?.id ?? null,
    childCategoryId: product.childCategory?.id ?? null,
    options: singleRows,
    optionsRequired: Boolean(product.isOptions),
    erpName: product.erpName ?? "",
    quantity: toNumberOrNull(product.quantity),
    taxType,
    erpUnitPrice: toNumberOrNull(product.erpUnitPrice),
  };
}

/** Option sets this form does not edit (category options made in the real admin) — re-sent unchanged. */
export function keptOptionSets(original?: ProductDetails): ProductSetInput[] {
  return (original?.productOptions ?? [])
    .filter((set) => set.type !== SINGLE_VOLUME)
    .map((set) => ({
      optionGroup: set.optionGroup,
      type: set.type,
      option: set.option.map((option) => ({ optionId: option.optionId, price: Number(option.price) || 0 })),
    }));
}

// ---- Form values → API body ------------------------------------------------------------------------

/**
 * Body for POST /products/add and PUT /products/edit/:id (productCode is added by the caller on create).
 * Options: the rows picked in 8.1.3 go out as one SINGLE_VOLUME set; on edit, other option sets of the
 * product are sent back unchanged (the API replaces ALL option rows whenever productSets is not empty).
 */
export function toPayload(values: ProductFormValues, original?: ProductDetails): ProductFormPayload {
  const others = keptOptionSets(original);
  const singleGroup =
    original?.productOptions.find((set) => set.type === SINGLE_VOLUME)?.optionGroup ??
    Math.max(0, ...others.map((set) => set.optionGroup)) + 1;
  const singleSet: ProductSetInput[] =
    values.options.length > 0
      ? [
          {
            optionGroup: singleGroup,
            type: SINGLE_VOLUME,
            option: values.options.map((row) => ({ optionId: row.optionId, price: row.price ?? 0 })),
          },
        ]
      : [];
  const productSets = [...others, ...singleSet];

  return {
    productName: values.productName.trim(),
    price: values.price ?? 0,
    unitPrice: values.unitPrice ?? 0,
    description: values.description.trim(),
    images: values.images.map((image) => image.filePath),
    isVisible: values.isVisible ?? "yes",
    onSale: values.onSale ?? "yes",
    categoryId: values.categoryId ?? 0,
    subCategoryId: values.subCategoryId ?? 0,
    childCategoryId: values.childCategoryId ?? 0,
    isOptions: values.optionsRequired ? "yes" : "no",
    productSets: productSets.length > 0 ? productSets : undefined,
    erpName: values.erpName.trim(),
    quantity: values.quantity ?? 0,
    taxType: values.taxType ?? "tax",
    erpUnitPrice: values.erpUnitPrice ?? 0,
  };
}

// ---- API error → form fields -------------------------------------------------------------------------

/** Business error keys that belong to one field. */
const MESSAGE_KEY_FIELDS: Record<string, ProductFormField> = {
  unitPriceMustBeLessThanPrice: "unitPrice",
  someProductDoesNotExist: "options",
  productOptionsRequired: "optionsRequired",
  "At least one image is required": "images",
};

/** DTO field names that differ from the form's names. */
const API_FIELD_NAMES: Record<string, ProductFormField> = {
  productSets: "options",
  isOptions: "optionsRequired",
};

function isFormField(name: string): name is ProductFormField {
  return Object.prototype.hasOwnProperty.call(EMPTY_PRODUCT_VALUES, name);
}

/** Which fields an API error points at (business key and/or DTO validation messages). */
export function fieldErrorsFromApi(error: ApiError): Array<{ field: ProductFormField; message: string }> {
  const result: Array<{ field: ProductFormField; message: string }> = [];
  const keyField = MESSAGE_KEY_FIELDS[error.messageKey];
  if (keyField) result.push({ field: keyField, message: error.message });

  Object.entries(error.fieldErrors ?? {}).forEach(([apiField, message]) => {
    const field = API_FIELD_NAMES[apiField] ?? (isFormField(apiField) ? apiField : null);
    if (field && !result.some((entry) => entry.field === field)) result.push({ field, message });
  });
  return result;
}
