# Data Migration Guide

This document explains how to migrate data from a MySQL database to the SPRS system's PostgreSQL database.

## Option 1: Direct Migration from MySQL

To migrate data directly from a MySQL database, you need to properly configure the connection details in your `.env.local` file:

```
# MySQL Database (for data migration)
MYSQL_HOST=your_mysql_host
MYSQL_USER=your_mysql_user
MYSQL_PASSWORD=your_mysql_password
MYSQL_DATABASE=your_old_database
```

### Running the Migration Script

Once the environment variables are set, run the migration script using the following commands:

```bash
# To migrate all data at once (chapters, schools, centers, registrations)
npx ts-node scripts/import-registrations.ts mysql:all

# To migrate specific data types
npx ts-node scripts/import-registrations.ts mysql:registrations
npx ts-node scripts/import-registrations.ts mysql:chapters
npx ts-node scripts/import-registrations.ts mysql:schools
npx ts-node scripts/import-registrations.ts mysql:centers
```

## Option 2: Import from SQL Files via Admin Interface

An easier way to import data is to use the Admin Dashboard's SQL Import feature:

1. Log in to the Admin Dashboard
2. Go to the "Data Import" tab
3. Upload your SQL file
4. Select the appropriate table type (registrations, chapters, schools, centers, coordinators)
5. Click "Import Data"

### Preparing SQL Files

To properly import SQL files:

1. Export each table from MySQL as a separate SQL file
2. Each file should contain only `INSERT` statements for a single table
3. Make sure the column names in the SQL files match the expected formats defined in the `structure` folder

#### Table Structures

The system uses the structure files in the `structure` folder to define the expected format for each table:

##### Registrations (`structure/registrations.txt`)
```
id                     mediumint(9)     PRIMARY KEY AUTO_INCREMENT
registration_number    varchar(20)      INDEX
first_name             varchar(50)
middle_name            varchar(50)      NULL
last_name              varchar(50)
chapter_id             mediumint(9)     INDEX
school_id              mediumint(9)     INDEX
center_id              mediumint(9)     INDEX
parent_first_name      varchar(50)
parent_last_name       varchar(50)
parent_phone           varchar(20)
parent_email           varchar(100)
passport_url           varchar(255)
payment_status         enum('pending', 'completed')  DEFAULT 'pending'
payment_reference      varchar(100)     NULL
created_at             datetime         DEFAULT current_timestamp()
school_name            varchar(100)     NULL
parent_consent         tinyint(1)
```

##### Chapters (`structure/chapter.txt`)
```
id                     mediumint(9)     PRIMARY KEY AUTO_INCREMENT
name                   varchar(100)
split_code             varchar(100)     NULL
amount                 decimal(10,2)    DEFAULT 3000.00
```

##### Centers (`structure/center.txt`)
```
id                     mediumint(9)     PRIMARY KEY AUTO_INCREMENT
chapter_id             mediumint(9)     INDEX
name                   varchar(100)
```

##### Schools (`structure/schools.txt`)
```
id                     mediumint(9)     PRIMARY KEY AUTO_INCREMENT
chapter_id             mediumint(9)     INDEX
name                   varchar(100)
```

##### Coordinators (`structure/cordinators.txt`)
```
id                     mediumint(9)     PRIMARY KEY AUTO_INCREMENT
chapter_id             mediumint(9)     INDEX
name                   varchar(100)
email                  varchar(100)
unique_code            varchar(20)      INDEX
```

### Import Order

For best results, import data in the following order:

1. Chapters
2. Schools/Centers 
3. Coordinators
4. Registrations

This ensures that all necessary foreign key relationships are established correctly.

## Option 3: Import from SQL Files via Command Line

You can also import SQL files using the command line:

```bash
# Import registrations from an SQL file
npx ts-node scripts/import-registrations.ts sql:registrations path/to/registrations.sql

# Import chapters from an SQL file
npx ts-node scripts/import-registrations.ts sql:chapters path/to/chapters.sql

# Import schools from an SQL file
npx ts-node scripts/import-registrations.ts sql:schools path/to/schools.sql

# Import centers from an SQL file
npx ts-node scripts/import-registrations.ts sql:centers path/to/centers.sql

# Import coordinators from an SQL file
npx ts-node scripts/import-registrations.ts sql:coordinators path/to/coordinators.sql
```

## Batch SQL File Import

For convenience, a batch import script is provided to import multiple SQL files in the correct order:

```bash
# Import all SQL files in a folder
npx ts-node scripts/import-sql-files.ts /path/to/sql-files-folder
```

This script looks for these specific filenames and imports them in the correct order:
- `chapters.sql`
- `schools.sql`
- `centers.sql`
- `coordinators.sql`
- `registrations.sql`

This is the easiest method when you have all SQL files ready.

## Handling Structure Changes

If your source database structure differs from what's defined in the `structure` folder:

1. You can modify the mapping functions in `scripts/import-registrations.ts` to handle the differences
2. For major structure changes, update both the `db/schema.ts` and the mapping functions

### Data Type Mapping

The system automatically converts MySQL data types to PostgreSQL types:

| MySQL Type | PostgreSQL Type |
|------------|----------------|
| VARCHAR, CHAR | TEXT |
| TINYINT | BOOLEAN (if used for boolean values) |
| INT, MEDIUMINT | INTEGER |
| DECIMAL | DECIMAL (with precision/scale) |
| DATETIME, TIMESTAMP | TIMESTAMP |
| ENUM | TEXT with constraints |

## Database Schema Visualization

After importing data, you can verify your database structure using:

```bash
# Generate schema diagram (requires GraphViz)
npx drizzle-kit generate:pg
```

This will create visual representations of your database schema to verify relationships.

## Backup Before Import

Always backup your PostgreSQL database before importing large amounts of data:

```bash
# Backup Neon database
pg_dump postgresql://neondb_owner:password@hostname/neondb > backup.sql
```

## Troubleshooting

- **Foreign Key Errors**: Make sure you import data in the correct order (chapters → schools/centers → coordinators → registrations)
- **Data Type Issues**: The script attempts to convert MySQL data types to PostgreSQL types, but some manual adjustments might be needed
- **Duplicate Records**: Records with existing IDs will be skipped to prevent duplicates
- **Structure Mismatch**: If your SQL file has different column names than defined in the structure files, modify the mapping functions in `scripts/import-registrations.ts`

## Summary

This system offers multiple ways to migrate data:

1. **Admin Dashboard**: The most user-friendly approach for non-technical users
2. **Batch Import Script**: `import-sql-files.ts` for importing multiple SQL files at once
3. **Individual SQL Files**: `import-registrations.ts` for importing specific tables
4. **Direct MySQL Migration**: For environments where direct database access is available

Choose the method that best fits your needs and technical comfort level. For large datasets or complex migrations, the direct MySQL approach offers the most control and detailed logging.
