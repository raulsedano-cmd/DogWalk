import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env_server') });

const prisma = new PrismaClient();

async function main() {
    console.log('--- TABLES IN DATABASE ---');
    try {
        const result = await prisma.$queryRawUnsafe(`
            SELECT table_name, table_schema 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name
        `);
        console.log(JSON.stringify(result, null, 2));
    } catch (e) {
        console.error('Audit Error:', e);
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
