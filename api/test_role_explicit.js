import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env_server') });

const prisma = new PrismaClient();

async function main() {
    console.log('--- EXPLICIT ROLE SELECT ---');
    try {
        const users = await prisma.$queryRaw`SELECT "id", "role" FROM "User" LIMIT 1`;
        console.log('Success:', JSON.stringify(users, null, 2));
    } catch (e) {
        console.error('Explicit SQL error:', e.message);
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
