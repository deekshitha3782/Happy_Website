import pg from "pg";

const { Pool } = pg;

async function migrate() {
  if (!process.env.DATABASE_URL) {
    console.warn("DATABASE_URL not set, skipping migration");
    return;
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    console.log("Running database migration...");
    
    // Check if messages table exists
    const result = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'messages'
      );
    `);

    const tableExists = result.rows[0]?.exists;

    if (!tableExists) {
      console.log("Creating messages table...");
      
      // Create messages table matching the schema
      await pool.query(`
        CREATE TABLE IF NOT EXISTS messages (
          id SERIAL PRIMARY KEY,
          role TEXT NOT NULL,
          content TEXT NOT NULL,
          session_type TEXT DEFAULT 'chat',
          created_at TIMESTAMP DEFAULT NOW()
        );
      `);
      
      console.log("✓ Database migration completed successfully");
    } else {
      console.log("✓ Database tables already exist");
      
      // Check if session_type column exists and add it if missing
      const columnCheck = await pool.query(`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'messages' AND column_name = 'session_type'
        );
      `);
      
      const columnExists = columnCheck.rows[0]?.exists;
      
      if (!columnExists) {
        console.log("Adding session_type column to existing messages table...");
        await pool.query(`
          ALTER TABLE messages ADD COLUMN session_type TEXT DEFAULT 'chat';
        `);
        console.log("✓ Added session_type column");
      } else {
        console.log("✓ session_type column already exists");
      }
    }
  } catch (error) {
    console.error("Migration error:", error);
    // Don't throw - allow server to start even if migration fails
    // (might be a connection issue that resolves later)
  } finally {
    await pool.end();
  }
}

export { migrate };

