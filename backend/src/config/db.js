const mysql = require('mysql2');
require('dotenv').config();

// የዳታቤዝ ኮኔክሽን ፑል መፍጠር (ለተሻለ ፐርፎርማንስ)
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// ኮኔክሽኑን ወደ Promise መቀየር (Async/Await ለመጠቀም)
const db = pool.promise();

// ግንኙነቱ መስራቱን ቼክ ለማድረግ
pool.getConnection((err, connection) => {
    if (err) {
        console.error('❌ Database Connection Error:', err.message);
    } else {
        console.log('✅ SmartClear Database Connected Successfully!');
        connection.release();
    }
});

module.exports = db;