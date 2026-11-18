import { MESSAGES } from "@/constants/messages";
import { IMAGE_RULES } from "@/constants/products";
import type { Product, ProductFormErrors, ProductFormValues, ProductRequest } from "@/types/product";
import { formatMegabytes } from "@/utils/format";

export const EMPTY_PRODUCT_FORM: ProductFormValues = {
  erpName: "",
  productName: "",
  productCode: "",
  taxType: "tax",
  quantity: "",
  unitPrice: "",
  erpUnitPrice: "",
  categoryId: null,
  subCategoryId: null,
  childCategoryId: null,
  description: "",
  images: [],
  isVisible: false,
  onSale: false,
  storedPrice: null,
};

const isWholeNumber = (value: string): boolean => /^\d+$/.test(value.trim());

/** 수량 × 단가, or null while either is not a whole number. 판매가 is never typed (the live admin does the same). */
export function salePrice(values: Pick<ProductFormValues, "quantity" | "unitPrice">): number | null {
  if (!isWholeNumber(values.quantity) || !isWholeNumber(values.unitPrice)) return null;
  return Number(values.quantity) * Number(values.unitPrice);
}

/**
 * The 판매가 the form shows and saves. A new product: 수량 × 단가, as in the live admin. An existing product
 * keeps its saved price until 수량 or 단가 is changed, so editing only the name never changes the price
 * (many products on the server have a price that is not 수량 × 단가, and 수량 0).
 */
export const formPrice = (values: Pick<ProductFormValues, "quantity" | "unitPrice" | "storedPrice">): number | null =>
  values.storedPrice ?? salePrice(values);

/**
 * The API's rules (class-validator on addProductDto): every field is required, numbers must be numbers,
 * at least one image. One function per step, so "next" checks only what the user can see.
 */
const STEP_RULES: Array<(values: ProductFormValues) => ProductFormErrors> = [
  (values) => {
    const errors: ProductFormErrors = {};
    if (!values.productName.trim()) errors.productName = MESSAGES.required("상품명");
    if (!values.productCode.trim()) errors.productCode = MESSAGES.required("상품코드");
    if (!values.erpName.trim()) errors.erpName = MESSAGES.required("상품 ERP명");
    return errors;
  },
  (values) => {
    const errors: ProductFormErrors = {};
    if (!isWholeNumber(values.quantity)) errors.quantity = "수량은 0 이상의 숫자로 입력해 주세요.";
    if (!isWholeNumber(values.unitPrice)) errors.unitPrice = "단가는 0 이상의 숫자로 입력해 주세요.";
    if (!isWholeNumber(values.erpUnitPrice)) errors.erpUnitPrice = "ERP 단가는 0 이상의 숫자로 입력해 주세요.";
    return errors;
  },
  (values) => {
    const errors: ProductFormErrors = {};
    if (values.categoryId === null) errors.categoryId = MESSAGES.selectRequired("대분류");
    if (values.subCategoryId === null) errors.subCategoryId = MESSAGES.selectRequired("중분류");
    if (values.childCategoryId === null) errors.childCategoryId = MESSAGES.selectRequired("소분류");
    return errors;
  },
  (values) => {
    const errors: ProductFormErrors = {};
    if (values.images.length === 0) errors.images = "이미지를 1장 이상 등록해 주세요.";
    if (!values.description.trim()) errors.description = MESSAGES.required("상세설명");
    return errors;
  },
];

export const validateStep = (step: number, values: ProductFormValues): ProductFormErrors => STEP_RULES[step](values);

/** Index of the first step that still has an error, or -1 when the whole form is valid. */
export const firstInvalidStep = (values: ProductFormValues): number =>
  STEP_RULES.findIndex((rule) => Object.keys(rule(values)).length > 0);

/** Why a picked file cannot be used, or null when it is fine. */
export function imageFileError(file: Pick<File, "type" | "size">, currentCount: number): string | null {
  if (currentCount >= IMAGE_RULES.maxCount) return `이미지는 최대 ${IMAGE_RULES.maxCount}장까지 등록할 수 있습니다.`;
  if (!(IMAGE_RULES.mimeTypes as readonly string[]).includes(file.type)) return "PNG, JPG, WEBP 이미지만 등록할 수 있습니다.";
  if (file.size > IMAGE_RULES.maxBytes) return `이미지는 ${formatMegabytes(IMAGE_RULES.maxBytes)} 이하만 등록할 수 있습니다.`;
  return null;
}

/**
 * The API keeps a product's image paths as ONE comma-separated text, and the path contains the file name,
 * so a comma in the name would split one image into two broken ones after saving. Commas are removed.
 */
export const uploadFileName = (name: string): string => name.replace(/,/g, "").trim() || "image";

/** Form values -> request body. Only called after every step is valid. */
export function toProductRequest(values: ProductFormValues): ProductRequest {
  return {
    productName: values.productName.trim(),
    productCode: values.productCode.trim(),
    price: formPrice(values) ?? 0,
    description: values.description.trim(),
    erpName: values.erpName.trim(),
    erpUnitPrice: Number(values.erpUnitPrice),
    taxType: values.taxType,
    quantity: Number(values.quantity),
    unitPrice: Number(values.unitPrice),
    categoryId: values.categoryId as number,
    subCategoryId: values.subCategoryId as number,
    childCategoryId: values.childCategoryId as number,
    images: values.images.map((image) => image.key),
    isVisible: values.isVisible ? "yes" : "no",
    onSale: values.onSale ? "yes" : "no",
  };
}

/** A product from the API -> form values for edit mode. */
export function toFormValues(product: Product): ProductFormValues {
  return {
    erpName: product.erpName,
    productName: product.productName,
    productCode: product.productCode,
    taxType: product.taxType,
    quantity: String(product.quantity),
    unitPrice: String(product.unitPrice),
    erpUnitPrice: String(product.erpUnitPrice),
    categoryId: product.category?.id ?? null,
    subCategoryId: product.subCategory?.id ?? null,
    childCategoryId: product.childCategory?.id ?? null,
    description: product.description,
    images: product.images.map((address) => {
      const key = storageKey(address);
      return { key, previewUrl: address, name: key.split("/").pop() ?? key };
    }),
    isVisible: product.isVisible,
    onSale: product.onSale,
    storedPrice: product.price,
  };
}

/**
 * Details return each image as a full address; the edit request wants the storage key ("products/…/a.png").
 * The key is the path of the address. A value that is already a key is returned as it is.
 */
export function storageKey(addressOrKey: string): string {
  try {
    return decodeURIComponent(new URL(addressOrKey).pathname.replace(/^\//, ""));
  } catch {
    return addressOrKey;
  }
}
