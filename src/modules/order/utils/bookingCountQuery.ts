interface BookingCountQueryPartsInput {
  departmentId: number;
  status: number;
  expectedDateStart?: number | null;
  expectedDateEnd?: number | null;
  keyWord?: string;
  jobComplete?: boolean;
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
