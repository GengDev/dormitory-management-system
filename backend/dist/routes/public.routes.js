"use strict";
/**
 * Public Routes
 *
 * API endpoints สำหรับ public access (ไม่ต้อง authentication)
 * ใช้สำหรับ frontend ที่ไม่ต้อง login
 *
 * @module routes/public.routes
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
/**
 * GET /public/buildings
 * ดึงข้อมูลอาคารทั้งหมด (สำหรับหน้าแรก)
 */
router.get('/buildings', async (_req, res) => {
    try {
        const buildings = await prisma.building.findMany({
            where: { deletedAt: null },
            select: {
                id: true,
                name: true,
                address: true,
                description: true,
                totalFloors: true,
                amenities: true,
                images: true,
                _count: {
                    select: {
                        rooms: {
                            where: { deletedAt: null }
                        }
                    }
                }
            },
            orderBy: { createdAt: 'asc' }
        });
        // เพิ่ม availableRooms count
        const buildingsWithStats = await Promise.all(buildings.map(async (building) => {
            const availableRooms = await prisma.room.count({
                where: {
                    buildingId: building.id,
                    status: 'available',
                    deletedAt: null
                }
            });
            return {
                ...building,
                totalRooms: building._count.rooms,
                availableRooms,
            };
        }));
        return res.json({
            success: true,
            data: buildingsWithStats
        });
    }
    catch (error) {
        console.error('Error fetching public buildings:', error);
        return res.status(500).json({
            success: false,
            message: 'เกิดข้อผิดพลาดในการดึงข้อมูลอาคาร'
        });
    }
});
/**
 * GET /public/rooms
 * ดึงข้อมูลห้องว่าง (สำหรับหน้าแรก)
 */
router.get('/rooms', async (req, res) => {
    try {
        const { status = 'available', limit = '6', buildingId } = req.query;
        const where = {
            deletedAt: null
        };
        if (status) {
            where.status = status;
        }
        if (buildingId) {
            where.buildingId = buildingId;
        }
        const rooms = await prisma.room.findMany({
            where,
            select: {
                id: true,
                roomNumber: true,
                floorNumber: true,
                roomType: true,
                monthlyRent: true,
                areaSqm: true,
                status: true,
                amenities: true,
                building: {
                    select: {
                        id: true,
                        name: true,
                        address: true
                    }
                }
            },
            orderBy: { createdAt: 'asc' },
            take: parseInt(limit) || 6
        });
        return res.json({
            success: true,
            data: rooms
        });
    }
    catch (error) {
        console.error('Error fetching public rooms:', error);
        return res.status(500).json({
            success: false,
            message: 'เกิดข้อผิดพลาดในการดึงข้อมูลห้อง'
        });
    }
});
/**
 * GET /public/buildings/:id
 * ดึงข้อมูลอาคารเฉพาะ (พร้อมห้องทั้งหมด)
 */
router.get('/buildings/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const building = await prisma.building.findUnique({
            where: { id, deletedAt: null },
            select: {
                id: true,
                name: true,
                address: true,
                description: true,
                totalFloors: true,
                amenities: true,
                images: true,
                rooms: {
                    where: { deletedAt: null },
                    select: {
                        id: true,
                        roomNumber: true,
                        floorNumber: true,
                        roomType: true,
                        monthlyRent: true,
                        areaSqm: true,
                        status: true,
                        amenities: true
                    },
                    orderBy: { roomNumber: 'asc' }
                }
            }
        });
        if (!building) {
            return res.status(404).json({
                success: false,
                message: 'ไม่พบข้อมูลอาคาร'
            });
        }
        // คำนวณสถิติ
        const totalRooms = building.rooms.length;
        const availableRooms = building.rooms.filter(room => room.status === 'available').length;
        const occupiedRooms = building.rooms.filter(room => room.status === 'occupied').length;
        return res.json({
            success: true,
            data: {
                ...building,
                stats: {
                    totalRooms,
                    availableRooms,
                    occupiedRooms
                }
            }
        });
    }
    catch (error) {
        console.error('Error fetching public building:', error);
        return res.status(500).json({
            success: false,
            message: 'เกิดข้อผิดพลาดในการดึงข้อมูลอาคาร'
        });
    }
});
/**
 * GET /public/stats
 * ดึงสถิติภาพรวม (สำหรับหน้าแรก)
 */
router.get('/stats', async (_req, res) => {
    try {
        const [totalBuildings, totalRooms, availableRooms, totalTenants] = await Promise.all([
            prisma.building.count({ where: { deletedAt: null } }),
            prisma.room.count({ where: { deletedAt: null } }),
            prisma.room.count({ where: { status: 'available', deletedAt: null } }),
            prisma.tenant.count({ where: { status: 'active', deletedAt: null } })
        ]);
        return res.json({
            success: true,
            data: {
                totalBuildings,
                totalRooms,
                availableRooms,
                totalTenants,
                occupancyRate: totalRooms > 0 ? ((totalRooms - availableRooms) / totalRooms * 100).toFixed(1) : 0
            }
        });
    }
    catch (error) {
        console.error('Error fetching public stats:', error);
        return res.status(500).json({
            success: false,
            message: 'เกิดข้อผิดพลาดในการดึงข้อมูลสถิติ'
        });
    }
});
exports.default = router;
//# sourceMappingURL=public.routes.js.map