// Simple script to check environment variables
require('dotenv').config({ path: '.env.local' });

console.log("Checking environment variables:");
console.log("NODE_ENV:", process.env.NODE_ENV);
console.log("DATABASE_URL exists:", !!process.env.DATABASE_URL);

if (process.env.DATABASE_URL) {
  // Only show a masked version for security
  const url = process.env.DATABASE_URL;
  const maskedUrl = url.replace(/(postgres:\/\/[^:]+):([^@]+)@/, 'postgres://$1:****@');
  console.log("DATABASE_URL (masked):", maskedUrl);
}
