# NAPPS Nasarawa State Unified Exams Database Setup

This document provides instructions for setting up the database for NAPPS Nasarawa State Unified Exams 2025.

## Database Schema

The database schema is defined in `db/schema.sql`. This file contains:

- Table definitions for chapters, schools, centers, registrations, chapter coordinators, and settings
- Foreign key relationships ensuring schools and centers belong to their respective chapters
- Sample data for chapters with their respective schools and centers
- Performance indexes for frequently queried fields

## Database Connection

The application uses a connection pool for server-side components and a fail-safe mechanism for client-side:

- Server-side: The `db/index.ts` file creates a database connection for server components
- Client-side safety: The connection is only created when not running in the browser
- API Routes: All API routes use the `getDbConnection()` utility from `db/utils.ts` to safely access the database

This approach ensures that:
1. No database connection code runs in the browser
2. API routes can always access the database
3. Server components have efficient connection pooling

## Initial Setup

1. Execute the SQL file against your PostgreSQL database:

```powershell
# If using psql command line
psql -U your_username -d your_database -f db/schema.sql

# If using Neon or another hosted database
# Copy the contents of schema.sql and paste into the web SQL editor
```

This will:
- Create all necessary tables
- Set up relationships between tables
- Add sample data for chapters, schools, and centers
- Configure default settings

## Importing Additional Data

For importing additional schools and centers, you can use the provided script:

```powershell
# First install the csv-parse package if not already installed
pnpm add csv-parse

# Navigate to the root directory
cd c:\Users\HP\Downloads\sprs

# Import schools from CSV file
npx ts-node scripts/import-data.ts schools sample-data/schools.csv

# Import centers from CSV file
npx ts-node scripts/import-data.ts centers sample-data/centers.csv
```

## CSV Format

### Schools CSV Format
```
chapterName,schoolName
Keffi,Kings International School
Lafia,Diamond International School
```

### Centers CSV Format
```
chapterName,centerName
Keffi,Government College Keffi
Lafia,Government College Lafia
```

## Important Notes

1. The schema maintains a hierarchical relationship:
   - Chapters are at the top level
   - Each school belongs to a specific chapter
   - Each exam center belongs to a specific chapter
   - Student registrations are linked to a chapter, school, and center

2. When importing data, ensure that:
   - Chapter names in CSV files match exactly with those in the database
   - School and center names are unique within each chapter

3. The database is configured to maintain data integrity through foreign key constraints, ensuring that:
   - Schools and centers cannot exist without an associated chapter
   - Registrations cannot exist without associated chapters, schools, and centers
