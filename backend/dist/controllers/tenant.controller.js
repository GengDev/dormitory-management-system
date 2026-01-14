"use strict";
/**
 * Tenant Controller
 *
 * Controller functions สำหรับ tenant management operations
 *
 * @module server/src/controllers/tenant.controller
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.linkLineUser = exports.deleteTenant = exports.updateTenant = exports.createTenant = exports.getTenantById = exports.getTenants = void 0;
const client_1 = require("@prisma/client");
const bcrypt_1 = __importDefault(require("bcrypt"));
const errorHandler_1 = require("../middleware/errorHandler");
const logger_1 = require("../utils/logger");
const prisma = new client_1.PrismaClient();
/**
 * Get All Tenants
 *
 * @route   GET /api/tenants
 * @access  Private (Admin only)
 *
 * @param req - Express request (query: roomId, isActive, search, page, limit)
 * @param res - Express response
 */
exports.getTenants = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { roomId, status, search, page = '1', limit = '20' } = req.query;
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;
    const where = {
        deletedAt: null,
    };
    if (roomId) {
        where.roomId = roomId;
    }
    if (status) {
        where.status = status;
    }
    if (search) {
        where.OR = [
            { fullName: { contains: search, mode: 'insensitive' } },
            { phone: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
        ];
    }
    const [tenants, total] = await Promise.all([
        prisma.tenant.findMany({
            where,
            include: {
                room: {
                    select: {
                        id: true,
                        roomNumber: true,
                        building: {
                            select: {
                                id: true,
                                name: true,
                            },
                        },
                    },
                },
                user: {
                    select: {
                        id: true,
                        email: true,
                    },
                },
                lineUser: {
                    select: {
                        id: true,
                        lineUserId: true,
                        displayName: true,
                    },
                },
            },
            skip,
            take: limitNum,
            orderBy: { createdAt: 'desc' },
        }),
        prisma.tenant.count({ where }),
    ]);
    res.json({
        success: true,
        data: tenants,
        meta: {
            total,
            page: pageNum,
            limit: limitNum,
            totalPages: Math.ceil(total / limitNum),
        },
    });
});
/**
 * Get Tenant By ID
 *
 * @route   GET /api/tenants/:id
 * @access  Private (Admin or own tenant)
 *
 * @param req - Express request (params: id)
 * @param res - Express response
 */
exports.getTenantById = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const tenant = await prisma.tenant.findUnique({
        where: { id },
        include: {
            room: {
                include: {
                    building: {
                        select: {
                            id: true,
                            name: true,
                            address: true,
                        },
                    },
                },
            },
            user: {
                select: {
                    id: true,
                    email: true,
                    fullName: true,
                },
            },
            lineUser: {
                select: {
                    id: true,
                    lineUserId: true,
                    displayName: true,
                    pictureUrl: true,
                },
            },
        },
    });
    if (!tenant || tenant.deletedAt) {
        res.status(404).json({
            success: false,
            message: 'Tenant not found',
        });
        return;
    }
    // Check authorization: Admin can see all, tenant can only see own
    if (req.user?.role !== 'admin') {
        // Check if user is linked to this tenant
        if (req.user?.userId !== tenant.userId) {
            res.status(403).json({
                success: false,
                message: 'Insufficient permissions',
            });
            return;
        }
    }
    res.json({
        success: true,
        data: { tenant },
    });
});
/**
 * Create Tenant
 *
 * @route   POST /api/tenants
 * @access  Private (Admin only)
 *
 * @param req - Express request (body: roomId, fullName, phone, ...)
 * @param res - Express response
 */
exports.createTenant = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    let { roomId, fullName, phone, email, idCardNumber, dateOfBirth, occupation, moveInDate, emergencyPhone, emergencyContact, emergencyContactPhone, userId, lineUserId, contractStartDate, contractEndDate } = req.body;
    // Convert empty strings to null for optional fields
    Object.keys(req.body).forEach(key => {
        if (req.body[key] === '') {
            req.body[key] = null;
        }
    });
    // Re-destructure sanitized values
    ({ roomId, fullName, phone, email, idCardNumber, dateOfBirth, occupation, moveInDate, emergencyPhone, emergencyContact, emergencyContactPhone, userId, lineUserId, contractStartDate, contractEndDate } = req.body);
    logger_1.logger.info('Creating tenant [DEBUG-V2]', { roomId, fullName, lineUserId });
    // Check for duplicate tenant (Email or ID Card)
    // Note: Prisma @unique constraint applies to all records, including soft-deleted ones.
    // We check for any existence to avoid P2002 error from Prisma.
    const existingTenantByEmail = await prisma.tenant.findUnique({
        where: { email },
    });
    if (existingTenantByEmail) {
        res.status(400).json({
            success: false,
            message: existingTenantByEmail.deletedAt
                ? 'A tenant with this email already exists in history (deleted). Please use a different email or contact admin to restore.'
                : 'A tenant with this email already exists',
        });
        return;
    }
    const existingTenantByIdCard = await prisma.tenant.findUnique({
        where: { idCardNumber },
    });
    if (existingTenantByIdCard) {
        res.status(400).json({
            success: false,
            message: existingTenantByIdCard.deletedAt
                ? 'A tenant with this ID card number already exists in history (deleted).'
                : 'A tenant with this ID card number already exists',
        });
        return;
    }
    // Check if a User account with this email already exists
    const existingUserByEmail = await prisma.user.findUnique({
        where: { email },
    });
    if (!userId && existingUserByEmail) {
        res.status(400).json({
            success: false,
            message: 'A user account with this email already exists but is not linked to any tenant. Please link to existing user or use a different email.',
        });
        return;
    }
    // Check if room exists and is available
    const room = await prisma.room.findUnique({
        where: { id: roomId },
        include: {
            tenants: {
                where: {
                    status: 'active',
                    deletedAt: null,
                },
            },
        },
    });
    if (!room || room.deletedAt) {
        res.status(404).json({
            success: false,
            message: 'Room not found',
        });
        return;
    }
    // Check if room is already occupied
    if (room.tenants.length >= room.maxOccupancy) {
        res.status(400).json({
            success: false,
            message: 'Room is already at maximum occupancy',
        });
        return;
    }
    // Check if user exists (if provided) or create a new one
    let resolvedUserId = userId;
    let autoCreatedCredentials = null;
    if (userId) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
        });
        if (!user || user.deletedAt) {
            res.status(404).json({
                success: false,
                message: 'User not found',
            });
            return;
        }
    }
    else if (email) {
        // Check if user already exists with this email
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });
        if (existingUser) {
            resolvedUserId = existingUser.id;
            logger_1.logger.info(`Linking existing user ${email} to new tenant`);
        }
        else {
            // Auto-create user account
            const saltRounds = 12;
            const defaultPassword = phone || '123456'; // Use phone as password, fallback to 123456
            const passwordHash = await bcrypt_1.default.hash(defaultPassword, saltRounds);
            const newUser = await prisma.user.create({
                data: {
                    email,
                    passwordHash,
                    fullName,
                    phone,
                    role: client_1.Role.tenant,
                    isActive: true,
                },
            });
            resolvedUserId = newUser.id;
            autoCreatedCredentials = {
                username: email,
                password: defaultPassword,
                note: 'Username is email, Password is phone number',
            };
            logger_1.logger.info(`Auto-created user account for tenant: ${email}`);
        }
    }
    // Check if LINE user exists (if provided)
    let resolvedLineUserUuid = null;
    if (lineUserId) {
        // Check if input is a raw LINE UID (starts with U)
        if (/^U[0-9a-f]{32}$/.test(lineUserId)) {
            // It's a raw LINE UID - Find or Create
            const lineUser = await prisma.lineUser.upsert({
                where: { lineUserId: lineUserId },
                update: {},
                create: {
                    lineUserId: lineUserId,
                    displayName: 'Unknown (Pending Link)',
                },
            });
            resolvedLineUserUuid = lineUser.id;
        }
        else {
            // Assume it's an internal UUID
            const lineUser = await prisma.lineUser.findUnique({
                where: { id: lineUserId },
            });
            if (!lineUser) {
                res.status(404).json({
                    success: false,
                    message: 'LINE user not found',
                });
                return;
            }
            resolvedLineUserUuid = lineUser.id;
        }
    }
    // Create tenant
    const tenant = await prisma.tenant.create({
        data: {
            user: resolvedUserId ? { connect: { id: resolvedUserId } } : undefined,
            lineUser: resolvedLineUserUuid ? { connect: { id: resolvedLineUserUuid } } : undefined,
            room: { connect: { id: roomId } },
            fullName,
            phone,
            email,
            idCardNumber,
            emergencyContact,
            emergencyContactPhone: emergencyContactPhone || emergencyPhone || null,
            contractStartDate: (contractStartDate && !isNaN(new Date(contractStartDate).getTime())) ? new Date(contractStartDate) : null,
            contractEndDate: (contractEndDate && !isNaN(new Date(contractEndDate).getTime())) ? new Date(contractEndDate) : null,
            dateOfBirth: (dateOfBirth && !isNaN(new Date(dateOfBirth).getTime())) ? new Date(dateOfBirth) : null,
            occupation: occupation || null,
            moveInDate: (moveInDate && !isNaN(new Date(moveInDate).getTime())) ? new Date(moveInDate) : null,
        },
        include: {
            room: {
                select: {
                    id: true,
                    roomNumber: true,
                    building: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                },
            },
        },
    });
    // Update room status to occupied
    await prisma.room.update({
        where: { id: roomId },
        data: { status: 'occupied' },
    });
    logger_1.logger.info(`Tenant created: ${tenant.fullName}`, {
        tenantId: tenant.id,
        roomId,
        createdBy: req.user?.userId,
    });
    res.status(201).json({
        success: true,
        message: 'Tenant created successfully' + (autoCreatedCredentials ? ' and user account generated' : ''),
        data: {
            tenant,
            credentials: autoCreatedCredentials
        },
    });
});
/**
 * Update Tenant
 *
 * @route   PUT /api/tenants/:id
 * @access  Private (Admin only)
 *
 * @param req - Express request (params: id, body: various tenant fields)
 * @param res - Express response
 */
exports.updateTenant = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;
    logger_1.logger.info('Updating tenant [DEBUG-V2]', { id, fields: Object.keys(updateData) });
    // Check if tenant exists
    const existingTenant = await prisma.tenant.findUnique({
        where: { id },
    });
    if (!existingTenant || existingTenant.deletedAt) {
        res.status(404).json({
            success: false,
            message: 'Tenant not found',
        });
        return;
    }
    // Convert date fields and map field names
    const dateFields = ['dateOfBirth', 'moveInDate', 'moveOutDate', 'contractStartDate', 'contractEndDate'];
    dateFields.forEach(field => {
        if (updateData[field] !== undefined) {
            if (updateData[field]) {
                const date = new Date(updateData[field]);
                if (!isNaN(date.getTime())) {
                    updateData[field] = date;
                }
                else {
                    updateData[field] = null;
                }
            }
            else {
                updateData[field] = null;
            }
        }
    });
    // Convert empty strings to null for optional fields (except for specific non-nullable fields if any)
    Object.keys(updateData).forEach(key => {
        if (updateData[key] === '') {
            // Fields that should be null if empty
            const nullableFields = ['emergencyPhone', 'emergencyContactPhone', 'emergencyContact', 'occupation', 'lineUserId', 'userId', 'roomId'];
            if (nullableFields.includes(key) || dateFields.includes(key)) {
                updateData[key] = null;
            }
        }
    });
    if (updateData.emergencyPhone !== undefined) {
        if (!updateData.emergencyContactPhone) {
            updateData.emergencyContactPhone = updateData.emergencyPhone;
        }
        delete updateData.emergencyPhone;
    }
    // Handle lineUserId
    if (updateData.hasOwnProperty('lineUserId')) {
        if (updateData.lineUserId) {
            const lineUserIdInput = updateData.lineUserId;
            let resolvedLineUserUuid = null;
            if (/^U[0-9a-f]{32}$/.test(lineUserIdInput)) {
                // It's a raw LINE UID - Find or Create
                const lineUser = await prisma.lineUser.upsert({
                    where: { lineUserId: lineUserIdInput },
                    update: {},
                    create: {
                        lineUserId: lineUserIdInput,
                        displayName: 'Unknown (Pending Link)',
                    },
                });
                resolvedLineUserUuid = lineUser.id;
            }
            else {
                // Assume it's an internal UUID (The UUID of the lineUser record)
                const lineUser = await prisma.lineUser.findUnique({
                    where: { id: lineUserIdInput },
                });
                if (lineUser) {
                    resolvedLineUserUuid = lineUser.id;
                }
            }
            if (resolvedLineUserUuid) {
                updateData.lineUser = { connect: { id: resolvedLineUserUuid } };
            }
        }
        else {
            // If lineUserId is null or empty string, disconnect it
            logger_1.logger.info('Disconnecting lineUser for tenant', { tenantId: id });
            updateData.lineUser = { disconnect: true };
        }
        // Always remove scalar field before update to avoid Prisma validation error
        delete updateData.lineUserId;
    }
    // Handle roomId relation
    if (updateData.roomId !== undefined) {
        if (updateData.roomId) {
            updateData.room = { connect: { id: updateData.roomId } };
        }
        else {
            updateData.room = { disconnect: true };
        }
        delete updateData.roomId;
    }
    // Handle userId relation
    if (updateData.userId !== undefined) {
        if (updateData.userId) {
            updateData.user = { connect: { id: updateData.userId } };
        }
        else {
            updateData.user = { disconnect: true };
        }
        delete updateData.userId;
    }
    const tenant = await prisma.tenant.update({
        where: { id },
        data: updateData,
        include: {
            room: {
                select: {
                    id: true,
                    roomNumber: true,
                },
            },
        },
    });
    logger_1.logger.info(`Tenant updated: ${tenant.fullName}`, {
        tenantId: id,
        updatedBy: req.user?.userId,
    });
    res.json({
        success: true,
        message: 'Tenant updated successfully',
        data: { tenant },
    });
});
/**
 * Delete Tenant (Soft Delete)
 *
 * @route   DELETE /api/tenants/:id
 * @access  Private (Admin only)
 *
 * @param req - Express request (params: id)
 * @param res - Express response
 */
exports.deleteTenant = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    // Check if tenant exists
    const existingTenant = await prisma.tenant.findUnique({
        where: { id },
        include: {
            room: true,
        },
    });
    if (!existingTenant || existingTenant.deletedAt) {
        res.status(404).json({
            success: false,
            message: 'Tenant not found',
        });
        return;
    }
    // Soft delete tenant
    await prisma.tenant.update({
        where: { id },
        data: {
            deletedAt: new Date(),
            status: 'inactive',
        },
    });
    // Check if room has other active tenants
    const activeTenants = await prisma.tenant.count({
        where: {
            roomId: existingTenant.roomId,
            status: 'active',
            deletedAt: null,
        },
    });
    // Update room status if no active tenants
    if (activeTenants === 0) {
        await prisma.room.update({
            where: { id: existingTenant.roomId },
            data: { status: 'available' },
        });
    }
    logger_1.logger.info(`Tenant deleted: ${existingTenant.fullName}`, {
        tenantId: id,
        deletedBy: req.user?.userId,
    });
    res.json({
        success: true,
        message: 'Tenant deleted successfully',
    });
});
/**
 * Link LINE User to Tenant
 *
 * @route   POST /api/tenants/:id/link-line
 * @access  Private (Admin only)
 *
 * @param req - Express request (params: id, body: lineUserId)
 * @param res - Express response
 */
exports.linkLineUser = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const { lineUserId } = req.body;
    // Check if tenant exists
    const tenant = await prisma.tenant.findUnique({
        where: { id },
    });
    if (!tenant || tenant.deletedAt) {
        res.status(404).json({
            success: false,
            message: 'Tenant not found',
        });
        return;
    }
    // Check if LINE user exists
    const lineUser = await prisma.lineUser.findUnique({
        where: { id: lineUserId },
    });
    if (!lineUser) {
        res.status(404).json({
            success: false,
            message: 'LINE user not found',
        });
        return;
    }
    // Update tenant
    const updatedTenant = await prisma.tenant.update({
        where: { id },
        data: { lineUserId },
        include: {
            lineUser: true,
        },
    });
    if (updatedTenant.userId) {
        await prisma.lineUser.update({
            where: { id: lineUserId },
            data: {
                userId: updatedTenant.userId,
            },
        });
    }
    logger_1.logger.info(`LINE user linked to tenant: ${tenant.fullName}`, {
        tenantId: id,
        lineUserId,
        linkedBy: req.user?.userId,
    });
    res.json({
        success: true,
        message: 'LINE user linked successfully',
        data: { tenant: updatedTenant },
    });
});
//# sourceMappingURL=tenant.controller.js.map