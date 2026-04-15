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
  'c.registrationNumber',
  'c.state',
  'c.name',
  'c.model',
  'c.year',
  'c.brand',
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

  if (expectedDateStart != null) {
    clauses.push('CAST(a.expectedDate AS UNSIGNED) >= :expectedDateStart');
    params.expectedDateStart = expectedDateStart;
  }

  if (expectedDateEnd != null) {
    clauses.push('CAST(a.expectedDate AS UNSIGNED) <= :expectedDateEnd');
    params.expectedDateEnd = expectedDateEnd;
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
