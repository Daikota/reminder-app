const assert = require('node:assert/strict');
const fs = require('node:fs');
const test = require('node:test');
const ts = require('typescript');

require.extensions['.ts'] = function loadTypeScript(module, filename) {
  const source = fs.readFileSync(filename, 'utf8');
  const output = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
    fileName: filename,
  }).outputText;

  module._compile(output, filename);
};

const {
  normalizeOptionalTime,
  validateRequiredTime,
} = require('../src/utils/reminderValidation.ts');

test('empty and whitespace-only reminder times are required', () => {
  assert.deepEqual(validateRequiredTime(''), {
    isValid: false,
    error: 'Bitte füge eine Uhrzeit hinzu.',
  });
  assert.deepEqual(validateRequiredTime('   '), {
    isValid: false,
    error: 'Bitte füge eine Uhrzeit hinzu.',
  });
});

test('flexible reminder time inputs normalize to HH:mm', () => {
  assert.equal(normalizeOptionalTime('17'), '17:00');
  assert.equal(normalizeOptionalTime('1730'), '17:30');
  assert.equal(normalizeOptionalTime('17:30'), '17:30');
  assert.deepEqual(validateRequiredTime('17'), {
    isValid: true,
    value: '17:00',
  });
  assert.deepEqual(validateRequiredTime('1730'), {
    isValid: true,
    value: '17:30',
  });
  assert.deepEqual(validateRequiredTime('17:30'), {
    isValid: true,
    value: '17:30',
  });
});

test('out-of-range reminder times are rejected before saving', () => {
  assert.deepEqual(validateRequiredTime('24:00'), {
    isValid: false,
    error: 'Bitte nutze z. B. 17, 1730 oder 17:30.',
  });
  assert.deepEqual(validateRequiredTime('12:60'), {
    isValid: false,
    error: 'Bitte nutze z. B. 17, 1730 oder 17:30.',
  });
});

test('legacy reminder time remains readable but cannot be saved unchanged', () => {
  assert.equal(normalizeOptionalTime(''), null);
  assert.equal(validateRequiredTime('').isValid, false);
});
