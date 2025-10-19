const sql = require('mssql/msnodesqlv8');

const config = {
  connectionString:
    "Driver={ODBC Driver 17 for SQL Server};Server=LAPTOP-F7V4BP1B\\SQLEXPRESS;Database=thebooks;Trusted_Connection=Yes;"
};

(async () => {
  try {
    console.log("🔄 Connecting to SQL Server...");
    const pool = await sql.connect(config);
    console.log("✅ Connected successfully!");
    const result = await pool.request().query('SELECT name FROM sys.databases');
    console.log("📚 Databases:");
    console.table(result.recordset);
  } catch (err) {
    console.error("❌ Connection failed:");
    console.error("Full error:", JSON.stringify(err, Object.getOwnPropertyNames(err), 2));
  } finally {
    await sql.close();
  }
})();
