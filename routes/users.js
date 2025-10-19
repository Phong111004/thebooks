const express = require('express');
const sql = require('mssql/msnodesqlv8');
const bcrypt = require('bcrypt');

const router = express.Router();
const saltRounds = 10; // Độ phức tạp của việc mã hóa mật khẩu

// GET /api/users - Get all users (admin only, in production add auth)
router.get('/', async (req, res) => {
    try {
        const pool = await req.db;
        // Chỉ lấy các trường an toàn, không lấy password_hash
        const result = await pool.request().query('SELECT id, username, email, created_at FROM Users');
        res.json(result.recordset);
    } catch (err) {
        console.error('Error fetching users:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/users - Register a new user (Đăng ký người dùng mới)
router.post('/', async (req, res) => {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
        return res.status(400).json({ error: 'Username, email, and password are required' });
    }
    try {
        // Mã hóa mật khẩu trước khi lưu
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        const pool = await req.db;
        const result = await pool.request()
            .input('username', sql.NVarChar, username)
            .input('email', sql.NVarChar, email)
            .input('password_hash', sql.NVarChar, hashedPassword)
            .query('INSERT INTO Users (username, email, password_hash) OUTPUT INSERTED.id, INSERTED.username, INSERTED.email VALUES (@username, @email, @password_hash)');
        
        res.status(201).json({ message: 'User created successfully', user: result.recordset[0] });
    } catch (err) {
        console.error('Error creating user:', err);
        if (err.number === 2627) { // Unique constraint violation
            res.status(409).json({ error: 'Username or email already exists' });
        } else {
            res.status(500).json({ error: 'Internal server error', details: err.message });
        }
    }
});

// GET /api/users/:id - Get user by ID
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const pool = await req.db;
        const result = await pool.request()
            .input('id', sql.Int, id)
            .query('SELECT id, username, email, created_at FROM Users WHERE id = @id');

        if (result.recordset.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(result.recordset[0]);
    } catch (err) {
        console.error('Error fetching user:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// PUT /api/users/:id - Update user (chỉ cho phép cập nhật username và email)
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { username, email } = req.body;
    if (!username || !email) {
        return res.status(400).json({ error: 'Username and email are required' });
    }
    try {
        const pool = await req.db;
        const result = await pool.request()
            .input('id', sql.Int, id)
            .input('username', sql.NVarChar, username)
            .input('email', sql.NVarChar, email)
            .query('UPDATE Users SET username = @username, email = @email WHERE id = @id');

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
            .input('id', sql.Int, id)
            .query('DELETE FROM Users WHERE id = @id');

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json({ message: 'User deleted successfully' });
    } catch (err) {
        console.error('Error deleting user:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/users/login - Login user (Đăng nhập)
router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
    }
    try {
        const pool = await req.db;
        const result = await pool.request()
            .input('username', sql.NVarChar, username)
            .query('SELECT * FROM Users WHERE username = @username');

        const user = result.recordset[0];

        // So sánh mật khẩu đã mã hóa
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const match = await bcrypt.compare(password, user.password_hash);
        if (!match) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Không trả về password_hash cho client
        res.json({ message: 'Login successful', user: { id: user.id, username: user.username, email: user.email } });
    } catch (err) {
        console.error('Error during login:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
