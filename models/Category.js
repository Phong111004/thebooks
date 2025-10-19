// Category model functions using mssql
const sql = require('mssql');

class Category {
    static async getAll() {
        try {
            const result = await sql.query`SELECT * FROM Categories`;
            return result.recordset;
        } catch (err) {
            throw err;
        }
    }

    static async create(name) {
        try {
            const result = await sql.query`INSERT INTO Categories (name) OUTPUT INSERTED.* VALUES (${name})`;
            return result.recordset[0];
        } catch (err) {
            throw err;
        }
    }

    static async getById(id) {
        try {
            const result = await sql.query`SELECT * FROM Categories WHERE id = ${id}`;
            return result.recordset[0];
        } catch (err) {
            throw err;
        }
    }

    static async update(id, name) {
        try {
            const result = await sql.query`UPDATE Categories SET name = ${name} WHERE id = ${id}`;
            return result.rowsAffected[0] > 0;
        } catch (err) {
            throw err;
        }
    }

    static async delete(id) {
        try {
            const result = await sql.query`DELETE FROM Categories WHERE id = ${id}`;
            return result.rowsAffected[0] > 0;
        } catch (err) {
            throw err;
        }
    }
}

module.exports = Category;
