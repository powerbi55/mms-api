const db = require('../config/db');

exports.createLog = async ({
  action,
  target_pns_id,
  changed_by,
  detail = null
}) => {

  if (!changed_by) {
    throw new Error('changed_by is required');
  }

  await db.execute(
    `INSERT INTO user_logs
     (action, target_pns_id, changed_by, detail)
     VALUES (?, ?, ?, ?)`,
    [
      action,
      target_pns_id,
      changed_by,
      detail ? JSON.stringify(detail) : null
    ]
  );
};
