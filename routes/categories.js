const express = require('express');
const router = express.Router();
const sql = require('mssql/msnodesqlv8');

// GET /api/categories
router.get('/', async (req, res) => {
  try {
    const pool = await req.db;
    const result = await pool.request().query('SELECT * FROM Categories');
    res.json(result.recordset);
  } catch (err) {
    console.error('❌ SQL Error:', err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
});

// POST /api/categories - Create a new category
router.post('/', async (req, res) => {
    const { name } = req.body;
    if (!name) {
        return res.status(400).json({ error: 'Category name is required' });
    }
    try {
        const pool = await req.db;
        const result = await pool.request()
            .input('name', sql.NVarChar, name)
            .query('INSERT INTO Categories (name) OUTPUT INSERTED.* VALUES (@name)');

        res.status(201).json(result.recordset[0]);
    } catch (err) {
        console.error('Error creating category:', err);
        if (err.number === 2627) { // Unique constraint violation
            res.status(409).json({ error: 'Category name already exists' });
        } else {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
});

// GET /api/categories/:id - Get category by ID
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const pool = await req.db;
        const result = await pool.request()
            .input('CategoryID', sql.Int, id)
            .query('SELECT * FROM Categories WHERE CategoryID = @CategoryID');
        if (result.recordset.length === 0) {
            return res.status(404).json({ error: 'Category not found' });
        }
        res.json(result.recordset[0]);
    } catch (err) {
        console.error('Error fetching category:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// PUT /api/categories/:id - Update category
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { name } = req.body;
    if (!name) {
        return res.status(400).json({ error: 'Category name is required' });
    }
    try {
        const pool = await req.db;
        const result = await pool.request()
            .input('CategoryID', sql.Int, id)
            .input('name', sql.NVarChar, name)
            .query('UPDATE Categories SET name = @name WHERE CategoryID = @CategoryID');
        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ error: 'Category not found' });
        }
        res.json({ message: 'Category updated successfully' });
    } catch (err) {
        console.error('Error updating category:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// DELETE /api/categories/:id - Delete category
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const pool = await req.db;
        const result = await pool.request()
            .input('CategoryID', sql.Int, id)
            .query('DELETE FROM Categories WHERE CategoryID = @CategoryID');
        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ error: 'Category not found' });
        }
        res.json({ message: 'Category deleted successfully' });
    } catch (err) {
        console.error('Error deleting category:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
