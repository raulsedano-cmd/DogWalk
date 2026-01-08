import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const submitVerification = async (req, res) => {
    try {
        const { dniNumber } = req.body;
        const userId = req.user.userId;

        if (req.user.role !== 'WALKER') {
            return res.status(403).json({ error: 'Solo los paseadores requieren verificación de DNI' });
        }

        if (!dniNumber || dniNumber.length !== 8) {
            return res.status(400).json({ error: 'El DNI debe tener exactamente 8 dígitos' });
        }

        if (!req.files || !req.files['dniFront'] || !req.files['dniBack']) {
            return res.status(400).json({ error: 'Debes subir ambas fotos del DNI (adelante y atrás)' });
        }

        const dniFrontPhotoUrl = `/uploads/verification/${req.files['dniFront'][0].filename}`;
        const dniBackPhotoUrl = `/uploads/verification/${req.files['dniBack'][0].filename}`;

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: {
                dniNumber,
                dniFrontPhotoUrl,
                dniBackPhotoUrl,
                verificationStatus: 'PENDING'
            }
        });

        res.json({
            message: 'Verificación enviada correctamente y está pendiente de revisión',
            user: {
                id: updatedUser.id,
                dniNumber: updatedUser.dniNumber,
                verificationStatus: updatedUser.verificationStatus
            }
        });
    } catch (error) {
        console.error('Submit verification error:', error);
        res.status(500).json({ error: 'Error al procesar la verificación' });
    }
};

export const getVerificationStatus = async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.userId },
            select: { verificationStatus: true, dniNumber: true }
        });
        res.json(user);
    } catch (error) {
        console.error('Get verification status error:', error);
        res.status(500).json({ error: 'Error al obtener estado de verificación' });
    }
};
