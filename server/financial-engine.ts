
import { storage } from "./storage";

export async function processPartnerPayment(partnerId: number, jobAmount: number) {
  const user = await storage.getUser(partnerId);
  if (!user) throw new Error("Partner not found");

  let payoutAmount = jobAmount;
  const breakdown = {
    gross: jobAmount,
    onboardingDeduction: 0,
    securityDepositDeduction: 0,
    net: 0
  };

  // 1. Onboarding Deduction (20%)
  if (user.onboardingDebt > 0) {
    const maxDeduction = jobAmount * 0.20;
    const actualDeduction = Math.min(maxDeduction, user.onboardingDebt);

    if (actualDeduction > 0) {
      payoutAmount -= actualDeduction;
      breakdown.onboardingDeduction = actualDeduction;
      // In a real implementation, call storage.updateUserDebt here
    }
  }

  // 2. Security Deposit Deduction (5%)
  if (user.securityDepositCurrent < user.securityDepositTarget) {
    const remainingTarget = user.securityDepositTarget - user.securityDepositCurrent;
    const maxDeposit = jobAmount * 0.05;
    const actualDeposit = Math.min(maxDeposit, remainingTarget);

    if (actualDeposit > 0) {
      payoutAmount -= actualDeposit;
      breakdown.securityDepositDeduction = actualDeposit;
      // In a real implementation, call storage.updateUserDeposit here
    }
  }

  breakdown.net = Math.floor(payoutAmount);
  return breakdown;
}
