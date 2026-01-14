"use strict";
/**
 * Report Routes
 *
 * Routes สำหรับ reports และ analytics
 *
 * @module server/src/routes/report.routes
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const report_controller_1 = require("../controllers/report.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const errorHandler_1 = require("../middleware/errorHandler");
const prisma = new client_1.PrismaClient();
const router = (0, express_1.Router)();
/**
 * @route   GET /api/reports
 * @desc    Get general dashboard reports
 * @access  Private (Admin only)
 * @query   period (current_month, last_month, current_year, etc.), startDate, endDate
 */
router.get('/', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)(['admin']), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { period, startDate, endDate } = req.query;
    // Calculate date range based on period
    let start, end;
    if (startDate && endDate) {
        start = new Date(startDate);
        end = new Date(endDate);
    }
    else {
        const now = new Date();
        switch (period) {
            case 'current_month':
                start = new Date(now.getFullYear(), now.getMonth(), 1);
                end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                break;
            case 'last_month':
                start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                end = new Date(now.getFullYear(), now.getMonth(), 0);
                break;
            case 'current_year':
                start = new Date(now.getFullYear(), 0, 1);
                end = new Date(now.getFullYear(), 11, 31);
                break;
            case 'last_year':
                start = new Date(now.getFullYear() - 1, 0, 1);
                end = new Date(now.getFullYear() - 1, 11, 31);
                break;
            default:
                start = new Date(now.getFullYear(), now.getMonth(), 1);
                end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        }
    }
    // Get occupancy data
    const buildings = await prisma.building.findMany({
        where: { deletedAt: null },
        include: {
            rooms: {
                where: { deletedAt: null },
                include: {
                    tenants: {
                        where: {
                            status: 'active',
                            deletedAt: null,
                        },
                    },
                },
            },
        },
    });
    const occupancy = buildings.map((building) => {
        const totalRooms = building.rooms.length;
        const occupiedRooms = building.rooms.filter((room) => room.tenants.length > 0).length;
        const availableRooms = totalRooms - occupiedRooms;
        const occupancyRate = totalRooms > 0 ? (occupiedRooms / totalRooms) * 100 : 0;
        return {
            buildingId: building.id,
            buildingName: building.name,
            totalRooms,
            occupiedRooms,
            availableRooms,
            occupancyRate: Math.round(occupancyRate * 100) / 100,
        };
    });
    // Get revenue data
    const payments = await prisma.payment.findMany({
        where: {
            paymentDate: {
                gte: start,
                lte: end,
            },
            deletedAt: null,
        },
    });
    const totalRevenue = payments.reduce((sum, p) => sum + Number(p.amount), 0);
    // Group payments by month for monthly revenue chart
    const monthlyRevenueMap = new Map();
    payments.forEach((payment) => {
        const date = new Date(payment.paymentDate);
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const monthName = date.toLocaleString('th-TH', { month: 'long' });
        if (!monthlyRevenueMap.has(key)) {
            monthlyRevenueMap.set(key, {
                month: monthName,
                year: date.getFullYear(),
                revenue: 0,
            });
        }
        monthlyRevenueMap.get(key).revenue += Number(payment.amount);
    });
    const monthlyRevenue = Array.from(monthlyRevenueMap.values()).sort((a, b) => {
        if (a.year !== b.year)
            return b.year - a.year;
        return b.month.localeCompare(a.month, 'th-TH');
    });
    // Get overdue data
    const overdueBills = await prisma.bill.findMany({
        where: {
            status: 'pending',
            dueDate: { lt: new Date() },
            deletedAt: null,
        },
    });
    const totalOverdue = overdueBills.reduce((sum, bill) => sum + Number(bill.totalAmount) - Number(bill.paidAmount), 0);
    // Get pending bills count
    const pendingBills = await prisma.bill.count({
        where: {
            status: 'pending',
            deletedAt: null,
        },
    });
    // Get pending maintenance count
    const pendingMaintenance = await prisma.maintenanceRequest.count({
        where: {
            status: 'pending',
            deletedAt: null,
        },
    });
    // Get total tenants
    const totalTenants = await prisma.tenant.count({
        where: {
            status: 'active',
            deletedAt: null,
        },
    });
    // Get active tenants (same as totalTenants for now)
    const activeTenants = totalTenants;
    // Get maintenance requests count
    const maintenanceRequests = await prisma.maintenanceRequest.count({
        where: {
            deletedAt: null,
        },
    });
    // Get pending payments count
    const pendingPayments = await prisma.payment.count({
        where: {
            status: 'pending',
            deletedAt: null,
        },
    });
    // Get tenant payment stats (top payers)
    const tenantPayments = await prisma.payment.findMany({
        where: {
            paymentDate: {
                gte: start,
                lte: end,
            },
            deletedAt: null,
        },
        include: {
            bill: {
                include: {
                    tenant: {
                        select: {
                            id: true,
                            fullName: true,
                        },
                    },
                },
            },
        },
    });
    const tenantPaymentMap = new Map();
    tenantPayments.forEach((payment) => {
        const tenantId = payment.bill?.tenant?.id;
        const tenantName = payment.bill?.tenant?.fullName;
        if (tenantId && tenantName) {
            if (!tenantPaymentMap.has(tenantId)) {
                tenantPaymentMap.set(tenantId, {
                    tenantId,
                    tenantName,
                    totalPaid: 0,
                    paymentCount: 0,
                });
            }
            const stats = tenantPaymentMap.get(tenantId);
            stats.totalPaid += Number(payment.amount);
            stats.paymentCount += 1;
            stats.paymentRate = stats.paymentCount > 0 ? (stats.totalPaid / stats.paymentCount) : 0;
        }
    });
    const tenantPaymentStats = Array.from(tenantPaymentMap.values()).sort((a, b) => b.totalPaid - a.totalPaid);
    res.json({
        success: true,
        data: {
            period: {
                start: start.toISOString(),
                end: end.toISOString(),
                period: period || 'current_month',
            },
            summary: {
                totalBuildings: buildings.length,
                totalRooms: occupancy.reduce((sum, b) => sum + b.totalRooms, 0),
                occupiedRooms: occupancy.reduce((sum, b) => sum + b.occupiedRooms, 0),
                availableRooms: occupancy.reduce((sum, b) => sum + b.availableRooms, 0),
                totalTenants,
                activeTenants,
                pendingBills,
                pendingMaintenance,
                maintenanceRequests,
                pendingPayments,
                totalRevenue,
                totalOverdue,
            },
            monthlyRevenue,
            buildingStats: occupancy,
            tenantPaymentStats,
            occupancy: {
                overall: {
                    totalRooms: occupancy.reduce((sum, b) => sum + b.totalRooms, 0),
                    occupiedRooms: occupancy.reduce((sum, b) => sum + b.occupiedRooms, 0),
                    availableRooms: occupancy.reduce((sum, b) => sum + b.availableRooms, 0),
                    occupancyRate: occupancy.reduce((sum, b) => sum + b.totalRooms, 0) > 0
                        ? Math.round((occupancy.reduce((sum, b) => sum + b.occupiedRooms, 0) / occupancy.reduce((sum, b) => sum + b.totalRooms, 0)) * 100 * 100) / 100
                        : 0,
                },
                byBuilding: occupancy,
            },
        },
    });
}));
/**
 * @route   GET /api/reports/occupancy
 * @desc    Get room occupancy statistics
 * @access  Private (Admin only)
 * @query   startDate, endDate
 */
router.get('/occupancy', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)(['admin']), report_controller_1.getOccupancyReport);
/**
 * @route   GET /api/reports/revenue
 * @desc    Get revenue statistics
 * @access  Private (Admin only)
 * @query   startDate, endDate, groupBy
 */
router.get('/revenue', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)(['admin']), report_controller_1.getRevenueReport);
/**
 * @route   GET /api/reports/overdue-summary
 * @desc    Get overdue bills summary
 * @access  Private (Admin only)
 */
router.get('/overdue-summary', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)(['admin']), report_controller_1.getOverdueSummary);
/**
 * @route   GET /api/reports/occupancy/export
 * @desc    Export occupancy report as CSV
 * @access  Private (Admin only)
 * @query   startDate, endDate, format
 */
router.get('/occupancy/export', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)(['admin']), report_controller_1.exportOccupancyReport);
/**
 * @route   GET /api/reports/revenue/export
 * @desc    Export revenue report as CSV
 * @access  Private (Admin only)
 * @query   startDate, endDate, format
 */
router.get('/revenue/export', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)(['admin']), report_controller_1.exportRevenueReport);
/**
 * @route   GET /api/reports/overdue/export
 * @desc    Export overdue bills report as CSV
 * @access  Private (Admin only)
 * @query   format
 */
router.get('/overdue/export', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)(['admin']), report_controller_1.exportOverdueReport);
exports.default = router;
//# sourceMappingURL=report.routes.js.map