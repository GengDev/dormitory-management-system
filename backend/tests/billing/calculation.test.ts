import { BillingService } from '../../src/services/billing.service';

describe('BillingService', () => {
    describe('calculateTotal', () => {
        it('should calculate total correctly with all values', () => {
            const result = BillingService.calculateTotal(
                5000, // rent
                10,   // water units
                18,   // water rate
                100,  // electric units
                8     // electric rate
            );

            // Rent: 5000
            // Water: 10 * 18 = 180
            // Elec: 100 * 8 = 800
            // Total: 5980

            expect(result.waterCost).toBe(180);
            expect(result.electricityCost).toBe(800);
            expect(result.totalAmount).toBe(5980);
        });

        it('should handle zero usage', () => {
            const result = BillingService.calculateTotal(5000, 0, 18, 0, 8);

            expect(result.waterCost).toBe(0);
            expect(result.electricityCost).toBe(0);
            expect(result.totalAmount).toBe(5000);
        });

        it('should handle floating point usage', () => {
            const result = BillingService.calculateTotal(5000, 10.5, 18, 100.5, 8);

            // Water: 10.5 * 18 = 189
            // Elec: 100.5 * 8 = 804
            // Total: 5000 + 189 + 804 = 5993

            expect(result.waterCost).toBe(189);
            expect(result.electricityCost).toBe(804);
            expect(result.totalAmount).toBe(5993);
        });
    });
});
