/**
 * Bill Controller
 * 
 * Controller functions สำหรับ bill management operations
 * ใช้ Transaction สำหรับ createBill เพื่อความปลอดภัยของข้อมูล
 * 
 * @module server/src/controllers/bill.controller
 */

import { Response } from 'express';
import { PrismaClient, BillStatus } from '@prisma/client';
import { AuthRequest } from '../middleware/auth.middleware';
import { asyncHandler } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

/**
 * Get All Bills
 * 
 * @route   GET /api/bills
 * @access  Private (Admin: all, Tenant: own bills)
 * 
 * @param req - Express request (query: tenantId, roomId, status, billingMonth, overdue, page, limit)
 * @param res - Express response
 */
export const getBills = asyncHandler(async (req: AuthRequest, res: Response) => {
  const {
    tenantId,
    roomId,
    status,
    billingMonth,
    overdue,
    page = '1',
    limit = '20',
  } = req.query;

  const pageNum = parseInt(page as string, 10);
  const limitNum = parseInt(limit as string, 10);
  const skip = (pageNum - 1) * limitNum;

  // Build where clause
  const where: any = {
    deletedAt: null,
  };

  // Tenant can only see own bills
  if (req.user?.role === 'tenant') {
    // Find tenant by userId
    const tenant = await prisma.tenant.findFirst({
      where: {
        userId: req.user.userId,
        status: 'active',
        deletedAt: null,
      },
    });

    if (!tenant) {
      res.json({
        success: true,
        data: [],
        meta: {
          total: 0,
          page: pageNum,
          limit: limitNum,
          totalPages: 0,
        },
      });
      return;
    }

    where.tenantId = tenant.id;
  } else if (tenantId) {
    // Admin can filter by tenantId
    where.tenantId = tenantId;
  }

  if (roomId) {
    where.roomId = roomId;
  }

  if (status) {
    where.status = status;
  }

  if (billingMonth) {
    const month = new Date(billingMonth as string);
    const startOfMonth = new Date(month.getFullYear(), month.getMonth(), 1);
    const endOfMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0);
    where.billingMonth = {
      gte: startOfMonth,
      lte: endOfMonth,
    };
  }

  if (overdue === 'true') {
    where.status = 'pending';
    where.dueDate = { lt: new Date() };
  }

  const [bills, total] = await Promise.all([
    prisma.bill.findMany({
      where,
      include: {
        tenant: {
          select: {
            id: true,
            fullName: true,
            phone: true,
          },
        },
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
      skip,
      take: limitNum,
      orderBy: { billingMonth: 'desc' },
    }),
    prisma.bill.count({ where }),
  ]);

  res.json({
    success: true,
    data: bills,
    meta: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    },
  });
});

/**
 * Get Bill By ID
 * 
 * @route   GET /api/bills/:id
 * @access  Private (Admin or own bill)
 * 
 * @param req - Express request (params: id)
 * @param res - Express response
 */
export const getBillById = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  const bill = await prisma.bill.findUnique({
    where: { id },
    include: {
      tenant: {
        select: {
          id: true,
          fullName: true,
          phone: true,
          email: true,
        },
      },
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
      payments: {
        where: { deletedAt: null },
        orderBy: { paymentDate: 'desc' },
      },
    },
  });

  if (!bill || bill.deletedAt) {
    res.status(404).json({
      success: false,
      message: 'Bill not found',
    });
    return;
  }

  // Check authorization: Tenant can only see own bills
  if (req.user?.role === 'tenant') {
    const tenant = await prisma.tenant.findFirst({
      where: {
        userId: req.user.userId,
        status: 'active',
        deletedAt: null,
      },
    });

    if (!tenant || tenant.id !== bill.tenantId) {
      res.status(403).json({
        success: false,
        message: 'Insufficient permissions',
      });
      return;
    }
  }

  // Create items array from bill fields
  const items = [];

  // Rent item
  if (bill.rentAmount > 0) {
    items.push({
      id: 'rent',
      itemType: 'rent',
      description: 'ค่าเช่าห้อง',
      quantity: 1,
      unitPrice: bill.rentAmount,
      amount: bill.rentAmount,
      metadata: {}
    });
  }

  // Water item
  if (bill.waterAmount > 0) {
    items.push({
      id: 'water',
      itemType: 'utility',
      description: `ค่าน้ำ (${bill.waterUsage} หน่วย × ${bill.waterRate} บาท)`,
      quantity: bill.waterUsage,
      unitPrice: bill.waterRate,
      amount: bill.waterAmount,
      metadata: { usage: bill.waterUsage }
    });
  }

  // Electricity item
  if (bill.electricityAmount > 0) {
    items.push({
      id: 'electricity',
      itemType: 'utility',
      description: `ค่าไฟฟ้า (${bill.electricityUsage} หน่วย × ${bill.electricityRate} บาท)`,
      quantity: bill.electricityUsage,
      unitPrice: bill.electricityRate,
      amount: bill.electricityAmount,
      metadata: { usage: bill.electricityUsage }
    });
  }

  res.json({
    success: true,
    data: {
      bill: {
        ...bill,
        items
      }
    },
  });
});

/**
 * Create Bill with Items (Transaction)
 * 
 * @route   POST /api/bills
 * @access  Private (Admin only)
 * 
 * @param req - Express request (body: tenantId, roomId, billingMonth, dueDate, items[], notes?)
 * @param res - Express response
 * 
 * @description
 * สร้างบิลพร้อมรายการย่อยใน Transaction เพื่อความปลอดภัยของข้อมูล
 * ถ้าสร้างบิลสำเร็จ แต่สร้าง items ล้มเหลว จะ rollback ทั้งหมด
 */
export const createBill = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { tenantId, roomId, billingMonth, dueDate, items = [], notes, utilityId } = req.body;

  // Check if tenant exists
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
  });

  if (!tenant || tenant.deletedAt || tenant.status !== 'active') {
    res.status(404).json({
      success: false,
      message: 'Tenant not found or inactive',
    });
    return;
  }

  // Check if room exists
  const room = await prisma.room.findUnique({
    where: { id: roomId },
  });

  if (!room || room.deletedAt) {
    res.status(404).json({
      success: false,
      message: 'Room not found',
    });
    return;
  }

  // Check if bill already exists for this tenant and month
  const billingMonthDate = new Date(billingMonth);
  const startOfMonth = new Date(billingMonthDate.getFullYear(), billingMonthDate.getMonth(), 1);
  const endOfMonth = new Date(billingMonthDate.getFullYear(), billingMonthDate.getMonth() + 1, 0);

  const existingBill = await prisma.bill.findFirst({
    where: {
      tenantId,
      billingMonth: {
        gte: startOfMonth,
        lte: endOfMonth,
      },
      deletedAt: null,
    },
  });

  if (existingBill) {
    res.status(400).json({
      success: false,
      message: 'Bill already exists for this tenant and month',
    });
    return;
  }

  // Auto-populate items from RoomUtility if utilityId is provided
  let finalItems = [...items];
  let utilityRecord = null;

  if (utilityId) {
    utilityRecord = await prisma.roomUtility.findUnique({
      where: { id: utilityId },
    });

    if (utilityRecord) {
      // Add Water if not present
      if (!finalItems.some(i => i.itemType === 'utility' && i.description.includes('น้ำ'))) {
        finalItems.push({
          itemType: 'utility',
          description: `ค่าน้ำ (${utilityRecord.waterUsage} หน่วย × ${utilityRecord.waterRate} บาท)`,
          quantity: utilityRecord.waterUsage || 0,
          unitPrice: utilityRecord.waterRate,
          amount: utilityRecord.waterCost,
          metadata: { usage: utilityRecord.waterUsage, type: 'water' }
        });
      }
      // Add Electricity if not present
      if (!finalItems.some(i => i.itemType === 'utility' && i.description.includes('ไฟ'))) {
        finalItems.push({
          itemType: 'utility',
          description: `ค่าไฟฟ้า (${utilityRecord.electricityUsage} หน่วย × ${utilityRecord.electricityRate} บาท)`,
          quantity: utilityRecord.electricityUsage || 0,
          unitPrice: utilityRecord.electricityRate,
          amount: utilityRecord.electricityCost,
          metadata: { usage: utilityRecord.electricityUsage, type: 'electricity' }
        });
      }
    }
  }

  // Add Rent if not present
  if (!finalItems.some(i => i.itemType === 'rent')) {
    finalItems.push({
      itemType: 'rent',
      description: 'ค่าเช่าห้อง',
      quantity: 1,
      unitPrice: room.monthlyRent,
      amount: room.monthlyRent,
      metadata: {}
    });
  }

  // Use transaction to create bill and items atomically
  const result = await prisma.$transaction(async (tx) => {
    // Create bill
    const bill = await tx.bill.create({
      data: {
        tenantId,
        roomId,
        billingMonth: startOfMonth,
        dueDate: new Date(dueDate),
        notes,
        utilityId: utilityId || null,
        createdById: req.user?.userId,
        // Store flatten data for easy access
        rentAmount: room.monthlyRent,
        waterUsage: utilityRecord?.waterUsage || 0,
        waterRate: utilityRecord?.waterRate || 15,
        waterAmount: utilityRecord?.waterCost || 0,
        electricityUsage: utilityRecord?.electricityUsage || 0,
        electricityRate: utilityRecord?.electricityRate || 8,
        electricityAmount: utilityRecord?.electricityCost || 0,
      },
    });

    // Create bill items
    const billItems = await Promise.all(
      finalItems.map((item: any) =>
        tx.billItem.create({
          data: {
            billId: bill.id,
            itemType: item.itemType,
            description: item.description,
            quantity: parseFloat(item.quantity),
            unitPrice: parseFloat(item.unitPrice),
            amount: parseFloat(item.quantity) * parseFloat(item.unitPrice),
            metadata: item.metadata || {},
          },
        })
      )
    );

    // Calculate total from items (trigger should handle this, but we'll verify)
    const totalAmount = billItems.reduce((sum, item) => sum + Number(item.amount), 0);

    // Update bill total
    const updatedBill = await tx.bill.update({
      where: { id: bill.id },
      data: {
        totalAmount,
      },
      include: {
        items: true,
        tenant: {
          select: {
            id: true,
            fullName: true,
          },
        },
        room: {
          select: {
            id: true,
            roomNumber: true,
          },
        },
      },
    });

    return updatedBill;
  });

  logger.info(`Bill created: ${result.billNumber}`, {
    billId: result.id,
    tenantId,
    totalAmount: result.totalAmount,
    createdBy: req.user?.userId,
  });

  res.status(201).json({
    success: true,
    message: 'Bill created successfully',
    data: { bill: result },
  });
});

/**
 * Update Bill Status
 * 
 * @route   PUT /api/bills/:id/status
 * @access  Private (Admin only)
 * 
 * @param req - Express request (params: id, body: status)
 * @param res - Express response
 */
export const updateBillStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;

  const bill = await prisma.bill.update({
    where: { id },
    data: { status: status as BillStatus },
    include: {
      tenant: {
        select: {
          id: true,
          fullName: true,
        },
      },
    },
  });

  logger.info(`Bill status updated: ${bill.billNumber}`, {
    billId: id,
    status,
    updatedBy: req.user?.userId,
  });

  res.json({
    success: true,
    message: 'Bill status updated successfully',
    data: { bill },
  });
});

/**
 * Get Overdue Bills
 * 
 * @route   GET /api/bills/overdue
 * @access  Private (Admin only)
 * 
 * @param req - Express request
 * @param res - Express response
 */
export const getOverdueBills = asyncHandler(async (_req: AuthRequest, res: Response) => {
  const bills = await prisma.bill.findMany({
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
          phone: true,
          lineUser: {
            select: {
              lineUserId: true,
            },
          },
        },
      },
      room: {
        select: {
          id: true,
          roomNumber: true,
          building: {
            select: {
              name: true,
            },
          },
        },
      },
    },
    orderBy: { dueDate: 'asc' },
  });

  // Calculate days overdue
  const billsWithOverdue = bills.map((bill) => {
    const daysOverdue = Math.floor(
      (new Date().getTime() - new Date(bill.dueDate).getTime()) / (1000 * 60 * 60 * 24)
    );
    return {
      ...bill,
      daysOverdue,
      remainingAmount: Number(bill.totalAmount) - Number(bill.paidAmount || 0),
    };
  });

  res.json({
    success: true,
    data: billsWithOverdue,
  });
});

/**
 * Generate Monthly Bills for All Active Tenants
 * 
 * @route   POST /api/bills/generate-monthly
 * @access  Private (Admin only)
 * 
 * @param req - Express request (body: billingMonth, dueDate)
 * @param res - Express response
 * 
 * @description
 * สร้างบิลให้ผู้เช่าทุกคนที่ active ในเดือนที่กำหนด
 * ใช้ Queue สำหรับ background processing
 */
export const generateMonthlyBills = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { billingMonth, billingYear, dueDate, rentAmount, waterRate, electricityRate } = req.body;

  let startOfMonth: Date;
  let endOfMonth: Date;

  if (typeof billingMonth === 'number' && billingYear) {
    // Numeric month (1-12) and year from dashboard
    startOfMonth = new Date(billingYear, billingMonth - 1, 1);
    endOfMonth = new Date(billingYear, billingMonth, 0);
  } else {
    // ISO Date format
    const billingMonthDate = new Date(billingMonth);
    startOfMonth = new Date(billingMonthDate.getFullYear(), billingMonthDate.getMonth(), 1);
    endOfMonth = new Date(billingMonthDate.getFullYear(), billingMonthDate.getMonth() + 1, 0);
  }

  // Use provided dueDate or default to 5th of next month
  const finalDueDate = dueDate
    ? new Date(dueDate)
    : new Date(startOfMonth.getFullYear(), startOfMonth.getMonth() + 1, 5);

  // Get all active tenants
  const tenants = await prisma.tenant.findMany({
    where: {
      status: 'active',
      deletedAt: null,
      moveInDate: { lte: endOfMonth },
    },
    include: {
      room: true,
    },
  });

  let createdCount = 0;
  let skippedCount = 0;
  const results = [];

  for (const tenant of tenants) {
    // Check if bill already exists
    const existingBill = await prisma.bill.findFirst({
      where: {
        tenantId: tenant.id,
        billingMonth: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
        deletedAt: null,
      },
    });

    if (existingBill) {
      skippedCount++;
      continue;
    }

    // Find utility record for this room and month
    const utility = await prisma.roomUtility.findFirst({
      where: {
        roomId: tenant.roomId!,
        recordMonth: startOfMonth,
        deletedAt: null,
      },
    });

    // Create bill (internal call simulation via service logic)
    // In a real app, you'd use a shared service function. Here we inline the logic.
    try {
      const items = [
        {
          itemType: 'rent',
          description: 'ค่าเช่าห้อง',
          quantity: 1,
          unitPrice: rentAmount || tenant.room?.monthlyRent || 0,
          amount: rentAmount || tenant.room?.monthlyRent || 0,
        }
      ];

      const currentWaterRate = waterRate || utility?.waterRate || 15;
      const currentElectricityRate = electricityRate || utility?.electricityRate || 8;

      if (utility) {
        items.push({
          itemType: 'utility',
          description: `ค่าน้ำ (${utility.waterUsage} หน่วย × ${currentWaterRate} บาท)`,
          quantity: utility.waterUsage || 0,
          unitPrice: currentWaterRate,
          amount: (utility.waterUsage || 0) * currentWaterRate,
        });
        items.push({
          itemType: 'utility',
          description: `ค่าไฟฟ้า (${utility.electricityUsage} หน่วย × ${currentElectricityRate} บาท)`,
          quantity: utility.electricityUsage || 0,
          unitPrice: currentElectricityRate,
          amount: (utility.electricityUsage || 0) * currentElectricityRate,
        });
      }

      const totalAmount = items.reduce((sum, item) => sum + item.amount, 0);

      const bill = await prisma.bill.create({
        data: {
          tenantId: tenant.id,
          roomId: tenant.roomId!,
          billingMonth: startOfMonth,
          dueDate: finalDueDate,
          totalAmount,
          subtotal: totalAmount,
          utilityId: utility?.id || null,
          rentAmount: rentAmount || tenant.room!.monthlyRent,
          waterUsage: utility?.waterUsage || 0,
          waterRate: currentWaterRate,
          waterAmount: (utility?.waterUsage || 0) * currentWaterRate,
          electricityUsage: utility?.electricityUsage || 0,
          electricityRate: currentElectricityRate,
          electricityAmount: (utility?.electricityUsage || 0) * currentElectricityRate,
          createdById: req.user?.userId,
          status: 'pending',
          items: {
            create: items.map(item => ({
              itemType: item.itemType,
              description: item.description,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              amount: item.amount,
            }))
          }
        },
      });

      createdCount++;
      results.push(bill.id);
    } catch (err) {
      logger.error(`Failed to create auto-bill for tenant ${tenant.id}`, err);
    }
  }

  res.json({
    success: true,
    message: `Generated bills for ${createdCount} tenants. Skipped ${skippedCount} (already exists).`,
    data: {
      createdCount,
      skippedCount,
      billingMonth: startOfMonth.toISOString(),
      billIds: results,
    },
  });
});

