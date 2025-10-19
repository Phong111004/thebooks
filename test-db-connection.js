require('dotenv').config();
const sql = require('mssql/msnodesqlv8'); // Sử dụng driver msnodesqlv8

const dbConfig = {
    connectionString:
        "Driver={ODBC Driver 17 for SQL Server};Server=LAPTOP-F7V4BP1B\\SQLEXPRESS;Database=thebooks;Trusted_Connection=Yes;TrustServerCertificate=Yes;",
};

async function testConnection() {
    try {
        console.log('Attempting to connect to the database...');
        let pool = await sql.connect(dbConfig);
        console.log('✅ Database connection successful!');
        // Không đóng pool ngay lập tức để giữ kết nối một lúc
        // await pool.close(); 
    } catch (err) {
        console.error('❌ Database connection failed:', err);
    }
}

testConnection();