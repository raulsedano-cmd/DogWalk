import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env_server') });

const prisma = new PrismaClient();

async function main() {
    console.log('--- RAW USER DATA INSPECTION ---');
    try {
        const result = await prisma.$queryRawUnsafe(`SELECT * FROM "User" LIMIT 1`);
        if (result.length > 0) {
            console.log('Columns found:', Object.keys(result[0]).join(', '));
            console.log('Sample Data (sanitized):');
            const sample = result[0];
            delete sample.password;
            console.log(JSON.stringify(sample, null, 2));
        } else {
            console.log('No users found in DB.');
        }
    } catch (e) {
        console.error('Audit Error:', e);
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
