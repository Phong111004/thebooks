const express = require('express');
const sql = require('mssql/msnodesqlv8');

const router = express.Router();

// GET /api/books - Get all books
router.get('/', async (req, res) => {
    try {
        const pool = await req.db;
        const result = await pool.request().query('SELECT b.*, c.name as category_name FROM Books b LEFT JOIN Categories c ON b.CategoryID = c.CategoryID');
        console.log('--- Dữ liệu sách từ Database ---');
        console.log(result.recordset);
        console.log(`--- Tìm thấy ${result.recordset.length} cuốn sách ---`);
        res.json(result.recordset);
    } catch (err) {
        console.error('Error fetching books:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ⚠️ QUAN TRỌNG: Đặt /search TRƯỚC /:id
// GET /api/books/search?q=... - Search for books
router.get('/search', async (req, res) => {
    const query = req.query.q;
    console.log('🔍 Search query received:', query); // Debug log
    
    if (!query) {
        return res.status(400).json({ error: 'Search query is required' });
    }
    try {
        const pool = await req.db;
        const result = await pool.request()
            .input('query', sql.NVarChar, `%${query}%`)
            .query("SELECT b.*, c.name as category_name FROM Books b LEFT JOIN Categories c ON b.CategoryID = c.CategoryID WHERE b.Title LIKE @query OR b.Author LIKE @query");
        console.log(`✅ Found ${result.recordset.length} books`); // Debug log
        res.json(result.recordset);
    } catch (err) {
        console.error('Error searching books:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/books/category/:category_id - Get books by category
// Đặt route này trước /:id để tránh xung đột
router.get('/category/:category_id', async (req, res) => {
    const { category_id } = req.params;
    console.log('📂 Category filter:', category_id); // Debug log
    try {
        const pool = await req.db;
        const result = await pool.request()
            .input('CategoryID', sql.Int, category_id)
            .query('SELECT b.*, c.name as category_name FROM Books b LEFT JOIN Categories c ON b.CategoryID = c.CategoryID WHERE b.CategoryID = @CategoryID');
        res.json(result.recordset);
    } catch (err) {
        console.error('Error fetching books by category:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/books/:id - Get book by ID
// Đặt route này CUỐI CÙNG trong các GET routes
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const pool = await req.db;
        const result = await pool.request()
            .input('BookID', sql.Int, id)
            .query('SELECT b.*, c.name as category_name FROM Books b LEFT JOIN Categories c ON b.CategoryID = c.CategoryID WHERE b.BookID = @BookID');
        if (result.recordset.length === 0) {
            return res.status(404).json({ error: 'Book not found' });
        }
        res.json(result.recordset[0]);
    } catch (err) {
        console.error('Error fetching book:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/books - Create a new book
router.post('/', async (req, res) => {
    const { title, author, CategoryID, description } = req.body;
    if (!title || !author || !CategoryID) {
        return res.status(400).json({ error: 'Title, author, and CategoryID are required' });
    }
    try {
        const pool = await req.db;
        const result = await pool.request()
            .input('title', sql.NVarChar, title)
            .input('author', sql.NVarChar, author)
            .input('CategoryID', sql.Int, CategoryID)
            .input('description', sql.NVarChar, description)
            .query('INSERT INTO Books (title, author, CategoryID, description) OUTPUT INSERTED.* VALUES (@title, @author, @CategoryID, @description)');
        res.status(201).json(result.recordset[0]);
    } catch (err) {
        console.error('Error creating book:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// PUT /api/books/:id - Update book
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { title, author, CategoryID, description } = req.body;
    if (!title || !author || !CategoryID) {
        return res.status(400).json({ error: 'Title, author, and CategoryID are required' });
    }
    try {
        const pool = await req.db;
        const result = await pool.request()
            .input('BookID', sql.Int, id)
            .input('Title', sql.NVarChar, title)
            .input('Author', sql.NVarChar, author)
            .input('CategoryID', sql.Int, CategoryID)
            .input('description', sql.NVarChar, description)
            .query('UPDATE Books SET title = @title, author = @author, CategoryID = @CategoryID, description = @description WHERE BookID = @BookID');
        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ error: 'Book not found' });
        }
        res.json({ message: 'Book updated successfully' });
    } catch (err) {
        console.error('Error updating book:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// DELETE /api/books/:id - Delete book
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const pool = await req.db;
        const result = await pool.request()
            .input('BookID', sql.Int, id)
            .query('DELETE FROM Books WHERE BookID = @BookID');
        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ error: 'Book not found' });
        }
        res.json({ message: 'Book deleted successfully' });
    } catch (err) {
        console.error('Error deleting book:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;