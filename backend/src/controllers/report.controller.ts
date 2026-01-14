/**
 * Report Controller
 * 
 * Controller functions สำหรับ reports และ analytics
 * 
 * @module server/src/controllers/report.controller
 */

import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth.middleware';
import { asyncHandler } from '../middleware/errorHandler';

const prisma = new PrismaClient();

/**
 * Get Occupancy Report
 * 
 * @route   GET /api/reports/occupancy
 * @access  Private (Admin only)
 * 
 * @param req - Express request
 * @param res - Express response
 */
export const getOccupancyReport = asyncHandler(async (_req: AuthRequest, res: Response) => {
  const buildings = await prisma.building.findMany({
    where: {
      deletedAt: null,
    },
    include: {
      rooms: {
        where: {
          deletedAt: null,
        },
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

  const report = buildings.map((building) => {
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

  const overall: any = {
    totalRooms: report.reduce((sum, b) => sum + b.totalRooms, 0),
    occupiedRooms: report.reduce((sum, b) => sum + b.occupiedRooms, 0),
    availableRooms: report.reduce((sum, b) => sum + b.availableRooms, 0),
  };
  overall.occupancyRate =
    overall.totalRooms > 0
      ? Math.round((overall.occupiedRooms / overall.totalRooms) * 100 * 100) / 100
      : 0;

  res.json({
    success: true,
    data: {
      overall,
      byBuilding: report,
    },
  });
});

/**
 * Get Revenue Report
 * 
 * @route   GET /api/reports/revenue
 * @access  Private (Admin only)
 * 
 * @param req - Express request (query: startDate, endDate, groupBy)
 * @param res - Express response
 */
export const getRevenueReport = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { startDate, endDate, groupBy = 'month' } = req.query;

  const start = startDate ? new Date(startDate as string) : new Date(new Date().getFullYear(), 0, 1);
  const end = endDate ? new Date(endDate as string) : new Date();

  const payments = await prisma.payment.findMany({
    where: {
      paymentDate: {
        gte: start,
        lte: end,
      },
      deletedAt: null,
    },
    include: {
      bill: true,
    },
  });

  // Group by period
  const grouped: { [key: string]: { total: number; count: number } } = {};

  payments.forEach((payment) => {
    let key: string;
    const date = new Date(payment.paymentDate);

    if (groupBy === 'day') {
      key = date.toISOString().split('T')[0];
    } else if (groupBy === 'month') {
      key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    } else {
      key = String(date.getFullYear());
    }

    if (!grouped[key]) {
      grouped[key] = { total: 0, count: 0 };
    }

    grouped[key].total += Number(payment.amount);
    grouped[key].count += 1;
  });

  const report = Object.entries(grouped).map(([period, data]) => ({
    period,
    totalRevenue: data.total,
    paymentCount: data.count,
    averagePayment: data.count > 0 ? data.total / data.count : 0,
  }));

  res.json({
    success: true,
    data: {
      period: {
        start: start.toISOString(),
        end: end.toISOString(),
        groupBy,
      },
      summary: {
        totalRevenue: payments.reduce((sum, p) => sum + Number(p.amount), 0),
        totalPayments: payments.length,
        averagePayment:
          payments.length > 0
            ? payments.reduce((sum, p) => sum + Number(p.amount), 0) / payments.length
            : 0,
      },
      byPeriod: report,
    },
  });
});

/**
 * Get Overdue Summary
 * 
 * @route   GET /api/reports/overdue-summary
 * @access  Private (Admin only)
 * 
 * @param req - Express request
 * @param res - Express response
 */
export const getOverdueSummary = asyncHandler(async (_req: AuthRequest, res: Response) => {
  const overdueBills = await prisma.bill.findMany({
    where: {
      status: 'pending',
      dueDate: { lt: new Date() },
      deletedAt: null,
    },
    include: {
      tenant: {
        select: {
          id: true,
          fullName: true,
        },
      },
      room: {
        select: {
          roomNumber: true,
        },
      },
    },
  });

  const totalOverdue = overdueBills.reduce(
    (sum, bill) => sum + Number(bill.totalAmount) - Number(bill.paidAmount),
    0
  );

  const byDaysOverdue = overdueBills.reduce((acc: { [key: string]: number }, bill) => {
    const daysOverdue = Math.floor(
      (new Date().getTime() - new Date(bill.dueDate).getTime()) / (1000 * 60 * 60 * 24)
    );
    const range =
      daysOverdue <= 7
        ? '1-7 days'
        : daysOverdue <= 30
          ? '8-30 days'
          : daysOverdue <= 60
            ? '31-60 days'
            : '60+ days';

    acc[range] = (acc[range] || 0) + Number(bill.totalAmount) - Number(bill.paidAmount);
    return acc;
  }, {});

  res.json({
    success: true,
    data: {
      totalOverdueBills: overdueBills.length,
      totalOverdueAmount: totalOverdue,
      byDaysOverdue,
      bills: overdueBills.map((bill) => ({
        id: bill.id,
        billNumber: bill.billNumber,
        tenant: bill.tenant.fullName,
        room: bill.room.roomNumber,
        amount: Number(bill.totalAmount) - Number(bill.paidAmount),
        dueDate: bill.dueDate,
        daysOverdue: Math.floor(
          (new Date().getTime() - new Date(bill.dueDate).getTime()) / (1000 * 60 * 60 * 24)
        ),
      })),
    },
  });
});

/**
 * Export Occupancy Report as CSV
 */
export const exportOccupancyReport = asyncHandler(async (_req: AuthRequest, res: Response) => {

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
            }
          }
        }
      }
    }
  });

  const csvData = buildings.map(building => ({
    building: building.name,
    totalRooms: building.rooms.length,
    occupiedRooms: building.rooms.filter(room => room.tenants.length > 0).length,
    availableRooms: building.rooms.filter(room => room.tenants.length === 0).length,
    occupancyRate: building.rooms.length > 0
      ? ((building.rooms.filter(room => room.tenants.length > 0).length / building.rooms.length) * 100).toFixed(1)
      : 0
  }));

  const csv = [
    ['Building', 'Total Rooms', 'Occupied Rooms', 'Available Rooms', 'Occupancy Rate (%)'].join(','),
    ...csvData.map(row => [row.building, row.totalRooms, row.occupiedRooms, row.availableRooms, row.occupancyRate].join(','))
  ].join('\n');

  res.header('Content-Type', 'text/csv');
  res.header('Content-Disposition', `attachment; filename="occupancy-report-${new Date().toISOString().split('T')[0]}.csv"`);
  res.send(csv);
});

/**
 * Export Revenue Report as CSV
 */
export const exportRevenueReport = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { startDate, endDate } = req.query;

  const start = startDate ? new Date(startDate as string) : new Date(new Date().getFullYear(), 0, 1);
  const end = endDate ? new Date(endDate as string) : new Date();

  const payments = await prisma.payment.findMany({
    where: {
      paymentDate: {
        gte: start,
        lte: end
      },
      deletedAt: null
    },
    include: {
      bill: {
        include: {
          tenant: {
            include: {
              room: {
                include: {
                  building: true
                }
              }
            }
          }
        }
      }
    },
    orderBy: { paymentDate: 'asc' }
  });

  const csvData = payments.map(payment => ({
    date: payment.paymentDate.toISOString().split('T')[0],
    billNumber: payment.bill?.billNumber || '',
    tenant: payment.bill?.tenant?.fullName || '',
    building: payment.bill?.tenant?.room?.building?.name || '',
    room: payment.bill?.tenant?.room?.roomNumber || '',
    amount: Number(payment.amount),
    method: payment.paymentMethod,
    reference: payment.referenceNumber || ''
  }));

  const csv = [
    ['Date', 'Bill Number', 'Tenant', 'Building', 'Room', 'Amount', 'Payment Method', 'Reference'].join(','),
    ...csvData.map(row => [
      row.date,
      row.billNumber,
      row.tenant,
      row.building,
      row.room,
      row.amount,
      row.method,
      row.reference
    ].join(','))
  ].join('\n');

  res.header('Content-Type', 'text/csv');
  res.header('Content-Disposition', `attachment; filename="revenue-report-${start.toISOString().split('T')[0]}-${end.toISOString().split('T')[0]}.csv"`);
  res.send(csv);
});

/**
 * Export Overdue Report as CSV
 */
export const exportOverdueReport = asyncHandler(async (_req: AuthRequest, res: Response) => {
  const overdueBills = await prisma.bill.findMany({
    where: {
      status: 'pending',
      dueDate: { lt: new Date() },
      deletedAt: null
    },
    include: {
      tenant: {
        include: {
          room: {
            include: {
              building: true
            }
          }
        }
      }
    },
    orderBy: { dueDate: 'asc' }
  });

  const csvData = overdueBills.map(bill => ({
    billNumber: bill.billNumber,
    tenant: bill.tenant?.fullName || '',
    building: bill.tenant?.room?.building?.name || '',
    room: bill.tenant?.room?.roomNumber || '',
    amount: Number(bill.totalAmount) - Number(bill.paidAmount),
    dueDate: bill.dueDate.toISOString().split('T')[0],
    daysOverdue: Math.floor(
      (new Date().getTime() - new Date(bill.dueDate).getTime()) / (1000 * 60 * 60 * 24)
    )
  }));

  const csv = [
    ['Bill Number', 'Tenant', 'Building', 'Room', 'Amount', 'Due Date', 'Days Overdue'].join(','),
    ...csvData.map(row => [
      row.billNumber,
      row.tenant,
      row.building,
      row.room,
      row.amount,
      row.dueDate,
      row.daysOverdue
    ].join(','))
  ].join('\n');

  res.header('Content-Type', 'text/csv');
  res.header('Content-Disposition', `attachment; filename="overdue-report-${new Date().toISOString().split('T')[0]}.csv"`);
  res.send(csv);
});

