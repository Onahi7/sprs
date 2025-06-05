const bcrypt = require('bcryptjs');

// Password to hash
const password = 'ADMIN@2025';

// Generate salt and hash
const saltRounds = 10;
const hash = bcrypt.hashSync(password, saltRounds);

console.log('Original password:', password);
console.log('Hashed password:', hash);

// Verify the hash works
const isMatch = bcrypt.compareSync(password, hash);
console.log('Password verification test:', isMatch ? 'PASSED' : 'FAILED');
