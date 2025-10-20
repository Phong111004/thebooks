const express = require('express');
const cors = require('cors');
const sql = require('mssql/msnodesqlv8'); // Sử dụng driver cho Windows Authentication

const app = express();
const port = 3000;

// Cấu hình CORS để cho phép frontend truy cập
app.use(cors());

// Middleware để parse JSON body
app.use(express.json());

// Middleware để phục vụ các tệp tĩnh (images, css, js) từ thư mục gốc
// Dấu '.' đại diện cho thư mục gốc của dự án
app.use(express.static('.'));

// --- CẤU HÌNH KẾT NỐI SQL SERVER ---
const dbConfig = {
    connectionString: "Driver={ODBC Driver 17 for SQL Server};Server=LAPTOP-F7V4BP1B\\SQLEXPRESS;Database=thebooks;Trusted_Connection=Yes;TrustServerCertificate=Yes;",
};

let pool;

const connectDB = async () => {
    try {
        console.log('🔄 Đang kết nối tới SQL Server...');
        pool = await sql.connect(dbConfig);
        console.log('✅ Kết nối SQL Server thành công!');
    } catch (err) {
        console.error('❌ Kết nối cơ sở dữ liệu thất bại:', err);
        // Thoát tiến trình nếu không kết nối được DB
        process.exit(1);
    }
};

// Middleware để gắn kết nối DB vào mỗi request
// Điều này cho phép các tệp route khác (như users.js) truy cập vào pool
const dbMiddleware = (req, res, next) => {
    if (pool) {
        req.db = pool;
        next();
    } else {
        res.status(500).json({ error: 'Database connection not established' });
    }
};

// Import các routes
const userRoutes = require('./routes/users');

// API Endpoint: Lấy tất cả sách
app.get('/api/books', async (req, res) => {
    try {
        const result = await pool.request().query(`
            SELECT b.*, c.Name as category_name 
            FROM Books b 
            LEFT JOIN Categories c ON b.CategoryID = c.CategoryID
        `);
        res.json(result.recordset);
    } catch (error) {
        res.status(500).send('Lỗi server khi lấy danh sách sách');
        console.error(error);
    }
});

// API Endpoint: Lấy tất cả thể loại
app.get('/api/categories', async (req, res) => {
    try {
        const result = await pool.request().query('SELECT * FROM Categories');
        res.json(result.recordset);
    } catch (error) {
        res.status(500).send('Lỗi server khi lấy danh sách thể loại');
        console.error(error);
    }
});

// API Endpoint: Tìm kiếm sách
app.get('/api/books/search', async (req, res) => {
    const query = req.query.q;
    if (!query) {
        return res.status(400).send('Thiếu tham số tìm kiếm `q`');
    }
    try {
        // Sử dụng parameterized query để chống SQL Injection
        const result = await pool.request()
            .input('query', sql.NVarChar, `%${query}%`)
            .query(`
                SELECT b.*, c.Name as category_name 
                FROM Books b 
                LEFT JOIN Categories c ON b.CategoryID = c.CategoryID 
                WHERE b.Title LIKE @query OR b.Author LIKE @query
            `);
        res.json(result.recordset);
    } catch (error) {
        res.status(500).send('Lỗi server khi tìm kiếm sách');
        console.error(error);
    }
});

// API Endpoint: Lấy sách theo thể loại
app.get('/api/books/category/:id', async (req, res) => {
    const categoryId = parseInt(req.params.id, 10);
    try {
        const result = await pool.request()
            .input('categoryId', sql.Int, categoryId)
            .query(`
                SELECT b.*, c.Name as category_name 
                FROM Books b 
                LEFT JOIN Categories c ON b.CategoryID = c.CategoryID 
                WHERE b.CategoryID = @categoryId
            `);
        res.json(result.recordset);
    } catch (error) {
        res.status(500).send('Lỗi server khi lọc sách theo thể loại');
        console.error(error);
    }
});

// API Endpoint: Lấy chi tiết một cuốn sách
app.get('/api/books/:id', async (req, res) => {
    const bookId = parseInt(req.params.id, 10);
    try {
        const result = await pool.request()
            .input('bookId', sql.Int, bookId)
            .query(`
                SELECT b.*, c.Name as category_name 
                FROM Books b 
                LEFT JOIN Categories c ON b.CategoryID = c.CategoryID 
                WHERE b.BookID = @bookId
            `);
        
        const book = result.recordset[0];
        if (book) {
            res.json(book);
        } else {
            res.status(404).json({ error: 'Không tìm thấy sách' });
        }
    } catch (error) {
        res.status(500).send('Lỗi server khi lấy chi tiết sách');
        console.error(error);
    }
});

// --- SỬ DỤNG CÁC ROUTE ---
app.use('/api/users', dbMiddleware, userRoutes);

// Khởi động server sau khi kết nối DB thành công
const startServer = async () => {
    await connectDB();
    app.listen(port, () => {
        console.log(`🚀 Server đang chạy tại http://localhost:${port}`);
    });
};

startServer();