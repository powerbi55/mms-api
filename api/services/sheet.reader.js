const path = require('path');
const { google } = require('googleapis');

const auth = new google.auth.GoogleAuth({                                      //เรียก API อ่านข้อมูลจาก Sheet
  keyFile: path.resolve(__dirname, '../credentials/service-account.json'),
  scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly']
});                                            

//===========================อ่านข้อมูลจาก Google Sheet===============================
//==================================================================================
async function readSheet() {
  const sheets = google.sheets({
    version: 'v4',
    auth: await auth.getClient()
  });

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: process.env.GOOGLE_SHEET_RANGE
  });

  return res.data.values || [];
}

module.exports = { readSheet };
//==================================================================================
//==================================================================================