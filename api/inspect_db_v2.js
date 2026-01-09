import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env_server') });

const prisma = new PrismaClient();

async function main() {
    console.log('--- COLUMNS IN WalkRequest ---');
    const wrCols = await prisma.$queryRaw`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'WalkRequest'
    `;
    console.log(wrCols.map(c => c.column_name).join(', '));

    console.log('\n--- COLUMNS IN User ---');
    const uCols = await prisma.$queryRaw`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'User'
    `;
    console.log(uCols.map(c => c.column_name).join(', '));

    // Also check for existing WalkRequests with their zone
    console.log('\n--- EXISTING WALK REQUESTS ZONES ---');
    const zones = await prisma.$queryRaw`SELECT DISTINCT zone FROM "WalkRequest"`;
    console.log(zones);
}

main().catch(err => {
    console.error('Inspection failed:', err);
}).finally(() => prisma.$disconnect());
