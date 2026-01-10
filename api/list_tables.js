import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env_server') });

const prisma = new PrismaClient();

async function main() {
    try {
        const tables = await prisma.$queryRaw`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        `;
        console.log('TABLES:', tables.map(t => t.table_name).join(', '));
    } catch (e) {
        console.error(e);
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
