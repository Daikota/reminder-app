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
  calculateInitialDueDate,
  calculateNextDueDateFromToday,
  calculateUpdatedDueDate,
  getDueDateLabel,
  getNextDueDate,
  isDueDateOnOrBefore,
} = require('../src/utils/dueDate.ts');

function withFixedLocalTime(fixedLocalNow, callback) {
  const OriginalDate = global.Date;

  global.Date = class FixedDate extends OriginalDate {
    constructor(...args) {
      super(...(args.length > 0 ? args : [fixedLocalNow.getTime()]));
    }

    static now() {
      return fixedLocalNow.getTime();
    }
  };

  try {
    callback();
  } finally {
    global.Date = OriginalDate;
  }
}

function reminder(repeatType, dueDate, overrides = {}) {
  return {
    repeatType,
    dueDate,
    customIntervalDays: null,
    repeatWeekdays: null,
    ...overrides,
  };
}

test('daily initial due date moves past times to tomorrow', () => {
  withFixedLocalTime(new Date(2026, 6, 21, 9, 0, 0), () => {
    assert.equal(
      calculateInitialDueDate(
        {
          ...reminder('daily', ''),
          time: '08:00',
        },
        '2026-07-21'
      ),
      '2026-07-22'
    );
  });
});

test('daily completion after 08:00 advances to the next day', () => {
  withFixedLocalTime(new Date(2026, 6, 21, 9, 0, 0), () => {
    assert.equal(
      calculateNextDueDateFromToday(
        reminder('daily', '2026-07-21', {
          time: '08:00',
        })
      ),
      '2026-07-22'
    );
  });
});

test('daily completion before 17:00 still advances to the next day', () => {
  withFixedLocalTime(new Date(2026, 6, 21, 9, 0, 0), () => {
    assert.equal(
      calculateNextDueDateFromToday(
        reminder('daily', '2026-07-21', {
          time: '17:00',
        })
      ),
      '2026-07-22'
    );
  });
});

test('weekly initial due date selects Thursday from Tuesday', () => {
  withFixedLocalTime(new Date(2026, 6, 21, 9, 0, 0), () => {
    assert.equal(
      calculateInitialDueDate(
        {
          ...reminder('weekly', '', { repeatWeekdays: [4] }),
          time: null,
        },
        '2026-07-21'
      ),
      '2026-07-23'
    );
  });
});

test('weekly completion never returns the completed selected date', () => {
  assert.equal(
    getNextDueDate(reminder('weekly', '2026-07-23', { repeatWeekdays: [4] })),
    '2026-07-30'
  );
});

test('weekly recurrence uses the next of multiple selected weekdays', () => {
  assert.equal(
    getNextDueDate(reminder('weekly', '2026-07-21', { repeatWeekdays: [2, 4] })),
    '2026-07-23'
  );
});

test('weekly recurrence crosses from Sunday to Monday', () => {
  assert.equal(
    getNextDueDate(reminder('weekly', '2026-07-26', { repeatWeekdays: [1] })),
    '2026-07-27'
  );
});

test('monthly recurrence clamps month ends without skipping a month', () => {
  const cases = [
    ['2026-01-29', '2026-02-28'],
    ['2026-01-30', '2026-02-28'],
    ['2026-01-31', '2026-02-28'],
    ['2028-01-29', '2028-02-29'],
    ['2026-03-31', '2026-04-30'],
    ['2026-12-31', '2027-01-31'],
  ];

  for (const [dueDate, expected] of cases) {
    assert.equal(getNextDueDate(reminder('monthly', dueDate)), expected);
  }
});

test('custom day recurrence advances by the exact interval across a month boundary', () => {
  assert.equal(
    getNextDueDate(
      reminder('custom_days', '2026-03-28', {
        customIntervalDays: 5,
      })
    ),
    '2026-04-02'
  );
});

test('one-time reminder has no next due date after completion', () => {
  assert.equal(getNextDueDate(reminder('once', '2026-07-23')), null);
});

test('saving an unchanged reminder preserves its stored due date', () => {
  assert.equal(
    calculateUpdatedDueDate(
      reminder('daily', '2026-08-12'),
      {
        repeatType: 'daily',
        customIntervalDays: null,
        repeatWeekdays: null,
        time: '17:00',
      },
      '2026-07-23'
    ),
    '2026-08-12'
  );
});

test('a title-only edit cannot change date or time scheduling inputs', () => {
  const existingReminder = reminder('once', '2026-12-31');
  const scheduleInput = {
    repeatType: 'once',
    customIntervalDays: null,
    repeatWeekdays: null,
    time: '23:45',
    dueDate: '2026-12-31',
  };

  assert.equal(
    calculateUpdatedDueDate(existingReminder, scheduleInput, '2026-07-23'),
    existingReminder.dueDate
  );
  assert.equal(scheduleInput.time, '23:45');
});

test('changing only time preserves the stored due date', () => {
  assert.equal(
    calculateUpdatedDueDate(
      reminder('monthly', '2026-08-31'),
      {
        repeatType: 'monthly',
        customIntervalDays: null,
        repeatWeekdays: null,
        time: '18:00',
      },
      '2026-07-23'
    ),
    '2026-08-31'
  );
});

test('one-time due date is explicit and repeat mode changes recalculate as needed', () => {
  withFixedLocalTime(new Date(2026, 6, 23, 9, 0, 0), () => {
    assert.equal(
      calculateUpdatedDueDate(
        reminder('daily', '2026-07-24'),
        {
          repeatType: 'once',
          customIntervalDays: null,
          repeatWeekdays: null,
          time: '17:00',
          dueDate: '2026-12-31',
        },
        '2026-07-23'
      ),
      '2026-12-31'
    );
    assert.equal(
      calculateUpdatedDueDate(
        reminder('once', '2026-12-31'),
        {
          repeatType: 'daily',
          customIntervalDays: null,
          repeatWeekdays: null,
          time: '17:00',
        },
        '2026-07-23'
      ),
      '2026-07-23'
    );
  });
});

test('today visibility includes today and overdue but excludes future dates', () => {
  assert.equal(isDueDateOnOrBefore('2026-07-22', '2026-07-23'), true);
  assert.equal(isDueDateOnOrBefore('2026-07-23', '2026-07-23'), true);
  assert.equal(isDueDateOnOrBefore('2026-07-24', '2026-07-23'), false);
});

test('due date labels distinguish overdue, today, and future dates', () => {
  assert.equal(getDueDateLabel('2026-07-20', '2026-07-21'), 'Überfällig seit: 2026-07-20');
  assert.equal(getDueDateLabel('2026-07-21', '2026-07-21'), 'Fällig: Heute');
  assert.equal(getDueDateLabel('2026-07-22', '2026-07-21'), 'Fällig: 2026-07-22');
});
