/**
 * Type definition for WrappedData
 * This matches the TypeScript type definition for type safety reference
 */

/**
 * @typedef {Object} MostExpensiveGift
 * @property {string} title
 * @property {number} price
 * @property {string|null} thumbnail_url
 */

/**
 * @typedef {Object} PurchaseTiming
 * @property {number} earlyBird
 * @property {number} onTime
 * @property {number} lastMinute
 */

/**
 * @typedef {Object} WrappedStats
 * @property {number} totalGiftsGiven
 * @property {number} totalGiftsReceived
 * @property {MostExpensiveGift} mostExpensiveGift
 * @property {number} totalSpending
 * @property {number} peopleExchangedWith
 * @property {string} mostPopularCategory
 * @property {number} giftGivingStreak
 * @property {number} santaScore
 * @property {number} lastMinutePurchases
 * @property {string} mostUsedRetailer
 * @property {number} homemadeGifts
 * @property {PurchaseTiming} purchaseTiming
 */

/**
 * @typedef {Object} WrappedData
 * @property {number} profileId
 * @property {number} year
 * @property {WrappedStats} stats
 * @property {string} personalityType
 * @property {string} personalityReason
 */

export {};

