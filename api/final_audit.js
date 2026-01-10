import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env_server') });

const prisma = new PrismaClient();

async function main() {
    try {
        const columns = await prisma.$queryRaw`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'User'
            ORDER BY column_name
        `;
        const list = columns.map(c => `${c.column_name}: ${c.data_type}`).join('\n');
        fs.writeFileSync('api/user_columns_audit.txt', list);
        console.log('Done.');
    } catch (e) {
        console.error(e);
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
