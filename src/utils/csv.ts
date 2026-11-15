/** Quote a cell when it holds a comma, a quote or a line break (RFC 4180). */
const cell = (value: string | number): string => {
  const text = String(value);
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

export const toCsv = (rows: Array<Array<string | number>>): string =>
  rows.map((row) => row.map(cell).join(",")).join("\r\n");

/** Save text as a file. The BOM makes Excel read Korean as UTF-8. */
export function downloadCsv(fileName: string, csv: string): void {
  const url = URL.createObjectURL(new Blob(["﻿", csv], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}
