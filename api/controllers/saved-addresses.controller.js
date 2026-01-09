import { PrismaClient } from '@prisma/client';

const prisma = global.prisma || new PrismaClient();
if (process.env.NODE_ENV !== 'production') global.prisma = prisma;

// Get all saved addresses for the authenticated user
export const getMySavedAddresses = async (req, res) => {
    try {
        const addresses = await prisma.savedAddress.findMany({
            where: { userId: req.user.userId },
            orderBy: [
                { isDefault: 'desc' }, // Default first
                { createdAt: 'desc' }
            ]
        });

        res.json(addresses);
    } catch (error) {
        console.error('Get saved addresses error:', error);
        res.status(500).json({ error: 'Error al obtener direcciones guardadas' });
    }
};

// Create a new saved address
export const createSavedAddress = async (req, res) => {
    try {
        const {
            name, address, city, zone, country,
            latitude, longitude, addressType, addressReference, isDefault
        } = req.body;

        // Validation
        if (!name || !address || !city || !zone || !latitude || !longitude) {
            return res.status(400).json({
                error: 'Nombre, dirección, ciudad, zona y coordenadas son obligatorios'
            });
        }

        // Check limit (max 5 addresses per user)
        const count = await prisma.savedAddress.count({
            where: { userId: req.user.userId }
        });

        if (count >= 5) {
            return res.status(400).json({
                error: 'Has alcanzado el límite de 5 direcciones guardadas'
            });
        }

        // If this is set as default, unset others
        if (isDefault) {
            await prisma.savedAddress.updateMany({
                where: { userId: req.user.userId, isDefault: true },
                data: { isDefault: false }
            });
        }

        const savedAddress = await prisma.savedAddress.create({
            data: {
                userId: req.user.userId,
                name,
                address,
                city,
                zone,
                country: country || 'Peru',
                latitude: parseFloat(latitude),
                longitude: parseFloat(longitude),
                addressType,
                addressReference,
                isDefault: isDefault || false
            }
        });

        res.status(201).json({
            message: 'Dirección guardada exitosamente',
            address: savedAddress
        });
    } catch (error) {
        console.error('Create saved address error:', error);
        res.status(500).json({ error: 'Error al guardar dirección' });
    }
};

// Update a saved address
export const updateSavedAddress = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            name, address, city, zone, country,
            latitude, longitude, addressType, addressReference, isDefault
        } = req.body;

        // Check if address exists and belongs to user
        const existing = await prisma.savedAddress.findUnique({
            where: { id }
        });

        if (!existing) {
            return res.status(404).json({ error: 'Dirección no encontrada' });
        }

        if (existing.userId !== req.user.userId) {
            return res.status(403).json({ error: 'No tienes permiso para editar esta dirección' });
        }

        // If setting as default, unset others
        if (isDefault && !existing.isDefault) {
            await prisma.savedAddress.updateMany({
                where: { userId: req.user.userId, isDefault: true },
                data: { isDefault: false }
            });
        }

        const updateData = {};
        if (name !== undefined) updateData.name = name;
        if (address !== undefined) updateData.address = address;
        if (city !== undefined) updateData.city = city;
        if (zone !== undefined) updateData.zone = zone;
        if (country !== undefined) updateData.country = country;
        if (latitude !== undefined) updateData.latitude = parseFloat(latitude);
        if (longitude !== undefined) updateData.longitude = parseFloat(longitude);
        if (addressType !== undefined) updateData.addressType = addressType;
        if (addressReference !== undefined) updateData.addressReference = addressReference;
        if (isDefault !== undefined) updateData.isDefault = isDefault;

        const updated = await prisma.savedAddress.update({
            where: { id },
            data: updateData
        });

        res.json({
            message: 'Dirección actualizada exitosamente',
            address: updated
        });
    } catch (error) {
        console.error('Update saved address error:', error);
        res.status(500).json({ error: 'Error al actualizar dirección' });
    }
};

// Delete a saved address
export const deleteSavedAddress = async (req, res) => {
    try {
        const { id } = req.params;

        // Check if address exists and belongs to user
        const existing = await prisma.savedAddress.findUnique({
            where: { id }
        });

        if (!existing) {
            return res.status(404).json({ error: 'Dirección no encontrada' });
        }

        if (existing.userId !== req.user.userId) {
            return res.status(403).json({ error: 'No tienes permiso para eliminar esta dirección' });
        }

        await prisma.savedAddress.delete({
            where: { id }
        });

        res.json({ message: 'Dirección eliminada exitosamente' });
    } catch (error) {
        console.error('Delete saved address error:', error);
        res.status(500).json({ error: 'Error al eliminar dirección' });
    }
};

// Set default address
export const setDefaultAddress = async (req, res) => {
    try {
        const { id } = req.params;

        // Check if address exists and belongs to user
        const existing = await prisma.savedAddress.findUnique({
            where: { id }
        });

        if (!existing) {
            return res.status(404).json({ error: 'Dirección no encontrada' });
        }

        if (existing.userId !== req.user.userId) {
            return res.status(403).json({ error: 'No tienes permiso' });
        }

        // Unset all other defaults
        await prisma.savedAddress.updateMany({
            where: { userId: req.user.userId, isDefault: true },
            data: { isDefault: false }
        });

        // Set this one as default
        const updated = await prisma.savedAddress.update({
            where: { id },
            data: { isDefault: true }
        });

        res.json({
            message: 'Dirección predeterminada actualizada',
            address: updated
        });
    } catch (error) {
        console.error('Set default address error:', error);
        res.status(500).json({ error: 'Error al establecer dirección predeterminada' });
    }
};
