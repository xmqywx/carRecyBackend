import test from 'node:test';
import assert from 'node:assert/strict';

import { buildBookingCountQueryParts } from '../src/modules/order/utils/bookingCountQuery.ts';

test('builds completed-booking count clauses with expected-date and keyword filters', () => {
  assert.deepEqual(
    buildBookingCountQueryParts({
      departmentId: 5,
      status: 1,
      expectedDateStart: 1713225600000,
      expectedDateEnd: 1713311999999,
      keyWord: 'AMAROK',
      jobComplete: true,
    }),
    {
      clauses: [
        'a.departmentId = :departmentId',
        'a.status = :status',
        'e.status = :jobStatus',
        'CAST(a.expectedDate AS UNSIGNED) >= :expectedDateStart',
        'CAST(a.expectedDate AS UNSIGNED) <= :expectedDateEnd',
      ],
      params: {
        departmentId: 5,
        status: 1,
        jobStatus: 4,
        expectedDateStart: 1713225600000,
        expectedDateEnd: 1713311999999,
        bookingKeyword: '%AMAROK%',
      },
      keywordFields: [
        'b.firstName',
        'b.surname',
        'c.registrationNumber',
        'c.state',
        'c.name',
        'c.model',
        'c.year',
        'c.brand',
      ],
    }
  );
});

test('omits optional clauses when only department-wide all-status count is needed', () => {
  assert.deepEqual(
    buildBookingCountQueryParts({
      departmentId: 2,
      status: -1,
      keyWord: '   ',
      jobComplete: false,
    }),
    {
      clauses: ['a.departmentId = :departmentId'],
      params: {
        departmentId: 2,
      },
      keywordFields: [],
    }
  );
});
