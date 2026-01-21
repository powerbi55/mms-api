const db = require('../config/db');

exports.update = async (pns_id, data) => {
  const fields = [];
  const values = [];

  if (data.pns_name) {
    fields.push('pns_name = ?');
    values.push(data.pns_name);
  }

  if (data.dep_id) {
    fields.push('dep_id = ?');
    values.push(data.dep_id);
  }

  if (fields.length === 0) return;

  values.push(pns_id);

  await db.execute(
    `UPDATE personnel SET ${fields.join(', ')} WHERE pns_id = ?`,
    values
  );
};
