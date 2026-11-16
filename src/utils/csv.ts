/**
 * One cell. A text that starts with = + - @ (or a tab or a carriage return) would be run as a formula by Excel,
 * so it gets a leading apostrophe and is shown as written ("CSV injection"). Then the cell is quoted when it
 * holds a comma, a quote or a line break (RFC 4180).
 */
const cell = (value: string | number): string => {
  const raw = String(value);
  const text = typeof value === "string" && /^[=+\-@\t\r]/.test(raw) ? `'${raw}` : raw;
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
