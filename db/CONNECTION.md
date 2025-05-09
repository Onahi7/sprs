# Database Connection Approach

This document explains the database connection handling approach used in the NAPPS Nasarawa State Unified Exams application.

## Connection Strategy

The application uses a dual approach to database connections to handle both server-side and client-side scenarios:

### 1. Server-side Connection

In `db/index.ts`:
```typescript
import { drizzle } from "drizzle-orm/neon-http"
import { neon } from "@neondatabase/serverless"
import * as schema from "./schema"

// Check if we're running on the client side
const isClient = typeof window !== 'undefined'

// Only attempt to use the database connection on the server
let db: ReturnType<typeof createDrizzleInstance> | null = null

function createDrizzleInstance() {
  const connectionString = process.env.DATABASE_URL

  if (!connectionString) {
    throw new Error("DATABASE_URL is not defined")
  }

  const sql = neon(connectionString)
  return drizzle(sql, { schema })
}

// Only initialize the database connection on the server side
if (!isClient) {
  db = createDrizzleInstance()
}

export { db }
```

Key aspects:
- Uses `typeof window !== 'undefined'` check to ensure database connection only happens on the server
- Exports the `db` object which is `null` on the client side
- Uses Neon serverless PostgreSQL with Drizzle ORM

### 2. Utility Function for Safe Access

In `db/utils.ts`:
```typescript
import { db } from "@/db"
import { drizzle } from "drizzle-orm/neon-http"
import { neon } from "@neondatabase/serverless"
import * as schema from "./schema"

/**
 * Utility function to get a database connection
 * Will use the existing db connection if available, otherwise creates a new one
 */
export function getDbConnection() {
  // If we already have a db connection, use it
  if (db) return db;
  
  // Otherwise, create a new connection
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not defined");
  }
  
  const sql = neon(connectionString);
  return drizzle(sql, { schema });
}
```

Key aspects:
- Acts as a safe accessor for database connections
- First tries to use the existing database connection from `db/index.ts`
- If that's null (such as during static rendering or client-side), creates a new connection

## Usage in API Routes

All API routes use the `getDbConnection()` utility function:

```typescript
import { getDbConnection } from "@/db/utils"

export async function GET() {
  const db = getDbConnection();
  // db is now guaranteed to be a valid database connection
  const data = await db.query.users.findMany();
  // ...
}
```

## Benefits of This Approach

1. **Safety**: Prevents client-side database connection attempts
2. **Efficiency**: Reuses the same connection for server components
3. **Consistency**: All API routes have a uniform way to access the database
4. **Reliability**: Even if components are statically rendered, API routes still work

## Important Notes

- The `DATABASE_URL` environment variable must be set in your `.env` file or deployment environment
- For local development, use `.env.local` to avoid committing database credentials
- Make sure all client components don't directly import the database objects
