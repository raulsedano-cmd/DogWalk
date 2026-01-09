import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getMyDogs = async (req, res) => {
    try {
        const dogs = await prisma.dog.findMany({
            where: { ownerId: req.user.userId },
            orderBy: { createdAt: 'desc' },
        });

        res.json(dogs);
    } catch (error) {
        console.error('Get dogs error:', error);
        res.status(500).json({ error: 'Failed to get dogs' });
    }
};

export const createDog = async (req, res) => {
    try {
        const {
            name, size, breed, behavior, age,
            energyLevel, reactiveWithDogs, reactiveWithPeople,
            needsMuzzle, pullsLeash, notesForWalker, specialNotes
        } = req.body;

        // Validation
        if (!name || !size) {
            return res.status(400).json({ error: 'Nombre y tamaño son obligatorios' });
        }

        if (!['SMALL', 'MEDIUM', 'LARGE'].includes(size)) {
            return res.status(400).json({ error: 'Tamaño no válido' });
        }

        const dog = await prisma.dog.create({
            data: {
                ownerId: req.user.userId,
                name,
                size,
                breed: breed || null,
                behavior: behavior || null,
                age: age ? parseInt(age) : null,
                energyLevel: energyLevel || 'MEDIUM',
                reactiveWithDogs: reactiveWithDogs === true || reactiveWithDogs === 'true',
                reactiveWithPeople: reactiveWithPeople === true || reactiveWithPeople === 'true',
                needsMuzzle: needsMuzzle === true || needsMuzzle === 'true',
                pullsLeash: pullsLeash === true || pullsLeash === 'true',
                notesForWalker: notesForWalker || null,
                specialNotes: specialNotes || null,
            },
        });

        res.status(201).json({
            message: 'Perro registrado con éxito',
            dog,
        });
    } catch (error) {
        console.error('Create dog error:', error);
        res.status(500).json({ error: 'Error al registrar perro' });
    }
};

export const updateDog = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            name, size, breed, behavior, age,
            energyLevel, reactiveWithDogs, reactiveWithPeople,
            needsMuzzle, pullsLeash, notesForWalker, specialNotes
        } = req.body;

        // Check if dog exists and belongs to user
        const existingDog = await prisma.dog.findUnique({
            where: { id },
        });

        if (!existingDog) {
            return res.status(404).json({ error: 'Perro no encontrado' });
        }

        if (existingDog.ownerId !== req.user.userId) {
            return res.status(403).json({ error: 'No tienes permiso para editar este perro' });
        }

        const updateData = {};
        if (name) updateData.name = name;
        if (size && ['SMALL', 'MEDIUM', 'LARGE'].includes(size)) updateData.size = size;
        if (breed !== undefined) updateData.breed = breed || null;
        if (behavior !== undefined) updateData.behavior = behavior || null;
        if (age !== undefined) updateData.age = age ? parseInt(age) : null;
        if (energyLevel) updateData.energyLevel = energyLevel;
        if (reactiveWithDogs !== undefined) updateData.reactiveWithDogs = reactiveWithDogs === true || reactiveWithDogs === 'true';
        if (reactiveWithPeople !== undefined) updateData.reactiveWithPeople = reactiveWithPeople === true || reactiveWithPeople === 'true';
        if (needsMuzzle !== undefined) updateData.needsMuzzle = needsMuzzle === true || needsMuzzle === 'true';
        if (pullsLeash !== undefined) updateData.pullsLeash = pullsLeash === true || pullsLeash === 'true';
        if (notesForWalker !== undefined) updateData.notesForWalker = notesForWalker || null;
        if (specialNotes !== undefined) updateData.specialNotes = specialNotes || null;

        const dog = await prisma.dog.update({
            where: { id },
            data: updateData,
        });

        res.json({
            message: 'Perro actualizado con éxito',
            dog,
        });
    } catch (error) {
        console.error('Update dog error:', error);
        res.status(500).json({ error: 'Error al actualizar perro' });
    }
};

export const uploadDogPhoto = async (req, res) => {
    try {
        const { id } = req.params;
        console.log(`[DEBUG] Intentando subir foto para perro ID: ${id}`);

        if (!req.file) {
            console.log(`[DEBUG] No se recibió archivo en req.file`);
            return res.status(400).json({ error: 'No se subió ninguna imagen' });
        }

        const dog = await prisma.dog.findUnique({ where: { id } });
        if (!dog) {
            console.log(`[DEBUG] Perro no encontrado`);
            return res.status(404).json({ error: 'Perro no encontrado' });
        }

        if (dog.ownerId !== req.user.userId) {
            console.log(`[DEBUG] El perro no pertenece al usuario logueado`);
            return res.status(403).json({ error: 'No tienes permiso' });
        }

        // If using Cloudinary, req.file.path contains the full URL
        // If using local storage, construct the path manually
        const photoUrl = req.file.path || `/uploads/dog-photos/${req.file.filename}`;
        console.log(`[DEBUG] Foto guardada en: ${photoUrl}`);

        const updatedDog = await prisma.dog.update({
            where: { id },
            data: { photoUrl }
        });

        res.json({
            message: 'Foto de perro actualizada',
            photoUrl,
            dog: updatedDog
        });
    } catch (error) {
        console.error('[ERROR] uploadDogPhoto:', error);
        res.status(500).json({ error: 'Error al subir foto' });
    }
};

export const deleteDog = async (req, res) => {
    try {
        const { id } = req.params;

        // Check if dog exists and belongs to user
        const existingDog = await prisma.dog.findUnique({
            where: { id },
        });

        if (!existingDog) {
            return res.status(404).json({ error: 'Perro no encontrado' });
        }

        if (existingDog.ownerId !== req.user.userId) {
            return res.status(403).json({ error: 'No tienes permiso para eliminar este perro' });
        }

        await prisma.dog.delete({
            where: { id },
        });

        res.json({ message: 'Perro eliminado con éxito' });
    } catch (error) {
        console.error('Delete dog error:', error);
        res.status(500).json({ error: 'Error al eliminar perro' });
    }
};
