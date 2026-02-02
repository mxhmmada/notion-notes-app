import mysql from 'mysql2/promise';

const connectionString = process.env.DATABASE_URL;
const url = new URL(connectionString);
const sslParam = url.searchParams.get('ssl');
let ssl = true;
if (sslParam) {
  try {
    ssl = JSON.parse(sslParam);
  } catch {
    ssl = sslParam === 'true';
  }
}

const connection = await mysql.createConnection({
  host: url.hostname,
  user: url.username,
  password: url.password,
  database: url.pathname.slice(1),
  port: url.port || 3306,
  ssl: ssl,
});

try {
  console.log('Dropping all tables...');
  await connection.execute('SET FOREIGN_KEY_CHECKS=0');
  await connection.execute('DROP TABLE IF EXISTS __drizzle_migrations');
  await connection.execute('DROP TABLE IF EXISTS trash');
  await connection.execute('DROP TABLE IF EXISTS blocks');
  await connection.execute('DROP TABLE IF EXISTS pages');
  await connection.execute('DROP TABLE IF EXISTS users');
  await connection.execute('SET FOREIGN_KEY_CHECKS=1');
  console.log('All tables dropped successfully');
} finally {
  await connection.end();
}
