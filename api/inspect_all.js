import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env_server') });

const prisma = new PrismaClient();

async function main() {
    console.log('--- ALL WALK REQUESTS ---');
    const requests = await prisma.$queryRaw`
        SELECT zone, status, id 
        FROM "WalkRequest"
    `;
    console.log(JSON.stringify(requests, null, 2));
}

main().catch(err => {
    console.error('Inspection failed:', err);
}).finally(() => prisma.$disconnect());
