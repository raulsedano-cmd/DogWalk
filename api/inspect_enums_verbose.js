import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env_server') });

const prisma = new PrismaClient();

async function main() {
    try {
        const enums = await prisma.$queryRaw`
            SELECT pg_type.typname AS enum_name,
                   string_agg(pg_enum.enumlabel, ',') AS enum_values
            FROM pg_type
            JOIN pg_enum ON pg_type.oid = pg_enum.enumtypid
            GROUP BY pg_type.typname
        `;
        console.log('--- ENUMS LIST ---');
        enums.forEach(e => {
            console.log(`Enum: ${e.enum_name}`);
            console.log(`Values: [${e.enum_values}]`);
            console.log('------------------');
        });
    } catch (e) {
        console.error(e);
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
