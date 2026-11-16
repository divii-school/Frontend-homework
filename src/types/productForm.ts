/** One image of a product: `filePath` is what the API stores, `preview` is a URL to show. */
export interface ProductImage {
  filePath: string;
  preview: string;
}

export type YesNo = "yes" | "no";
export type TaxType = "tax" | "tax_free";

/**
 * Everything the 8.1.1 / 8.1.2 form edits. Numbers are kept as strings while typing
 * (so "" and partial input are possible) and converted when the request is built.
 */
export interface ProductFormValues {
  // Step 1 — basic information
  productName: string;
  productCode: string;
  unitPrice: string;
  price: string;
  description: string;
  // Step 2 — images (up to 4)
  images: ProductImage[];
  // Step 3 — display and category
  isVisible: YesNo;
  onSale: YesNo;
  categoryId: number | null;
  subCategoryId: number | null;
  childCategoryId: number | null;
  // Step 4 — ERP
  erpCode: string;
  erpName: string;
  quantity: string;
  taxType: TaxType | "";
  erpUnitPrice: string;
}

export const EMPTY_PRODUCT_FORM: ProductFormValues = {
  productName: "",
  productCode: "",
  unitPrice: "",
  price: "",
  description: "",
  images: [],
  isVisible: "yes",
  onSale: "yes",
  categoryId: null,
  subCategoryId: null,
  childCategoryId: null,
  erpCode: "",
  erpName: "",
  quantity: "",
  taxType: "",
  erpUnitPrice: "",
};

/** Figma 8.1.1 #7: up to 4 images, 800×800 recommended. Size cap also keeps uploads under the hosting limit. */
export const PRODUCT_IMAGE_MAX = 4;
export const PRODUCT_IMAGE_MAX_BYTES = 3 * 1024 * 1024;
export const PRODUCT_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
