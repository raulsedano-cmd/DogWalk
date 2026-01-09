import { PrismaClient } from '@prisma/client';

const prisma = global.prisma || new PrismaClient();
if (process.env.NODE_ENV !== 'production') global.prisma = prisma;

export const acceptTerms = async (req, res) => {
    try {
        const { version } = req.body;
        const userId = req.user.userId;

        if (!version) {
            return res.status(400).json({ error: 'Terms version is required' });
        }

        const acceptance = await prisma.legalAcceptance.create({
            data: {
                userId,
                termsVersion: version,
                ipAddress: req.ip || req.headers['x-forwarded-for'] || 'unknown',
                userAgent: req.headers['user-agent'] || 'unknown'
            }
        });

        // Update user record
        await prisma.user.update({
            where: { id: userId },
            data: { termsAccepted: true },
            select: { id: true, termsAccepted: true } // Explicit select to avoid 'role' column
        });

        res.status(201).json({
            message: 'Términos aceptados correctamente',
            acceptance
        });
    } catch (error) {
        console.error('Accept terms error:', error);
        res.status(500).json({ error: 'Error al procesar la aceptación de términos' });
    }
};

export const getLegalStatus = async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.userId },
            select: {
                id: true,
                termsAccepted: true,
                verificationStatus: true,
                roles: true,
                activeRole: true
            }
        });

        if (!user) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        res.json(user);
    } catch (error) {
        console.error('Get legal status error:', error);
        res.status(500).json({ error: 'Error al obtener estado legal' });
    }
};
