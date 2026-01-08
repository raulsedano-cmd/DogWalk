import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const createTicket = async (req, res) => {
    try {
        const { category, subject, description } = req.body;
        const userId = req.user.userId;

        if (!category || !subject || !description) {
            return res.status(400).json({ error: 'Todos los campos son obligatorios' });
        }

        const ticket = await prisma.supportTicket.create({
            data: {
                userId,
                category,
                subject,
                description
            }
        });

        res.status(201).json({
            message: 'Reporte enviado correctamente. Nos pondremos en contacto contigo pronto.',
            ticket
        });
    } catch (error) {
        console.error('Create ticket error:', error);
        res.status(500).json({ error: 'Error al enviar el reporte de ayuda' });
    }
};

export const getMyTickets = async (req, res) => {
    try {
        const tickets = await prisma.supportTicket.findMany({
            where: { userId: req.user.userId },
            orderBy: { createdAt: 'desc' }
        });
        res.json(tickets);
    } catch (error) {
        console.error('Get tickets error:', error);
        res.status(500).json({ error: 'Error al obtener tus reportes' });
    }
};
