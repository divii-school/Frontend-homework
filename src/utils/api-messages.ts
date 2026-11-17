// API message keys → readable English.
//
// talking-club-backend (release/qa) answers with plain keys (there are no i18n files on that branch):
// `throw new BadRequestException('productNotFound')`, `return { message: 'productDeletedSucessFully' }`.
// The spelling of the keys (Sucess, SuccessFull) is the backend's — keep it as is.
// Unknown keys fall back to a humanised version of the key ("someNewKey" → "Some new key").

export const API_MESSAGES: Record<string, string> = {
  // ---- Auth (src/modules/auth/v1/auth.service.ts → authenticateCredentials) ----------------------
  invalidCredentials: "This account is not registered.",
  invalidPassword: "The ID and password do not match. Please check and try again.",
  userSuspended: "This account is suspended. Please contact the customer center.",
  userDeleted: "This account has been deleted. Please contact the customer center.",
  tooManyRequests: "Too many attempts. Please wait a moment and try again.",
  Unauthorized: "Your session has expired. Please log in again.",
  loginSuccess: "Logged in.",
  adminLogout: "Logged out.",
  noAdminPermission: "You do not have admin permission. Please contact the customer center.",

  // ---- Generic (GlobalExceptionFilter / local) ----------------------------------------------------
  "You do not have permission to access this resource": "You do not have permission to do this.",
  "Something went wrong": "Something went wrong on the server. Please try again.",
  "Internal server error": "Something went wrong on the server. Please try again.",
  "Validation Error": "Please check the highlighted fields.",
  networkError: "Cannot reach the server. Check your connection and try again.",
  requestTimeout: "The server took too long to answer. Please try again.",
  sessionExpired: "Your session has expired. Please log in again.",
  forbidden: "You do not have permission to do this.",
  notFound: "The requested data could not be found.",
  serverError: "Something went wrong on the server. Please try again.",
  noRecordFound: "No data was found.",

  // ---- Product categories (src/modules/product-categories/v1/category.service.ts) ---------------
  categoryAlreadyExists: "A category with this name already exists.",
  subCategoryAlreadyExists: "A middle category with this name already exists in this category.",
  childSubcategoryAlreadyExists: "A minor category with this name already exists in this middle category.",
  maximumCategoryLimitReached: "You can register up to 3 top-level categories.",
  categoryNotFound: "This category no longer exists.",
  subCategoryNotFound: "This middle category no longer exists.",
  childSubcategoryNotFound: "This minor category no longer exists.",
  categoryAddedSucessFully: "Category added.",
  categoryUpdatedSucessFully: "Category updated.",
  categoryDeletedSuccessFull: "Category deleted.",
  subCategoryAddedSucessFully: "Middle category added.",
  subCategoryUpdatedSucessFully: "Middle category updated.",
  subCategoryDeletedSuccessFull: "Middle category deleted.",
  childSubcategoryAddedSucessFully: "Minor category added.",
  childSubcategoryUpdatedSucessFully: "Minor category updated.",
  childSubcategoryDeletedSuccessFull: "Minor category deleted.",
  orderSwappedSuccessfully: "Order saved.",

  // ---- Products (src/modules/products/v1/product.service.ts) ------------------------------------
  productNotFound: "This product no longer exists.",
  unitPriceMustBeLessThanPrice: "The selling price must be lower than the unit price.",
  someProductDoesNotExist: "One of the selected option products no longer exists.",
  productOptionsRequired: "Add at least one option.",
  // The backend answers productCreatedSucessFully for both add AND edit — screens pick their own text.
  productCreatedSucessFully: "Product saved.",
  productDeletedSucessFully: "Product deleted.",
  productStatusUpdatedSuccessfully: "Visibility updated.",
  erpCodeAlreadyExists: "This ERP code is already in use.",
  erpCodeAvailable: "This ERP code is available.",
  "At least one image is required": "Add at least one image.",

  // ---- Upload (src/modules/utils/v1 → POST /utils/upload-file-urls) ------------------------------
  urlGeneratedSuccessfully: "Upload URL ready.",
  fileFormatNotAllowed: "This file type is not allowed.",
  FileSizeExceeded: "The file is too large.",
  uploadFailed: "The image could not be uploaded. Please try again.",
  // ---- Upload, this app's own server route (src/app/api/upload/route.ts) --------------------------
  uploadTooLarge: "The image is too large to upload. Please choose a smaller file.",
  uploadUrlNotAllowed: "The image could not be uploaded: the upload address was not accepted.",
};

/** "categoryAlreadyExists" / "category_already_exists" → "Category already exists". */
export function humanizeKey(key: string): string {
  const spaced = key
    .replace(/[_-]+/g, " ")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
  if (!spaced) return API_MESSAGES.serverError;
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

/** Readable English for an API message key (falls back to the humanised key). */
export function getApiMessage(key: string | null | undefined, fallback?: string): string {
  if (!key) return fallback ?? API_MESSAGES.serverError;
  if (Object.prototype.hasOwnProperty.call(API_MESSAGES, key)) return API_MESSAGES[key];
  // Sentences (class-validator: "name should not be empty") are already readable
  if (/\s/.test(key)) return key.charAt(0).toUpperCase() + key.slice(1);
  return fallback ?? humanizeKey(key);
}
