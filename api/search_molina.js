import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env_server') });

const prisma = new PrismaClient();

async function main() {
    console.log('--- SEARCHING FOR MOLINA ---');
    const molinaReqs = await prisma.walkRequest.findMany({
        where: {
            zone: { contains: 'Molina', mode: 'insensitive' }
        }
    });
    console.log('Results found:', JSON.stringify(molinaReqs, null, 2));

    console.log('\n--- SEARCHING FOR LIMA ---');
    const limaReqs = await prisma.walkRequest.findMany({
        where: {
            zone: { contains: 'Lima', mode: 'insensitive' }
        }
    });
    console.log('Results found:', JSON.stringify(limaReqs, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
