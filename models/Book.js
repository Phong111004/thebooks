// Book model functions using mssql
const sql = require('mssql');

class Book {
    static async getAll() {
        try {
            const result = await sql.query`
                SELECT b.*, c.name as category_name
                FROM Books b
                LEFT JOIN Categories c ON b.category_id = c.id
            `;
            return result.recordset;
        } catch (err) {
            throw err;
        }
    }

    static async create(title, author, category_id, description) {
        try {
            const result = await sql.query`
                INSERT INTO Books (title, author, category_id, description)
                OUTPUT INSERTED.*
                VALUES (${title}, ${author}, ${category_id}, ${description || null})
            `;
            return result.recordset[0];
        } catch (err) {
            throw err;
        }
    }

    static async getById(id) {
        try {
            const result = await sql.query`
                SELECT b.*, c.name as category_name
                FROM Books b
                LEFT JOIN Categories c ON b.category_id = c.id
                WHERE b.id = ${id}
            `;
            return result.recordset[0];
        } catch (err) {
            throw err;
        }
    }

    static async update(id, title, author, category_id, description) {
        try {
            const result = await sql.query`
                UPDATE Books
                SET title = ${title}, author = ${author}, category_id = ${category_id}, description = ${description}
                WHERE id = ${id}
            `;
            return result.rowsAffected[0] > 0;
        } catch (err) {
            throw err;
        }
    }

    static async delete(id) {
        try {
            const result = await sql.query`DELETE FROM Books WHERE id = ${id}`;
            return result.rowsAffected[0] > 0;
        } catch (err) {
            throw err;
        }
    }

    static async getByCategory(category_id) {
        try {
            const result = await sql.query`
                SELECT b.*, c.name as category_name
                FROM Books b
                LEFT JOIN Categories c ON b.category_id = c.id
                WHERE b.category_id = ${category_id}
            `;
            return result.recordset;
        } catch (err) {
            throw err;
        }
    }
}

module.exports = Book;
