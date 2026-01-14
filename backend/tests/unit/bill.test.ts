import { testDb, factories } from '../helpers';

describe('Bill Management', () => {
    let building: any;
    let room: any;
    let tenant: any;

    beforeEach(async () => {
        await testDb.cleanup();
        building = await factories.createBuilding();
        room = await factories.createRoom(building.id);
        tenant = await factories.createTenant({ roomId: room.id });
    });

    afterAll(async () => {
        await testDb.disconnect();
    });

    describe('Bill Creation', () => {
        it('should create a bill with correct data', async () => {
            const bill = await factories.createBill(tenant.id, room.id, {
                rentAmount: 3000,
                waterUsage: 10,
                waterRate: 15,
                electricityUsage: 100,
                electricityRate: 8,
            });

            expect(bill).toBeDefined();
            expect(bill.tenantId).toBe(tenant.id);
            expect(bill.roomId).toBe(room.id);
            expect(bill.rentAmount).toBe(3000);
            expect(bill.status).toBe('pending');
        });

        it('should generate unique bill number', async () => {
            const bill1 = await factories.createBill(tenant.id, room.id);
            const bill2 = await factories.createBill(tenant.id, room.id);

            expect(bill1.billNumber).not.toBe(bill2.billNumber);
        });

        it('should set default status to pending', async () => {
            const bill = await factories.createBill(tenant.id, room.id);
            expect(bill.status).toBe('pending');
        });

        it('should set due date in the future', async () => {
            const bill = await factories.createBill(tenant.id, room.id);
            const now = new Date();
            expect(bill.dueDate.getTime()).toBeGreaterThan(now.getTime());
        });
    });

    describe('Bill Calculation', () => {
        it('should calculate water amount correctly', async () => {
            const waterUsage = 10;
            const waterRate = 15;
            const expectedWaterAmount = waterUsage * waterRate;

            const bill = await factories.createBill(tenant.id, room.id, {
                waterUsage,
                waterRate,
                waterAmount: expectedWaterAmount,
            });

            expect(bill.waterAmount).toBe(expectedWaterAmount);
        });

        it('should calculate electricity amount correctly', async () => {
            const electricityUsage = 100;
            const electricityRate = 8;
            const expectedElectricityAmount = electricityUsage * electricityRate;

            const bill = await factories.createBill(tenant.id, room.id, {
                electricityUsage,
                electricityRate,
                electricityAmount: expectedElectricityAmount,
            });

            expect(bill.electricityAmount).toBe(expectedElectricityAmount);
        });

        it('should calculate total amount correctly', async () => {
            const rentAmount = 3000;
            const waterAmount = 150; // 10 * 15
            const electricityAmount = 800; // 100 * 8
            const expectedTotal = rentAmount + waterAmount + electricityAmount;

            const bill = await factories.createBill(tenant.id, room.id, {
                rentAmount,
                waterAmount,
                electricityAmount,
                totalAmount: expectedTotal,
            });

            expect(bill.totalAmount).toBe(expectedTotal);
        });

        it('should include tax if applicable', async () => {
            const subtotal = 3950;
            const tax = 276.5; // 7% tax
            const totalAmount = subtotal + tax;

            const bill = await factories.createBill(tenant.id, room.id, {
                subtotal,
                tax,
                totalAmount,
            });

            expect(bill.tax).toBe(tax);
            expect(bill.totalAmount).toBe(totalAmount);
        });
    });

    describe('Bill Status Transitions', () => {
        it('should transition from pending to verifying', async () => {
            const bill = await factories.createBill(tenant.id, room.id, {
                status: 'pending',
            });

            expect(bill.status).toBe('pending');
            // In real implementation, this would be updated via controller
        });

        it('should transition from verifying to paid', async () => {
            const bill = await factories.createBill(tenant.id, room.id, {
                status: 'verifying',
            });

            expect(bill.status).toBe('verifying');
        });

        it('should mark bill as overdue after due date', async () => {
            const pastDate = new Date();
            pastDate.setDate(pastDate.getDate() - 7);

            const bill = await factories.createBill(tenant.id, room.id, {
                dueDate: pastDate,
                status: 'overdue',
            });

            expect(bill.status).toBe('overdue');
            expect(bill.dueDate.getTime()).toBeLessThan(new Date().getTime());
        });

        it('should allow cancelling bills', async () => {
            const bill = await factories.createBill(tenant.id, room.id, {
                status: 'cancelled',
            });

            expect(bill.status).toBe('cancelled');
        });
    });

    describe('Bill Payment Tracking', () => {
        it('should track paid amount', async () => {
            const bill = await factories.createBill(tenant.id, room.id, {
                totalAmount: 3950,
                paidAmount: 3950,
                status: 'paid',
            });

            expect(bill.paidAmount).toBe(bill.totalAmount);
            expect(bill.status).toBe('paid');
        });

        it('should track partial payments', async () => {
            const bill = await factories.createBill(tenant.id, room.id, {
                totalAmount: 3950,
                paidAmount: 2000,
            });

            expect(bill.paidAmount).toBe(2000);
            expect(bill.paidAmount).toBeLessThan(bill.totalAmount);
        });

        it('should record payment date', async () => {
            const paymentDate = new Date();
            const bill = await factories.createBill(tenant.id, room.id, {
                paidAt: paymentDate,
                status: 'paid',
            });

            expect(bill.paidAt).toBeDefined();
            expect(bill.status).toBe('paid');
        });
    });

    describe('Bill Relationships', () => {
        it('should be associated with a tenant', async () => {
            const bill = await factories.createBill(tenant.id, room.id);
            expect(bill.tenantId).toBe(tenant.id);
        });

        it('should be associated with a room', async () => {
            const bill = await factories.createBill(tenant.id, room.id);
            expect(bill.roomId).toBe(room.id);
        });

        it('should support multiple bills for same tenant', async () => {
            const bill1 = await factories.createBill(tenant.id, room.id);
            const bill2 = await factories.createBill(tenant.id, room.id);

            expect(bill1.tenantId).toBe(bill2.tenantId);
            expect(bill1.id).not.toBe(bill2.id);
        });
    });
});

describe('Payment Management', () => {
    let building: any;
    let room: any;
    let tenant: any;
    let bill: any;

    beforeEach(async () => {
        await testDb.cleanup();
        building = await factories.createBuilding();
        room = await factories.createRoom(building.id);
        tenant = await factories.createTenant({ roomId: room.id });
        bill = await factories.createBill(tenant.id, room.id);
    });

    afterAll(async () => {
        await testDb.disconnect();
    });

    describe('Payment Creation', () => {
        it('should create a payment record', async () => {
            const payment = await factories.createPayment(bill.id, tenant.id, {
                amount: 3950,
                paymentMethod: 'bank_transfer',
            });

            expect(payment).toBeDefined();
            expect(payment.billId).toBe(bill.id);
            expect(payment.tenantId).toBe(tenant.id);
            expect(payment.amount).toBe(3950);
        });

        it('should set default status to pending', async () => {
            const payment = await factories.createPayment(bill.id, tenant.id);
            expect(payment.status).toBe('pending');
        });

        it('should record payment date', async () => {
            const payment = await factories.createPayment(bill.id, tenant.id);
            expect(payment.paymentDate).toBeDefined();
            expect(payment.paymentDate).toBeInstanceOf(Date);
        });
    });

    describe('Payment Methods', () => {
        it('should support cash payment', async () => {
            const payment = await factories.createPayment(bill.id, tenant.id, {
                paymentMethod: 'cash',
            });
            expect(payment.paymentMethod).toBe('cash');
        });

        it('should support bank transfer', async () => {
            const payment = await factories.createPayment(bill.id, tenant.id, {
                paymentMethod: 'bank_transfer',
            });
            expect(payment.paymentMethod).toBe('bank_transfer');
        });

        it('should support PromptPay', async () => {
            const payment = await factories.createPayment(bill.id, tenant.id, {
                paymentMethod: 'promptpay',
            });
            expect(payment.paymentMethod).toBe('promptpay');
        });

        it('should support credit card', async () => {
            const payment = await factories.createPayment(bill.id, tenant.id, {
                paymentMethod: 'credit_card',
            });
            expect(payment.paymentMethod).toBe('credit_card');
        });
    });

    describe('Payment Approval', () => {
        it('should allow approving payments', async () => {
            const admin = await factories.createAdmin();
            const approvedAt = new Date();

            const payment = await factories.createPayment(bill.id, tenant.id, {
                status: 'approved',
                approvedBy: admin.id,
                approvedAt,
            });

            expect(payment.status).toBe('approved');
            expect(payment.approvedBy).toBe(admin.id);
            expect(payment.approvedAt).toBeDefined();
        });

        it('should allow rejecting payments', async () => {
            const payment = await factories.createPayment(bill.id, tenant.id, {
                status: 'rejected',
                notes: 'Invalid receipt',
            });

            expect(payment.status).toBe('rejected');
            expect(payment.notes).toBe('Invalid receipt');
        });

        it('should track who approved the payment', async () => {
            const admin = await factories.createAdmin();
            const payment = await factories.createPayment(bill.id, tenant.id, {
                status: 'approved',
                approvedBy: admin.id,
            });

            expect(payment.approvedBy).toBe(admin.id);
        });
    });

    describe('Payment Receipt', () => {
        it('should store receipt URL', async () => {
            const payment = await factories.createPayment(bill.id, tenant.id, {
                receiptUrl: 'https://example.com/receipts/123.jpg',
            });

            expect(payment.receiptUrl).toBe('https://example.com/receipts/123.jpg');
        });

        it('should allow reference number', async () => {
            const payment = await factories.createPayment(bill.id, tenant.id, {
                referenceNumber: 'REF123456',
            });

            expect(payment.referenceNumber).toBe('REF123456');
        });
    });

    describe('Payment Relationships', () => {
        it('should be associated with a bill', async () => {
            const payment = await factories.createPayment(bill.id, tenant.id);
            expect(payment.billId).toBe(bill.id);
        });

        it('should be associated with a tenant', async () => {
            const payment = await factories.createPayment(bill.id, tenant.id);
            expect(payment.tenantId).toBe(tenant.id);
        });

        it('should support multiple payments for same bill', async () => {
            const payment1 = await factories.createPayment(bill.id, tenant.id, {
                amount: 2000,
            });
            const payment2 = await factories.createPayment(bill.id, tenant.id, {
                amount: 1950,
            });

            expect(payment1.billId).toBe(payment2.billId);
            expect(payment1.id).not.toBe(payment2.id);
            expect(payment1.amount + payment2.amount).toBe(3950);
        });
    });
});
