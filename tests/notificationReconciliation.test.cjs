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
  getOrphanedReminderNotificationIds,
  getReminderNotificationOwnership,
  getNotificationTriggerChannelId,
  isStaleReminderNotification,
  needsNotificationRepair,
  shouldReminderHaveNotification,
} = require('../src/services/notificationReconciliation.ts');

const NOW = new Date(2026, 6, 21, 9, 0, 0).getTime();

function reminder(overrides = {}) {
  return {
    dueDate: '2026-07-21',
    id: 'reminder-1',
    isCompleted: false,
    notificationId: 'notification-1',
    time: '17:00',
    ...overrides,
  };
}

test('planned stored notification does not need repair', () => {
  assert.equal(
    needsNotificationRepair(
      reminder(),
      new Set(['notification-1']),
      NOW
    ),
    false
  );
});

test('missing stored notification ID needs repair', () => {
  assert.equal(
    needsNotificationRepair(
      reminder({ notificationId: null }),
      new Set(),
      NOW
    ),
    true
  );
});

test('stored notification ID missing from the schedule needs repair', () => {
  assert.equal(needsNotificationRepair(reminder(), new Set(), NOW), true);
});

test('reminder without a time does not receive a notification', () => {
  const reminderWithoutTime = reminder({
    notificationId: null,
    time: null,
  });

  assert.equal(shouldReminderHaveNotification(reminderWithoutTime, NOW), false);
  assert.equal(
    needsNotificationRepair(reminderWithoutTime, new Set(), NOW),
    false
  );
});

test('past reminder timestamp does not receive a notification', () => {
  assert.equal(
    shouldReminderHaveNotification(
      reminder({
        dueDate: '2026-07-21',
        time: '08:00',
      }),
      NOW
    ),
    false
  );
});

test('safely identified notification for a deleted reminder is orphaned', () => {
  assert.deepEqual(
    getOrphanedReminderNotificationIds(
      [
        {
          identifier: 'orphaned-notification',
          isReminderNotification: true,
          reminderId: 'deleted-reminder',
        },
      ],
      new Set(['reminder-1'])
    ),
    ['orphaned-notification']
  );
});

test('foreign and unassignable notifications are never orphaned', () => {
  assert.deepEqual(
    getOrphanedReminderNotificationIds(
      [
        {
          identifier: 'foreign-notification',
          isReminderNotification: false,
          reminderId: 'deleted-reminder',
        },
        {
          identifier: 'unassignable-notification',
          isReminderNotification: true,
          reminderId: null,
        },
      ],
      new Set()
    ),
    []
  );
});

test('current and legacy reminder data are recognized defensively', () => {
  assert.deepEqual(
    getReminderNotificationOwnership({
      notificationKind: 'reminder',
      reminderId: 'reminder-1',
    }),
    {
      isReminderNotification: true,
      reminderId: 'reminder-1',
    }
  );
  assert.deepEqual(
    getReminderNotificationOwnership({
      reminderId: 'legacy-reminder',
    }),
    {
      isReminderNotification: true,
      reminderId: 'legacy-reminder',
    }
  );
  assert.deepEqual(
    getReminderNotificationOwnership({
      notificationKind: 'other',
      reminderId: 'foreign-reminder',
    }),
    {
      isReminderNotification: false,
      reminderId: 'foreign-reminder',
    }
  );
});

test('scheduled Android reminder channel can be inspected for migration', () => {
  assert.equal(
    getNotificationTriggerChannelId({
      channelId: 'reminders-v2',
      type: 'date',
    }),
    'reminders-v2'
  );
  assert.equal(getNotificationTriggerChannelId(null), null);
});

test('only the notification ID stored by its reminder is current', () => {
  const storedReminder = reminder();

  assert.equal(
    isStaleReminderNotification(
      {
        identifier: 'notification-1',
        isReminderNotification: true,
        reminderId: 'reminder-1',
      },
      storedReminder
    ),
    false
  );
  assert.equal(
    isStaleReminderNotification(
      {
        identifier: 'outdated-notification',
        isReminderNotification: true,
        reminderId: 'reminder-1',
      },
      storedReminder
    ),
    true
  );
});

test('an unpersisted owned notification is stale and foreign notifications are ignored', () => {
  const reminderWithoutNotificationId = reminder({ notificationId: null });

  assert.equal(
    isStaleReminderNotification(
      {
        identifier: 'unpersisted-notification',
        isReminderNotification: true,
        reminderId: 'reminder-1',
      },
      reminderWithoutNotificationId
    ),
    true
  );
  assert.equal(
    isStaleReminderNotification(
      {
        identifier: 'foreign-notification',
        isReminderNotification: false,
        reminderId: 'reminder-1',
      },
      reminderWithoutNotificationId
    ),
    false
  );
});
