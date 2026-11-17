// Fixture data for scripts/screenshots/compare.mjs — same shapes as the release/qa API and as the
// e2e mocks (e2e/products-helpers.ts mockProduct / e2e/categories.helpers.ts sampleTree). Plain JS
// so the script runs with `node` (the e2e helpers are TypeScript and import from src/).
// Nothing here is real data: names look like the design (8.1.0 / 8.2.0), ids are made up.

export const CDN_ORIGIN = "https://hw3-shots-cdn.test";

// ---- Category tree (GET /product-category/list) — the same tree as e2e sampleTree() ---------------
export function categoryTree() {
  return [
    {
      id: 67,
      name: "Main",
      sortOrder: 1,
      subCategories: [
        {
          id: 72,
          name: "Phonics & Alphabet",
          sortOrder: 1,
          childCategories: [
            { id: 536, name: "ACE Alphabet", sortOrder: 1 },
            { id: 645, name: "ACE Phonics", sortOrder: 2 },
          ],
        },
        {
          id: 494,
          name: "ACE",
          sortOrder: 2,
          childCategories: [
            { id: 500, name: "Insider", sortOrder: 1 },
            { id: 501, name: "Adventurer", sortOrder: 2 },
          ],
        },
      ],
    },
    {
      id: 74,
      name: "Books",
      sortOrder: 2,
      subCategories: [
        { id: 166, name: "Booster", sortOrder: 1, childCategories: [] },
        { id: 168, name: "Racer", sortOrder: 2, childCategories: [] },
        { id: 169, name: "Junior", sortOrder: 3, childCategories: [] },
      ],
    },
    { id: 80, name: "Goods", sortOrder: 3, subCategories: [] },
  ];
}

// ---- Category pickers (GET /products/categories, /subcategories/:id, /childcategories/:id) ---------
export function pickerCategories() {
  return categoryTree().map(({ id, name }) => ({ id, name }));
}
export function pickerSubCategories(categoryId) {
  const category = categoryTree().find((item) => item.id === categoryId);
  return (category?.subCategories ?? []).map(({ id, name }) => ({ id, name }));
}
export function pickerChildCategories(subCategoryId) {
  for (const category of categoryTree()) {
    const sub = category.subCategories.find((item) => item.id === subCategoryId);
    if (sub) return sub.childCategories.map(({ id, name }) => ({ id, name }));
  }
  return [];
}

// ---- Products (list + details) --------------------------------------------------------------------
// One "series" per minor category; the cover colour + title make the thumbnails look like books.
const SERIES = [
  { title: "Insider Practice Book", cat: [67, "Main"], sub: [494, "ACE"], child: [500, "Insider"], colour: "#1f8a8a", price: 5000, unit: 4000 },
  { title: "ACE Phonics Practice Book", cat: [67, "Main"], sub: [72, "Phonics & Alphabet"], child: [645, "ACE Phonics"], colour: "#e2711d", price: 4000, unit: 3000 },
  { title: "Adventurer Student Book", cat: [67, "Main"], sub: [494, "ACE"], child: [501, "Adventurer"], colour: "#5b4bc4", price: 18000, unit: 15000 },
  { title: "ACE Alphabet Workbook", cat: [67, "Main"], sub: [72, "Phonics & Alphabet"], child: [536, "ACE Alphabet"], colour: "#d1495b", price: 6000, unit: 5000 },
  { title: "Booster Reader", cat: [74, "Books"], sub: [166, "Booster"], child: null, colour: "#2b6cb0", price: 12000, unit: 9900 },
  { title: "Racer Workbook", cat: [74, "Books"], sub: [168, "Racer"], child: null, colour: "#c05621", price: 9000, unit: 7500 },
];

const TOTAL_PRODUCTS = 128;

function cover(id) {
  return `${CDN_ORIGIN}/products/cover-${id}.svg`;
}

function product(id) {
  const series = SERIES[id % SERIES.length];
  const volume = (id % 6) + 1;
  // Every 7th product has no image → the grey placeholder of the design (8.1.0 #6)
  const hasImage = id % 7 !== 0;
  const created = new Date(Date.UTC(2025, 8, 12, 8, 10, 0) + id * 5 * 60 * 1000 + (id % 3) * 17 * 1000);
  return {
    id,
    uuid: `shots-${id}`,
    productName: `${series.title} ${volume}`,
    productCode: `PRD-${String(1000 + id).padStart(6, "0")}`,
    price: series.price,
    unitPrice: series.unit,
    description:
      `${series.title} ${volume} — practice pages for one month of classes.\n` +
      "A4, full colour, 96 pages. Answer key included at the back.",
    images: hasImage ? [`products/cover-${id}.svg`] : [],
    image: hasImage ? cover(id) : null,
    isVisible: id % 9 !== 0,
    onSale: id % 11 !== 0,
    isOptions: id % 4 === 0,
    erpCode: String(70000 + id),
    erpName: `${series.title} ${volume} (ERP)`,
    erpUnitPrice: Math.round(series.unit * 0.6),
    quantity: 1,
    taxType: id % 5 === 0 ? "tax_free" : "tax",
    category: { id: series.cat[0], name: series.cat[1] },
    subCategory: { id: series.sub[0], name: series.sub[1] },
    childCategory: series.child ? { id: series.child[0], name: series.child[1] } : null,
    createdBy: 1,
    isSuspended: false,
    isDeleted: false,
    createdAt: created.toISOString(),
    updatedAt: created.toISOString(),
  };
}

/** Newest first, like the API (id DESC). */
export const PRODUCTS = Array.from({ length: TOTAL_PRODUCTS }, (_, index) => product(TOTAL_PRODUCTS - index));

/** The product the details screenshot opens (has a minor category, options and 3 images). */
export const DETAILS_ID = 126;

export function productDetails(id) {
  const rest = { ...(PRODUCTS.find((item) => item.id === id) ?? product(id)) };
  delete rest.image; // details has `images` (full URLs) instead of the list's `image`
  // ids 6 apart share the series and volume → three images of the same book
  const images = [cover(id), cover(id - 6), cover(id - 12)];
  return {
    ...rest,
    images,
    isOptions: true,
    productOptions: [
      {
        optionGroup: 1,
        type: "SINGLE_VOLUME",
        option: [
          { optionId: id - 6, optionName: `${PRODUCTS.find((item) => item.id === id - 6)?.productName ?? "Workbook"}`, optionCode: `PRD-${String(1000 + id - 6).padStart(6, "0")}`, price: 3000 },
          { optionId: id - 12, optionName: `${PRODUCTS.find((item) => item.id === id - 12)?.productName ?? "Workbook"}`, optionCode: `PRD-${String(1000 + id - 12).padStart(6, "0")}`, price: 3000 },
        ],
      },
    ],
  };
}

/** Paged envelope like GET /products/get-products-by-category (+ the filters the list sends). */
export function productPage(searchParams) {
  const page = Number(searchParams.get("page") ?? "1");
  const limit = Number(searchParams.get("limit") ?? "10");
  const search = (searchParams.get("search") ?? "").toLowerCase();
  const categoryId = Number(searchParams.get("categoryId") ?? "0");
  const subCategoryId = Number(searchParams.get("subCategoryId") ?? "0");
  const childCategoryId = Number(searchParams.get("childCategoryId") ?? "0");
  const productType = searchParams.get("productType");
  const matches = PRODUCTS.filter(
    (item) =>
      (!search || item.productName.toLowerCase().includes(search)) &&
      (!categoryId || item.category?.id === categoryId) &&
      (!subCategoryId || item.subCategory?.id === subCategoryId) &&
      (!childCategoryId || item.childCategory?.id === childCategoryId) &&
      (!productType || (productType === "MAIN") === item.isOptions),
  );
  return {
    success: true,
    message: "",
    data: matches.slice((page - 1) * limit, page * limit),
    totalRecords: matches.length,
    totalPage: Math.ceil(matches.length / limit),
    page,
  };
}

// ---- Book-cover SVGs for the fake CDN --------------------------------------------------------------
function escapeXml(text) {
  return text.replace(/[<>&"']/g, (char) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&apos;" })[char]);
}

/** A 300×400 "book cover" for /products/cover-<id>.svg. */
export function coverSvg(id) {
  const item = product(((id - 1) % TOTAL_PRODUCTS) + 1);
  const series = SERIES[item.id % SERIES.length];
  const words = item.productName.split(" ");
  const volume = words.pop();
  const lines = [];
  for (const word of words) {
    const last = lines[lines.length - 1];
    if (last && `${last} ${word}`.length <= 12) lines[lines.length - 1] = `${last} ${word}`;
    else lines.push(word);
  }
  const title = lines
    .map((line, index) => `<text x="28" y="${120 + index * 38}" font-size="32" font-weight="700" fill="#ffffff">${escapeXml(line)}</text>`)
    .join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="400" viewBox="0 0 300 400" font-family="Segoe UI, Arial, sans-serif">
  <rect width="300" height="400" fill="${series.colour}"/>
  <rect x="0" y="0" width="16" height="400" fill="#000000" opacity="0.18"/>
  <circle cx="250" cy="330" r="90" fill="#ffffff" opacity="0.12"/>
  <text x="28" y="56" font-size="16" font-weight="600" fill="#ffffff" opacity="0.85">TalkingClub</text>
  ${title}
  <circle cx="232" cy="332" r="38" fill="#ffffff"/>
  <text x="232" y="346" font-size="38" font-weight="800" text-anchor="middle" fill="${series.colour}">${escapeXml(volume)}</text>
</svg>`;
}
