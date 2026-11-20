import { z } from "zod";
import { apiRequest, request } from "@/services/http";
import type { CategoryRef } from "@/types/product";
import type { ProductFormValues, ProductImage, TaxType, YesNo } from "@/types/productForm";

/** Public base of the product image bucket; the API stores keys like "products/…/name.png". */
export const PRODUCT_IMAGE_BASE = "https://talking-club-dev.s3.ap-northeast-2.amazonaws.com";
export const imagePreviewUrl = (filePath: string) => (/^https?:\/\//.test(filePath) ? filePath : `${PRODUCT_IMAGE_BASE}/${filePath.replace(/^\/+/, "")}`);

/**
 * Any image reference → the storage key the API expects ("products/…/name.png").
 * The details endpoint returns full URLs; sending those back makes the server prefix its base
 * a second time (seen on QA 2026-11-16), so edit always sends keys.
 */
export function imageKey(ref: string): string {
  if (!/^https?:\/\//.test(ref)) return ref.replace(/^\/+/, "");
  const url = new URL(ref);
  // A doubled URL (".../https://bucket/products/...") → take the last real path.
  const path = decodeURIComponent(url.pathname).replace(/^\/+/, "");
  const nested = path.lastIndexOf("https:/");
  return (nested >= 0 ? new URL(path.slice(nested).replace(/^https:\/(?!\/)/, "https://")).pathname : `/${path}`).replace(/^\/+/, "");
}

// GET /api/v1/products/details/{id} — confirmed on QA 2026-11-16.
const categoryRef = z.object({ id: z.number(), name: z.string() }).nullable().optional();
const detailSchema = z.object({
  id: z.number(),
  productName: z.string(),
  productCode: z.string().nullable().optional(),
  price: z.number(),
  unitPrice: z.number().nullable().optional(),
  description: z.string().nullable().optional(),
  images: z.array(z.string()).nullable().optional(),
  isVisible: z.boolean(),
  onSale: z.boolean(),
  erpCode: z.string().nullable().optional(),
  erpName: z.string().nullable().optional(),
  erpUnitPrice: z.number().nullable().optional(),
  quantity: z.number().nullable().optional(),
  taxType: z.string().nullable().optional(),
  category: categoryRef,
  subCategory: categoryRef,
  childCategory: categoryRef,
  createdAt: z.string(),
  updatedAt: z.string().optional(),
});

export type ProductDetail = z.infer<typeof detailSchema>;

const optionList = z.array(z.object({ id: z.number(), name: z.string() }));

const yesNo = (value: boolean): YesNo => (value ? "yes" : "no");
const num = (value: string) => Number(value.replace(/,/g, ""));

/** Detail → form values (edit screen 8.1.2). */
export function detailToForm(d: ProductDetail): ProductFormValues {
  const images: ProductImage[] = (d.images ?? []).map((ref) => {
    const filePath = imageKey(ref);
    return { filePath, preview: imagePreviewUrl(filePath) };
  });
  return {
    productName: d.productName,
    productCode: d.productCode ?? "",
    unitPrice: d.unitPrice != null ? String(d.unitPrice) : "",
    price: String(d.price),
    description: d.description ?? "",
    images,
    isVisible: yesNo(d.isVisible),
    onSale: yesNo(d.onSale),
    categoryId: d.category?.id ?? null,
    subCategoryId: d.subCategory?.id ?? null,
    childCategoryId: d.childCategory?.id ?? null,
    erpCode: d.erpCode ?? "",
    erpName: d.erpName ?? "",
    quantity: d.quantity != null ? String(d.quantity) : "",
    taxType: d.taxType === "tax" || d.taxType === "tax_free" ? d.taxType : "",
    erpUnitPrice: d.erpUnitPrice != null ? String(d.erpUnitPrice) : "",
  };
}

/**
 * Form values → POST /products/add / PUT /products/edit/{id} body (validated before this is called).
 * No erpCode: the API assigns it and ignores a sent value (OpenAPI note, confirmed on QA 2026-11-16).
 */
export function formToBody(v: ProductFormValues, mode: "create" | "edit") {
  const body = {
    productName: v.productName.trim(),
    price: num(v.price),
    unitPrice: num(v.unitPrice),
    description: v.description.trim(),
    images: v.images.map((image) => imageKey(image.filePath)),
    isVisible: v.isVisible,
    onSale: v.onSale,
    isOptions: "no" as YesNo,
    categoryId: v.categoryId as number,
    subCategoryId: v.subCategoryId as number,
    childCategoryId: v.childCategoryId as number,
    erpName: v.erpName.trim(),
    quantity: num(v.quantity),
    taxType: v.taxType as TaxType,
    erpUnitPrice: num(v.erpUnitPrice),
  };
  return mode === "create" ? { ...body, productCode: v.productCode } : body;
}

export const productFormService = {
  async detail(id: number, signal?: AbortSignal): Promise<ProductDetail> {
    const data = await apiRequest<unknown>(`/api/v1/products/details/${id}`, { signal });
    return detailSchema.parse(data);
  },

  /** GET /products/generate-code → "PRD-020018" (Figma 8.1.1 #3: generated automatically). */
  async generateCode(): Promise<string> {
    return z.string().parse(await apiRequest<unknown>("/api/v1/products/generate-code"));
  },

  async majorCategories(): Promise<CategoryRef[]> {
    return optionList.parse(await apiRequest<unknown>("/api/v1/products/categories"));
  },
  async subCategories(categoryId: number): Promise<CategoryRef[]> {
    return optionList.parse(await apiRequest<unknown>(`/api/v1/products/subcategories/${categoryId}`));
  },
  async childCategories(subCategoryId: number): Promise<CategoryRef[]> {
    return optionList.parse(await apiRequest<unknown>(`/api/v1/products/childcategories/${subCategoryId}`));
  },

  async create(values: ProductFormValues): Promise<void> {
    await request<unknown>("/api/v1/products/add", { method: "POST", body: formToBody(values, "create") });
  },

  async update(id: number, values: ProductFormValues): Promise<void> {
    await request<unknown>(`/api/v1/products/edit/${id}`, { method: "PUT", body: formToBody(values, "edit") });
  },
};
