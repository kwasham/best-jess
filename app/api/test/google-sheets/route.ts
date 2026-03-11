import { NextResponse } from "next/server";
import { google } from "googleapis";

export const runtime = "nodejs";

function getGooglePrivateKey() {
  const key = process.env.GOOGLE_PRIVATE_KEY;
  if (!key) throw new Error("Missing GOOGLE_PRIVATE_KEY");
  return key.replace(/\\n/g, "\n");
}

export async function GET() {
  try {
    const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const privateKey = getGooglePrivateKey();
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;
    const sheetTabName = process.env.GOOGLE_SHEET_TAB_NAME;

    if (!email) throw new Error("Missing GOOGLE_SERVICE_ACCOUNT_EMAIL");
    if (!spreadsheetId) throw new Error("Missing GOOGLE_SHEET_ID");
    if (!sheetTabName) throw new Error("Missing GOOGLE_SHEET_TAB_NAME");

    const auth = new google.auth.JWT({
      email,
      key: privateKey,
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const sheets = google.sheets({ version: "v4", auth });

    const values = [[
      "Sandbox Store",
      "TEST-1001",
      new Date().toISOString(),
      "Test Product",
      "Hi Jessica, this is a test order to verify the Google Sheets connection.",
      2,
      12.50,
      25.00,
      2.06,
      "Google Sheets connection test"
    ]];

    const result = await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${sheetTabName}!A:J`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values,
      },
    });

    return NextResponse.json({
      ok: true,
      updates: result.data.updates,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}