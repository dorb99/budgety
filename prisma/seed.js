const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');
  
  await prisma.user.upsert({
    where: { id: 'owner' },
    update: { displayName: "דור", isOwner: true },
    create: { id: 'owner', displayName: "דור", isOwner: true },
  });
  
  await prisma.user.upsert({
    where: { id: 'partner' },
    update: { displayName: "הילה", isOwner: false },
    create: { id: 'partner', displayName: "דור", isOwner: false },
  });
  
  console.log('Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
