// Verifies the runtime diagnostics hooks remain wired and exposed for inspection.
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';

const main = readFileSync(new URL('../main.js', import.meta.url), 'utf8');

assert.match(main, /window\.addEventListener\(['"]error['"],[\s\S]*?,\s*true\s*\)/,
  'capture-phase error listener must intercept failed resource loads');
assert.match(main, /recordRuntimeDiagnostic\(['"]resource-load['"]/,
  'resource failures must be recorded');
assert.match(main, /recordRuntimeDiagnostic\(['"]uncaught-error['"]/,
  'uncaught JavaScript errors must be recorded');
assert.match(main, /window\.addEventListener\(['"]unhandledrejection['"]/,
  'unhandled promise rejections must be recorded');
assert.match(main, /RUNTIME_DIAGNOSTICS_LIMIT\s*=\s*50/,
  'diagnostics must remain bounded');
assert.match(main, /getRuntimeDiagnostics:\s*\(\)\s*=>/,
  'diagnostics must be readable through GameAPI');
assert.match(main, /clearRuntimeDiagnostics:\s*\(\)\s*=>/,
  'diagnostics must be clearable through GameAPI');

console.log('Runtime diagnostics contract: OK');
