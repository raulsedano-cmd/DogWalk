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

    console.log('\n--- REQUEST COUNT BY ZONE ---');
    const zoneCounts = await prisma.$queryRaw`
        SELECT zone, count(*) as total
        FROM "WalkRequest"
        GROUP BY zone
        ORDER BY total DESC
    `;
    console.table(zoneCounts);

    console.log('\n--- OPEN REQUESTS IN LIMA ---');
    const limaRequests = await prisma.$queryRaw`
        SELECT id, zone, status
        FROM "WalkRequest"
        WHERE status = 'OPEN' AND (zone ILIKE '%Molina%' OR zone ILIKE '%Miraflores%' OR zone ILIKE '%Surco%')
    `;
    console.table(limaRequests);
}

main().catch(err => {
    console.error('Inspection failed:', err);
}).finally(() => prisma.$disconnect());
