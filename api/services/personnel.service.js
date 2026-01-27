//อัปเดตตาราง personnel
const db = require('../config/db');

//===================อัพเดท personnel========================================
//===========================================================================
exports.update = async (pns_id, data) => {
  const fields = [];
  const values = [];

  if (data.pns_name) {                                                                //ตรวจว่ามี pns_name ส่งมาหรือไม่ถ้าไม่มี → ข้าม ไม่แตะคอลัมน์นี้
    fields.push('pns_name = ?');
    values.push(data.pns_name);
  }

  if (data.dep_id) {                                                                  //ตรวจว่ามี dep_id ส่งมาหรือไม่ถ้าไม่มี → ข้าม ไม่แตะคอลัมน์นี้
    fields.push('dep_id = ?');
    values.push(data.dep_id);
  }

  if (fields.length === 0) return;                                                   //ถ้าไม่มีฟิลด์อะไรจะอัปเดทเลย ให้ return ออกไป

  values.push(pns_id);                                                               //เพิ่มเงื่อนไข where pns_id

  await db.execute(                                                                  //อัปเดทตาราง personnel
    `UPDATE personnel SET ${fields.join(', ')} WHERE pns_id = ?`,
    values
  );
};

//===========================================================================
//===========================================================================