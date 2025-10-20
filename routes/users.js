const express = require('express');
const sql = require('mssql/msnodesqlv8');
const bcrypt = require('bcrypt');

const router = express.Router();
const saltRounds = 10;

// GET /api/users - Get all users
router.get('/', async (req, res) => {
    try {
        const pool = await req.db;
        const result = await pool.request().query('SELECT UserID, Username, Email, CreatedAt FROM Users');
        res.json(result.recordset);
    } catch (err) {
        console.error('Error fetching users:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/users - Register a new user
router.post('/', async (req, res) => {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
        return res.status(400).json({ error: 'Username, email, and password are required' });
    }
    try {
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        const pool = await req.db;
        const result = await pool.request()
            .input('username', sql.NVarChar, username)
            .input('email', sql.NVarChar, email)
            .input('password_hash', sql.NVarChar, hashedPassword)
            .input('role', sql.NVarChar, 'customer')
            .query('INSERT INTO Users (Username, Email, PasswordHash, Role) OUTPUT INSERTED.UserID, INSERTED.Username, INSERTED.Email, INSERTED.Role VALUES (@username, @email, @password_hash, @role)');
        
        res.status(201).json({ message: 'User created successfully', user: result.recordset[0] });
    } catch (err) {
        console.error('Error creating user:', err);
        if (err.number === 2627) {
            res.status(409).json({ error: 'Username or email already exists' });
        } else {
            res.status(500).json({ error: 'Internal server error', details: err.message });
        }
    }
});

// POST /api/users/login - Login user
router.post('/login', async (req, res) => {
    const { username: email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }
    try {
        const pool = await req.db;
        const result = await pool.request()
            .input('email', sql.NVarChar, email)
            .query('SELECT * FROM Users WHERE Email = @email');

        const user = result.recordset[0];

        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const match = await bcrypt.compare(password, user.PasswordHash);
        if (!match) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        res.json({ 
            message: 'Login successful', 
            user: { 
                id: user.UserID, 
                username: user.Username, 
                email: user.Email, 
                role: user.Role 
            } 
        });
    } catch (err) {
        console.error('Error during login:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// --- API CHO LỊCH SỬ ĐỌC / THEO DÕI (Bảng ReadingHistory) ---
// Các route này phải được đặt TRƯỚC route /:id để tránh xung đột

// GET /api/users/:userId/history - Lấy danh sách sách trong lịch sử đọc của người dùng
router.get('/:userId/history', async (req, res) => {
    const { userId } = req.params;
    try {
        const pool = await req.db;
        const result = await pool.request()
            .input('UserID', sql.Int, userId)
            .query(`
                SELECT 
                    b.*, 
                    c.Name as category_name,
                    rh.Progress,
                    rh.LastPage
                FROM Books b
                JOIN ReadingHistory rh ON b.BookID = rh.BookID
                LEFT JOIN Categories c ON b.CategoryID = c.CategoryID
                WHERE rh.UserID = @UserID
                ORDER BY rh.LastReadAt DESC
            `);
        res.json(result.recordset);
    } catch (err) {
        console.error('Error fetching reading history:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/users/:id - Get user by ID
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const pool = await req.db;
        const result = await pool.request()
            .input('UserID', sql.Int, id)
            .query('SELECT UserID, Username, Email, CreatedAt FROM Users WHERE UserID = @UserID');

        if (result.recordset.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(result.recordset[0]);
    } catch (err) {
        console.error('Error fetching user:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// PUT /api/users/:id - Update user
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { username, email } = req.body;
    if (!username || !email) {
        return res.status(400).json({ error: 'Username and email are required' });
    }
    try {
        const pool = await req.db;
        const result = await pool.request()
            .input('UserID', sql.Int, id)
            .input('username', sql.NVarChar, username)
            .input('email', sql.NVarChar, email)
            .query('UPDATE Users SET Username = @username, Email = @email WHERE UserID = @UserID');

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json({ message: 'User updated successfully' });
    } catch (err) {
        console.error('Error updating user:', err);
        if (err.number === 2627) {
            res.status(409).json({ error: 'Username or email already exists' });
        } else {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
});

// DELETE /api/users/:id - Delete user
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const pool = await req.db;
        const result = await pool.request()
            .input('UserID', sql.Int, id)
            .query('DELETE FROM Users WHERE UserID = @UserID');

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json({ message: 'User deleted successfully' });
    } catch (err) {
        console.error('Error deleting user:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/users/:userId/history/:bookId - Thêm sách vào lịch sử (Hành động "Theo dõi")
router.post('/:userId/history/:bookId', async (req, res) => {
    const { userId, bookId } = req.params;
    try {
        const pool = await req.db;
        // Thêm sách vào lịch sử với các giá trị mặc định.
        // Nếu sách đã tồn tại, sẽ không làm gì cả để tránh lỗi (do có PRIMARY KEY hoặc UNIQUE constraint).
        await pool.request()
            .input('UserID', sql.Int, userId)
            .input('BookID', sql.Int, bookId)
            .input('Progress', sql.Decimal(5, 2), 0.00) // Mặc định tiến trình là 0%
            .input('LastPage', sql.Int, 0) // Mặc định trang cuối là 0
            .query(`
                IF NOT EXISTS (SELECT 1 FROM ReadingHistory WHERE UserID = @UserID AND BookID = @BookID)
                BEGIN
                    INSERT INTO ReadingHistory (UserID, BookID, Progress, LastPage)
                    VALUES (@UserID, @BookID, @Progress, @LastPage)
                END
            `);
        res.status(201).json({ message: 'Book added to history successfully' });
    } catch (err) {
        console.error('Error adding book to history:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// DELETE /api/users/:userId/history/:bookId - Xóa sách khỏi lịch sử (Hành động "Bỏ theo dõi")
router.delete('/:userId/history/:bookId', async (req, res) => {
    const { userId, bookId } = req.params;
    try {
        const pool = await req.db;
        await pool.request()
            .input('UserID', sql.Int, userId)
            .input('BookID', sql.Int, bookId)
            .query('DELETE FROM ReadingHistory WHERE UserID = @UserID AND BookID = @BookID');
        res.status(200).json({ message: 'Book removed from history successfully' });
    } catch (err) {
        console.error('Error removing book from history:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;