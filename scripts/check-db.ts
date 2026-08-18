import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const prisma = new PrismaClient();

async function main() {
  try {
    const userCount = await prisma.user.count();
    console.log('Database connected! Total users:', userCount);
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        role: true,
        walletBalance: true,
        creatorProfile: true,
      },
      take: 10,
    });
    console.log('Sample users:', JSON.stringify(users, (key, value) =>
      typeof value === 'bigint' ? value.toString() : value
    , 2));

    const creators = await prisma.creator.findMany({
      include: {
        scores: true,
      },
      take: 10,
    });
    console.log('Sample creators:', JSON.stringify(creators, (key, value) =>
      typeof value === 'bigint' ? value.toString() : value
    , 2));
  } catch (err) {
    console.error('Database connection error:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
