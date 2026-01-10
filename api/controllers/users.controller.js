import { PrismaClient } from '@prisma/client';

const prisma = global.prisma || new PrismaClient();
if (process.env.NODE_ENV !== 'production') global.prisma = prisma;

export const getMyProfile = async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.userId },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                phone: true,
                role: true,
                city: true,
                zone: true,
                latitude: true,
                longitude: true,
                bio: true,
                averageRating: true,
                profilePhotoUrl: true,
                isVerifiedWalker: true,
                isAvailable: true,
                baseCity: true,
                baseZone: true,
                addressType: true,
                addressReference: true,
                serviceRadiusKm: true,
                experienceText: true,
                acceptsSmall: true,
                acceptsMedium: true,
                acceptsLarge: true,
                maxDogsAtOnce: true,
                createdAt: true,
                updatedAt: true,
                termsAccepted: true,
                verificationStatus: true,
            },
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json(user);
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ error: 'Failed to get profile' });
    }
};

export const updateMyProfile = async (req, res) => {
    try {
        const {
            firstName, lastName, phone, city, zone, bio,
            profilePhotoUrl, isAvailable, baseCity, baseZone, serviceRadiusKm,
            experienceText, acceptsSmall, acceptsMedium, acceptsLarge, maxDogsAtOnce,
            addressType, addressReference
        } = req.body;

        const updateData = {};
        if (firstName) updateData.firstName = firstName;
        if (lastName) updateData.lastName = lastName;
        if (phone) updateData.phone = phone;
        if (city) updateData.city = city;
        if (zone) updateData.zone = zone;
        if (req.body.latitude !== undefined) updateData.latitude = parseFloat(req.body.latitude);
        if (req.body.longitude !== undefined) updateData.longitude = parseFloat(req.body.longitude);
        if (bio !== undefined) updateData.bio = bio;
        if (addressType !== undefined) updateData.addressType = addressType;
        if (addressReference !== undefined) updateData.addressReference = addressReference;

        if (req.file) {
            updateData.profilePhotoUrl = `/uploads/profiles/${req.file.filename}`;
        } else if (profilePhotoUrl !== undefined) {
            updateData.profilePhotoUrl = profilePhotoUrl;
        }

        // Walker fields update logic
        if (isAvailable !== undefined) updateData.isAvailable = isAvailable === 'true' || isAvailable === true;
        if (baseCity !== undefined) updateData.baseCity = baseCity;
        if (baseZone !== undefined) updateData.baseZone = baseZone;
        if (serviceRadiusKm !== undefined) updateData.serviceRadiusKm = parseInt(serviceRadiusKm);
        if (experienceText !== undefined) updateData.experienceText = experienceText;
        if (acceptsSmall !== undefined) updateData.acceptsSmall = acceptsSmall === 'true' || acceptsSmall === true;
        if (acceptsMedium !== undefined) updateData.acceptsMedium = acceptsMedium === 'true' || acceptsMedium === true;
        if (acceptsLarge !== undefined) updateData.acceptsLarge = acceptsLarge === 'true' || acceptsLarge === true;
        if (maxDogsAtOnce !== undefined) updateData.maxDogsAtOnce = parseInt(maxDogsAtOnce);

        const user = await prisma.user.update({
            where: { id: req.user.userId },
            data: updateData,
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                phone: true,
                role: true,
                city: true,
                zone: true,
                latitude: true,
                longitude: true,
                bio: true,
                averageRating: true,
                profilePhotoUrl: true,
                isVerifiedWalker: true,
                isAvailable: true,
                baseCity: true,
                baseZone: true,
                addressType: true,
                addressReference: true,
                serviceRadiusKm: true,
                experienceText: true,
                acceptsSmall: true,
                acceptsMedium: true,
                acceptsLarge: true,
                maxDogsAtOnce: true,
                termsAccepted: true,
                verificationStatus: true,
            },
        });

        res.json({
            message: 'Profile updated successfully',
            user,
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ error: 'Failed to update profile' });
    }
};

export const activateRole = async (req, res) => {
    try {
        const { role } = req.body;
        if (!['OWNER', 'WALKER'].includes(role)) {
            return res.status(400).json({ error: 'Rol no válido' });
        }

        // With singular role column, activation is just updating the current role
        const updatedUser = await prisma.user.update({
            where: { id: req.user.userId },
            data: { role: role }
        });

        res.json({ message: 'Rol activado correctamente', user: updatedUser });
    } catch (error) {
        console.error('Activate role error:', error);
        res.status(500).json({ error: 'Error al activar rol' });
    }
};

export const switchRole = async (req, res) => {
    try {
        const { role } = req.body;
        if (!['OWNER', 'WALKER'].includes(role)) {
            return res.status(400).json({ error: 'Rol no válido' });
        }

        // With singular role column, switching is just updating the column
        const updatedUser = await prisma.user.update({
            where: { id: req.user.userId },
            data: { role: role }
        });

        res.json({ message: 'Rol cambiado correctamente', user: updatedUser });
    } catch (error) {
        console.error('Switch role error:', error);
        res.status(500).json({ error: 'Error al cambiar rol' });
    }
};

export const getUserById = async (req, res) => {
    try {
        const { id } = req.params;

        const user = await prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                role: true,
                city: true,
                zone: true,
                latitude: true,
                longitude: true,
                bio: true,
                averageRating: true,
                // Enhanced profile (public)
                profilePhotoUrl: true,
                isVerifiedWalker: true,
                isAvailable: true,
                baseCity: true,
                baseZone: true,
                experienceText: true,
                acceptsSmall: true,
                acceptsMedium: true,
                acceptsLarge: true,
                maxDogsAtOnce: true,
                addressType: true,
                addressReference: true,
                createdAt: true,
            },
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json(user);
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ error: 'Failed to get user' });
    }
};
