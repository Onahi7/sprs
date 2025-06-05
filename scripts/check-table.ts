// This script checks if the administrators table exists
import { getDbConnection } from "@/db/utils";

async function checkAdministratorsTable() {
  try {
    const db = getDbConnection();
    const result = await db.execute(
      `SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'administrators'
      );`
    );
    
    console.log("Administrators table exists:", result.rows[0].exists);
    
    // If the table exists, check if there are any records
    if (result.rows[0].exists) {
      const adminsResult = await db.execute(
        `SELECT id, username, is_active FROM administrators;`
      );
      
      console.log("Administrators in the table:", adminsResult.rows.length);
      console.log("Admin records:", adminsResult.rows);
    }
  } catch (error) {
    console.error("Error checking administrators table:", error);
  }
}

checkAdministratorsTable();
