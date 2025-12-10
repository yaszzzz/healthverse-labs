import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger.js';

const prisma = new PrismaClient({
    log: ['error', 'warn'],
});

async function connectDB() {
    try {
        await prisma.$connect();
        logger.info('Database connected successfully');
    } catch (error) {
        logger.error('Database connection failed', error);
        process.exit(1);
    }
}

connectDB();

export default prisma;
