import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env_server') });

const prisma = new PrismaClient();

async function main() {
    console.log('--- FETCHING ONE USER (RAW) ---');
    try {
        const users = await prisma.$queryRaw`SELECT * FROM "User" LIMIT 1`;
        if (users.length > 0) {
            console.log('Columns returned:', Object.keys(users[0]).join(', '));
            console.log('Full user object:', JSON.stringify(users[0], null, 2));
        } else {
            console.log('No users found in "User" table.');
        }
    } catch (e) {
        console.error('Raw SQL error:', e);
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
