export type CsvRow = Array<string | number | null | undefined>;

const escape = (value: CsvRow[number]) => {
  const text = value === null || value === undefined ? "" : String(value);
  return /[",\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
};

export function toCsv(headers: string[], rows: CsvRow[]) {
  return [headers, ...rows].map((row) => row.map(escape).join(",")).join("\r\n");
}

export function downloadCsv(filename: string, headers: string[], rows: CsvRow[]) {
  const blob = new Blob([toCsv(headers, rows)], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
