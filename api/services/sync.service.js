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

  // 13/1/2026, 13:26:44
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
function getDepartmentPrefix(department) {
  if (!department) return 'UNK';

  const dep = department.toString().trim();

  const map = [
    { keyword: "เครือข่าย", prefix: "ONT-NW" },
    { keyword: "จราจรอัจฉริยะ", prefix: "OTN-ITR" },
    { keyword: "อุปกรณ์เทคโนโลยีสารสนเทศ", prefix: "OTN-IT" },
    { keyword: "ระบบเก็บค่าผ่านทาง", prefix: "OTE" },
    { keyword: "Application", prefix: "OTD-APP" },
    { keyword: "Toll System", prefix: "OTD-TOLL" }
  ];

  for (const item of map) {
    if (dep.includes(item.keyword)) {
      return item.prefix;
    }
  }

  return dep.substring(0, 3).toUpperCase();
}

/* -----------------------------
   Sync Job
----------------------------- */
async function syncFromSheet() {
  const rows = await readSheet();

  // 🔐 เวลาล่าสุดใน DB
  const [last] = await db.execute(
    'SELECT MAX(timestamp) AS last_ts FROM data_imports'
  );
  const lastTs = last[0].last_ts;

  console.log('🕒 last timestamp =', lastTs);

  let inserted = 0;

  // ✅ ข้าม header
  for (const row of rows.slice(1)) {
    const [
      timestamp,
      requester_id,
      dep_alert,
      location,
      dep_requester,
      detail_report
    ] = row;

    if (!requester_id || !detail_report) continue;

    const ts = normalizeDatetime(timestamp);
    if (!ts) continue;

    // 🛑 กัน insert ซ้ำ
    if (lastTs && new Date(ts) <= new Date(lastTs)) {
      console.log('⏭ skip (old):', ts);
      continue;
    }

    // ✅ แปลงชื่อแผนก → prefix
    const dep_prefix = getDepartmentPrefix(dep_alert);

    await db.execute(
      `INSERT INTO data_imports
       (timestamp, requester_id, dep_alert, location, dep_requester, detail_report)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        ts,
        requester_id,
        dep_prefix,   // ⭐ เก็บ prefix เท่านั้น (ไม่ error)
        location,
        dep_requester,
        detail_report
      ]
    );

    console.log('✅ inserted:', ts, requester_id, dep_prefix);
    inserted++;
  }

  return inserted;
}

module.exports = { syncFromSheet };
