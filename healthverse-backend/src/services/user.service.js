import bcrypt from 'bcryptjs';
import prisma from '../config/db.js';
import { AuthenticationError, ValidationError } from '../middleware/errorHandler.js';
import logger from '../utils/logger.js';

class UserService {
    /**
     * Create a new user with email/password
     */
    async createUser(email, password, name) {
        // Check if user exists
        const existingUser = await prisma.user.findUnique({
            where: { email }
        });

        if (existingUser) {
            throw new ValidationError('User with this email already exists');
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // Create user
        try {
            // Note: The schema doesn't have a 'name' field in User model based on previous file read (id, email, passwordHash, role, walletAddress, dates).
            // I will stick to the schema.
            const user = await prisma.user.create({
                data: {
                    email,
                    passwordHash,
                    role: 'user'
                },
                select: {
                    id: true,
                    email: true,
                    role: true,
                    createdAt: true
                }
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
    async validateUser(email, password) {
        const user = await prisma.user.findUnique({
            where: { email }
        });

        if (!user || !user.passwordHash) {
            throw new AuthenticationError('Invalid email or password');
        }

        const isValid = await bcrypt.compare(password, user.passwordHash);

        if (!isValid) {
            throw new AuthenticationError('Invalid email or password');
        }

        const { passwordHash, ...userWithoutPassword } = user;
        return userWithoutPassword;
    }
}

export const userService = new UserService();
export default userService;
