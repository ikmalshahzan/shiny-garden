const INVITATIONS = 'Invitations';
const HEADERS = ['InviteCode', 'Event', 'InvitedName', 'InvitedPax', 'Status', 'ReplyName', 'ConfirmedPax', 'RespondedAt', 'InviteLink'];
const EVENT_URL_KEYS = { engagement: 'ENGAGEMENT_INVITATION_URL', wedding: 'WEDDING_INVITATION_URL' };

function onOpen() {
  SpreadsheetApp.getUi().createMenu('RSVP')
    .addItem('Set up RSVP database', 'setupRsvpDatabase')
    .addItem('Generate invite links', 'generateInviteLinks')
    .addToUi();
}

function setupRsvpDatabase() {
  const book = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = book.getSheetByName(INVITATIONS);
  checkHeaders(sheet);
  PropertiesService.getScriptProperties().setProperty('SPREADSHEET_ID', book.getId());
  sheet.setFrozenRows(1);
  sheet.getRange('A2:A').setNumberFormat('@');
  sheet.getRange('F2:F').setNumberFormat('@');
  sheet.getRange('H2:H').setNumberFormat('dd mmm yyyy hh:mm');
}

function checkHeaders(sheet) {
  if (!sheet || sheet.getRange(1, 1, 1, HEADERS.length).getValues()[0].join('|') !== HEADERS.join('|')) {
    throw new Error('The Invitations sheet must use the original tracker headers in order.');
  }
}

function generateInviteLinks() {
  const props = PropertiesService.getScriptProperties();
  const urls = {};
  for (const event of Object.keys(EVENT_URL_KEYS)) {
    const url = (props.getProperty(EVENT_URL_KEYS[event]) || '').trim();
    if (url && !/^https:\/\/[^/?#\s]+(?:\/[^?#\s]*)?$/.test(url)) {
      throw new Error(EVENT_URL_KEYS[event] + ' must be an HTTPS invitation URL without a query or fragment.');
    }
    urls[event] = url.replace(/\/$/, '');
  }

  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(INVITATIONS);
  checkHeaders(sheet);
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const rowCount = sheet.getLastRow() - 1;
    if (rowCount < 1) return;
    const rows = sheet.getRange(2, 1, rowCount, HEADERS.length).getValues();
    const codes = new Set();
    for (const [code] of rows) {
      if (!code) continue;
      if (typeof code !== 'string' || !/^[a-f0-9]{32}$/.test(code) || codes.has(code)) {
        throw new Error('An invite code is invalid or duplicated. Keep the existing valid code for each invitation.');
      }
      codes.add(code);
    }

    const prepared = rows.map((row, index) => {
      const [existingCode, rawEvent, invitedName, invitedPax, status] = row;
      if (!rawEvent && !invitedName && !invitedPax && !existingCode) return null;
      const event = String(rawEvent).trim().toLowerCase();
      if (!Object.hasOwn(EVENT_URL_KEYS, event) || !String(invitedName).trim() ||
          !Number.isInteger(invitedPax) || invitedPax < 1 || invitedPax > 99) {
        throw new Error('Row ' + (index + 2) + ' needs Engagement or Wedding, a name, and a whole-number party size from 1 to 99.');
      }
      const code = existingCode || Utilities.getUuid().replace(/-/g, '').toLowerCase();
      const label = event === 'engagement' ? 'Engagement' : 'Wedding';
      const link = urls[event] ? urls[event] + '/?invite=' + code : '';
      return { row: index + 2, code, label, status: status || 'Pending', link };
    });

    sheet.getRange(2, 1, rowCount, 2).setValues(prepared.map(invite =>
      invite ? [invite.code, invite.label] : ['', '']
    ));
    sheet.getRange(2, 5, rowCount, 1).setValues(prepared.map((invite, index) =>
      [invite?.status ?? rows[index][4]]
    ));
    sheet.getRange(2, 9, rowCount, 1).setValues(prepared.map((invite, index) =>
      [invite?.link ?? rows[index][8]]
    ));
    SpreadsheetApp.flush();
  } finally {
    lock.releaseLock();
  }
}

function doPost(event) {
  const input = event && event.parameter;
  const eventId = String(input?.eventId || '');
  const code = String(input?.inviteCode || '').toLowerCase();
  const name = String(input?.name || '').trim();
  const decision = input?.attendance;
  if (!Object.hasOwn(EVENT_URL_KEYS, eventId) || !/^[a-f0-9]{32}$/.test(code) ||
      !name || name.length > 120 || /[\r\n]/.test(name) || !['yes', 'no'].includes(decision)) {
    return jsonReply({ ok: false, code: 'INVITE' });
  }

  const guests = decision === 'yes' ? Number(input.guests) : 0;
  if (decision === 'yes' && (!Number.isInteger(guests) || guests < 1 || guests > 99)) {
    return jsonReply({ ok: false, code: 'PARTY_SIZE' });
  }

  const lock = LockService.getScriptLock();
  try {
    if (!lock.tryLock(8000)) return jsonReply({ ok: false, code: 'RETRY' });
    const id = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
    const sheet = SpreadsheetApp.openById(id).getSheetByName(INVITATIONS);
    checkHeaders(sheet);
    const lastRow = sheet.getLastRow();
    if (lastRow < 2) return jsonReply({ ok: false, code: 'INVITE' });
    const matches = sheet.getRange(2, 1, lastRow - 1, 1)
      .createTextFinder(code).matchEntireCell(true).matchCase(true).findAll();
    if (matches.length !== 1) return jsonReply({ ok: false, code: 'INVITE' });

    const row = matches[0].getRow();
    const [, invitedEvent, , limit] = sheet.getRange(row, 1, 1, 4).getValues()[0];
    if (String(invitedEvent).toLowerCase() !== eventId) return jsonReply({ ok: false, code: 'INVITE' });
    if (!Number.isInteger(limit) || limit < 1 || guests > limit) return jsonReply({ ok: false, code: 'PARTY_SIZE' });

    const status = decision === 'yes' ? 'Accepted' : 'Declined';
    // Keep formula-like guest names as plain text in Sheets and spreadsheet exports.
    const replyName = /^[=+\-@]/.test(name) ? "'" + name : name;
    sheet.getRange(row, 5, 1, 4).setValues([[status, replyName, guests, new Date()]]);
    SpreadsheetApp.flush();
    return jsonReply({ ok: true });
  } catch {
    return jsonReply({ ok: false, code: 'RETRY' });
  } finally {
    if (lock.hasLock()) lock.releaseLock();
  }
}

function doGet() {
  return jsonReply({ ok: true, service: 'rsvp' });
}

function jsonReply(body) {
  return ContentService.createTextOutput(JSON.stringify(body)).setMimeType(ContentService.MimeType.JSON);
}
