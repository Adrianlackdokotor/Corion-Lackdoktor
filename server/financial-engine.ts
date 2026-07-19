
import { storage } from "./storage";

export async function processPartnerPayment(partnerId: string, jobAmount: number) {
  const user = await storage.getUser(partnerId);
  if (!user) throw new Error("Partner not found");

  let payoutAmount = jobAmount;
  const breakdown = {
    gross: jobAmount,
    onboardingDeduction: 0,
    securityDepositDeduction: 0,
    net: 0
  };

  const userData = user as any;

  if (userData.onboardingDebt && userData.onboardingDebt > 0) {
    const maxDeduction = jobAmount * 0.20;
    const actualDeduction = Math.min(maxDeduction, userData.onboardingDebt);

    if (actualDeduction > 0) {
      payoutAmount -= actualDeduction;
      breakdown.onboardingDeduction = actualDeduction;
    }
  }

  if (userData.securityDepositCurrent != null && userData.securityDepositTarget != null) {
    if (userData.securityDepositCurrent < userData.securityDepositTarget) {
      const remainingTarget = userData.securityDepositTarget - userData.securityDepositCurrent;
      const maxDeposit = jobAmount * 0.05;
      const actualDeposit = Math.min(maxDeposit, remainingTarget);

      if (actualDeposit > 0) {
        payoutAmount -= actualDeposit;
        breakdown.securityDepositDeduction = actualDeposit;
      }
    }
  }

  breakdown.net = Math.floor(payoutAmount);
  return breakdown;
}
