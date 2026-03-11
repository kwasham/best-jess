import { google } from 'googleapis';
import { config } from '@/lib/config';

function getSheetsClient() {
  const auth = new google.auth.JWT({
    email: config.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: config.googlePrivateKey,
    scopes: ['https://www.googleapis.com/auth/spreadsheets']
  });

  return google.sheets({ version: 'v4', auth });
}

export async function ensureHeaderRow() {
  const sheets = getSheetsClient();
  const range = `${config.GOOGLE_SHEET_TAB_NAME}!A1:O1`;
  const existing = await sheets.spreadsheets.values.get({
    spreadsheetId: config.GOOGLE_SHEET_ID,
    range
  });

  if ((existing.data.values?.length ?? 0) === 0) {
    await sheets.spreadsheets.values.update({
      spreadsheetId: config.GOOGLE_SHEET_ID,
      range,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[
          'Customer*',
          'Sales Receipt No',
          'Sales Receipt Date',
          'Product/Service',
          'Description',
          'Qty',
          'Rate',
          'Tax',
          'Amount',
          'Memo',
          'Ship To State',
          'Order Id',
          'Line Item Id',
          'SKU',
          'Store'
        ]]
      }
    });
  }
}

export async function appendRows(rows: string[][]) {
  const sheets = getSheetsClient();
  const response = await sheets.spreadsheets.values.append({
    spreadsheetId: config.GOOGLE_SHEET_ID,
    range: `${config.GOOGLE_SHEET_TAB_NAME}!A:O`,
    valueInputOption: 'USER_ENTERED',
    insertDataOption: 'INSERT_ROWS',
    requestBody: {
      values: rows
    }
  });

  const updatedRange = response.data.updates?.updatedRange || '';
  const match = updatedRange.match(/![A-Z]+(\d+):[A-Z]+(\d+)/);
  const startRow = match ? Number(match[1]) : undefined;

  return {
    updatedRange,
    startRow,
    updatedRows: response.data.updates?.updatedRows ?? 0
  };
}
