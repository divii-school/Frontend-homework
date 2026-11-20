// Builds docs/design-compare/<screen>-<width>-<theme>.png: Figma frame (left) | build screenshot (right).
// Figma only has desktop spec frames, so the left side is always the desktop design (light);
// the label says so. Run after `screens.real.spec.ts` has filled screenshots/.
//   node scripts/compose-design-compare.mjs
import { chromium } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const out = path.join(root, "docs", "design-compare");
fs.mkdirSync(out, { recursive: true });

// App area of each Figma export (px in the 1x export): skips the spec header and the DESCRIPTION column.
const FRAMES = {
  login: { file: "login-1.1.0.png", node: "1.1.0 Login", crop: [20, 100, 1465, 951] },
  categories: { file: "shop-8.2.0-product-category-management.png", node: "8.2.0 Product Category Management", crop: [20, 100, 1465, 1399] },
  products: { file: "shop-8.1.0-product-list.png", node: "8.1.0 Product Management", crop: [20, 100, 1465, 1399] },
  "product-new": { file: "shop-8.1.1-product-registration.png", node: "8.1.1 Product Registration", crop: [20, 100, 1465, 3320] },
  "product-edit": { file: "shop-8.1.2-product-editing.png", node: "8.1.2 Product Editing", crop: [20, 100, 1465, 2450] },
  "product-detail": null, // no Figma frame exists for this page
};
const WIDTHS = [1440, 768, 375];
const THEMES = ["light", "dark"];
const dataUrl = (file) => `data:image/png;base64,${fs.readFileSync(file).toString("base64")}`;

const browser = await chromium.launch();
const page = await browser.newPage({ deviceScaleFactor: 1 });
let made = 0;

for (const [screen, frame] of Object.entries(FRAMES)) {
  for (const width of WIDTHS) {
    for (const theme of THEMES) {
      const shot = path.join(root, "screenshots", `${screen}-${width}-${theme}.png`);
      if (!fs.existsSync(shot)) continue;
      const left = frame
        ? `<figure><figcaption>Figma · ${frame.node} (desktop frame${width === 1440 ? "" : " — Figma has no " + width + " frame"})</figcaption><canvas id="fig"></canvas></figure>`
        : `<figure><figcaption>Figma · no frame for this page</figcaption><div class="none">No Figma frame exists for the product details page.<br/>Built from the 8.1.0 / 8.2.0 components (see design questions).</div></figure>`;
      const html = `<!doctype html><html><head><meta charset="utf-8"><style>
        body{margin:0;padding:24px;background:#f2f3f5;font:14px/1.4 system-ui,sans-serif;color:#181818}
        h1{font-size:18px;margin:0 0 16px}
        .row{display:flex;gap:24px;align-items:flex-start}
        figure{margin:0;background:#fff;border:1px solid #ddd;border-radius:8px;padding:12px;width:720px}
        figcaption{font-weight:600;margin-bottom:8px}
        canvas,img{display:block;width:100%;height:auto;border:1px solid #eee}
        img.narrow{width:${Math.min(width, 720) * (width === 375 ? 1 : 1)}px;max-width:100%;margin:0 auto}
        .none{padding:80px 24px;text-align:center;color:#666;border:1px dashed #bbb}
      </style></head><body>
        <h1>${screen} · ${width}px · ${theme} — design | build (https://hw3-sandip.vercel.app)</h1>
        <div class="row">${left}
          <figure><figcaption>Build · ${width}px · ${theme}</figcaption><img class="${width < 720 ? "narrow" : ""}" src="${dataUrl(shot)}"></figure>
        </div></body></html>`;
      await page.setContent(html);
      if (frame) {
        const src = dataUrl(path.join(root, "docs", "figma", frame.file));
        await page.evaluate(
          async ({ src, crop }) => {
            const img = new Image();
            img.src = src;
            await img.decode();
            const [x, y, w, h] = crop;
            const canvas = document.getElementById("fig");
            canvas.width = w;
            canvas.height = Math.min(h, img.height - y);
            canvas.getContext("2d").drawImage(img, x, y, w, canvas.height, 0, 0, w, canvas.height);
          },
          { src, crop: frame.crop },
        );
      }
      await page.waitForFunction(() => [...document.images].every((i) => i.complete));
      await page.screenshot({ path: path.join(out, `${screen}-${width}-${theme}.png`), fullPage: true });
      made++;
    }
  }
}
await browser.close();
console.log(`made ${made} images in docs/design-compare/`);
