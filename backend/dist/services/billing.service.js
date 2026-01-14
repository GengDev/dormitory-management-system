"use strict";
/**
 * Billing Service
 *
 * Helper functions required for billing operations.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.BillingService = void 0;
class BillingService {
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
    static calculateTotal(rentAmount, waterUsage, waterRate, electricityUsage, electricityRate) {
        const waterCost = waterUsage * waterRate;
        const electricityCost = electricityUsage * electricityRate;
        const totalAmount = rentAmount + waterCost + electricityCost;
        return {
            waterCost,
            electricityCost,
            totalAmount,
        };
    }
}
exports.BillingService = BillingService;
//# sourceMappingURL=billing.service.js.map