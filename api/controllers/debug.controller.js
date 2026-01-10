import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const debugDatabase = async (req, res) => {
    try {
        console.log('=== DATABASE DEBUG ROUTE ACCESSED ===');

        // 1. Check User table columns
        const userColumns = await prisma.$queryRawUnsafe(`
            SELECT column_name, data_type, table_schema
            FROM information_schema.columns 
            WHERE table_name = 'User'
            ORDER BY column_name
        `);

        // 2. Check WalkRequest table columns
        const walkRequestColumns = await prisma.$queryRawUnsafe(`
            SELECT column_name, data_type, table_schema
            FROM information_schema.columns 
            WHERE table_name = 'WalkRequest'
            ORDER BY column_name
        `);

        // 3. Check WalkAssignment table columns
        const walkAssignmentColumns = await prisma.$queryRawUnsafe(`
            SELECT column_name, data_type, table_schema
            FROM information_schema.columns 
            WHERE table_name = 'WalkAssignment'
            ORDER BY column_name
        `);

        // 3. Get a sample user (sanitized)
        const sampleUser = await prisma.$queryRawUnsafe(`
            SELECT * FROM "User" LIMIT 1
        `);

        const sanitizedUser = sampleUser.length > 0 ? {
            columns: Object.keys(sampleUser[0]),
            hasRole: 'role' in sampleUser[0],
            hasActiveRole: 'activeRole' in sampleUser[0]
        } : null;

        // 4. Database connection info
        const dbInfo = {
            databaseUrl: process.env.DATABASE_URL ? 'SET (hidden for security)' : 'NOT SET',
            nodeEnv: process.env.NODE_ENV,
            prismaVersion: '5.8.0'
        };

        res.json({
            success: true,
            timestamp: new Date().toISOString(),
            environment: dbInfo,
            userTableColumns: userColumns,
            walkRequestTableColumns: walkRequestColumns,
            walkAssignmentTableColumns: walkAssignmentColumns,
            sampleUserAnalysis: sanitizedUser,
            roleColumnExists: userColumns.some(c => c.column_name === 'role'),
            activeRoleColumnExists: userColumns.some(c => c.column_name === 'activeRole')
        });
    } catch (error) {
        console.error('Debug route error:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            code: error.code,
            stack: error.stack
        });
    }
};
