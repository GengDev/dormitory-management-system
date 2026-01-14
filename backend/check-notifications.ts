import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkNotifications() {
  console.log('=== Checking Tenants with LINE Users ===');
  const tenants = await prisma.tenant.findMany({
    where: { deletedAt: null },
    include: {
      lineUser: true,
      room: {
        select: {
          roomNumber: true
        }
      }
    },
    take: 5
  });
  
  tenants.forEach(t => {
    console.log(`${t.fullName} (${t.room?.roomNumber}): LINE ${t.lineUser ? `✓ ${t.lineUser.lineUserId}` : '✗ Not linked'}`);
  });

  console.log('\n=== Recent Notifications ===');
  const notifications = await prisma.notification.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5,
    include: {
      tenant: {
        select: { fullName: true }
      }
    }
  });
  
  notifications.forEach(n => {
    console.log(`${n.createdAt.toISOString()} - ${n.tenant.fullName}: ${n.title} [${n.status}]`);
  });

  await prisma.$disconnect();
}

checkNotifications().catch(console.error);
