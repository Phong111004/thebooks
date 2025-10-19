// User model functions using mssql
const sql = require('mssql');

class User {
    static async getAll() {
        try {
            const result = await sql.query`SELECT id, username, email FROM Users`;
            return result.recordset;
        } catch (err) {
            throw err;
        }
    }

    static async create(username, email, password) {
        try {
            // Note: In production, hash the password before storing
            const result = await sql.query`
                INSERT INTO Users (username, email, password)
                OUTPUT INSERTED.id, INSERTED.username, INSERTED.email
                VALUES (${username}, ${email}, ${password})
            `;
            return result.recordset[0];
        } catch (err) {
            throw err;
        }
    }

    static async getById(id) {
        try {
            const result = await sql.query`SELECT id, username, email FROM Users WHERE id = ${id}`;
            return result.recordset[0];
        } catch (err) {
            throw err;
        }
    }

    static async getByUsername(username) {
        try {
            const result = await sql.query`SELECT * FROM Users WHERE username = ${username}`;
            return result.recordset[0];
        } catch (err) {
            throw err;
        }
    }

    static async update(id, username, email) {
        try {
            const result = await sql.query`
                UPDATE Users
                SET username = ${username}, email = ${email}
                WHERE id = ${id}
            `;
            return result.rowsAffected[0] > 0;
        } catch (err) {
            throw err;
        }
    }

    static async delete(id) {
        try {
            const result = await sql.query`DELETE FROM Users WHERE id = ${id}`;
            return result.rowsAffected[0] > 0;
        } catch (err) {
            throw err;
        }
    }

    // Basic authentication method (not secure, for demo only)
    static async authenticate(username, password) {
        try {
            const result = await sql.query`SELECT * FROM Users WHERE username = ${username} AND password = ${password}`;
            return result.recordset[0];
        } catch (err) {
            throw err;
        }
    }
}

module.exports = User;
