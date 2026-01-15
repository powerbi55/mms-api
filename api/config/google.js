const { google } = require('googleapis');

const auth = new google.auth.GoogleAuth({
  keyFile: './credentials/service-account.json',
  scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
});

module.exports = google.sheets({ version: 'v4', auth });
