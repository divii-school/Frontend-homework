import { describe, expect, it } from "vitest";
import { canDo, canOpen, visibleNavItems } from "@/config/navigation";
import type { AuthUser } from "@/types/auth";
import { toCsv } from "@/utils/csv";
import { formatDateTime, formatWon } from "@/utils/format";
import { MESSAGES } from "@/constants/messages";
import { withDirectionParticle, withObjectParticle } from "@/utils/korean";
import { koreanForKey, koreanForValidationList } from "@/utils/api-messages";
import { parseProductParams, toProductQuery } from "@/utils/product-params";
import { EMPTY_PRODUCT_FORM, firstInvalidStep, imageFileError, salePrice, storageKey, toProductRequest, uploadFileName, validateStep } from "@/utils/product-rules";
import { isTokenValid, safeRedirectPath } from "@/utils/session";

const user = (role: string, permissions: AuthUser["permissions"]): AuthUser => ({ id: 1, uuid: "u", fullName: "Tester", userId: "tester", role, permissions });

describe("permissions (one config for menu, guard and buttons)", () => {
  it("SUPER_ADMIN may open and do everything without a grant", () => {
    const admin = user("SUPER_ADMIN", []);
    expect(visibleNavItems(admin).map((item) => item.key)).toEqual(["products", "categories"]);
    expect(canDo(admin, "product.delete")).toBe(true);
  });

  it("a grant opens only its own page, including sub-pages", () => {
    const categoryOnly = user("GENERAL_ADMIN", [{ module: "shopping_mall", subModules: ["category_management"] }]);
    expect(canOpen(categoryOnly, "/categories")).toBe(true);
    expect(canOpen(categoryOnly, "/products")).toBe(false);
    expect(canOpen(categoryOnly, "/products/20000/edit")).toBe(false);
  });

  it("every action, delete included, follows the page permission only (no invented role list)", () => {
    const master = user("MASTER_ADMIN", ["product_management"]);
    expect(canDo(master, "product.write")).toBe(true);
    expect(canDo(master, "product.delete")).toBe(true);
    expect(canDo(master, "category.delete")).toBe(false);
  });

  it("nobody signed in may open nothing", () => {
    expect(canOpen(null, "/products")).toBe(false);
    expect(visibleNavItems(null)).toEqual([]);
  });
});

describe("product list state in the URL", () => {
  it("falls back to defaults for missing or invalid values", () => {
    const params = parseProductParams(new URLSearchParams("page=abc&limit=7&sort=hack&order=up&categoryId=-1"));
    expect(params).toMatchObject({ page: 1, limit: 10, sort: "createdAt", order: "desc", categoryId: null, type: "productName" });
  });

  it("round-trips and leaves defaults out of the query string", () => {
    const params = parseProductParams(new URLSearchParams("page=3&limit=20&search=FLY&sort=price&order=asc"));
    expect(toProductQuery(params)).toBe("page=3&limit=20&search=FLY&sort=price&order=asc");
    expect(toProductQuery(parseProductParams(new URLSearchParams("")))).toBe("");
  });
});

describe("product form rules", () => {
  const valid = {
    ...EMPTY_PRODUCT_FORM,
    productName: "HW3-Sachin-A",
    productCode: "PRD-1",
    erpName: "ERP",
    quantity: "2",
    unitPrice: "1500",
    erpUnitPrice: "1000",
    categoryId: 1,
    subCategoryId: 2,
    childCategoryId: 3,
    description: "text",
    images: [{ key: "products/a.png", previewUrl: "https://x/products/a.png", name: "a.png" }],
  };

  it("each step reports only its own fields", () => {
    expect(Object.keys(validateStep(0, EMPTY_PRODUCT_FORM)).sort()).toEqual(["erpName", "productCode", "productName"]);
    expect(Object.keys(validateStep(1, { ...EMPTY_PRODUCT_FORM, quantity: "x", unitPrice: "x", erpUnitPrice: "-1" })).sort()).toEqual(["erpUnitPrice", "quantity", "unitPrice"]);
    // 0 is a valid quantity (the API's rule is only "a number"; many saved products have 0)
    expect(validateStep(1, { ...EMPTY_PRODUCT_FORM, quantity: "0", unitPrice: "0", erpUnitPrice: "0" })).toEqual({});
    expect(Object.keys(validateStep(3, EMPTY_PRODUCT_FORM)).sort()).toEqual(["description", "images"]);
  });

  it("finds the first invalid step, or none", () => {
    expect(firstInvalidStep(valid)).toBe(-1);
    expect(firstInvalidStep({ ...valid, childCategoryId: null })).toBe(2);
  });

  it("sale price is quantity × unit price, and the request uses the API's yes/no strings", () => {
    expect(salePrice({ quantity: "3", unitPrice: "1500" })).toBe(4500);
    expect(salePrice({ quantity: "", unitPrice: "1500" })).toBeNull();
    expect(toProductRequest(valid)).toMatchObject({ price: 3000, quantity: 2, isVisible: "no", onSale: "no", images: ["products/a.png"] });
    // Edit mode keeps the saved price, even when it is not 수량 × 단가
    expect(toProductRequest({ ...valid, storedPrice: 1500 }).price).toBe(1500);
  });

  it("checks image count, type and size before any upload", () => {
    expect(imageFileError({ type: "image/png", size: 1024 }, 0)).toBeNull();
    expect(imageFileError({ type: "text/plain", size: 10 }, 0)).toContain("PNG");
    expect(imageFileError({ type: "image/png", size: 5 * 1024 * 1024 }, 0)).toContain("4MB");
    expect(imageFileError({ type: "image/png", size: 4 * 1024 * 1024 }, 0)).toBeNull();
    expect(imageFileError({ type: "image/png", size: 10 }, 4)).toContain("최대 4장");
  });

  it("turns a full image address back into its storage key", () => {
    expect(storageKey("https://bucket.s3.amazonaws.com/products/1-a/HW3%20test.png")).toBe("products/1-a/HW3 test.png");
    expect(storageKey("products/1-a/x.png")).toBe("products/1-a/x.png");
  });
});

describe("WM formats", () => {
  it("won: three-digit comma, no decimals, unit with no space", () => {
    expect(formatWon(1980000)).toBe("1,980,000원");
  });

  it("Korean date: no leading zero on month/day, 오전/오후 before the time", () => {
    expect(formatDateTime(new Date(2026, 4, 7, 20, 3).toISOString())).toBe("2026년 5월 7일 오후 08:03");
    expect(formatDateTime(new Date(2026, 10, 13, 0, 9).toISOString())).toBe("2026년 11월 13일 오전 12:09");
  });

  it("CSV quotes commas and quotes", () => {
    expect(toCsv([["a,b", 'say "hi"', 3]])).toBe('"a,b","say ""hi""",3');
    // A text that Excel would run as a formula is written as text
    expect(toCsv([["=1+1", "@SUM(A1)", -5]])).toBe("'=1+1,'@SUM(A1),-5");
  });
});

describe("Korean particles", () => {
  it("을 after a final consonant, 를 after a vowel", () => {
    expect(withObjectParticle("상품명")).toBe("상품명을");
    expect(withObjectParticle("아이디")).toBe("아이디를");
    expect(MESSAGES.required("비밀번호")).toBe("비밀번호를 입력해 주세요.");
    expect(MESSAGES.selectRequired("대분류")).toBe("대분류를 선택해 주세요.");
    expect(MESSAGES.required("중분류 이름")).toBe("중분류 이름을 입력해 주세요.");
  });

  it("로 after a vowel or ㄹ, 으로 after another consonant", () => {
    expect(withDirectionParticle("상품 카테고리 관리")).toBe("상품 카테고리 관리로");
    expect(withDirectionParticle("서울")).toBe("서울로");
    expect(withDirectionParticle("목록")).toBe("목록으로");
  });
});

describe("session helpers", () => {
  const token = (exp: number) => `x.${btoa(JSON.stringify({ exp }))}.y`;

  it("a token is valid only before its expiry", () => {
    expect(isTokenValid(token(2000), 1_000_000)).toBe(true);
    expect(isTokenValid(token(500), 1_000_000)).toBe(false);
    expect(isTokenValid("garbage")).toBe(false);
    expect(isTokenValid(undefined)).toBe(false);
  });

  it("only paths inside the app are accepted as a return address", () => {
    expect(safeRedirectPath("/products?page=2")).toBe("/products?page=2");
    expect(safeRedirectPath("https://example.com")).toBe("/products");
    expect(safeRedirectPath("//example.com")).toBe("/products");
    expect(safeRedirectPath("/auth/login")).toBe("/products");
    expect(safeRedirectPath(null)).toBe("/products");
    // Browsers read a backslash as a slash and drop tabs, so these lead to another site
    expect(safeRedirectPath("/\\example.com")).toBe("/products");
    expect(safeRedirectPath("/\t/example.com")).toBe("/products");
  });
});

describe("API errors are always shown in Korean (no key, no English sentence)", () => {
  const hangul = /[가-힣]/;

  it("known keys use their sentence; the login texts follow the Korean login frame", () => {
    expect(koreanForKey("invalidCredentials", 400)).toBe("등록되지 않은 계정입니다.");
    expect(koreanForKey("invalidPassword", 400)).toBe("아이디와 비밀번호가 일치하지 않습니다. 다시 확인해 주세요.");
    expect(koreanForKey("subCategoryAlreadyExists", 400)).toBe("같은 이름의 중분류가 이미 있습니다.");
  });

  it("an unknown key gets a Korean sentence by its shape or status, never the key", () => {
    for (const [key, status] of [["someThingNotFound", 400], ["brandNewAlreadyExists", 409], ["photoLimitReached", 400], ["fooMustBePositive", 400], ["whatever", 400], ["whatever", 500], ["whatever", 403]] as const) {
      const text = koreanForKey(key, status);
      expect(text).not.toContain(key);
      expect(text).toMatch(hangul);
    }
    expect(koreanForKey("someThingNotFound", 400)).toBe(MESSAGES.notFound);
    expect(koreanForKey("whatever", 500)).toBe(MESSAGES.server);
  });

  it("English validation sentences become Korean, one line per field", () => {
    expect(koreanForValidationList(["productName should not be empty", "unitPrice must be a number conforming to the specified constraints", "productName should not be empty"]))
      .toEqual(["상품명을 입력해 주세요.", "단가는 올바른 숫자로 입력해 주세요."]);
    expect(koreanForValidationList(["name must be shorter than or equal to 50 characters"])).toEqual(["카테고리 이름의 글자 수를 확인해 주세요."]);
    expect(koreanForValidationList(["property foo should not exist"])).toEqual([MESSAGES.checkInput]);
    expect(koreanForValidationList([])).toEqual([MESSAGES.checkInput]);
  });
});

describe("image upload", () => {
  it("a comma in a file name is removed, because the API keeps image paths as one comma-separated text", () => {
    expect(uploadFileName("racer, blue.png")).toBe("racer blue.png");
    expect(uploadFileName(",,,")).toBe("image");
    expect(uploadFileName("plain.png")).toBe("plain.png");
  });
});
