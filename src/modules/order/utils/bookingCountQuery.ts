interface BookingCountQueryPartsInput {
  departmentId: number;
  status: number;
  expectedDateStart?: number | null;
  expectedDateEnd?: number | null;
  keyWord?: string;
  jobComplete?: boolean;
  // Callback tab is cross-status — counts any order with a scheduled
  // callback time. Mirrors the page endpoint's where clause at info.ts:297.
  hasCallback?: boolean;
}

const BOOKING_COUNT_KEYWORD_FIELDS = [
  'b.firstName',
  'b.surname',
  'b.phoneNumber',
  'c.registrationNumber',
  'c.state',
  'c.name',
  'c.model',
  'c.year',
  'c.brand',
  'c.vinNumber',
  'a.quoteNumber',
];

export function buildBookingCountQueryParts({
  departmentId,
  status,
  expectedDateStart,
  expectedDateEnd,
  keyWord,
  jobComplete = false,
  hasCallback = false,
}: BookingCountQueryPartsInput) {
  const clauses = ['a.departmentId = :departmentId'];
  const params: Record<string, any> = {
    departmentId,
  };

  if (status >= 0) {
    clauses.push('a.status = :status');
    params.status = status;
  }

  if (jobComplete) {
    clauses.push('e.status = :jobStatus');
    params.jobStatus = 4;
  }

  if (hasCallback) {
    clauses.push('a.callbackTime IS NOT NULL');
  }

  // Booking page filters by createTime (booking entry time). Customer-preferred
  // pickup date (a.expectedDate) is for Schedule / job dispatch, not for the
  // booking historical list.
  if (expectedDateStart != null) {
    clauses.push('a.createTime >= :bookingDateStart');
    params.bookingDateStart = new Date(expectedDateStart);
  }

  if (expectedDateEnd != null) {
    clauses.push('a.createTime <= :bookingDateEnd');
    params.bookingDateEnd = new Date(expectedDateEnd);
  }

  const trimmedKeyword = keyWord?.trim();
  if (trimmedKeyword) {
    params.bookingKeyword = `%${trimmedKeyword}%`;
  }

  return {
    clauses,
    params,
    keywordFields: trimmedKeyword ? BOOKING_COUNT_KEYWORD_FIELDS : [],
  };
}
