import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env_server') });

const prisma = new PrismaClient();

async function main() {
    console.log('--- INSPECTING TABLE: WalkRequest ---');
    const columns = await prisma.$queryRaw`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'WalkRequest'
    `;
    console.table(columns);

    console.log('\n--- INSPECTING TABLE: User ---');
    const userColumns = await prisma.$queryRaw`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'User'
    `;
    console.table(userColumns);
}

main().catch(err => {
    console.error('Inspection failed:', err);
}).finally(() => prisma.$disconnect());
