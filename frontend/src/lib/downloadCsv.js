const UTF8_BYTE_ORDER_MARK = '﻿'; // lets Excel open UTF-8 CSVs with the right encoding

/** Quotes a cell when it contains a comma, quote or line break (RFC 4180). */
function escapeCsvCell(cellValue) {
  const cellText = cellValue == null ? '' : String(cellValue);
  return /[",\r\n]/.test(cellText) ? `"${cellText.replace(/"/g, '""')}"` : cellText;
}

/**
 * Builds a CSV from rows of cells and makes the browser download it.
 * @param {string} fileName
 * @param {Array<Array<string|number|null|undefined>>} csvRows
 */
export function downloadCsv(fileName, csvRows) {
  const csvContent = csvRows.map((csvRow) => csvRow.map(escapeCsvCell).join(',')).join('\r\n');
  const csvBlob = new Blob([UTF8_BYTE_ORDER_MARK + csvContent], { type: 'text/csv;charset=utf-8' });
  const downloadUrl = URL.createObjectURL(csvBlob);

  const downloadLink = document.createElement('a');
  downloadLink.href = downloadUrl;
  downloadLink.download = fileName;
  document.body.append(downloadLink);
  downloadLink.click();
  downloadLink.remove();
  URL.revokeObjectURL(downloadUrl);
}
