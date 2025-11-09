
import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, DollarSign, Target, Activity, Zap, Globe, BarChart3, Crosshair, Brain, Loader2, CheckCircle2, AlertCircle, Clock, TrendingDown, ArrowUpRight, ArrowDownRight, PlayCircle, Wifi, WifiOff, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import AutoTrader from "../components/trading/AutoTrader";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function Dashboard() {
  const [operationStatus, setOperationStatus] = useState(null);
  const queryClient = useQueryClient();

  const { data: opportunities = [] } = useQuery({
    queryKey: ['opportunities'],
    queryFn: () => base44.entities.Opportunity.filter({ status: 'Active' }, '-expected_value'),
    initialData: [],
    refetchInterval: 45000,
    refetchIntervalInBackground: true,
  });

  const { data: trades = [] } = useQuery({
    queryKey: ['trades'],
    queryFn: () => base44.entities.Trade.list('-created_date', 100),
    initialData: [],
    refetchInterval: 30000,
    refetchIntervalInBackground: true,
  });

  const { data: markets = [] } = useQuery({
    queryKey: ['markets'],
    queryFn: () => base44.entities.Market.list('-last_scanned', 100),
    initialData: [],
    refetchInterval: 60000,
    refetchIntervalInBackground: true,
  });

  const { data: configs = [] } = useQuery({
    queryKey: ['configs'],
    queryFn: async () => {
      try {
        const result = await base44.entities.SystemConfig.list();
        return Array.isArray(result) ? result : [];
      } catch (error) {
        console.error('Error fetching configs:', error);
        return [];
      }
    },
    initialData: [],
  });

  const { data: alerts = [] } = useQuery({
    queryKey: ['alerts'],
    queryFn: () => base44.entities.Alert.list('-created_date', 20),
    initialData: [],
    refetchInterval: 30000,
  });

  // Mutation for backend operations
  const fetchMarketsMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('fetchLiveMarkets', {
        platform: 'all',
        category: 'all',
        limit: 100
      });
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['markets'] });
      setOperationStatus({
        type: 'success',
        title: 'Markets Fetched Successfully',
        message: `Fetched ${data.markets_fetched || 0} markets. New: ${data.new_markets || 0}, Updated: ${data.updated_markets || 0}`
      });
      setTimeout(() => setOperationStatus(null), 5000);
    },
    onError: (error) => {
      setOperationStatus({
        type: 'error',
        title: 'Failed to Fetch Markets',
        message: error.message || 'Unknown error occurred'
      });
      setTimeout(() => setOperationStatus(null), 5000);
    }
  });

  const scanAlphaMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('scanForAlpha', {
        minEdge: 0.03
      });
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['opportunities'] });
      setOperationStatus({
        type: 'success',
        title: 'Alpha Scan Complete',
        message: `Scanned ${data.markets_scanned || 0} markets, found ${data.opportunities_created || 0} opportunities`
      });
      setTimeout(() => setOperationStatus(null), 5000);
    },
    onError: (error) => {
      setOperationStatus({
        type: 'error',
        title: 'Alpha Scan Failed',
        message: error.message || 'Unknown error occurred'
      });
      setTimeout(() => setOperationStatus(null), 5000);
    }
  });

  const monitorPositionsMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('monitorPositions', {});
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['trades'] });
      setOperationStatus({
        type: 'success',
        title: 'Positions Monitored',
        message: `Monitored ${data.monitored || 0} positions, closed ${data.closed || 0}`
      });
      setTimeout(() => setOperationStatus(null), 5000);
    },
    onError: (error) => {
      setOperationStatus({
        type: 'error',
        title: 'Position Monitoring Failed',
        message: error.message || 'Unknown error occurred'
      });
      setTimeout(() => setOperationStatus(null), 5000);
    }
  });

  const cleanupMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('cleanupData', {});
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['opportunities'] });
      queryClient.invalidateQueries({ queryKey: ['markets'] });
      setOperationStatus({
        type: 'success',
        title: 'Cleanup Complete',
        message: `Expired ${data.expired_opportunities || 0} opportunities, deleted ${data.deleted_alerts || 0} alerts`
      });
      setTimeout(() => setOperationStatus(null), 5000);
    },
    onError: (error) => {
      setOperationStatus({
        type: 'error',
        title: 'Cleanup Failed',
        message: error.message || 'Unknown error occurred'
      });
      setTimeout(() => setOperationStatus(null), 5000);
    }
  });

  // Safely get active config with defensive checks
  const activeConfig = Array.isArray(configs) ? configs.find(c => c && c.is_active) : null;

  // Safely get arrays with defensive checks
  const safeOpportunities = Array.isArray(opportunities) ? opportunities : [];
  const safeTrades = Array.isArray(trades) ? trades : [];
  const safeMarkets = Array.isArray(markets) ? markets : [];
  const safeAlerts = Array.isArray(alerts) ? alerts : [];

  const openTrades = safeTrades.filter(t => t && t.status === 'Open');
  const closedTrades = safeTrades.filter(t => t && t.status === 'Closed');
  const totalPnL = closedTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
  const totalExposure = openTrades.reduce((sum, t) => sum + (t.position_size || 0), 0);
  const winRate = closedTrades.length > 0
    ? (closedTrades.filter(t => t.pnl > 0).length / closedTrades.length * 100).toFixed(0)
    : 0;

  // Calculate alpha metrics with null safety
  const highValueAlpha = safeOpportunities.filter(o => o && Math.abs(o.edge || 0) >= 0.1);
  const avgEdge = safeOpportunities.length > 0
    ? safeOpportunities.reduce((sum, o) => sum + Math.abs(o.edge || 0), 0) / safeOpportunities.length
    : 0;

  // Platform statistics with null safety
  const platformStats = {};
  safeTrades.forEach(trade => {
    if (!trade || !trade.platform) return;
    if (!platformStats[trade.platform]) {
      platformStats[trade.platform] = {
        trades: 0,
        pnl: 0,
        open: 0
      };
    }
    platformStats[trade.platform].trades += 1;
    if (trade.status === 'Closed') {
      platformStats[trade.platform].pnl += (trade.pnl || 0);
    }
    if (trade.status === 'Open') {
      platformStats[trade.platform].open += 1;
    }
  });

  const marketsByPlatform = {};
  safeMarkets.forEach(market => {
    if (!market || !market.platform) return;
    marketsByPlatform[market.platform] = (marketsByPlatform[market.platform] || 0) + 1;
  });

  const oppsByPlatform = {};
  safeOpportunities.forEach(opp => {
    if (!opp || !opp.platform) return;
    oppsByPlatform[opp.platform] = (oppsByPlatform[opp.platform] || 0) + 1;
  });

  const enabledPlatforms = (activeConfig && Array.isArray(activeConfig.platforms_enabled)) 
    ? activeConfig.platforms_enabled 
    : ['Polymarket', 'Kalshi', 'Manifold', 'Gnosis', 'Augur', 'PredictIt'];

  const isAnyOperationLoading = fetchMarketsMutation.isPending || 
                                 scanAlphaMutation.isPending || 
                                 monitorPositionsMutation.isPending || 
                                 cleanupMutation.isPending;

  // NEW FEATURE 1: Today's Activity Summary
  const todayStats = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    const todayTrades = safeTrades.filter(t => {
      if (!t.created_date) return false;
      return new Date(t.created_date) >= todayStart;
    });
    
    const todayOpportunities = safeOpportunities.filter(o => {
      if (!o.created_date) return false;
      return new Date(o.created_date) >= todayStart;
    });
    
    const todayClosedTrades = todayTrades.filter(t => t.status === 'Closed');
    const todayPnL = todayClosedTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
    
    const autoTrades = todayTrades.filter(t => t.auto_trade);
    const manualTrades = todayTrades.filter(t => !t.auto_trade);
    
    const bestTrade = todayClosedTrades.reduce((best, t) => {
      if (!best || (t.pnl || 0) > (best.pnl || 0)) return t;
      return best;
    }, null);
    
    const bestOpp = safeOpportunities.reduce((best, o) => {
      if (!best || Math.abs(o.edge || 0) > Math.abs(best.edge || 0)) return o;
      return best;
    }, null);

    return {
      tradesExecuted: todayTrades.length,
      autoTrades: autoTrades.length,
      manualTrades: manualTrades.length,
      opportunitiesFound: todayOpportunities.length,
      positionsClosed: todayClosedTrades.length,
      todayPnL,
      bestTrade,
      bestOpp
    };
  }, [safeTrades, safeOpportunities]);

  // NEW FEATURE 2: Recent Trades Feed (Last 5)
  const recentTrades = useMemo(() => {
    return safeTrades
      .filter(t => t)
      .sort((a, b) => new Date(b.created_date) - new Date(a.created_date))
      .slice(0, 5);
  }, [safeTrades]);

  // NEW FEATURE 3: Performance Chart Data (Last 30 Days)
  const performanceChartData = useMemo(() => {
    const dayData = {};
    const now = new Date();
    
    // Initialize last 30 days
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateKey = date.toISOString().split('T')[0];
      dayData[dateKey] = { date: dateKey, pnl: 0, cumulative: 0 };
    }
    
    // Add trades
    safeTrades.forEach(t => {
      if (!t.close_date || t.status !== 'Closed') return;
      const closeDate = new Date(t.close_date).toISOString().split('T')[0];
      if (dayData[closeDate]) {
        dayData[closeDate].pnl += (t.pnl || 0);
      }
    });
    
    // Calculate cumulative
    let cumulative = 0;
    const chartData = Object.values(dayData).map(day => {
      cumulative += day.pnl;
      return {
        ...day,
        cumulative,
        date: new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      };
    });
    
    return chartData;
  }, [safeTrades]);

  // NEW FEATURE 4: Top 3 Opportunities Right Now
  const topOpportunities = useMemo(() => {
    return safeOpportunities
      .filter(o => o)
      .sort((a, b) => Math.abs(b.edge || 0) - Math.abs(a.edge || 0))
      .slice(0, 3);
  }, [safeOpportunities]);

  // NEW FEATURE 5: System Health Indicators
  const systemHealth = useMemo(() => {
    const now = Date.now();
    
    // Check last data refresh time
    const lastMarketUpdate = safeMarkets.reduce((latest, m) => {
      if (!m.last_updated) return latest;
      const time = new Date(m.last_updated).getTime();
      return time > latest ? time : latest;
    }, 0);
    
    const lastRefreshMinutes = lastMarketUpdate > 0 
      ? Math.floor((now - lastMarketUpdate) / (1000 * 60))
      : 999;
    
    // Platform API health
    const platformHealth = {};
    enabledPlatforms.forEach(platform => {
      const platformMarkets = safeMarkets.filter(m => m.platform === platform);
      const recentMarkets = platformMarkets.filter(m => {
        if (!m.last_updated) return false;
        const age = now - new Date(m.last_updated).getTime();
        return age < 30 * 60 * 1000; // 30 minutes
      });
      platformHealth[platform] = {
        status: recentMarkets.length > 0 ? 'connected' : 'stale',
        lastSync: platformMarkets.length > 0 && platformMarkets[0].last_updated 
          ? Math.floor((now - new Date(platformMarkets[0].last_updated).getTime()) / (1000 * 60))
          : 999
      };
    });
    
    return {
      dataFreshness: lastRefreshMinutes < 60 ? 'healthy' : lastRefreshMinutes < 180 ? 'warning' : 'error',
      lastRefreshMinutes,
      platformHealth,
      alertSystem: safeAlerts.length >= 0 ? 'operational' : 'unknown',
      autoTrader: activeConfig?.auto_trade_enabled ? 'active' : 'inactive'
    };
  }, [safeMarkets, safeAlerts, enabledPlatforms, activeConfig]);

  const getTimeSince = (date) => {
    if (!date) return 'Never';
    const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-white border-b border-slate-200/80 px-6 py-6 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-[28px] font-semibold text-slate-900 tracking-tight">Dashboard</h1>
              <p className="text-[13px] text-slate-600 mt-1 font-medium">
                AI-powered alpha detection system · Monitoring {enabledPlatforms.length} platforms
              </p>
            </div>
            {activeConfig?.auto_trade_enabled && (
              <div className="flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-lg">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-semibold text-green-700">Auto-Trading Active</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        {/* Operation Status Alert */}
        {operationStatus && (
          <Alert className={operationStatus.type === 'success' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
            {operationStatus.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-600" />
            )}
            <AlertDescription className={operationStatus.type === 'success' ? 'text-green-800' : 'text-red-800'}>
              <div className="font-semibold text-sm mb-1">{operationStatus.title}</div>
              <div className="text-xs">{operationStatus.message}</div>
            </AlertDescription>
          </Alert>
        )}

        {/* NEW FEATURE 1: Today's Activity Summary */}
        <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-5 h-5 text-blue-600" />
              <h3 className="text-base font-semibold text-slate-900">Today's Activity</h3>
              <Badge className="bg-blue-600 text-white ml-auto">Live</Badge>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="bg-white rounded-lg p-3 border border-blue-200">
                <div className="text-xs text-slate-500 mb-1">Trades Executed</div>
                <div className="text-2xl font-bold text-slate-900">{todayStats.tradesExecuted}</div>
                <div className="text-xs text-slate-600 mt-1">
                  {todayStats.autoTrades} auto, {todayStats.manualTrades} manual
                </div>
              </div>
              
              <div className="bg-white rounded-lg p-3 border border-blue-200">
                <div className="text-xs text-slate-500 mb-1">Opportunities Found</div>
                <div className="text-2xl font-bold text-slate-900">{todayStats.opportunitiesFound}</div>
                <div className="text-xs text-slate-600 mt-1">
                  {highValueAlpha.length} high-value
                </div>
              </div>
              
              <div className="bg-white rounded-lg p-3 border border-blue-200">
                <div className="text-xs text-slate-500 mb-1">Positions Closed</div>
                <div className="text-2xl font-bold text-slate-900">{todayStats.positionsClosed}</div>
                <div className={`text-xs font-semibold mt-1 ${(todayStats.todayPnL || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {(todayStats.todayPnL || 0) >= 0 ? '+' : ''}${((todayStats.todayPnL || 0)).toFixed(2)}
                </div>
              </div>
              
              <div className="bg-white rounded-lg p-3 border border-blue-200">
                <div className="text-xs text-slate-500 mb-1">Best Edge Today</div>
                <div className="text-2xl font-bold text-blue-600">
                  {todayStats.bestOpp ? `${(Math.abs(todayStats.bestOpp.edge || 0) * 100).toFixed(1)}%` : '-'}
                </div>
                <div className="text-xs text-slate-600 mt-1">
                  {todayStats.bestOpp ? todayStats.bestOpp.platform : 'No opportunities'}
                </div>
              </div>
            </div>

            {todayStats.bestTrade && (
              <div className="bg-white rounded-lg p-3 border border-green-200">
                <div className="text-xs text-slate-500 mb-1">🏆 Top Performer Today</div>
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-slate-900 truncate">
                      {todayStats.bestTrade.question}
                    </div>
                    <div className="text-xs text-slate-600 mt-1">
                      {todayStats.bestTrade.platform} · {todayStats.bestTrade.direction}
                    </div>
                  </div>
                  <div className="text-right ml-4">
                    <div className="text-lg font-bold text-green-600">
                      +${((todayStats.bestTrade.pnl || 0)).toFixed(2)}
                    </div>
                    <div className="text-xs text-green-600">
                      {(todayStats.bestTrade.pnl_percent || 0) > 0 && `+${((todayStats.bestTrade.pnl_percent || 0)).toFixed(1)}%`}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* NEW FEATURE 5: System Health Indicators */}
        <Card className="border border-slate-200 bg-white">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="w-5 h-5 text-slate-600" />
              <h3 className="text-base font-semibold text-slate-900">System Health</h3>
            </div>
            
            <div className="grid md:grid-cols-3 gap-4 mb-4">
              <div className={`p-4 rounded-lg border-2 ${
                systemHealth.dataFreshness === 'healthy' 
                  ? 'bg-green-50 border-green-300'
                  : systemHealth.dataFreshness === 'warning'
                    ? 'bg-yellow-50 border-yellow-300'
                    : 'bg-red-50 border-red-300'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  {systemHealth.dataFreshness === 'healthy' ? (
                    <Wifi className="w-5 h-5 text-green-600" />
                  ) : (
                    <WifiOff className="w-5 h-5 text-red-600" />
                  )}
                  <span className="text-sm font-semibold">Data Feeds</span>
                </div>
                <div className={`text-xs font-medium ${
                  systemHealth.dataFreshness === 'healthy' 
                    ? 'text-green-700'
                    : systemHealth.dataFreshness === 'warning'
                      ? 'text-yellow-700'
                      : 'text-red-700'
                }`}>
                  {systemHealth.dataFreshness === 'healthy' && '✅ Live & Fresh'}
                  {systemHealth.dataFreshness === 'warning' && '⚠️ Slightly Stale'}
                  {systemHealth.dataFreshness === 'error' && '❌ Needs Refresh'}
                </div>
                <div className="text-xs text-slate-600 mt-1">
                  Last update: {systemHealth.lastRefreshMinutes}m ago
                </div>
              </div>

              <div className={`p-4 rounded-lg border-2 ${
                systemHealth.autoTrader === 'active'
                  ? 'bg-green-50 border-green-300'
                  : 'bg-slate-50 border-slate-300'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  <Zap className={`w-5 h-5 ${systemHealth.autoTrader === 'active' ? 'text-green-600' : 'text-slate-400'}`} />
                  <span className="text-sm font-semibold">Auto-Trader</span>
                </div>
                <div className={`text-xs font-medium ${
                  systemHealth.autoTrader === 'active' ? 'text-green-700' : 'text-slate-600'
                }`}>
                  {systemHealth.autoTrader === 'active' ? '🤖 Active & Running' : '⏸️ Inactive'}
                </div>
                <div className="text-xs text-slate-600 mt-1">
                  {openTrades.length} positions open
                </div>
              </div>

              <div className="p-4 rounded-lg border-2 bg-blue-50 border-blue-300">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="w-5 h-5 text-blue-600" />
                  <span className="text-sm font-semibold">Alerts</span>
                </div>
                <div className="text-xs font-medium text-blue-700">
                  ✅ Operational
                </div>
                <div className="text-xs text-slate-600 mt-1">
                  {safeAlerts.length} recent alerts
                </div>
              </div>
            </div>

            <div className="border-t border-slate-200 pt-4">
              <div className="text-xs font-semibold text-slate-700 mb-3">Platform API Status</div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
                {enabledPlatforms.map(platform => {
                  const health = systemHealth.platformHealth[platform];
                  const isConnected = health?.status === 'connected';
                  
                  return (
                    <div key={platform} className={`p-2 rounded border ${
                      isConnected 
                        ? 'bg-green-50 border-green-300'
                        : 'bg-slate-50 border-slate-300'
                    }`}>
                      <div className="flex items-center gap-1 mb-1">
                        <div className={`w-2 h-2 rounded-full ${
                          isConnected ? 'bg-green-500' : 'bg-slate-400'
                        }`}></div>
                        <span className="text-xs font-medium truncate">{platform}</span>
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {health?.lastSync < 60 ? `${health.lastSync}m` : 'Stale'}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* NEW FEATURE 4: Top 3 Opportunities Right Now */}
        {topOpportunities.length > 0 && (
          <Card className="border border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-purple-600" />
                  <h3 className="text-base font-semibold text-slate-900">Top Opportunities Right Now</h3>
                </div>
                <Link to={createPageUrl("Opportunities")}>
                  <Button variant="outline" size="sm" className="border-purple-300 text-purple-700 hover:bg-purple-100">
                    View All
                    <ExternalLink className="w-3 h-3 ml-2" />
                  </Button>
                </Link>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                {topOpportunities.map((opp, idx) => (
                  <div key={opp.id} className="bg-white rounded-lg p-4 border-2 border-purple-200 hover:border-purple-400 transition-all cursor-pointer">
                    <div className="flex items-center justify-between mb-2">
                      <Badge className={`text-xs ${
                        Math.abs(opp.edge || 0) >= 0.1 
                          ? 'bg-red-500 text-white'
                          : Math.abs(opp.edge || 0) >= 0.07
                            ? 'bg-orange-500 text-white'
                            : 'bg-purple-500 text-white'
                      }`}>
                        #{idx + 1} · {(Math.abs(opp.edge || 0) * 100).toFixed(1)}% Edge
                      </Badge>
                      <Badge variant="outline" className="text-xs border-slate-300">
                        {opp.platform}
                      </Badge>
                    </div>

                    <div className="mb-3">
                      <div className="text-sm font-medium text-slate-900 line-clamp-2 mb-2">
                        {opp.question}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mb-3">
                      <div className="bg-slate-50 rounded p-2">
                        <div className="text-[10px] text-slate-500">Market</div>
                        <div className="text-lg font-bold text-slate-900">
                          {((opp.market_price || 0) * 100).toFixed(0)}%
                        </div>
                      </div>
                      <div className="bg-purple-50 rounded p-2">
                        <div className="text-[10px] text-purple-600">AI Estimate</div>
                        <div className="text-lg font-bold text-purple-700">
                          {((opp.estimated_true_probability || 0) * 100).toFixed(0)}%
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="text-xs text-slate-600">
                        Confidence: {((opp.confidence_score || 0) * 100).toFixed(0)}%
                      </div>
                      <Link to={createPageUrl("Opportunities")}>
                        <Button size="sm" className="bg-purple-600 hover:bg-purple-700 text-white h-7 text-xs">
                          <PlayCircle className="w-3 h-3 mr-1" />
                          Trade
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* NEW FEATURE 3: Performance Chart (Last 30 Days) */}
        <Card className="border border-slate-200 bg-white">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-5 h-5 text-slate-600" />
              <h3 className="text-base font-semibold text-slate-900">Performance Chart (Last 30 Days)</h3>
            </div>

            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={performanceChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 11 }}
                    stroke="#64748b"
                  />
                  <YAxis 
                    tick={{ fontSize: 11 }}
                    stroke="#64748b"
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '12px'
                    }}
                    formatter={(value) => [`$${(value || 0).toFixed(2)}`, 'P&L']}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="cumulative" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    dot={false}
                    name="Cumulative P&L"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-4 gap-4 mt-4 pt-4 border-t border-slate-200">
              <div className="text-center">
                <div className="text-xs text-slate-500 mb-1">30-Day P&L</div>
                <div className={`text-xl font-bold ${
                  (performanceChartData[performanceChartData.length - 1]?.cumulative || 0) >= 0 
                    ? 'text-green-600' 
                    : 'text-red-600'
                }`}>
                  {(performanceChartData[performanceChartData.length - 1]?.cumulative || 0) >= 0 ? '+' : ''}
                  ${((performanceChartData[performanceChartData.length - 1]?.cumulative || 0)).toFixed(2)}
                </div>
              </div>
              <div className="text-center">
                <div className="text-xs text-slate-500 mb-1">Win Rate</div>
                <div className="text-xl font-bold text-slate-900">{winRate}%</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-slate-500 mb-1">Total Trades</div>
                <div className="text-xl font-bold text-slate-900">{closedTrades.length}</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-slate-500 mb-1">Avg Edge</div>
                <div className="text-xl font-bold text-blue-600">
                  {(avgEdge * 100).toFixed(1)}%
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* NEW FEATURE 2: Recent Trades Feed (Last 5) */}
        <Card className="border border-slate-200 bg-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-slate-600" />
                <h3 className="text-base font-semibold text-slate-900">Recent Trades</h3>
              </div>
              <Link to={createPageUrl("Portfolio")}>
                <Button variant="outline" size="sm" className="border-slate-300">
                  View All
                  <ExternalLink className="w-3 h-3 ml-2" />
                </Button>
              </Link>
            </div>

            {recentTrades.length > 0 ? (
              <div className="space-y-3">
                {recentTrades.map(trade => {
                  const pnl = trade.status === 'Open' ? (trade.unrealized_pnl || 0) : (trade.pnl || 0);
                  const isProfit = pnl >= 0;
                  
                  return (
                    <div key={trade.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200 hover:border-slate-300 transition-colors">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        trade.direction === 'Long' 
                          ? 'bg-green-100'
                          : 'bg-red-100'
                      }`}>
                        {trade.direction === 'Long' ? (
                          <ArrowUpRight className="w-5 h-5 text-green-600" />
                        ) : (
                          <ArrowDownRight className="w-5 h-5 text-red-600" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-xs border-slate-300">
                            {trade.platform}
                          </Badge>
                          <Badge className={`text-xs ${
                            trade.status === 'Open' 
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-slate-200 text-slate-700'
                          }`}>
                            {trade.status}
                          </Badge>
                          {trade.auto_trade && (
                            <Badge className="text-xs bg-purple-100 text-purple-700">
                              Auto
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm font-medium text-slate-900 truncate">
                          {trade.question}
                        </div>
                        <div className="text-xs text-slate-500 mt-1">
                          {getTimeSince(trade.created_date)} · ${(trade.position_size || 0).toFixed(0)}
                        </div>
                      </div>

                      <div className="text-right flex-shrink-0">
                        <div className={`text-lg font-bold ${
                          isProfit ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {isProfit ? '+' : ''}${pnl.toFixed(2)}
                        </div>
                        {trade.pnl_percent !== undefined && trade.pnl_percent !== 0 && (
                          <div className={`text-xs ${
                            (trade.pnl_percent || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {(trade.pnl_percent || 0) >= 0 ? '+' : ''}{((trade.pnl_percent || 0)).toFixed(1)}%
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-400">
                <Activity className="w-12 h-12 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No trades yet. Start trading to see your activity here.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link to={createPageUrl("AlphaHunter")}>
            <Card className="border border-slate-200 hover:border-slate-300 hover:shadow-lg transition-all cursor-pointer bg-white">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs text-slate-500 font-medium">Alpha Opportunities</div>
                  <Target className="w-4 h-4 text-slate-400" />
                </div>
                <div className="text-3xl font-semibold text-slate-900 tracking-tight tabular-nums">{safeOpportunities.length}</div>
                <div className="text-xs text-slate-600 mt-1 font-medium">
                  {highValueAlpha.length} high-value
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link to={createPageUrl("Portfolio")}>
            <Card className="border border-slate-200 hover:border-slate-300 hover:shadow-lg transition-all cursor-pointer bg-white">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs text-slate-500 font-medium">Total P&L</div>
                  <DollarSign className="w-4 h-4 text-slate-400" />
                </div>
                <div className={`text-3xl font-semibold tracking-tight tabular-nums ${totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {totalPnL >= 0 ? '+' : ''}${(totalPnL || 0).toFixed(0)}
                </div>
                <div className="text-xs text-slate-600 mt-1 font-medium">Win rate: {winRate}%</div>
              </CardContent>
            </Card>
          </Link>

          <Link to={createPageUrl("AlphaHunter")}>
            <Card className="border border-slate-200 hover:border-slate-300 hover:shadow-lg transition-all cursor-pointer bg-white">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs text-slate-500 font-medium">Avg Edge Found</div>
                  <TrendingUp className="w-4 h-4 text-slate-400" />
                </div>
                <div className="text-3xl font-semibold text-slate-900 tracking-tight tabular-nums">
                  {((avgEdge || 0) * 100).toFixed(1)}%
                </div>
                <div className="text-xs text-slate-600 mt-1 font-medium">Average mispricing</div>
              </CardContent>
            </Card>
          </Link>

          <Link to={createPageUrl("Markets")}>
            <Card className="border border-slate-200 hover:border-slate-300 hover:shadow-lg transition-all cursor-pointer bg-white">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs text-slate-500 font-medium">Markets Tracked</div>
                  <Activity className="w-4 h-4 text-slate-400" />
                </div>
                <div className="text-3xl font-semibold text-slate-900 tracking-tight tabular-nums">{safeMarkets.length}</div>
                <div className="text-xs text-slate-600 mt-1 font-medium">Across platforms</div>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Backend Function Controls */}
        <Card className="border border-slate-200/80 bg-white rounded-xl shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-slate-900 tracking-tight">Backend Operations</h3>
              {activeConfig?.auto_trade_enabled && (
                <Badge className="bg-green-500 text-white">
                  <Zap className="w-3 h-3 mr-1" />
                  Auto-Trade ON
                </Badge>
              )}
            </div>
            <div className="grid md:grid-cols-4 gap-3">
              <Button
                onClick={() => fetchMarketsMutation.mutate()}
                disabled={isAnyOperationLoading}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm hover:shadow transition-all"
              >
                {fetchMarketsMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Fetching...
                  </>
                ) : (
                  <>
                    <Globe className="w-4 h-4 mr-2" />
                    Fetch Markets
                  </>
                )}
              </Button>
              <Button
                onClick={() => scanAlphaMutation.mutate()}
                disabled={isAnyOperationLoading}
                className={`${
                  activeConfig?.auto_trade_enabled 
                    ? 'bg-green-600 hover:bg-green-700' 
                    : 'bg-purple-600 hover:bg-purple-700'
                } text-white font-medium rounded-lg shadow-sm hover:shadow transition-all`}
              >
                {scanAlphaMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Scanning...
                  </>
                ) : (
                  <>
                    {activeConfig?.auto_trade_enabled ? (
                      <Zap className="w-4 h-4 mr-2" />
                    ) : (
                      <Crosshair className="w-4 h-4 mr-2" />
                    )}
                    {activeConfig?.auto_trade_enabled ? 'Scan & Trade' : 'Scan Alpha'}
                  </>
                )}
              </Button>
              <Button
                onClick={() => monitorPositionsMutation.mutate()}
                disabled={isAnyOperationLoading}
                className="bg-orange-600 hover:bg-orange-700 text-white font-medium rounded-lg shadow-sm hover:shadow transition-all"
              >
                {monitorPositionsMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Monitoring...
                  </>
                ) : (
                  <>
                    <Activity className="w-4 h-4 mr-2" />
                    Monitor Positions
                  </>
                )}
              </Button>
              <Button
                onClick={() => cleanupMutation.mutate()}
                disabled={isAnyOperationLoading}
                variant="outline"
                className="border-slate-300 hover:bg-slate-50 font-medium rounded-lg transition-all"
              >
                {cleanupMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Cleaning...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 mr-2" />
                    Cleanup Data
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
        
        {/* Platform Overview */}
        <Card className="border border-slate-200 bg-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-slate-900">Platform Performance</h3>
              <Badge variant="outline" className="border-slate-300 text-slate-700">
                {enabledPlatforms.length} Active
              </Badge>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {enabledPlatforms.map(platform => {
                const stats = platformStats[platform];
                const marketCount = marketsByPlatform[platform] || 0;
                const oppCount = oppsByPlatform[platform] || 0;

                return (
                  <div key={platform} className="border border-slate-200 rounded-lg p-4 hover:border-slate-300 transition-colors bg-slate-50">
                    <Badge variant="outline" className="border-slate-300 text-slate-700 mb-3 text-xs">
                      {platform}
                    </Badge>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500">Markets</span>
                        <span className="font-semibold text-slate-900">{marketCount}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500">Alpha</span>
                        <span className="font-semibold text-slate-900">{oppCount}</span>
                      </div>
                      {stats && (
                        <>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-500">Trades</span>
                            <span className="font-semibold text-slate-900">{stats.trades}</span>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-500">P&L</span>
                            <span className={`font-semibold ${(stats.pnl || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {(stats.pnl || 0) >= 0 ? '+' : ''}${(stats.pnl || 0).toFixed(0)}
                            </span>
                          </div>
                          {stats.open > 0 && (
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-slate-500">Open</span>
                              <span className="font-semibold text-slate-900">{stats.open}</span>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Auto-Trader */}
        <AutoTrader />

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="border border-slate-200 bg-white">
            <CardContent className="p-6">
              <h3 className="text-base font-semibold text-slate-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <Link to={createPageUrl("AlphaHunter")}>
                  <div className="p-4 border border-slate-200 rounded-lg hover:border-slate-300 hover:bg-slate-50 transition-all cursor-pointer">
                    <div className="font-medium text-slate-900 text-sm mb-1 flex items-center gap-2">
                      <Crosshair className="w-4 h-4 text-slate-600" />
                      Scan for Alpha
                    </div>
                    <div className="text-xs text-slate-500">Hunt for profitable inefficiencies across all platforms</div>
                  </div>
                </Link>
                <Link to={createPageUrl("Markets")}>
                  <div className="p-4 border border-slate-200 rounded-lg hover:border-slate-300 hover:bg-slate-50 transition-all cursor-pointer">
                    <div className="font-medium text-slate-900 text-sm mb-1">Discover Markets</div>
                    <div className="text-xs text-slate-500">Scan live markets from 6+ platforms</div>
                  </div>
                </Link>
                <Link to={createPageUrl("Opportunities")}>
                  <div className="p-4 border border-slate-200 rounded-lg hover:border-slate-300 hover:bg-slate-50 transition-all cursor-pointer">
                    <div className="font-medium text-slate-900 text-sm mb-1">View Opportunities</div>
                    <div className="text-xs text-slate-500">AI-detected mispricings with live analysis</div>
                  </div>
                </Link>
                <Link to={createPageUrl("Settings")}>
                  <div className="p-4 border border-slate-200 rounded-lg hover:border-slate-300 hover:bg-slate-50 transition-all cursor-pointer">
                    <div className="font-medium text-slate-900 text-sm mb-1">Configure System</div>
                    <div className="text-xs text-slate-500">Multi-platform risk parameters and automation</div>
                  </div>
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-slate-200 bg-white">
            <CardContent className="p-6">
              <h3 className="text-base font-semibold text-slate-900 mb-4">System Status</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Crosshair className="w-4 h-4 text-slate-600" />
                    <span className="text-sm text-slate-600">Alpha Detection</span>
                  </div>
                  <Badge variant="outline" className="border-slate-300 text-slate-700">
                    {safeOpportunities.length} Found
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-slate-600" />
                    <span className="text-sm text-slate-600">Platform Scanning</span>
                  </div>
                  <Badge variant="outline" className="border-slate-300 text-slate-700">
                    {enabledPlatforms.length} Active
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-slate-600" />
                    <span className="text-sm text-slate-600">AI Prediction Engine</span>
                  </div>
                  <Badge variant="outline" className="border-slate-300 text-slate-700">Running</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-slate-600" />
                    <span className="text-sm text-slate-600">Auto-Trader Status</span>
                  </div>
                  <Badge variant="outline" className={activeConfig?.auto_trade_enabled ? "border-green-300 text-green-700" : "border-slate-300 text-slate-700"}>
                    {activeConfig?.auto_trade_enabled ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-slate-600" />
                    <span className="text-sm text-slate-600">Data Feeds</span>
                  </div>
                  <Badge variant="outline" className="border-slate-300 text-slate-700">Live</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* System Info */}
        <Card className="border border-slate-200 bg-white">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-slate-100 rounded-lg">
                <Brain className="w-6 h-6 text-slate-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-slate-900 mb-2">How BetGPT Works</h3>
                <p className="text-sm text-slate-600 mb-4">
                  BetGPT scans prediction markets, uses AI to independently estimate probabilities, 
                  and identifies profitable mispricings where the market is systematically wrong.
                </p>
                <div className="grid md:grid-cols-3 gap-4 text-xs">
                  <div>
                    <strong className="text-slate-900 block mb-1">1. Data Ingestion</strong>
                    <span className="text-slate-600">Scrapes live prices, volumes, and liquidity from 6+ platforms</span>
                  </div>
                  <div>
                    <strong className="text-slate-900 block mb-1">2. AI Prediction</strong>
                    <span className="text-slate-600">Estimates probabilities using news, polls, historical data</span>
                  </div>
                  <div>
                    <strong className="text-slate-900 block mb-1">3. Alpha Detection</strong>
                    <span className="text-slate-600">Compares AI estimate to market price to find mispricings</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
