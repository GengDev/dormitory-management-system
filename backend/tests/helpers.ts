import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

/**
 * Test Database Utilities
 */
export const testDb = {
    /**
     * Clean all tables in the database
     */
    async cleanup() {
        const tables = [
            'chat_messages',
            'chat_rooms',
            'notifications',
            'line_events',
            'line_users',
            'bill_items',
            'payments',
            'bills',
            'room_utilities',
            'maintenance_requests',
            'tenants',
            'rooms',
            'buildings',
            'users',
        ];

        for (const table of tables) {
            await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${table}" CASCADE;`);
        }
    },

    /**
     * Disconnect from database
     */
    async disconnect() {
        await prisma.$disconnect();
    },
};

/**
 * Test Data Factories
 */
export const factories = {
    /**
     * Create a test user
     */
    async createUser(data?: Partial<any>) {
        const passwordHash = await bcrypt.hash('password123', 10);
        return prisma.user.create({
            data: {
                email: data?.email || `test${Date.now()}@example.com`,
                passwordHash,
                fullName: data?.fullName || 'Test User',
                phone: data?.phone || '0812345678',
                role: data?.role || 'tenant',
                isActive: data?.isActive ?? true,
                ...data,
            },
        });
    },

    /**
     * Create a test admin user
     */
    async createAdmin(data?: Partial<any>) {
        return factories.createUser({ role: 'admin', ...data });
    },

    /**
     * Create a test building
     */
    async createBuilding(data?: Partial<any>) {
        return prisma.building.create({
            data: {
                name: data?.name || `Building ${Date.now()}`,
                address: data?.address || '123 Test Street',
                description: data?.description || 'Test building',
                totalFloors: data?.totalFloors || 3,
                amenities: data?.amenities || ['WiFi', 'Parking'],
                images: data?.images || [],
                ...data,
            },
        });
    },

    /**
     * Create a test room
     */
    async createRoom(buildingId: string, data?: Partial<any>) {
        return prisma.room.create({
            data: {
                buildingId,
                roomNumber: data?.roomNumber || `${Date.now()}`,
                floorNumber: data?.floorNumber || 1,
                roomType: data?.roomType || 'single',
                monthlyRent: data?.monthlyRent || 3000,
                deposit: data?.deposit || 3000,
                areaSqm: data?.areaSqm || 20,
                maxOccupancy: data?.maxOccupancy || 1,
                description: data?.description || 'Test room',
                amenities: data?.amenities || ['AC', 'WiFi'],
                status: data?.status || 'available',
                images: data?.images || [],
                ...data,
            },
        });
    },

    /**
     * Create a test tenant
     */
    async createTenant(data?: Partial<any>) {
        return prisma.tenant.create({
            data: {
                fullName: data?.fullName || 'Test Tenant',
                email: data?.email || `tenant${Date.now()}@example.com`,
                phone: data?.phone || '0812345678',
                idCardNumber: data?.idCardNumber || `${Date.now()}`,
                status: data?.status || 'active',
                ...data,
            },
        });
    },

    /**
     * Create a test bill
     */
    async createBill(tenantId: string, roomId: string, data?: Partial<any>) {
        const now = new Date();
        return prisma.bill.create({
            data: {
                tenantId,
                roomId,
                billNumber: data?.billNumber || `BILL-${Date.now()}`,
                billingMonth: data?.billingMonth || now,
                dueDate: data?.dueDate || new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
                status: data?.status || 'pending',
                rentAmount: data?.rentAmount || 3000,
                waterUsage: data?.waterUsage || 10,
                waterRate: data?.waterRate || 15,
                waterAmount: data?.waterAmount || 150,
                electricityUsage: data?.electricityUsage || 100,
                electricityRate: data?.electricityRate || 8,
                electricityAmount: data?.electricityAmount || 800,
                subtotal: data?.subtotal || 3950,
                tax: data?.tax || 0,
                totalAmount: data?.totalAmount || 3950,
                ...data,
            },
        });
    },

    /**
     * Create a test payment
     */
    async createPayment(billId: string, tenantId: string, data?: Partial<any>) {
        return prisma.payment.create({
            data: {
                billId,
                tenantId,
                amount: data?.amount || 3950,
                paymentMethod: data?.paymentMethod || 'bank_transfer',
                paymentDate: data?.paymentDate || new Date(),
                status: data?.status || 'pending',
                ...data,
            },
        });
    },
};

/**
 * JWT Test Utilities
 */
export const jwtUtils = {
    /**
     * Generate a test JWT token
     */
    generateToken(userId: string, role: string = 'tenant') {
        return jwt.sign(
            { userId, role },
            process.env.JWT_SECRET || 'test-jwt-secret',
            { expiresIn: '1h' }
        );
    },

    /**
     * Generate an expired token
     */
    generateExpiredToken(userId: string, role: string = 'tenant') {
        return jwt.sign(
            { userId, role },
            process.env.JWT_SECRET || 'test-jwt-secret',
            { expiresIn: '-1h' }
        );
    },

    /**
     * Generate an admin token
     */
    generateAdminToken(userId: string) {
        return this.generateToken(userId, 'admin');
    },
};

/**
 * HTTP Test Utilities
 */
export const httpUtils = {
    /**
     * Create authorization header
     */
    authHeader(token: string) {
        return { Authorization: `Bearer ${token}` };
    },
};

/**
 * Mock Data
 */
export const mockData = {
    user: {
        email: 'test@example.com',
        password: 'password123',
        fullName: 'Test User',
        phone: '0812345678',
    },
    admin: {
        email: 'admin@example.com',
        password: 'admin123',
        fullName: 'Admin User',
        phone: '0812345679',
        role: 'admin',
    },
    building: {
        name: 'Test Building',
        address: '123 Test Street',
        description: 'A test building',
        totalFloors: 5,
        amenities: ['WiFi', 'Parking', 'Security'],
        images: [],
    },
    room: {
        roomNumber: '101',
        floorNumber: 1,
        roomType: 'single',
        monthlyRent: 3000,
        deposit: 3000,
        areaSqm: 20,
        maxOccupancy: 1,
        amenities: ['AC', 'WiFi', 'Hot Water'],
        status: 'available',
    },
};

export { prisma };
