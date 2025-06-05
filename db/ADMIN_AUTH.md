# Administrator Database Authentication

This document explains how to use the `administrators.sql` file to set up database-backed authentication for admin users in the SPRS system.

## Importing the Administrators SQL File

You can import the administrators table using the same tools you use for other SQL imports:

### Using the Admin Dashboard

1. Log in to the Admin Dashboard using your existing admin credentials (environment variables)
2. Navigate to the "Data Import" tab
3. Upload the `administrators.sql` file
4. Select "administrators" as the table type (note: you may need to add this option to your import tool)
5. Click "Import Data"

### Using the Command Line

```bash
npx ts-node scripts/import-registrations.ts sql:administrators path/to/administrators.sql
```

Or as part of a batch import:

```bash
npx ts-node scripts/import-sql-files.ts /path/to/sql-files-folder
```

## Default Administrator Credentials

The SQL file includes a default administrator account with the following credentials:

- Username: `admin`
- Password: `AdminPassword123!` (pre-hashed in the SQL file)

And a second supervisor account:

- Username: `supervisor`
- Password: `SupervisorPwd456!` (pre-hashed in the SQL file)

## Switching to Database Authentication

To switch from environment variable-based authentication to database-based authentication:

1. Import the administrators table using the SQL file
2. Update your authentication system (see the example in `examples/db-auth-example.ts`)
3. Modify the admin login route to check against the database instead of environment variables

Key changes needed:

1. Add the administrators table to your schema.ts file
2. Update the adminLogin function to query the database
3. Use bcrypt to verify passwords

## Security Considerations

- The passwords in the SQL file are already hashed using bcrypt
- Remember to change the default passwords after the first login
- Consider adding 2FA for additional security
- Implement proper password policies (minimum length, complexity requirements)

## Generating Hashed Passwords

To generate a bcrypt hashed password for new administrators:

```javascript
const bcrypt = require('bcrypt');
const saltRounds = 10;
const password = 'YourPasswordHere';

bcrypt.hash(password, saltRounds).then(hash => {
  console.log(hash);
});
```

You can use this hash in an SQL insert statement to add new administrators.
