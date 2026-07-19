/**
 * Hub+1 Economic Engine - Dynamic Referral & P2P Module
 * Ported from Grok's Python Logic (05.05.2026)
 */

class DynamicTokenomics {
  constructor({
    initialSupply = 1000000,
    initialPrice = 0.010,
    baseReferralReward = 500.0,
    logDecayFactor = 0.3,
    velocityImpact = 0.15,
    burnRate = 0.02
  } = {}) {
    this.supply = initialSupply;
    this.price = initialPrice;
    this.baseReferralReward = baseReferralReward;
    this.logDecayFactor = logDecayFactor;
    this.velocityImpact = velocityImpact;
    this.burnRate = burnRate;
    this.p2pVelocity = 0.0;
    this.totalBurned = 0.0;
  }

  // 1. DYNAMIC REFERRAL REWARD (Logarithmic Decay)
  calculateReferralReward(fiatValue, totalUsers) {
    // Formula: R_ref = base * (1 / (1 + λ * ln(1 + N))) * V_add
    const decay = 1 / (1 + this.logDecayFactor * Math.log(1 + totalUsers));
    const vAdd = 1 + (fiatValue / 10000) * 0.4;
    const reward = this.baseReferralReward * decay * vAdd;

    // Both get reward + 2% burned for utility
    const burned = reward * this.burnRate;
    this.totalBurned += burned;
    this.supply -= burned; // Deflationary pressure

    return {
      referrer_reward: parseFloat(reward.toFixed(2)),
      referee_reward: parseFloat((reward * 0.6).toFixed(2)), // Client gets 60%
      burned: parseFloat(burned.toFixed(2)),
      fiat_equivalent: parseFloat((reward * this.price).toFixed(2))
    };
  }

  // 2. PEER-TO-PEER TRANSFER (Micro-economy)
  processP2PTransfer(amountHubs) {
    // Every P2P transaction burns 2% of the token to increase scarcity
    const burn = amountHubs * this.burnRate;
    const netAmount = amountHubs - burn;
    
    this.totalBurned += burn;
    this.supply -= burn;
    this.p2pVelocity += amountHubs;

    return {
      gross_amount: parseFloat(amountHubs.toFixed(2)),
      net_to_receiver: parseFloat(netAmount.toFixed(2)),
      burned: parseFloat(burn.toFixed(2)),
      velocity_increased: parseFloat(this.p2pVelocity.toFixed(2))
    };
  }
}

// TEST: Simulation for Helmut & Cristos
const engine = new DynamicTokenomics();
console.log("--- CORION DYNAMIC TOKENOMICS TEST ---");

// Test 1: Cristos aduce o lucrare de 300 EUR (Azi, rețea mică: 100 useri)
console.log("\\n1. Recomandare Mica (300 EUR), Retea Mica (100 useri):");
console.log(engine.calculateReferralReward(300, 100));

// Test 2: Peste 2 ani, Cristos aduce o lucrare de 5000 EUR (Retea Mare: 10.000 useri)
// Prețul tokenului a crescut ipotetic la 0.10 EUR
engine.price = 0.10; 
console.log("\\n2. Recomandare Mare (5000 EUR), Retea Mare (10.000 useri):");
console.log(engine.calculateReferralReward(5000, 10000));

// Test 3: Adam ii plateste lui Adil 200 HUB pt o polisare
console.log("\\n3. P2P Transfer (Adam -> Adil, 200 HUB):");
console.log(engine.processP2PTransfer(200));
