import test from 'node:test'
import assert from 'node:assert/strict'

import { parseExpectedDateRange } from '../src/modules/order/utils/expectedDateRange.ts'

test('parses booking date filter strings into expectedDate millisecond bounds', () => {
  const range = parseExpectedDateRange('2026-04-17 00:00:00', '2026-04-17 23:59:59')

  assert.deepEqual(range, {
    expectedDateStart: new Date('2026-04-17 00:00:00').getTime(),
    expectedDateEnd: new Date('2026-04-17 23:59:59').getTime(),
  })
})

test('returns null bounds when date filter input is missing', () => {
  assert.deepEqual(parseExpectedDateRange('', ''), {
    expectedDateStart: null,
    expectedDateEnd: null,
  })
})
