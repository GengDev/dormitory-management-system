/**
 * Billing Service
 *
 * Helper functions required for billing operations.
 */
export declare class BillingService {
    /**
     * Calculate Total Bill Amount
     *
     * @param rentAmount - Base rent
     * @param waterUsage - Water usage units
     * @param waterRate - Price per water unit
     * @param electricityUsage - Electricity usage units
     * @param electricityRate - Price per electricity unit
     * @returns Total amount
     */
    static calculateTotal(rentAmount: number, waterUsage: number, waterRate: number, electricityUsage: number, electricityRate: number): {
        waterCost: number;
        electricityCost: number;
        totalAmount: number;
    };
}
//# sourceMappingURL=billing.service.d.ts.map