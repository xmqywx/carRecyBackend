export function parseExpectedDateRange(
  startDate?: string | number | Date,
  endDate?: string | number | Date
) {
  const toTimestamp = (value?: string | number | Date): number | null => {
    if (value == null || value === '') return null;
    if (typeof value === 'number') {
      return Number.isNaN(value) ? null : value;
    }
    if (value instanceof Date) {
      const ts = value.getTime();
      return Number.isNaN(ts) ? null : ts;
    }
    const parsed = new Date(value).getTime();
    return Number.isNaN(parsed) ? null : parsed;
  };

  return {
    expectedDateStart: toTimestamp(startDate),
    expectedDateEnd: toTimestamp(endDate),
  };
}
