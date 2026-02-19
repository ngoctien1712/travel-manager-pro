import pkg from 'pg';
import fs from 'fs';
const { Pool } = pkg;

const pool = new Pool({
    connectionString: 'postgresql://postgres:PhucThanh2002@localhost:5432/travel_manager'
});

async function check() {
    let output = '';
    try {
        output += '--- Providers ---\n';
        const providers = await pool.query("SELECT * FROM provider");
        output += JSON.stringify(providers.rows, null, 2) + '\n';

        output += '\n--- Users & Role Details ---\n';
        const users = await pool.query(`
        SELECT u.id_user, u.email, r.code 
        FROM users u 
        LEFT JOIN role_detail rd ON u.id_user = rd.id_user 
        LEFT JOIN roles r ON rd.id_role = r.id_role
    `);
        output += JSON.stringify(users.rows, null, 2) + '\n';

        fs.writeFileSync('db_debug.txt', output);
        await pool.end();
    } catch (err) {
        fs.writeFileSync('db_debug.txt', err.stack);
        process.exit(1);
    }
}

check();
