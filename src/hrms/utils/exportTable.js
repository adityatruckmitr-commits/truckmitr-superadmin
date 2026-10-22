// Dependency-free table export: CSV, or an Excel-openable .xls (an HTML table Excel reads natively).
// columns: [{ header: 'Name', value: (row) => row.name }]

const cell = (col, row) => {
  const v = col.value(row)
  return v === null || v === undefined ? '' : String(v)
}

const download = (content, filename, type) => {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export const exportCsv = (rows, columns, filename) => {
  const esc = (s) => (/[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s)
  const lines = [columns.map((c) => esc(c.header)).join(',')]
  rows.forEach((row) => lines.push(columns.map((c) => esc(cell(c, row))).join(',')))
  // BOM so Excel reads Hindi names / ₹ correctly.
  download('﻿' + lines.join('\r\n'), `${filename}.csv`, 'text/csv;charset=utf-8')
}

export const exportExcel = (rows, columns, filename, title) => {
  const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  // mso-number-format:\@ keeps phone numbers and ids as text (no 9.87E+09, no dropped leading zeros).
  const td = (s) => `<td style="mso-number-format:'\\@';border:1px solid #d1d5db;padding:4px 8px">${esc(s)}</td>`
  const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel">
<head><meta charset="utf-8"></head><body>
${title ? `<h3>${esc(title)}</h3>` : ''}
<table style="border-collapse:collapse;font-family:Calibri,Arial;font-size:11pt">
<thead><tr>${columns.map((c) => `<th style="background:#1e3a5f;color:#fff;border:1px solid #d1d5db;padding:6px 8px;text-align:left">${esc(c.header)}</th>`).join('')}</tr></thead>
<tbody>${rows.map((row) => `<tr>${columns.map((c) => td(cell(c, row))).join('')}</tr>`).join('')}</tbody>
</table></body></html>`
  download(html, `${filename}.xls`, 'application/vnd.ms-excel;charset=utf-8')
}
