// test-dropdowns-backend.js
// 🧪 สคริปต์ทดสอบเพื่อหาว่าตาราง/query ไหนที่เกิดปัญหา

require('dotenv').config();
const db = require('./config/db'); // ปรับ path ตามโครงสร้างของคุณ

async function testAllQueries() {
  console.log('🔍 เริ่มทดสอบ Queries ทั้งหมด...\n');
  
  const queries = [
    {
      name: 'Personnel',
      query: 'SELECT pns_id AS value, pns_name AS label FROM personnel ORDER BY pns_name LIMIT 5'
    },
    {
      name: 'Departments', 
      query: 'SELECT dep_id AS value, dep_name AS label FROM departments ORDER BY dep_name LIMIT 5'
    },
    {
      name: 'Locations',
      query: 'SELECT location_id AS value, location_name AS label FROM locations ORDER BY location_name LIMIT 5'
    },
    {
      name: 'Job Statuses',
      query: 'SELECT jobstatus_id AS value, jobstatus_type AS label FROM master_statuses ORDER BY jobstatus_id LIMIT 5'
    },
    {
      name: 'Equipments',
      query: 'SELECT equipment_id AS value, equipment_name AS label FROM equipment_storages ORDER BY equipment_name LIMIT 5'
    },
    {
      name: 'Customers',
      query: 'SELECT customer_id AS value, customer_name AS label FROM customers ORDER BY customer_name LIMIT 5'
    },
    {
      name: 'Impacts',
      query: "SELECT lookup_id AS value, lookup_name AS label FROM lookups_type WHERE lookup_type = 'impact' ORDER BY lookup_name LIMIT 5"
    },
    {
      name: 'Error Symptoms',
      query: "SELECT lookup_id AS value, lookup_name AS label FROM lookups_type WHERE lookup_type = 'symptom' ORDER BY lookup_name LIMIT 5"
    },
    {
      name: 'Priorities',
      query: "SELECT lookup_id AS value, lookup_name AS label FROM lookups_type WHERE lookup_type = 'priority' ORDER BY lookup_name LIMIT 5"
    },
    {
      name: 'Fault Codes',
      query: "SELECT lookup_id AS value, lookup_name AS label FROM lookups_type WHERE lookup_type = 'fault_code' ORDER BY lookup_name LIMIT 5"
    },
    {
      name: 'Funds',
      query: 'SELECT fund_id AS value, fund_name AS label FROM fund_center ORDER BY fund_name LIMIT 5'
    },
    {
      name: 'Fund Centers',
      query: 'SELECT fund_id AS value, fund_name AS label FROM fund_center ORDER BY fund_name LIMIT 5'
    }
  ];

  let allSuccess = true;
  const results = {};

  for (const test of queries) {
    try {
      const [rows] = await db.query(test.query);
      const count = rows.length;
      
      if (count > 0) {
        console.log(`✅ ${test.name}: ${count} records`);
        console.log(`   Sample:`, rows[0]);
        results[test.name] = { success: true, count, sample: rows[0] };
      } else {
        console.log(`⚠️  ${test.name}: 0 records (ตารางว่าง)`);
        results[test.name] = { success: true, count: 0, warning: 'Empty table' };
      }
    } catch (error) {
      console.log(`❌ ${test.name}: ERROR`);
      console.log(`   Error: ${error.message}`);
      results[test.name] = { success: false, error: error.message };
      allSuccess = false;
    }
    console.log(''); // บรรทัดว่าง
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 สรุปผลการทดสอบ');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  const successCount = Object.values(results).filter(r => r.success).length;
  const failCount = Object.values(results).filter(r => !r.success).length;
  
  console.log(`✅ สำเร็จ: ${successCount}/${queries.length}`);
  console.log(`❌ ล้มเหลว: ${failCount}/${queries.length}`);
  
  if (!allSuccess) {
    console.log('\n❌ ตารางที่มีปัญหา:');
    Object.entries(results).forEach(([name, result]) => {
      if (!result.success) {
        console.log(`   - ${name}: ${result.error}`);
      }
    });
    
    console.log('\n💡 แนะนำ:');
    console.log('1. ตรวจสอบว่าตารางที่มีปัญหาถูกสร้างแล้วหรือยัง');
    console.log('2. ตรวจสอบ column names ว่าถูกต้องหรือไม่');
    console.log('3. รัน schema/migration ใหม่ถ้าจำเป็น');
  } else {
    console.log('\n✅ Query ทั้งหมดทำงานได้ปกติ!');
    
    const emptyTables = Object.entries(results)
      .filter(([_, r]) => r.success && r.count === 0)
      .map(([name]) => name);
    
    if (emptyTables.length > 0) {
      console.log('\n⚠️  ตารางที่ว่างเปล่า (ต้องเพิ่มข้อมูล):');
      emptyTables.forEach(name => console.log(`   - ${name}`));
      console.log('\n💡 รัน insert_sample_data.sql เพื่อเพิ่มข้อมูลตัวอย่าง');
    }
  }
  
  process.exit(allSuccess ? 0 : 1);
}

// เรียกใช้งาน
testAllQueries().catch(err => {
  console.error('💥 Fatal Error:', err);
  process.exit(1);
});