import { base44 } from './base44Client';


export const fetchLiveMarkets = base44.functions.fetchLiveMarkets;

export const scanForAlpha = base44.functions.scanForAlpha;

export const monitorPositions = base44.functions.monitorPositions;

export const executeTrade = base44.functions.executeTrade;

export const cleanupData = base44.functions.cleanupData;

export const fetchRealMarketData = base44.functions.fetchRealMarketData;

export const predictWithRealData = base44.functions.predictWithRealData;

export const sendEmail = base44.functions.sendEmail;

export const sendDailySummary = base44.functions.sendDailySummary;

export const fetchRelevantNews = base44.functions.fetchRelevantNews;

export const executeRealTrade = base44.functions.executeRealTrade;

export const fetchRealPrices = base44.functions.fetchRealPrices;

export const stripeWebhook = base44.functions.stripeWebhook;

export const createCheckoutSession = base44.functions.createCheckoutSession;

export const cancelSubscription = base44.functions.cancelSubscription;

export const createPortalSession = base44.functions.createPortalSession;

