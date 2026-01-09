import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env_server') });

const prisma = new PrismaClient();

async function main() {
    const tables = ['WalkRequest', 'Dog', 'User'];
    for (const table of tables) {
        console.log(`\n--- COLUMNS IN ${table} ---`);
        const cols = await prisma.$queryRawUnsafe(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = '${table}'
        `);
        console.log(cols.map(c => c.column_name).join(', '));
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
