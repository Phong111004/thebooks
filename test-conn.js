const sql = require('mssql');

const config = {
  server: 'LAPTOP-F7V4BP1B\\SQLEXPRESS',
  database: 'thebooks',
  options: {
    trustedConnection: true,
    trustServerCertificate: true
  }
};

(async () => {
  console.log("🔄 Testing connection with tedious...");
  try {
    const pool = await sql.connect(config);
    console.log("✅ Connected!");
    const result = await pool.request().query("SELECT @@SERVERNAME AS ServerName");
    console.log(result.recordset);
  } catch (err) {
    console.error("❌ Failed:", err);
  } finally {
    sql.close();
  }
})();
