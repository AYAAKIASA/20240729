const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
  errorFormat: 'pretty',
});

async function connectDB() {
  try {
    await prisma.$connect();
    console.log('DB 연결에 성공했습니다.');
  } catch (error) {
    console.error('DB 연결에 실패했습니다.', error);
  }
}

connectDB();

module.exports = { prisma };