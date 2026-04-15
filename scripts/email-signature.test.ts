import test from 'node:test';
import assert from 'node:assert/strict';

import { normalizeSignatureImagesLeftAligned } from '../src/modules/sendEmail/utils/emailSignature.ts';

test('signature images are normalized to left alignment', () => {
  const html =
    '<p><img src="https://example.com/logo.png" style="width: 150px;height: 78px;" /></p>';

  const normalized = normalizeSignatureImagesLeftAligned(html);

  assert.match(normalized, /align="left"/);
  assert.match(normalized, /margin:\s*0\s*!important/);
  assert.match(normalized, /display:\s*block/);
});

test('signature normalization preserves existing image styles', () => {
  const html =
    '<p><img src="https://example.com/logo.png" style="width: 150px; height: 78px; border: 1px solid #000;" /></p>';

  const normalized = normalizeSignatureImagesLeftAligned(html);

  assert.match(normalized, /width:\s*150px/);
  assert.match(normalized, /height:\s*78px/);
  assert.match(normalized, /border:\s*1px solid #000/);
});
