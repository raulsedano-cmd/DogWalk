import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Clear existing data
  await prisma.review.deleteMany();
  await prisma.walkAssignment.deleteMany();
  await prisma.offer.deleteMany();
  await prisma.walkRequest.deleteMany();
  await prisma.dog.deleteMany();
  await prisma.blockedWalker.deleteMany();
  await prisma.favoriteWalker.deleteMany();
  await prisma.message.deleteMany();
  await prisma.user.deleteMany();

  console.log('✅ Cleared existing data');

  // Hash password
  const hashedPassword = await bcrypt.hash('password123', 10);

  // Create owners
  const owner1 = await prisma.user.create({
    data: {
      email: 'maria@example.com',
      password: hashedPassword,
      firstName: 'María',
      lastName: 'García',
      phone: '+52 55 1234 5678',
      role: 'OWNER',
      bio: 'Amante de los perros, busco paseadores confiables',
      city: 'Ciudad de México',
      zone: 'Condesa',
      termsAccepted: true,
    },
  });

  const owner2 = await prisma.user.create({
    data: {
      email: 'juan@example.com',
      password: hashedPassword,
      firstName: 'Juan',
      lastName: 'Rodríguez',
      phone: '+52 55 2345 6789',
      role: 'OWNER',
      bio: 'Trabajo desde casa y necesito ayuda con los paseos',
      city: 'Ciudad de México',
      zone: 'Roma Norte',
    },
  });

  const owner3 = await prisma.user.create({
    data: {
      email: 'lucia@example.com',
      password: hashedPassword,
      firstName: 'Lucía',
      lastName: 'Hernández',
      phone: '+52 55 3456 7890',
      role: 'OWNER',
      city: 'Ciudad de México',
      zone: 'Polanco',
    },
  });

  console.log('✅ Created 3 owners');

  // Create walkers
  const walker1 = await prisma.user.create({
    data: {
      email: 'carlos@example.com',
      password: hashedPassword,
      firstName: 'Carlos',
      lastName: 'Martínez',
      phone: '+52 55 4567 8901',
      role: 'WALKER',
      bio: '5 años de experiencia paseando perros. Responsable y puntual.',
      city: 'Ciudad de México',
      zone: 'Condesa',
      averageRating: 4.8,
      // Enhanced profile
      termsAccepted: true,
      verificationStatus: 'VERIFIED',
      isVerifiedWalker: true,
      baseCity: 'Ciudad de México',
      baseZone: 'Condesa',
      serviceRadiusKm: 5,
      experienceText: 'Entrenador certificado, primeros auxilios caninos.',
      acceptsSmall: true,
      acceptsMedium: true,
      acceptsLarge: true,
      maxDogsAtOnce: 3,
    },
  });

  const walker2 = await prisma.user.create({
    data: {
      email: 'ana@example.com',
      password: hashedPassword,
      firstName: 'Ana',
      lastName: 'López',
      phone: '+52 55 5678 9012',
      role: 'WALKER',
      bio: 'Veterinaria con amor por los animales. Paseos seguros y divertidos.',
      city: 'Ciudad de México',
      zone: 'Roma Norte',
      averageRating: 4.9,
      // Enhanced profile
      isVerifiedWalker: true,
      isAvailable: true,
      baseCity: 'Ciudad de México',
      baseZone: 'Roma Norte',
      serviceRadiusKm: 10,
      experienceText: 'Veterinaria titulada. Especialista en perros nerviosos.',
      acceptsSmall: true,
      acceptsMedium: true,
      acceptsLarge: false,
      maxDogsAtOnce: 2,
    },
  });

  const walker3 = await prisma.user.create({
    data: {
      email: 'diego@example.com',
      password: hashedPassword,
      firstName: 'Diego',
      lastName: 'Sánchez',
      phone: '+52 55 6789 0123',
      role: 'WALKER',
      bio: 'Estudiante apasionado por los perros.',
      city: 'Ciudad de México',
      zone: 'Polanco',
      averageRating: 4.5,
      // Enhanced profile
      isVerifiedWalker: false,
      isAvailable: false, // Currently unavailable
      baseCity: 'Ciudad de México',
      baseZone: 'Polanco',
      serviceRadiusKm: 3,
      experienceText: 'Tengo perro propio desde hace 10 años.',
      acceptsSmall: true,
      acceptsMedium: true,
      acceptsLarge: true,
      maxDogsAtOnce: 1,
    },
  });

  console.log('✅ Created 3 walkers');

  // Create dogs
  const dog1 = await prisma.dog.create({
    data: {
      ownerId: owner1.id,
      name: 'Max',
      size: 'MEDIUM',
      behavior: 'Tranquilo y sociable',
      age: 3,
      specialNotes: 'Le gusta correr en el parque',
    },
  });

  const dog2 = await prisma.dog.create({
    data: {
      ownerId: owner1.id,
      name: 'Luna',
      size: 'SMALL',
      behavior: 'Energética pero amigable',
      age: 2,
    },
  });

  const dog3 = await prisma.dog.create({
    data: {
      ownerId: owner2.id,
      name: 'Rocky',
      size: 'LARGE',
      behavior: 'Tranquilo con personas, nervioso con otros perros',
      age: 5,
      specialNotes: 'Prefiere paseos alejados de otros perros',
    },
  });

  const dog4 = await prisma.dog.create({
    data: {
      ownerId: owner2.id,
      name: 'Bella',
      size: 'SMALL',
      behavior: 'Muy sociable y juguetona',
      age: 1,
    },
  });

  const dog5 = await prisma.dog.create({
    data: {
      ownerId: owner3.id,
      name: 'Toby',
      size: 'MEDIUM',
      behavior: 'Obediente y calmado',
      age: 4,
      specialNotes: 'Necesita caminar despacio',
    },
  });

  console.log('✅ Created 5 dogs');

  // Create walk requests
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  const walkReq1 = await prisma.walkRequest.create({
    data: {
      ownerId: owner1.id,
      dogId: dog1.id,
      date: tomorrow,
      startTime: '09:00',
      durationMinutes: 30,
      zone: 'Parque México, Condesa',
      suggestedPrice: 150,
      status: 'OPEN',
      details: 'Paseo matutino en el parque',
    },
  });

  const walkReq2 = await prisma.walkRequest.create({
    data: {
      ownerId: owner1.id,
      dogId: dog2.id,
      date: tomorrow,
      startTime: '17:00',
      durationMinutes: 45,
      zone: 'Parque España, Condesa',
      suggestedPrice: 200,
      status: 'OPEN',
      details: 'Paseo vespertino, Luna necesita correr',
    },
  });

  const walkReq3 = await prisma.walkRequest.create({
    data: {
      ownerId: owner2.id,
      dogId: dog3.id,
      date: tomorrow,
      startTime: '08:00',
      durationMinutes: 60,
      zone: 'Plaza Río de Janeiro, Roma Norte',
      suggestedPrice: 250,
      status: 'OPEN',
      details: 'Rocky necesita paseo largo y tranquilo, evitar otros perros',
    },
  });

  const dayAfterTomorrow = new Date(tomorrow);
  dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);

  const walkReq4 = await prisma.walkRequest.create({
    data: {
      ownerId: owner2.id,
      dogId: dog4.id,
      date: dayAfterTomorrow,
      startTime: '10:00',
      durationMinutes: 30,
      zone: 'Roma Norte',
      suggestedPrice: 150,
      status: 'OPEN',
    },
  });

  const walkReq5 = await prisma.walkRequest.create({
    data: {
      ownerId: owner3.id,
      dogId: dog5.id,
      date: dayAfterTomorrow,
      startTime: '16:00',
      durationMinutes: 45,
      zone: 'Parque Lincoln, Polanco',
      suggestedPrice: 200,
      status: 'OPEN',
      details: 'Paseo tranquilo, Toby es mayor',
    },
  });

  console.log('✅ Created 5 walk requests');

  // Create some offers
  await prisma.offer.create({
    data: {
      walkRequestId: walkReq1.id,
      walkerId: walker1.id,
      offeredPrice: 150,
      message: 'Puedo hacerlo al precio sugerido. Vivo cerca del parque.',
      status: 'PENDING',
    },
  });

  await prisma.offer.create({
    data: {
      walkRequestId: walkReq1.id,
      walkerId: walker2.id,
      offeredPrice: 140,
      message: 'Ofrezco $140. Tengo experiencia con perros medianos.',
      status: 'PENDING',
    },
  });

  await prisma.offer.create({
    data: {
      walkRequestId: walkReq3.id,
      walkerId: walker2.id,
      offeredPrice: 250,
      message: 'Acepto el precio. Soy veterinaria y tengo experiencia con perros nerviosos.',
      status: 'PENDING',
    },
  });

  console.log('✅ Created sample offers');

  // Completed walk
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(0, 0, 0, 0);

  const completedWalkReq = await prisma.walkRequest.create({
    data: {
      ownerId: owner1.id,
      dogId: dog1.id,
      date: yesterday,
      startTime: '10:00',
      durationMinutes: 30,
      zone: 'Condesa',
      suggestedPrice: 150,
      status: 'COMPLETED',
    },
  });

  const assignment = await prisma.walkAssignment.create({
    data: {
      walkRequestId: completedWalkReq.id,
      walkerId: walker1.id,
      status: 'COMPLETED',
      actualStartTime: new Date(yesterday.getTime() + 10 * 60 * 60 * 1000),
      actualEndTime: new Date(yesterday.getTime() + 10.5 * 60 * 60 * 1000),
      // Payment data
      agreedPrice: 150,
      paymentStatus: 'PAID',
      paidAt: new Date(yesterday.getTime() + 11 * 60 * 60 * 1000),
      platformFeeAmount: 22.5,
      platformFeeStatus: 'DUE',
      // Report data
      didPee: true,
      didPoop: true,
      behaviorRating: 'BUENO',
      reportNotes: 'Max se portó increíble, no ladró a nadie.',
    },
  });

  await prisma.review.create({
    data: {
      walkAssignmentId: assignment.id,
      authorId: owner1.id,
      rating: 5,
      comment: 'Excelente paseador! Max llegó muy feliz y cansado.',
    },
  });

  // Create messages
  await prisma.message.create({
    data: {
      walkRequestId: walkReq1.id,
      senderId: walker1.id,
      receiverId: owner1.id,
      content: 'Hola, ¿está disponible el paseo? Vivo a 2 cuadras.',
    }
  });

  // Create favorites
  await prisma.favoriteWalker.create({
    data: {
      ownerId: owner1.id,
      walkerId: walker1.id,
    }
  });

  console.log('✅ Created completed walk, review, messages, and favorites');

  console.log('\n🎉 Seed completed successfully!');
  console.log('\n📧 Test accounts:');
  console.log('Owner: maria@example.com / password123');
  console.log('Walker: carlos@example.com / password123');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
