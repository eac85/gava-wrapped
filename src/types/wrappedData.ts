/**
 * TypeScript type definition for WrappedData
 * Use this file if you're using TypeScript in your project
 */

export type MostExpensiveGift = {
  title: string;
  price: number;
  thumbnail_url: string | null;
};

export type PurchaseTiming = {
  earlyBird: number;
  onTime: number;
  lastMinute: number;
};

export type WrappedStats = {
  totalGiftsGiven: number;
  totalGiftsReceived: number;
  mostExpensiveGift: MostExpensiveGift;
  totalSpending: number;
  peopleExchangedWith: number;
  mostPopularCategory: string;
  giftGivingStreak: number;
  santaScore: number;
  lastMinutePurchases: number;
  mostUsedRetailer: string;
  homemadeGifts: number;
  purchaseTiming: PurchaseTiming;
};

export type WrappedData = {
  profileId: number;
  year: number;
  stats: WrappedStats;
  personalityType: string;
  personalityReason: string;
};

