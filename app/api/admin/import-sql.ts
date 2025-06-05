import { NextRequest, NextResponse } from 'next/server';
import { Client } from 'pg';
import formidable from 'formidable';
import fs from 'fs';

export const config = {
  api: {
    bodyParser: false,
  },
};

export async function POST(req: NextRequest) {
  // Parse the incoming form data
  const form = new formidable.IncomingForm();

  return new Promise((resolve) => {
    form.parse(req, async (
      err: any,
      fields: any,
      files: any
    ) => {
      if (err) {
        resolve(NextResponse.json({ error: 'Error parsing form data' }, { status: 500 }));
        return;
      }

      const tableType = fields.tableType as string;
      const sqlFile = files.sqlFile as any;

      if (!sqlFile || !tableType) {
        resolve(NextResponse.json({ error: 'Missing file or table type' }, { status: 400 }));
        return;
      }      try {
        const sql = fs.readFileSync(sqlFile.filepath, 'utf8');
        // Connect to Neon DB using the same connection string as the main app
        const connectionString = process.env.DATABASE_URL;
        if (!connectionString) {
          throw new Error('DATABASE_URL environment variable is not set');
        }
        
        const client = new Client({
          connectionString,
          ssl: { rejectUnauthorized: false },
        });
        
        console.log('Connecting to Neon database...');
        await client.connect();
        console.log('Connected successfully. Starting transaction...');
        
        await client.query('BEGIN');
        console.log('Executing SQL content...');
        await client.query(sql);
        await client.query('COMMIT');
        console.log('Transaction committed successfully.');
        
        await client.end();
        console.log('Database connection closed.');        resolve(NextResponse.json({ 
          message: `Imported ${tableType} successfully.`,
          count: sql.split(';').filter(stmt => stmt.trim().toLowerCase().startsWith('insert')).length
        }));
      } catch (e: any) {
        console.error('Import error details:', e);
        resolve(NextResponse.json({ 
          error: `Failed to import ${tableType}: ${e.message}` 
        }, { status: 500 }));
      }
    });
  });
}
