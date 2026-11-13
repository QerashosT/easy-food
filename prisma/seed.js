import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const ownerEmail = process.env.SEED_OWNER_EMAIL?.trim().toLowerCase();
  if (!ownerEmail) {
    throw new Error('Defina SEED_OWNER_EMAIL com o e-mail de um usuário já cadastrado antes de executar o seed.');
  }

  const owner = await prisma.user.findUnique({ where: { email: ownerEmail } });
  if (!owner) {
    throw new Error(`Não existe usuário com o e-mail ${ownerEmail}. Cadastre-se primeiro e execute novamente.`);
  }

  const examples = [
    { name: 'Pizzaria Napoli', category: 'Pizza', rating: '4.5' },
    { name: 'Burger House', category: 'Hambúrgueres', rating: '4.2' },
    { name: 'Sushi Express', category: 'Japonesa', rating: '4.8' }
  ];

  for (const restaurant of examples) {
    const exists = await prisma.restaurant.findFirst({
      where: { name: restaurant.name, ownerId: owner.id }
    });
    if (!exists) {
      await prisma.restaurant.create({ data: { ...restaurant, ownerId: owner.id } });
    }
  }

  console.log(`Restaurantes de exemplo associados a ${owner.email}.`);
}

main()
  .catch((error) => {
    console.error('Falha no seed:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
