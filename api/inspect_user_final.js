import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env_server') });

const prisma = new PrismaClient();

async function main() {
    console.log('--- USER TABLE COLUMNS (RAW SQL) ---');
    try {
        const columns = await prisma.$queryRaw`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'User'
            ORDER BY column_name
        `;
        columns.forEach(c => console.log(`${c.column_name}: ${c.data_type}`));
    } catch (e) {
        console.error('SQL Error:', e);
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
