// api/jobs/sheet.sync.js
require('dotenv').config();
const { syncFromSheet } = require('../services/sync.service');

async function run() {
  try {
    const inserted = await syncFromSheet();
    console.log(`✅ synced: ${inserted}`);
  } catch (err) {
    console.error('❌ sync failed:', err.message);
  }
}

run();
setInterval(run, 30000);
