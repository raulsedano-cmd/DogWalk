import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env_server') });

const prisma = new PrismaClient();

async function main() {
    console.log('--- DEFINITIVE DATABASE AUDIT ---');
    try {
        const tables = ['User', 'WalkRequest'];
        for (const table of tables) {
            console.log(`\nTable: ${table}`);
            const columns = await prisma.$queryRawUnsafe(`
                SELECT table_schema, column_name, data_type 
                FROM information_schema.columns 
                WHERE table_name = '${table}' AND column_name LIKE '%role%'
                ORDER BY table_schema, column_name
            `);
            columns.forEach(c => console.log(`[${c.table_schema}] - ${c.column_name}: ${c.data_type}`));
        }
    } catch (e) {
        console.error('Audit Error:', e);
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
