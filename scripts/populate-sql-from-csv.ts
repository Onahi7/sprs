import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';

interface CenterRow {
  chapterName: string;
  centerName: string;
}

interface SchoolRow {
  chapterName: string;
  schoolName: string;
}

interface ChapterMap {
  [key: string]: number;
}

// Chapter name mapping from CSV to database
const chapterMapping: ChapterMap = {
  'Keffi': 91,
  'Lafia': 65, // Using Lafia A, could also be 76 for Lafia B
  'Akwanga': 58,
  'Nasarawa': 128, // Using Nasarawa Eggon as closest match
  'Doma': 17
};

async function readCSV<T>(filePath: string): Promise<T[]> {
  return new Promise((resolve, reject) => {
    const results: T[] = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', reject);
  });
}

function generateSchoolsSQL(schools: SchoolRow[]): string {
  let sql = `-- PostgreSQL compatible import for schools
-- Generated from sample-data/schools.csv

-- Insert data into schools table
INSERT INTO schools (id, chapter_id, name) VALUES\n`;

  let id = 1;
  const values: string[] = [];

  schools.forEach((school) => {
    const chapterId = chapterMapping[school.chapterName];
    if (chapterId) {
      values.push(`(${id}, ${chapterId}, '${school.schoolName.replace(/'/g, "''")}')`);
      id++;
    } else {
      console.warn(`Warning: No chapter mapping found for "${school.chapterName}"`);
    }
  });

  sql += values.join(',\n') + '\n';
  sql += `ON CONFLICT (id) DO UPDATE SET
  chapter_id = EXCLUDED.chapter_id,
  name = EXCLUDED.name;

-- Update the sequence to the correct next value
SELECT setval('schools_id_seq', ${id}, false);
`;

  return sql;
}

function generateCentersSQL(centers: CenterRow[]): string {
  let sql = `-- PostgreSQL compatible import for centers
-- Generated from sample-data/centers.csv

-- Insert data into centers table
INSERT INTO centers (id, chapter_id, name) VALUES\n`;

  let id = 1;
  const values: string[] = [];

  centers.forEach((center) => {
    const chapterId = chapterMapping[center.chapterName];
    if (chapterId) {
      values.push(`(${id}, ${chapterId}, '${center.centerName.replace(/'/g, "''")}')`);
      id++;
    } else {
      console.warn(`Warning: No chapter mapping found for "${center.chapterName}"`);
    }
  });

  sql += values.join(',\n') + '\n';
  sql += `ON CONFLICT (id) DO UPDATE SET
  chapter_id = EXCLUDED.chapter_id,
  name = EXCLUDED.name;

-- Update the sequence to the correct next value
SELECT setval('centers_id_seq', ${id}, false);
`;

  return sql;
}

function generateCoordinatorsSQL(): string {
  // Generate sample coordinators for each chapter
  const coordinators = [
    { chapterId: 91, name: 'Keffi Coordinator', email: 'keffi.coord@sprs.ng', code: 'KEFF2025' },
    { chapterId: 65, name: 'Lafia Coordinator', email: 'lafia.coord@sprs.ng', code: 'LAFI2025' },
    { chapterId: 58, name: 'Akwanga Coordinator', email: 'akwanga.coord@sprs.ng', code: 'AKWA2025' },
    { chapterId: 128, name: 'Nasarawa Coordinator', email: 'nasarawa.coord@sprs.ng', code: 'NASR2025' },
    { chapterId: 17, name: 'Doma Coordinator', email: 'doma.coord@sprs.ng', code: 'DOMA2025' }
  ];

  let sql = `-- PostgreSQL compatible import for coordinators
-- Generated sample coordinators for chapters

-- Insert data into chapter_coordinators table
INSERT INTO chapter_coordinators (id, chapter_id, name, email, unique_code) VALUES\n`;

  const values = coordinators.map((coord, index) => 
    `(${index + 1}, ${coord.chapterId}, '${coord.name}', '${coord.email}', '${coord.code}')`
  );

  sql += values.join(',\n') + '\n';
  sql += `ON CONFLICT (id) DO UPDATE SET
  chapter_id = EXCLUDED.chapter_id,
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  unique_code = EXCLUDED.unique_code;

-- Update the sequence to the correct next value
SELECT setval('chapter_coordinators_id_seq', ${coordinators.length + 1}, false);
`;

  return sql;
}

async function main() {
  try {
    console.log('Reading CSV files...');
    
    const schools = await readCSV<SchoolRow>(path.join(__dirname, '../sample-data/schools.csv'));
    const centers = await readCSV<CenterRow>(path.join(__dirname, '../sample-data/centers.csv'));
    
    console.log(`Found ${schools.length} schools and ${centers.length} centers`);
    
    // Generate SQL files
    const schoolsSQL = generateSchoolsSQL(schools);
    const centersSQL = generateCentersSQL(centers);
    const coordinatorsSQL = generateCoordinatorsSQL();
    
    // Write to files
    fs.writeFileSync(path.join(__dirname, '../schools.sql'), schoolsSQL);
    fs.writeFileSync(path.join(__dirname, '../centers.sql'), centersSQL);
    fs.writeFileSync(path.join(__dirname, '../coordinators.sql'), coordinatorsSQL);
    
    console.log('✅ Successfully generated SQL files:');
    console.log('  - schools.sql');
    console.log('  - centers.sql');
    console.log('  - coordinators.sql');
    
    // Display summary
    console.log('\n📊 Summary:');
    console.log(`  Schools: ${schools.length} records`);
    console.log(`  Centers: ${centers.length} records`);
    console.log(`  Coordinators: 5 records (sample data)`);
    
    console.log('\n📋 Chapter Mapping Used:');
    Object.entries(chapterMapping).forEach(([name, id]) => {
      console.log(`  ${name} → Chapter ID ${id}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
