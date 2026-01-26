const db = require('../config/db');
const { readSheet } = require('./sheet.reader');

/* -----------------------------
   Normalize DATETIME
----------------------------- */
function normalizeDatetime(value) {
  if (!value) return null;

  if (value instanceof Date) {
    return value.toISOString().slice(0, 19).replace('T', ' ');
  }

  // 13/1/2026, 13:26:44 เเปลงค่าเวลาให้ใชช้ได้กับ MySQL
  if (typeof value === 'string' && value.includes('/')) {
    const [d, m, rest] = value.split('/');
    const [y, time] = rest.split(', ');
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')} ${time}`;
  }

  return value;
}

/* -----------------------------
   Department → Prefix
----------------------------- */
function getDepartmentPrefix(depAlert) {
  if (!depAlert) return 'UNKNOWN';

  const map = [
    { keywords: ['ONT-NW'], dep_id: 'OTN-NW' },
    { keywords: ['OTN-ITR'], dep_id: 'OTN-ITR' },
    { keywords: ['OTN-IT'], dep_id: 'OTN-IT' },
    { keywords: ['OTE'], dep_id: 'OTE' },
    { keywords: ['OTD-APP'], dep_id: 'OTD-APP' },
    { keywords: ['OTD-TOLL'], dep_id: 'OTD-TOLL' }
  ];

  const text = depAlert.toUpperCase();

  for (const g of map) {
    if (g.keywords.some(k => text.includes(k.toUpperCase()))) {
      return g.dep_id;
    }
  }

  return 'UNKNOWN';
}


/* -----------------------------
   Sync Job
----------------------------- */
async function syncFromSheet() {
  const rows = await readSheet();

  console.log('🔍 rows[1] =', rows[1]);
  console.log('📄 rows type =', Array.isArray(rows));

  // 🔐 ดึง timestamp ล่าสุดจาก DB (ตัวเดียว)
  const [last] = await db.execute(
    'SELECT timestamp FROM data_imports ORDER BY timestamp DESC LIMIT 1'
  );
  let currentLastTs = last.length ? last[0].timestamp : null;

  console.log('🕒 last timestamp =', currentLastTs);

  let inserted = 0;

  // 🔄 เรียงข้อมูลจาก sheet ตามเวลา (กันข้อมูลสลับ)
  const sortedRows = rows
    .map(r => ({ row: r, ts: normalizeDatetime(r[0]) }))
    .filter(r => r.ts)
    .sort((a, b) => new Date(a.ts) - new Date(b.ts));

  for (const { row, ts } of sortedRows) {
    const [
      _timestamp,
      requester_id,
      dep_alert,
      location,
      dep_requester,
      detail_report
    ] = row;

    if (!requester_id || !detail_report) continue;

    // 🛑 เช็คแค่ตัวล่าสุดของตาราง
    if (currentLastTs && new Date(ts) <= new Date(currentLastTs)) {
      console.log('⏭ skip (old):', ts);
      continue;
    }

    const dep_prefix = getDepartmentPrefix(dep_alert);

    await db.execute(
      `INSERT INTO data_imports
       (timestamp, requester_id, dep_alert, location, dep_requester, detail_report)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        ts,
        requester_id,
        dep_prefix,
        location,
        dep_requester,
        detail_report
      ]
    );

    console.log('✅ inserted:', ts, requester_id, dep_prefix);
    inserted++;

    // 🔁 อัปเดตตัวล่าสุดหลัง insert
    currentLastTs = ts;
  }

  return inserted;
}

module.exports = { syncFromSheet };

