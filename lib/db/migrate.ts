import dotenv from 'dotenv';
import path from 'path';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { client, db } from './drizzle';

dotenv.config();

async function main() {
  console.log('Running migrations...');
  
  try {
    await migrate(db, {
      migrationsFolder: path.join(process.cwd(), 'lib/db/migrations'),
    });
    console.log('Migrations completed successfully');
  } catch (error) {
    console.error('Error running migrations:', error);
    process.exit(1);
  }

  await client.end();
  process.exit(0);
}

main();