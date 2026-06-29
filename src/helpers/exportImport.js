const { sendSuccess } = require('./response');

const escapeCsv = (value) => {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

const toCsv = (rows, columns) => {
  const header = columns.map((c) => escapeCsv(c.label)).join(',');
  const lines = rows.map((row) =>
    columns.map((c) => escapeCsv(typeof c.accessor === 'function' ? c.accessor(row) : row[c.key])).join(',')
  );
  return [header, ...lines].join('\n');
};

const sendExport = (res, { format, filename, rows, columns, jsonData }) => {
  const fmt = (format || 'json').toLowerCase();

  if (fmt === 'csv') {
    const content = toCsv(rows, columns);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);
    return res.status(200).send(content);
  }

  return sendSuccess(res, jsonData ?? rows, 'Export generated');
};

const parseCsv = (content) => {
  const lines = content.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
  const records = [];

  for (let i = 1; i < lines.length; i += 1) {
    const values = [];
    let current = '';
    let inQuotes = false;

    for (let j = 0; j < lines[i].length; j += 1) {
      const char = lines[i][j];
      if (char === '"') {
        if (inQuotes && lines[i][j + 1] === '"') {
          current += '"';
          j += 1;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        values.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current);

    const record = {};
    headers.forEach((header, idx) => {
      record[header] = values[idx]?.trim() ?? '';
    });
    records.push(record);
  }

  return records;
};

module.exports = { toCsv, sendExport, parseCsv, escapeCsv };
