/**
 * Database Seed Script
 *
 * สร้างข้อมูลทดสอบสำหรับระบบ Dormitory Management
 *
 * @module prisma/seed
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Delete all existing data
  await prisma.chatMessage.deleteMany();
  await prisma.chatRoom.deleteMany();
  await prisma.maintenanceRequest.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.bill.deleteMany();
  await prisma.tenant.deleteMany();
  await prisma.lineUser.deleteMany();
  await prisma.room.deleteMany();
  await prisma.building.deleteMany();
  await prisma.user.deleteMany();

  console.log('🗑️ Cleared database');

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 10);
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@example.com',
      passwordHash: adminPassword as any,
      fullName: 'Administrator',
      role: 'admin',
    },
  });
  console.log('✅ Created admin user:', adminUser.email);

  // Create tenant user
  const tenantPassword = await bcrypt.hash('tenant123', 10);
  const tenantUser = await prisma.user.create({
    data: {
      email: 'tenant@example.com',
      passwordHash: tenantPassword as any,
      fullName: 'สมชาย ใจดี',
      role: 'tenant',
    },
  });
  console.log('✅ Created tenant user:', tenantUser.email);

  // Create buildings
  const buildings = await Promise.all([
    prisma.building.create({
      data: {
        name: 'อาคาร A',
        address: '123 ถนนสุขุมวิท แขวงบางนา เขตบางนา กรุงเทพฯ 10260',
        description: 'อาคารพักอาศัยระดับพรีเมี่ยม ใกล้ BTS พร้อมสิ่งอำนวยความสะดวกครบครัน',
        totalFloors: 8,
        amenities: ['wifi', 'parking', 'gym', 'pool', 'security'],
        images: [
          'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800',
          'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800'
        ],
      },
    }),
    prisma.building.create({
      data: {
        name: 'อาคาร B',
        address: '456 ถนนพระราม 9 แขวงห้วยขวาง เขตห้วยขวาง กรุงเทพฯ 10310',
        description: 'อาคารพักอาศัยโมเดิร์น สไตล์มินิมอล ใกล้รถไฟฟ้า MRT',
        totalFloors: 12,
        amenities: ['wifi', 'parking', 'gym', 'laundry', 'security'],
        images: [
          'https://images.unsplash.com/photo-1469022563428-aa04fef9f5a2?w=800',
          'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800'
        ],
      },
    }),
    prisma.building.create({
      data: {
        name: 'อาคาร C',
        address: '789 ถนนพหลโยธิน แขวงจตุจักร เขตจตุจักร กรุงเทพฯ 10900',
        description: 'อาคารพักอาศัยสำหรับนักศึกษาและผู้ทำงาน ราคาย่อมเยาว์',
        totalFloors: 6,
        amenities: ['wifi', 'parking', 'laundry', 'security'],
        images: [
          'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800'
        ],
      },
    }),
  ]);
  console.log('✅ Created buildings:', buildings.map(b => b.name));

  // Create rooms for building A
  const buildingA = buildings[0];
  const roomsA = await Promise.all([
    // Floor 1
    prisma.room.create({
      data: {
        roomNumber: 'A-101',
        floorNumber: 1,
        roomType: 'single',
        monthlyRent: 6500,
        deposit: 6500,
        areaSqm: 25,
        maxOccupancy: 1,
        description: 'ห้องเดี่ยวตกแต่งเรียบง่าย พร้อมระเบียง',
        amenities: ['wifi', 'aircon', 'tv', 'fridge', 'water_heater'],
        status: 'occupied',
        buildingId: buildingA.id,
      },
    }),
    prisma.room.create({
      data: {
        roomNumber: 'A-102',
        floorNumber: 1,
        roomType: 'single',
        monthlyRent: 6500,
        deposit: 6500,
        areaSqm: 25,
        maxOccupancy: 1,
        description: 'ห้องเดี่ยวมุมอาคาร มองเห็นวิวสวน',
        amenities: ['wifi', 'aircon', 'tv', 'fridge', 'water_heater', 'balcony'],
        status: 'available',
        buildingId: buildingA.id,
      },
    }),
    prisma.room.create({
      data: {
        roomNumber: 'A-201',
        floorNumber: 2,
        roomType: 'double',
        monthlyRent: 8500,
        deposit: 8500,
        areaSqm: 35,
        maxOccupancy: 2,
        description: 'ห้องคู่พร้อมครัวขนาดเล็ก',
        amenities: ['wifi', 'aircon', 'tv', 'fridge', 'water_heater', 'kitchen'],
        status: 'occupied',
        buildingId: buildingA.id,
      },
    }),
    prisma.room.create({
      data: {
        roomNumber: 'A-202',
        floorNumber: 2,
        roomType: 'double',
        monthlyRent: 8500,
        deposit: 8500,
        areaSqm: 35,
        maxOccupancy: 2,
        description: 'ห้องคู่ตกแต่งสวยงาม',
        amenities: ['wifi', 'aircon', 'tv', 'fridge', 'water_heater', 'kitchen'],
        status: 'available',
        buildingId: buildingA.id,
      },
    }),
    prisma.room.create({
      data: {
        roomNumber: 'A-301',
        floorNumber: 3,
        roomType: 'suite',
        monthlyRent: 12000,
        deposit: 12000,
        areaSqm: 45,
        maxOccupancy: 2,
        description: 'ห้องสวีทหรูหรา พร้อมระเบียงส่วนตัว',
        amenities: ['wifi', 'aircon', 'tv', 'fridge', 'water_heater', 'kitchen', 'balcony', 'parking'],
        status: 'available',
        buildingId: buildingA.id,
      },
    }),
  ]);
  console.log('✅ Created rooms for building A:', roomsA.map(r => r.roomNumber));

  // Create rooms for building B
  const buildingB = buildings[1];
  const roomsB = await Promise.all([
    prisma.room.create({
      data: {
        roomNumber: 'B-101',
        floorNumber: 1,
        roomType: 'single',
        monthlyRent: 5500,
        deposit: 5500,
        areaSqm: 22,
        maxOccupancy: 1,
        description: 'ห้องเดี่ยวราคาประหยัด',
        amenities: ['wifi', 'aircon', 'tv', 'fridge'],
        status: 'occupied',
        buildingId: buildingB.id,
      },
    }),
    prisma.room.create({
      data: {
        roomNumber: 'B-201',
        floorNumber: 2,
        roomType: 'single',
        monthlyRent: 5500,
        deposit: 5500,
        areaSqm: 22,
        maxOccupancy: 1,
        description: 'ห้องเดี่ยวชั้น 2',
        amenities: ['wifi', 'aircon', 'tv', 'fridge'],
        status: 'available',
        buildingId: buildingB.id,
      },
    }),
  ]);
  console.log('✅ Created rooms for building B:', roomsB.map(r => r.roomNumber));

  // Create tenants
  const tenants = await Promise.all([
    prisma.tenant.create({
      data: {
        fullName: 'สมชาย ใจดี',
        email: 'somchai@example.com',
        phone: '0812345678',
        idCardNumber: '1234567890123',
        dateOfBirth: new Date('1990-05-15'),
        occupation: 'นักศึกษา',
        emergencyContact: 'สมหญิง ใจดี',
        emergencyContactPhone: '0898765432' as any,
        moveInDate: new Date('2024-01-01'),
        status: 'active',
        userId: tenantUser.id,
        roomId: roomsA[0].id, // A-101
      },
    }),
    prisma.tenant.create({
      data: {
        fullName: 'สมศักดิ์ รักงาน',
        email: 'somsak@example.com',
        phone: '0823456789',
        idCardNumber: '2345678901234',
        dateOfBirth: new Date('1988-03-20'),
        occupation: 'พนักงานบริษัท',
        emergencyContact: 'สมนึก รักงาน',
        emergencyContactPhone: '0897654321',
        moveInDate: new Date('2024-01-15'),
        status: 'active',
        roomId: roomsA[2].id, // A-201
      },
    }),
    prisma.tenant.create({
      data: {
        fullName: 'Sarah Johnson',
        email: 'sarah@example.com',
        phone: '0834567890',
        idCardNumber: '3456789012345',
        dateOfBirth: new Date('1992-08-10'),
        occupation: 'นักออกแบบกราฟิก',
        emergencyContact: 'John Johnson',
        emergencyContactPhone: '0896543210',
        moveInDate: new Date('2024-02-01'),
        status: 'active',
        roomId: roomsB[0].id, // B-101
      },
    }),
  ]);
  console.log('✅ Created tenants:', tenants.map(t => t.fullName));

  // Create bills for current month
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1; // 1-12
  const currentYear = currentDate.getFullYear();

  const bills = await Promise.all([
    // Bill for Somchai (A-101)
    prisma.bill.create({
      data: {
        billNumber: 'BILL-2024-01-001',
        billingMonth: new Date(currentYear, currentMonth - 1, 1),
        rentAmount: 6500,
        waterUsage: 15,
        waterRate: 15,
        waterAmount: 225,
        electricityUsage: 120,
        electricityRate: 8,
        electricityAmount: 960,
        subtotal: 6500 + 225 + 960,
        totalAmount: 6500 + 225 + 960, // 7685
        dueDate: new Date(currentYear, currentMonth, 5), // วันที่ 5 ของเดือนถัดไป
        status: 'pending',
        tenantId: tenants[0].id,
        roomId: roomsA[0].id,
      },
    }),
    // Bill for Somsak (A-201)
    prisma.bill.create({
      data: {
        billNumber: 'BILL-2024-01-002',
        billingMonth: new Date(currentYear, currentMonth - 1, 1),
        rentAmount: 8500,
        waterUsage: 20,
        waterRate: 15,
        waterAmount: 300,
        electricityUsage: 150,
        electricityRate: 8,
        electricityAmount: 1200,
        subtotal: 8500 + 300 + 1200,
        totalAmount: 8500 + 300 + 1200, // 10000
        dueDate: new Date(currentYear, currentMonth, 5),
        status: 'pending',
        tenantId: tenants[1].id,
        roomId: roomsA[2].id,
      },
    }),
    // Bill for Sarah (B-101) - paid
    prisma.bill.create({
      data: {
        billNumber: 'BILL-2024-01-003',
        billingMonth: new Date(currentYear, currentMonth - 1, 1),
        rentAmount: 5500,
        waterUsage: 12,
        waterRate: 15,
        waterAmount: 180,
        electricityUsage: 100,
        electricityRate: 8,
        electricityAmount: 800,
        subtotal: 5500 + 180 + 800,
        totalAmount: 5500 + 180 + 800, // 6480
        dueDate: new Date(currentYear, currentMonth, 5),
        status: 'paid',
        paymentDate: new Date(),
        tenantId: tenants[2].id,
        roomId: roomsB[0].id,
      },
    }),
  ]);
  console.log('✅ Created bills for current month');

  // Create payments
  const payments = await Promise.all([
    prisma.payment.create({
      data: {
        amount: 6480,
        paymentMethod: 'bank_transfer',
        paymentDate: new Date(),
        referenceNumber: 'TF123456789',
        notes: 'ชำระค่าห้องเดือนมกราคม 2567',
        status: 'approved',
        billId: bills[2].id,
        tenantId: tenants[2].id,
      },
    }),
  ]);
  console.log('✅ Created payments');

  // Create maintenance requests
  const maintenanceRequests = await Promise.all([
    prisma.maintenanceRequest.create({
      data: {
        title: 'ไฟห้องน้ำไม่ติด',
        description: 'ไฟในห้องน้ำชั้น 1 อาคาร A ดับ ไม่สามารถใช้งานได้',
        category: 'electrical',
        priority: 'high',
        status: 'pending',
        tenantId: tenants[0].id,
        roomId: roomsA[0].id,
      },
    }),
    prisma.maintenanceRequest.create({
      data: {
        title: 'ประตูห้องน้ำล็อกไม่สนิท',
        description: 'ประตูห้องน้ำล็อกแล้วแต่ยังเปิดได้ ปัญหาด้านความปลอดภัย',
        category: 'structural',
        priority: 'medium',
        status: 'in_progress',
        estimatedCost: 500,
        tenantId: tenants[1].id,
        roomId: roomsA[2].id,
      },
    }),
    prisma.maintenanceRequest.create({
      data: {
        title: 'เครื่องทำน้ำอุ่นเสีย',
        description: 'เครื่องทำน้ำอุ่นในห้องทำงานได้ช้าและน้ำไม่ร้อนเพียงพอ',
        category: 'appliance',
        priority: 'medium',
        status: 'completed',
        estimatedCost: 1200,
        actualCost: 800,
        completedDate: new Date(),
        tenantId: tenants[2].id,
        roomId: roomsB[0].id,
      },
    }),
  ]);
  console.log('✅ Created maintenance requests');

  // Create chat room for tenant-admin communication
  const chatRoom = await prisma.chatRoom.create({
    data: {
      name: 'สนทนากับแอดมิน',
      isPublic: false,
      tenantId: tenants[0].id,
      sessionId: 'session-001',
      guestName: null,
      lastMessageAt: new Date(),
    },
  });
  console.log('✅ Created chat room');

  // Create sample chat messages
  await Promise.all([
    prisma.chatMessage.create({
      data: {
        senderId: tenantUser.id,
        senderName: tenants[0].fullName,
        chatRoomId: chatRoom.id,
        content: 'สวัสดีครับ ต้องการสอบถามข้อมูลค่าห้องเดือนนี้',
        messageType: 'text',
        isRead: false
      },
    }),
    prisma.chatMessage.create({
      data: {
        senderId: adminUser.id,
        senderName: 'Administrator',
        chatRoomId: chatRoom.id,
        content: 'สวัสดีครับ มีอะไรให้ช่วยเหลือไหมครับ?',
        messageType: 'text',
        isRead: true
      },
    }),
  ]);
  console.log('✅ Created sample chat messages');

  console.log('🎉 Database seeding completed successfully!');
  console.log('');
  console.log('📊 Summary:');
  console.log(`   - Buildings: ${buildings.length}`);
  console.log(`   - Rooms: ${roomsA.length + roomsB.length}`);
  console.log(`   - Tenants: ${tenants.length}`);
  console.log(`   - Bills: ${bills.length}`);
  console.log(`   - Payments: ${payments.length}`);
  console.log(`   - Maintenance: ${maintenanceRequests.length}`);
  console.log('');
  console.log('🔑 Test Accounts:');
  console.log('   Admin: admin@example.com / admin123');
  console.log('   Tenant: tenant@example.com / tenant123');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

