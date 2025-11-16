import postgres from 'postgres';

const connectionString = process.env.DATABASE_URL!;

// Create a single postgres connection instance
const sql = postgres(connectionString, {
  max: 10, // Maximum number of connections
  idle_timeout: 20,
  connect_timeout: 10,
});

export default sql;
