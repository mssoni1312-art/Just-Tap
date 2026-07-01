const toMysqlDate = (value) => {
  if (value === undefined || value === null) return null;

  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }

  const trimmed = String(value).trim();
  if (!trimmed) return null;

  if (trimmed.includes('T')) {
    return trimmed.slice(0, 10);
  }

  return trimmed.slice(0, 10);
};

const toMysqlTime = (value) => {
  if (value === undefined || value === null) return null;

  const trimmed = String(value).trim();
  if (!trimmed) return null;

  const isoTimeMatch = trimmed.match(/T(\d{1,2}):(\d{2})(?::(\d{2}))?(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})?$/i);
  if (isoTimeMatch) {
    const hour = isoTimeMatch[1].padStart(2, '0');
    const minute = isoTimeMatch[2];
    const second = isoTimeMatch[3] || '00';
    return `${hour}:${minute}:${second}`;
  }

  const timeWithFraction = trimmed.match(/^(\d{1,2}):(\d{2}):(\d{2})(?:\.\d+)?$/);
  if (timeWithFraction) {
    return `${timeWithFraction[1].padStart(2, '0')}:${timeWithFraction[2]}:${timeWithFraction[3]}`;
  }

  if (/^\d{1,2}:\d{2}:\d{2}$/.test(trimmed)) {
    const [hour, minute, second] = trimmed.split(':');
    return `${hour.padStart(2, '0')}:${minute}:${second}`;
  }

  if (/^\d{1,2}:\d{2}$/.test(trimmed)) {
    const [hour, minute] = trimmed.split(':');
    return `${hour.padStart(2, '0')}:${minute}:00`;
  }

  const match = trimmed.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (match) {
    let hour = Number(match[1]);
    const minute = match[2];
    const period = match[3].toUpperCase();
    if (period === 'PM' && hour !== 12) hour += 12;
    if (period === 'AM' && hour === 12) hour = 0;
    return `${String(hour).padStart(2, '0')}:${minute}:00`;
  }

  return null;
};

const toMysqlDateTime = (value) => {
  if (value === undefined || value === null) return null;

  if (value instanceof Date) {
    return value.toISOString().slice(0, 19).replace('T', ' ');
  }

  const trimmed = String(value).trim();
  if (!trimmed) return null;

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return `${trimmed} 00:00:00`;
  }

  if (trimmed.includes('T')) {
    return trimmed.slice(0, 19).replace('T', ' ');
  }

  return trimmed;
};

module.exports = { toMysqlDate, toMysqlTime, toMysqlDateTime };
