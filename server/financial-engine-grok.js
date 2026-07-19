/**
 * Hub+1 Economic Engine (Updated with P2P & Staking Metrics)
 * Node.js Translation from Grok's Python Output
 */
class Hub1EconomicEngine {
  constructor({
    initialSupply = 1000000,
    initialPrice = 0.010,
    initialBtcPrice = 100000,
    gMonthly = 0.10,
    btcAnnualGrowth = 0.29,
    btcReserveRate = 0.08,
    participationRate = 0.20,
    progressiveTaxRates = [0.05, 0.10, 0.15, 0.20, 0.25]
  } = {}) {
    this.supply = initialSupply;
    this.price = initialPrice;
    this.btcPrice = initialBtcPrice;
    this.g = gMonthly;
    this.btcGrowthMonthly = btcAnnualGrowth / 12;
    this.btcReserveRate = btcReserveRate;
    this.participationRate = participationRate;
    this.progressiveTaxRates = progressiveTaxRates;
    
    this.btcReserveEur = 0.0;
    this.btcHeld = 0.0;
    this.history = [];
  }

  updateTokenomics(month) {
    const currentLen = this.history.length;
    for (let i = 0; i < (month > currentLen ? month - currentLen : 0); i++) {
      this.supply *= (1 + this.g);
      this.price *= (1 + this.g) * (1 + this.btcGrowthMonthly);
    }
    
    const current = {
      month: month,
      supply: parseFloat(this.supply.toFixed(2)),
      price_eur: parseFloat(this.price.toFixed(4)),
      market_cap: parseFloat((this.supply * this.price).toFixed(2))
    };
    
    this.history.push(current);
    return current;
  }

  calculateRewards(totalUsers, rewardsPerLevel) {
    let totalRewards = 0.0;
    const distribution = {};
    
    for (let l = 1; l <= 5; l++) {
      const usersAtLevel = totalUsers * Math.pow(this.participationRate, l - 1);
      const rewardL = (l - 1) < rewardsPerLevel.length ? rewardsPerLevel[l - 1] : 500;
      const levelReward = usersAtLevel * rewardL;
      totalRewards += levelReward;
      
      distribution[`level_${l}`] = {
        users: parseFloat(usersAtLevel.toFixed(2)),
        reward_per_user: rewardL,
        total: parseFloat(levelReward.toFixed(2))
      };
    }
    
    return {
      total_rewards_hubs: parseFloat(totalRewards.toFixed(2)),
      distribution: distribution
    };
  }

  manageBtcReserve(eurTransactions, btcCurrentPrice) {
    const allocationEur = eurTransactions * this.btcReserveRate;
    this.btcReserveEur += allocationEur;

    // Exponential moving average smoothing for BTC purchase
    const r = Math.log(1 + 0.29); // annual
    const pAvg = r !== 0 ? this.btcPrice * (Math.exp(r) - 1) / r : this.btcPrice;

    const btcAdded = allocationEur / pAvg;
    this.btcHeld += btcAdded;
    this.btcPrice = btcCurrentPrice;

    return {
      allocated_eur: parseFloat(allocationEur.toFixed(2)),
      btc_added: parseFloat(btcAdded.toFixed(4)),
      total_btc_held: parseFloat(this.btcHeld.toFixed(4)),
      reserve_value_eur: parseFloat((this.btcHeld * btcCurrentPrice).toFixed(2))
    };
  }
}

// TEST
const engine = new Hub1EconomicEngine();
console.log("Tokenomics Month 1:", engine.updateTokenomics(1));
console.log("Tokenomics Month 12:", engine.updateTokenomics(12));
console.log("Reserve Allocation (50k EUR):", engine.manageBtcReserve(50000, 105000));
