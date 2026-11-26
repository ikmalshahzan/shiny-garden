import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { runInNewContext } from 'node:vm';

const source = readFileSync(new URL('./Code.gs', import.meta.url), 'utf8');
const code = 'a'.repeat(32);
const request = { eventId: 'engagement', inviteCode: code, name: 'Preview Guest', attendance: 'yes', guests: '3' };
const headers = ['InviteCode', 'Event', 'InvitedName', 'InvitedPax', 'Status', 'ReplyName', 'ConfirmedPax', 'RespondedAt', 'InviteLink'];

function spreadsheet(rows, { busy = false } = {}) {
  let locked = false;
  const sheet = {
    getLastRow: () => rows.length + 1,
    getRange(row, column, height, width) {
      return {
        getValues: () => [row === 1 ? headers : rows[row - 2].slice(column - 1, column - 1 + width)],
        setValues: ([values]) => {
          assert(locked, 'Writes must hold the script lock');
          rows[row - 2].splice(column - 1, values.length, ...values);
        },
        createTextFinder(value) {
          return {
            matchEntireCell() { return this; },
            matchCase() { return this; },
            findAll: () => rows.flatMap(([key], index) => key === value ? [{ getRow: () => index + 2 }] : []),
          };
        },
      };
    },
  };

  const runner = runInNewContext(source + '\ndoPost;', {
    SpreadsheetApp: { openById: () => ({ getSheetByName: () => sheet }), flush() {} },
    PropertiesService: { getScriptProperties: () => ({ getProperty: () => 'test-sheet' }) },
    LockService: { getScriptLock: () => ({
      tryLock() { locked = !busy; return locked; },
      hasLock: () => locked,
      releaseLock() { locked = false; },
    }) },
    ContentService: { createTextOutput: value => ({ setMimeType: () => value }), MimeType: { JSON: 'json' } },
  });

  return (patch = {}) => {
    const answer = JSON.parse(runner({ parameter: { ...request, ...patch } }));
    assert.equal(locked, false, 'Each response releases the lock');
    return answer;
  };
}

test('a pending invitation is updated on accept and decline without adding rows', () => {
  const rows = [[code, 'Engagement', 'Preview Household', 4, 'Pending', '', '', '', '']];
  const submit = spreadsheet(rows);
  assert.deepEqual(submit(), { ok: true });
  assert.deepEqual(rows[0].slice(4, 7), ['Accepted', 'Preview Guest', 3]);
  assert.deepEqual(submit({ attendance: 'no' }), { ok: true });
  assert.deepEqual(rows[0].slice(4, 7), ['Declined', 'Preview Guest', 0]);
  assert.equal(rows.length, 1);
});

test('bad keys, wrong events, and oversized parties do not change the invitation', () => {
  const rows = [[code, 'Engagement', 'Preview Household', 4, 'Pending']];
  const submit = spreadsheet(rows);
  assert.equal(submit({ eventId: 'wedding' }).code, 'INVITE');
  assert.equal(submit({ inviteCode: 'b'.repeat(32) }).code, 'INVITE');
  assert.equal(submit({ guests: '5' }).code, 'PARTY_SIZE');
  assert.equal(rows[0][4], 'Pending');
});

test('duplicate invite codes are rejected and a busy lock allows retry', () => {
  const invite = [code, 'Engagement', 'Preview Household', 4, 'Pending'];
  assert.equal(spreadsheet([[...invite], [...invite]])().code, 'INVITE');
  assert.equal(spreadsheet([[...invite]], { busy: true })().code, 'RETRY');
});

test('formula-like guest names are recorded as text', () => {
  const rows = [[code, 'Engagement', 'Preview Household', 4, 'Pending']];
  assert.equal(spreadsheet(rows)({ name: '=2+2' }).ok, true);
  assert.equal(rows[0][5], "'=2+2");
});
