import assert from 'node:assert/strict';
import { escapeHtml } from '../ui/screens.js';

assert.equal(escapeHtml('<img src=x onerror="alert(1)">'), '&lt;img src=x onerror=&quot;alert(1)&quot;&gt;');
assert.equal(escapeHtml("O'Neil & Sons"), 'O&#39;Neil &amp; Sons');
assert.equal(escapeHtml(null), '');
assert.equal(escapeHtml(42), '42');
const importedJobResult = '<svg onload=alert(1)>';
assert.equal(escapeHtml(importedJobResult), '&lt;svg onload=alert(1)&gt;');
console.log('check-safe-rendering: PASS (text, quotes and markup are escaped)');
