import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env_server') });

const prisma = new PrismaClient();

async function main() {
    console.log('--- VERBOSE USER FETCH ---');
    try {
        const users = await prisma.$queryRaw`SELECT * FROM "User" LIMIT 1`;
        if (users.length > 0) {
            const user = users[0];
            Object.keys(user).forEach(key => {
                console.log(`${key}: ${user[key]}`);
            });
        } else {
            console.log('No users found.');
        }
    } catch (e) {
        console.error('Raw SQL error:', e);
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
