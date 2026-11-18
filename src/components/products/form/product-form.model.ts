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
  /** 판매가 (selling price) — what the cart and the order charge per item. */
  price: number | null;
  /** 단가 (unit price) — must be lower than `price` (API rule unitPriceMustBeLessThanPrice). */
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
  { step: 1, label: "기본 정보" },
  { step: 2, label: "이미지 및 상태" },
  { step: 3, label: "카테고리 및 옵션" },
  { step: 4, label: "ERP 정보 및 확인" },
];

export const LAST_STEP: StepNumber = 4;

/** "Next" validates only these fields (react-hook-form `trigger(STEP_FIELDS[step])`). */
export const STEP_FIELDS: Record<StepNumber, ProductFormField[]> = {
  1: ["productName", "productCode", "unitPrice", "price", "description"],
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
  { label: "과세", value: "tax" },
  { label: "비과세", value: "tax_free" },
];

export const YES_NO_OPTIONS: ReadonlyArray<{ label: string; value: YesNo }> = [
  { label: "예", value: "yes" },
  { label: "아니오", value: "no" },
];

export const FORM_MESSAGES = {
  productNameRequired: "상품명을 입력해 주세요.",
  productNameTooLong: `상품명은 최대 ${FORM_LIMITS.productNameMax}자까지 입력할 수 있습니다.`,
  productCodeMissing: "상품코드를 생성하지 못했습니다. [다시 생성] 버튼을 눌러 주세요.",
  priceRequired: "판매가를 입력해 주세요.",
  pricePositive: "판매가는 0보다 큰 값을 입력해 주세요.",
  unitPriceRequired: "단가를 입력해 주세요.",
  unitPricePositive: "단가는 0보다 큰 값을 입력해 주세요.",
  unitPriceNotLower: "단가는 판매가보다 낮아야 합니다.",
  moneyTooLarge: "금액은 최대 ₩2,147,483,647까지 입력할 수 있습니다.",
  descriptionRequired: "상세설명을 입력해 주세요.",
  imagesRequired: "이미지를 1장 이상 등록해 주세요.",
  imagesTooMany: `이미지는 최대 ${PRODUCT_RULES.images.max}장까지 등록 가능합니다. 초과한 이미지를 삭제해 주세요.`,
  imagesUploading: "이미지 업로드가 완료될 때까지 기다려 주세요.",
  isVisibleRequired: "노출상태를 선택해 주세요.",
  onSaleRequired: "판매상태를 선택해 주세요.",
  categoryRequired: "대분류를 선택해 주세요.",
  subCategoryRequired: "중분류를 선택해 주세요.",
  childCategoryRequired: "소분류를 선택해 주세요.",
  optionPriceRequired: "옵션 판매가를 입력해 주세요. (₩0 이상)",
  optionsRequired: "옵션을 1개 이상 추가하거나 “상품 구매 필수 옵션 선택”을 해제해 주세요.",
  erpNameRequired: "상품ERP명을 입력해 주세요.",
  erpNameTooLong: `상품ERP명은 최대 ${FORM_LIMITS.erpNameMax}자까지 입력할 수 있습니다.`,
  quantityRequired: "갯수를 입력해 주세요.",
  quantityPositive: "갯수는 1 이상의 숫자여야 합니다.",
  quantityTooLarge: "입력할 수 있는 갯수를 초과했습니다.",
  taxTypeRequired: "비과세를 선택해 주세요.",
  erpUnitPriceRequired: "ERP 단가를 입력해 주세요. (₩0 이상)",
  // Notice above the edit form when a saved draft is thrown away (see the draft restore in ProductForm)
  draftOutdated: "임시 저장된 내용을 불러오지 않았습니다. 임시 저장 이후 이 상품의 정보가 변경되어 현재 저장된 정보를 표시합니다.",
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
