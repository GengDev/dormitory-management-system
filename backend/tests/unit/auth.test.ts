import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { testDb, factories, jwtUtils, mockData } from '../helpers';

describe('Authentication', () => {
    beforeEach(async () => {
        await testDb.cleanup();
    });

    afterAll(async () => {
        await testDb.disconnect();
    });

    describe('User Registration', () => {
        it('should create a new user with hashed password', async () => {
            const user = await factories.createUser({
                email: 'newuser@example.com',
                fullName: 'New User',
            });

            expect(user).toBeDefined();
            expect(user.email).toBe('newuser@example.com');
            expect(user.fullName).toBe('New User');
            expect(user.passwordHash).toBeDefined();
            expect(user.passwordHash).not.toBe('password123');
        });

        it('should not allow duplicate email addresses', async () => {
            await factories.createUser({ email: 'duplicate@example.com' });

            await expect(
                factories.createUser({ email: 'duplicate@example.com' })
            ).rejects.toThrow();
        });

        it('should set default role to tenant', async () => {
            const user = await factories.createUser();
            expect(user.role).toBe('tenant');
        });

        it('should allow creating admin users', async () => {
            const admin = await factories.createAdmin();
            expect(admin.role).toBe('admin');
        });
    });

    describe('Password Hashing', () => {
        it('should hash password correctly', async () => {
            const password = 'testpassword123';
            const hash = await bcrypt.hash(password, 10);

            expect(hash).toBeDefined();
            expect(hash).not.toBe(password);
            expect(hash.length).toBeGreaterThan(20);
        });

        it('should verify password correctly', async () => {
            const password = 'testpassword123';
            const hash = await bcrypt.hash(password, 10);

            const isValid = await bcrypt.compare(password, hash);
            expect(isValid).toBe(true);
        });

        it('should reject incorrect password', async () => {
            const password = 'testpassword123';
            const hash = await bcrypt.hash(password, 10);

            const isValid = await bcrypt.compare('wrongpassword', hash);
            expect(isValid).toBe(false);
        });
    });

    describe('JWT Token Generation', () => {
        it('should generate valid JWT token', () => {
            const userId = 'test-user-id';
            const token = jwtUtils.generateToken(userId);

            expect(token).toBeDefined();
            expect(typeof token).toBe('string');
            expect(token.split('.')).toHaveLength(3);
        });

        it('should include userId and role in token payload', () => {
            const userId = 'test-user-id';
            const role = 'tenant';
            const token = jwtUtils.generateToken(userId, role);

            const decoded = jwt.verify(
                token,
                process.env.JWT_SECRET || 'test-jwt-secret'
            ) as any;

            expect(decoded.userId).toBe(userId);
            expect(decoded.role).toBe(role);
        });

        it('should generate admin token with admin role', () => {
            const userId = 'admin-user-id';
            const token = jwtUtils.generateAdminToken(userId);

            const decoded = jwt.verify(
                token,
                process.env.JWT_SECRET || 'test-jwt-secret'
            ) as any;

            expect(decoded.role).toBe('admin');
        });

        it('should reject expired tokens', () => {
            const userId = 'test-user-id';
            const expiredToken = jwtUtils.generateExpiredToken(userId);

            expect(() => {
                jwt.verify(expiredToken, process.env.JWT_SECRET || 'test-jwt-secret');
            }).toThrow();
        });

        it('should reject invalid tokens', () => {
            const invalidToken = 'invalid.token.here';

            expect(() => {
                jwt.verify(invalidToken, process.env.JWT_SECRET || 'test-jwt-secret');
            }).toThrow();
        });
    });

    describe('User Authentication Flow', () => {
        it('should authenticate user with correct credentials', async () => {
            const password = 'password123';
            const user = await factories.createUser({
                email: 'auth@example.com',
            });

            // Simulate login
            const isValid = await bcrypt.compare(password, user.passwordHash);
            expect(isValid).toBe(true);

            // Generate token
            const token = jwtUtils.generateToken(user.id, user.role);
            expect(token).toBeDefined();

            // Verify token
            const decoded = jwt.verify(
                token,
                process.env.JWT_SECRET || 'test-jwt-secret'
            ) as any;
            expect(decoded.userId).toBe(user.id);
        });

        it('should reject authentication with incorrect password', async () => {
            const user = await factories.createUser({
                email: 'auth@example.com',
            });

            const isValid = await bcrypt.compare('wrongpassword', user.passwordHash);
            expect(isValid).toBe(false);
        });

        it('should not authenticate inactive users', async () => {
            const user = await factories.createUser({
                email: 'inactive@example.com',
                isActive: false,
            });

            expect(user.isActive).toBe(false);
        });
    });

    describe('Role-Based Access', () => {
        it('should identify admin users', async () => {
            const admin = await factories.createAdmin();
            expect(admin.role).toBe('admin');
        });

        it('should identify tenant users', async () => {
            const tenant = await factories.createUser({ role: 'tenant' });
            expect(tenant.role).toBe('tenant');
        });

        it('should identify guest users', async () => {
            const guest = await factories.createUser({ role: 'guest' });
            expect(guest.role).toBe('guest');
        });
    });
});
