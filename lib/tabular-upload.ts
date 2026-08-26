import ExcelJS from "exceljs";

export type UploadedTable = { headers: string[]; rows: string[][] };

function parseCsvLine(line: string) {
  const values: string[] = []; let value = ""; let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"' && line[i + 1] === '"' && quoted) { value += '"'; i++; }
    else if (char === '"') quoted = !quoted;
    else if (char === "," && !quoted) { values.push(value.trim()); value = ""; }
    else value += char;
  }
  values.push(value.trim()); return values;
}

function excelCellText(value: ExcelJS.CellValue) {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "object") {
    if ("result" in value && value.result !== undefined) return String(value.result ?? "").trim();
    if ("text" in value) return String(value.text ?? "").trim();
    if ("richText" in value) return value.richText.map((part) => part.text).join("").trim();
  }
  return String(value).trim();
}

export async function readUploadedTable(file: File): Promise<UploadedTable> {
  const extension = file.name.toLowerCase().split(".").pop();
  if (extension === "xlsx") {
    const workbook = new ExcelJS.Workbook();
    // ExcelJS ships Buffer typings from an older Node release; runtime accepts the current Buffer.
    await workbook.xlsx.load(Buffer.from(await file.arrayBuffer()) as never);
    const sheet = workbook.worksheets[0];
    if (!sheet) return { headers: [], rows: [] };
    if (sheet.actualRowCount > 5_000 || sheet.actualColumnCount > 100) throw new Error("file_too_large");
    const width = sheet.actualColumnCount;
    const values: string[][] = [];
    sheet.eachRow({ includeEmpty: false }, (row) => {
      values.push(Array.from({ length: width }, (_, column) => excelCellText(row.getCell(column + 1).value)));
    });
    return { headers: values[0] || [], rows: values.slice(1).filter((row) => row.some(Boolean)) };
  }
  if (extension !== "csv") throw new Error("file_type");
  const lines = (await file.text()).replace(/^\uFEFF/, "").split(/\r?\n/).filter(Boolean);
  return { headers: parseCsvLine(lines[0] || ""), rows: lines.slice(1).map(parseCsvLine) };
}

export function normalizeSpreadsheetDate(value: string) {
  const text = value.trim();
  const direct = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (direct) return `${direct[1]}-${direct[2]}-${direct[3]}`;
  const serial = Number(text);
  if (Number.isFinite(serial) && serial > 0) {
    const date = new Date(Math.round((serial - 25569) * 86_400_000));
    if (!Number.isNaN(date.valueOf())) return date.toISOString().slice(0, 10);
  }
  const parsed = new Date(text);
  return Number.isNaN(parsed.valueOf()) ? null : parsed.toISOString().slice(0, 10);
}
