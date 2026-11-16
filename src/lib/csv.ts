/** Builds a CSV (RFC 4180 quoting, UTF-8 BOM so Excel shows Korean correctly) and downloads it. */
export function downloadCsv(filename: string, header: string[], rows: Array<Array<string | number>>): void {
  const escape = (value: string | number) => {
    const text = String(value);
    // Guard against spreadsheet formula injection (=, +, @, or "-" not followed by a digit, at the start).
    const safe = typeof value === "string" && /^([=+@]|-[^\d])/.test(text) ? `'${text}` : text;
    return /[",\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
  };
  const csv = [header, ...rows].map((row) => row.map(escape).join(",")).join("\r\n");
  const blob = new Blob(["﻿", csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
