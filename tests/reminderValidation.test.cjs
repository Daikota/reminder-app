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
  formatDateKeyForInput,
  normalizeGermanDate,
  normalizeOptionalTime,
  validateFutureOneTimeSchedule,
  validateRequiredDate,
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

test('valid German dates normalize to stable local date keys', () => {
  assert.equal(normalizeGermanDate('23.07.2026'), '2026-07-23');
  assert.equal(normalizeGermanDate('23072026'), '2026-07-23');
  assert.equal(formatDateKeyForInput('2026-07-23'), '23.07.2026');
});

test('incomplete and impossible German dates are rejected', () => {
  for (const value of ['', '23.07', '31.02.2026', '23.13.2026', '00.07.2026']) {
    assert.equal(validateRequiredDate(value).isValid, false);
  }
});

test('date validation handles month, year, and leap-year boundaries', () => {
  assert.equal(normalizeGermanDate('31.12.2026'), '2026-12-31');
  assert.equal(normalizeGermanDate('01.01.2027'), '2027-01-01');
  assert.equal(normalizeGermanDate('29.02.2028'), '2028-02-29');
  assert.equal(normalizeGermanDate('29.02.2027'), undefined);
});

test('past one-time dates and past times today are rejected', () => {
  const now = new Date(2026, 6, 23, 9, 0, 0).getTime();

  assert.deepEqual(validateFutureOneTimeSchedule('2026-07-22', '17:00', now), {
    isValid: false,
    field: 'dueDate',
    error: 'Das Datum darf nicht in der Vergangenheit liegen.',
  });
  assert.deepEqual(validateFutureOneTimeSchedule('2026-07-23', '08:59', now), {
    isValid: false,
    field: 'time',
    error: 'Bitte wähle eine Uhrzeit in der Zukunft.',
  });
});

test('today with a future time and future one-time dates are valid', () => {
  const now = new Date(2026, 6, 23, 9, 0, 0).getTime();

  assert.equal(
    validateFutureOneTimeSchedule('2026-07-23', '09:01', now).isValid,
    true
  );
  assert.equal(
    validateFutureOneTimeSchedule('2027-01-01', '00:00', now).isValid,
    true
  );
});
