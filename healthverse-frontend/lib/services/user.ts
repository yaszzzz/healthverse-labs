import bcrypt from 'bcryptjs';
import prisma from '@/lib/db';
import { logger } from '@/lib/utils/logger';

export class UserService {
    /**
     * Create a new user with email/password
     */
    async createUser(email: string, password: string) {
        // Check if user exists
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            throw new Error('User with this email already exists');
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // Create user
        try {
            const user = await prisma.user.create({
                data: {
                    email,
                    passwordHash,
                    role: 'user',
                },
                select: {
                    id: true,
                    email: true,
                    role: true,
                    createdAt: true,
                },
            });

            logger.info('User created successfully', { userId: user.id });
            return user;
        } catch (error) {
            logger.error('Error creating user', error);
            throw new Error('Failed to create user');
        }
    }

    /**
     * Validate user credentials
     */
    async validateUser(email: string, password: string) {
        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user || !user.passwordHash) {
            throw new Error('Invalid email or password');
        }

        const isValid = await bcrypt.compare(password, user.passwordHash);

        if (!isValid) {
            throw new Error('Invalid email or password');
        }

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { passwordHash, ...userWithoutPassword } = user;
        return userWithoutPassword;
    }

    /**
     * Find or create user from OAuth
     */
    async findOrCreateOAuthUser(profile: {
        id: string;
        email: string;
        name?: string;
        picture?: string;
    }) {
        let user = await prisma.user.findUnique({
            where: { email: profile.email },
        });

        if (!user) {
            user = await prisma.user.create({
                data: {
                    email: profile.email,
                    role: 'user',
                },
            });
            logger.info('OAuth user created', { userId: user.id, email: profile.email });
        }

        return user;
    }

    /**
     * Get user by ID
     */
    async getUserById(userId: string) {
        return prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                role: true,
                walletAddress: true,
                createdAt: true,
            },
        });
    }

    /**
     * Update wallet address
     */
    async updateWalletAddress(userId: string, walletAddress: string) {
        return prisma.user.update({
            where: { id: userId },
            data: { walletAddress },
            select: {
                id: true,
                email: true,
                role: true,
                walletAddress: true,
            },
        });
    }
}

export const userService = new UserService();
export default userService;
