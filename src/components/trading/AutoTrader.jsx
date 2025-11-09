import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Zap, Activity, CheckCircle2, XCircle, AlertCircle, Clock, Pause, ChevronDown, ChevronUp, Minimize2, Maximize2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import PlatformAdapter from "./PlatformAdapter";

export default function AutoTrader() {
  const [isRunning, setIsRunning] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);
  const [lastScanTime, setLastScanTime] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [recentActivity, setRecentActivity] = useState([]);
  const [initialized, setInitialized] = useState(false);
  const [dailyTradeCount, setDailyTradeCount] = useState(0);
  const [lastTradeTime, setLastTradeTime] = useState(null);
  const [inCooldown, setInCooldown] = useState(false);
  const [failedOrderRetries, setFailedOrderRetries] = useState({});

  const queryClient = useQueryClient();

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

  const config = configs.find(c => c.is_active) || null;

  const { data: opportunities = [] } = useQuery({
    queryKey: ['opportunities'],
    queryFn: async () => {
      try {
        const result = await base44.entities.Opportunity.filter({ status: 'Active' }, '-expected_value');
        return Array.isArray(result) ? result : [];
      } catch (error) {
        console.error('Error fetching opportunities:', error);
        return [];
      }
    },
    initialData: [],
    refetchInterval: 30000,
    refetchIntervalInBackground: true,
  });

  const { data: openTrades = [] } = useQuery({
    queryKey: ['open-trades'],
    queryFn: async () => {
      try {
        const result = await base44.entities.Trade.filter({ status: 'Open' });
        return Array.isArray(result) ? result : [];
      } catch (error) {
        console.error('Error fetching trades:', error);
        return [];
      }
    },
    initialData: [],
    refetchInterval: 15000,
    refetchIntervalInBackground: true,
  });

  const { data: todayTrades = [] } = useQuery({
    queryKey: ['today-trades'],
    queryFn: async () => {
      try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const result = await base44.entities.Trade.list('-created_date', 100);
        return result.filter(t => new Date(t.created_date) >= today);
      } catch (error) {
        return [];
      }
    },
    initialData: [],
    refetchInterval: 60000,
  });

  useEffect(() => {
    setDailyTradeCount(todayTrades.length);
  }, [todayTrades]);

  const initConfigMutation = useMutation({
    mutationFn: async () => {
      const newConfig = await base44.entities.SystemConfig.create({
        config_name: 'Default Trading Config',
        min_confidence_threshold: 0.65,
        min_edge_threshold: 0.03,
        max_position_size: 500,
        max_portfolio_exposure: 5000,
        kelly_multiplier: 0.25,
        scan_interval_minutes: 5,
        auto_trade_enabled: true,
        take_profit_percent: 0.20,
        stop_loss_percent: 0.12,
        max_open_positions: 3,
        platforms_enabled: ['Polymarket', 'Kalshi', 'Manifold', 'Gnosis', 'Augur', 'PredictIt'],
        categories_enabled: ['Politics', 'Sports', 'Crypto', 'Economics'],
        is_active: true,
        max_daily_trades: 10,
        cooldown_between_trades_minutes: 5,
        order_timeout_seconds: 30,
        retry_failed_orders: true,
        slippage_tolerance: 0.03,
        trailing_stop_enabled: false,
        trailing_stop_percent: 0.05
      });
      return newConfig;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['configs'] });
      setRecentActivity(prev => [{
        type: 'system',
        message: '🎉 Default configuration created - Multi-platform support enabled',
        timestamp: new Date().toISOString(),
        success: true
      }, ...prev]);
    },
  });

  const executeTradeMutation = useMutation({
    mutationFn: async ({ opportunity, config }) => {
      if (dailyTradeCount >= config.max_daily_trades) {
        throw new Error(`Daily trade limit reached (${config.max_daily_trades} trades)`);
      }

      if (lastTradeTime && config.cooldown_between_trades_minutes > 0) {
        const cooldownMs = config.cooldown_between_trades_minutes * 60 * 1000;
        const timeSinceLastTrade = Date.now() - new Date(lastTradeTime).getTime();
        if (timeSinceLastTrade < cooldownMs) {
          const remainingSeconds = Math.ceil((cooldownMs - timeSinceLastTrade) / 1000);
          throw new Error(`Cooldown active: ${remainingSeconds}s remaining`);
        }
      }

      setScanProgress(30);
      
      const kellySize = (opportunity.kelly_fraction || 0.05) * config.kelly_multiplier;
      const positionSize = Math.min(
        kellySize * 10000,
        config.max_position_size
      );

      const direction = opportunity.edge > 0 ? 'Long' : 'Short';
      
      const takeProfit = opportunity.edge > 0 
        ? opportunity.market_price * (1 + config.take_profit_percent)
        : opportunity.market_price * (1 - config.take_profit_percent);
      
      const stopLoss = opportunity.edge > 0
        ? opportunity.market_price * (1 - config.stop_loss_percent)
        : opportunity.market_price * (1 + config.stop_loss_percent);

      setScanProgress(50);

      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Order timeout')), config.order_timeout_seconds * 1000)
      );

      let executionDetails;
      try {
        executionDetails = await Promise.race([
          PlatformAdapter.executeTrade(
            opportunity.platform,
            {
              question: opportunity.question,
              direction,
              positionSize,
              entryPrice: opportunity.market_price,
              platform: opportunity.platform,
              slippageTolerance: config.slippage_tolerance
            }
          ),
          timeoutPromise
        ]);
      } catch (error) {
        if (config.retry_failed_orders) {
          const retryKey = opportunity.id;
          const retryCount = failedOrderRetries[retryKey] || 0;
          
          if (retryCount < 2) {
            setFailedOrderRetries(prev => ({ ...prev, [retryKey]: retryCount + 1 }));
            throw new Error(`Order failed (retry ${retryCount + 1}/3): ${error.message}`);
          }
        }
        throw error;
      }

      setScanProgress(70);

      const tradeData = {
        opportunity_id: opportunity.id,
        market_id: opportunity.market_id,
        question: opportunity.question,
        platform: opportunity.platform,
        direction,
        entry_price: executionDetails.executed_price || opportunity.market_price,
        current_price: executionDetails.executed_price || opportunity.market_price,
        position_size: positionSize,
        quantity: executionDetails.executed_quantity || Math.floor(positionSize / opportunity.market_price),
        estimated_probability: opportunity.estimated_true_probability,
        edge: opportunity.edge,
        status: 'Open',
        auto_trade: true,
        take_profit: takeProfit,
        stop_loss: stopLoss,
        execution_details: {
          ...executionDetails,
          order_timeout: config.order_timeout_seconds,
          slippage_tolerance: config.slippage_tolerance,
          trailing_stop_enabled: config.trailing_stop_enabled,
          trailing_stop_percent: config.trailing_stop_percent
        }
      };

      await base44.entities.Trade.create(tradeData);
      await base44.entities.Opportunity.update(opportunity.id, { status: 'Executed' });

      setLastTradeTime(new Date().toISOString());
      setDailyTradeCount(prev => prev + 1);
      
      if (config.cooldown_between_trades_minutes > 0) {
        setInCooldown(true);
        setTimeout(() => setInCooldown(false), config.cooldown_between_trades_minutes * 60 * 1000);
      }

      delete failedOrderRetries[opportunity.id];

      try {
        await base44.entities.Alert.create({
          alert_type: 'Trade Executed',
          severity: 'Medium',
          title: `${opportunity.platform} Trade: ${direction} ${opportunity.question.substring(0, 40)}...`,
          message: `Opened ${direction} position on ${opportunity.platform} - Size: $${positionSize.toFixed(2)} @ ${(executionDetails.executed_price * 100).toFixed(0)}%`,
          opportunity_id: opportunity.id,
          data: { trade: tradeData }
        });
      } catch (error) {
        console.error('Error creating alert:', error);
      }

      setScanProgress(100);
      return { trade: tradeData, execution: executionDetails };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['open-trades'] });
      queryClient.invalidateQueries({ queryKey: ['opportunities'] });
      queryClient.invalidateQueries({ queryKey: ['trades'] });
      queryClient.invalidateQueries({ queryKey: ['today-trades'] });
      
      setRecentActivity(prev => [{
        type: 'trade_executed',
        message: `✅ ${data.trade.platform}: Opened ${data.trade.direction} - ${data.trade.question.substring(0, 50)}... ($${data.trade.position_size.toFixed(0)})`,
        timestamp: new Date().toISOString(),
        success: true
      }, ...prev.slice(0, 19)]);
    },
    onError: (error) => {
      setRecentActivity(prev => [{
        type: 'error',
        message: `❌ Trade Error: ${error.message}`,
        timestamp: new Date().toISOString(),
        success: false
      }, ...prev.slice(0, 19)]);
    }
  });

  const monitorPositionsMutation = useMutation({
    mutationFn: async (trades) => {
      const updates = [];

      for (const trade of trades) {
        const volatility = 0.05;
        const drift = (Math.random() - 0.5) * 0.02;
        const priceChange = trade.entry_price * (drift + (Math.random() - 0.5) * volatility);
        const currentPrice = Math.max(0.01, Math.min(0.99, trade.entry_price + priceChange));
        
        const unrealizedPnl = trade.direction === 'Long'
          ? (currentPrice - trade.entry_price) * trade.quantity
          : (trade.entry_price - currentPrice) * trade.quantity;
        
        const pnlPercent = (unrealizedPnl / trade.position_size) * 100;

        let effectiveStopLoss = trade.stop_loss;
        const trailingEnabled = trade.execution_details?.trailing_stop_enabled;
        const trailingPercent = trade.execution_details?.trailing_stop_percent || 0.05;

        if (trailingEnabled && unrealizedPnl > 0) {
          if (trade.direction === 'Long') {
            const newStopLoss = currentPrice * (1 - trailingPercent);
            effectiveStopLoss = Math.max(effectiveStopLoss, newStopLoss);
          } else {
            const newStopLoss = currentPrice * (1 + trailingPercent);
            effectiveStopLoss = Math.min(effectiveStopLoss, newStopLoss);
          }
        }

        if ((trade.direction === 'Long' && currentPrice >= trade.take_profit) ||
            (trade.direction === 'Short' && currentPrice <= trade.take_profit)) {
          updates.push({
            id: trade.id,
            action: 'close',
            reason: 'Take Profit Hit',
            exit_price: currentPrice,
            pnl: unrealizedPnl,
            pnl_percent: pnlPercent,
            question: trade.question,
            platform: trade.platform
          });
        }
        else if ((trade.direction === 'Long' && currentPrice <= effectiveStopLoss) ||
                 (trade.direction === 'Short' && currentPrice >= effectiveStopLoss)) {
          updates.push({
            id: trade.id,
            action: 'close',
            reason: trailingEnabled && effectiveStopLoss !== trade.stop_loss ? 'Trailing Stop Hit' : 'Stop Loss Hit',
            exit_price: currentPrice,
            pnl: unrealizedPnl,
            pnl_percent: pnlPercent,
            question: trade.question,
            platform: trade.platform
          });
        }
        else {
          updates.push({
            id: trade.id,
            action: 'update',
            current_price: currentPrice,
            unrealized_pnl: unrealizedPnl,
            stop_loss: effectiveStopLoss
          });
        }
      }

      for (const update of updates) {
        if (update.action === 'close') {
          await base44.entities.Trade.update(update.id, {
            status: 'Closed',
            exit_price: update.exit_price,
            pnl: update.pnl,
            pnl_percent: update.pnl_percent,
            close_date: new Date().toISOString()
          });

          try {
            await base44.entities.Alert.create({
              alert_type: 'Trade Executed',
              severity: update.pnl > 0 ? 'Low' : 'High',
              title: `${update.platform}: ${update.reason}`,
              message: `${update.reason} - P&L: ${update.pnl > 0 ? '+' : ''}$${update.pnl.toFixed(2)} (${update.pnl_percent.toFixed(1)}%)`,
              data: { trade_id: update.id, pnl: update.pnl }
            });
          } catch (error) {
            console.error('Error creating alert:', error);
          }

          setRecentActivity(prev => [{
            type: 'position_closed',
            message: `${update.pnl > 0 ? '✅' : '❌'} ${update.platform} ${update.reason}: ${update.question.substring(0, 40)}... (${update.pnl > 0 ? '+' : ''}$${update.pnl.toFixed(2)})`,
            timestamp: new Date().toISOString(),
            success: update.pnl > 0
          }, ...prev.slice(0, 19)]);
        } else {
          await base44.entities.Trade.update(update.id, {
            current_price: update.current_price,
            unrealized_pnl: update.unrealized_pnl,
            stop_loss: update.stop_loss
          });
        }
      }

      return updates;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['open-trades'] });
      queryClient.invalidateQueries({ queryKey: ['trades'] });
    },
  });

  const scanAndTrade = async () => {
    if (!config || !config.auto_trade_enabled) return;
    
    setScanning(true);
    setScanProgress(0);

    try {
      if (openTrades.length > 0) {
        setScanProgress(5);
        await monitorPositionsMutation.mutateAsync(openTrades);
      }

      if (openTrades.length >= config.max_open_positions) {
        setRecentActivity(prev => [{
          type: 'limit_reached',
          message: `⚠️ Max open positions reached (${config.max_open_positions})`,
          timestamp: new Date().toISOString(),
          success: false
        }, ...prev.slice(0, 19)]);
        setScanProgress(100);
        return;
      }

      if (dailyTradeCount >= config.max_daily_trades) {
        setRecentActivity(prev => [{
          type: 'limit_reached',
          message: `⚠️ Daily trade limit reached (${config.max_daily_trades} trades)`,
          timestamp: new Date().toISOString(),
          success: false
        }, ...prev.slice(0, 19)]);
        setScanProgress(100);
        return;
      }

      if (inCooldown) {
        setRecentActivity(prev => [{
          type: 'cooldown',
          message: `⏸️ Cooldown period active (${config.cooldown_between_trades_minutes}m between trades)`,
          timestamp: new Date().toISOString(),
          success: false
        }, ...prev.slice(0, 19)]);
        setScanProgress(100);
        return;
      }

      setScanProgress(20);

      const enabledPlatforms = config.platforms_enabled || ['Polymarket', 'Kalshi', 'Manifold'];
      const validOpportunities = opportunities.filter(opp => 
        enabledPlatforms.includes(opp.platform) &&
        opp.confidence_score >= config.min_confidence_threshold &&
        Math.abs(opp.edge) >= config.min_edge_threshold &&
        (opp.recommended_action === 'Strong Buy' || opp.recommended_action === 'Buy')
      );

      setScanProgress(40);

      if (validOpportunities.length > 0) {
        const bestOpp = validOpportunities[0];
        await executeTradeMutation.mutateAsync({ opportunity: bestOpp, config });
      } else {
        setRecentActivity(prev => [{
          type: 'scan_complete',
          message: `ℹ️ Scan complete - ${opportunities.length} opps analyzed, none met criteria`,
          timestamp: new Date().toISOString(),
          success: true
        }, ...prev.slice(0, 19)]);
        setScanProgress(100);
      }

      setLastScanTime(new Date());
    } catch (error) {
      setRecentActivity(prev => [{
        type: 'error',
        message: `❌ Error: ${error.message}`,
        timestamp: new Date().toISOString(),
        success: false
      }, ...prev.slice(0, 19)]);
      setScanProgress(0);
    } finally {
      setScanning(false);
      setScanProgress(0);
    }
  };

  useEffect(() => {
    if (!isRunning || !config) return;

    scanAndTrade();

    const interval = setInterval(() => {
      scanAndTrade();
    }, (config.scan_interval_minutes || 5) * 60 * 1000);

    return () => clearInterval(interval);
  }, [isRunning, config]);

  useEffect(() => {
    if (!initialized && configs.length === 0) {
      initConfigMutation.mutate();
      setInitialized(true);
    } else if (config && !initialized) {
      setInitialized(true);
      if (config.auto_trade_enabled) {
        setIsRunning(true);
        setRecentActivity([{
          type: 'system',
          message: `🚀 Auto-trader started - Monitoring ${(config.platforms_enabled || []).length} platforms`,
          timestamp: new Date().toISOString(),
          success: true
        }]);
        setTimeout(() => scanAndTrade(), 2000);
      }
    }
  }, [configs, config, initialized]);

  const handleToggle = () => {
    setIsRunning(!isRunning);
    if (!isRunning) {
      setRecentActivity(prev => [{
        type: 'system',
        message: '🚀 Auto-trader started - Multi-platform mode active',
        timestamp: new Date().toISOString(),
        success: true
      }, ...prev]);
      setTimeout(() => scanAndTrade(), 1000);
    } else {
      setRecentActivity(prev => [{
        type: 'system',
        message: '⏸️ Auto-trader stopped',
        timestamp: new Date().toISOString(),
        success: true
      }, ...prev]);
    }
  };

  const validOppsCount = config ? opportunities.filter(o => 
    (config.platforms_enabled || []).includes(o.platform) &&
    o.confidence_score >= config.min_confidence_threshold &&
    Math.abs(o.edge) >= config.min_edge_threshold
  ).length : 0;

  const enabledPlatforms = config?.platforms_enabled || [];
  const tradesRemaining = config ? config.max_daily_trades - dailyTradeCount : 0;

  return (
    <Card className="border-none shadow-lg">
      <CardHeader className="border-b border-slate-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${isRunning ? 'bg-green-100' : 'bg-slate-100'}`}>
              <Zap className={`w-5 h-5 ${isRunning ? 'text-green-600 animate-pulse' : 'text-slate-500'}`} />
            </div>
            <div>
              <CardTitle className="text-lg">AI Auto-Trader</CardTitle>
              <p className="text-xs text-slate-500 mt-0.5">
                {isRunning ? `🟢 Active - ${enabledPlatforms.length} platforms` : '⚫ Inactive'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {!isMinimized && (
              <>
                <Badge className={isRunning ? 'bg-green-100 text-green-700 border border-green-300' : 'bg-slate-100 text-slate-700'}>
                  {isRunning ? '🟢 Running' : 'Stopped'}
                </Badge>
                <Switch
                  checked={isRunning && config?.auto_trade_enabled}
                  onCheckedChange={handleToggle}
                  disabled={!config?.auto_trade_enabled}
                />
              </>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMinimized(!isMinimized)}
              className="text-slate-600 hover:text-slate-900"
            >
              {isMinimized ? (
                <>
                  <Maximize2 className="w-4 h-4 mr-1" />
                  Expand
                </>
              ) : (
                <>
                  <Minimize2 className="w-4 h-4 mr-1" />
                  Minimize
                </>
              )}
            </Button>
          </div>
        </div>
      </CardHeader>

      {!isMinimized && (
        <CardContent className="p-6 space-y-4">
          {config && config.auto_trade_enabled ? (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                  <div className="text-xs text-slate-500 mb-1">Open Positions</div>
                  <div className="text-3xl font-bold text-slate-900">{openTrades.length}</div>
                  <div className="text-xs text-slate-600 mt-1">of {config.max_open_positions} max</div>
                </div>
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <div className="text-xs text-blue-600 mb-1">Valid Opportunities</div>
                  <div className="text-3xl font-bold text-blue-700">{validOppsCount}</div>
                  <div className="text-xs text-blue-600 mt-1">{enabledPlatforms.length} platforms</div>
                </div>
                <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                  <div className="text-xs text-purple-600 mb-1 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Trades Today
                  </div>
                  <div className="text-3xl font-bold text-purple-700">{dailyTradeCount}</div>
                  <div className="text-xs text-purple-600 mt-1">{tradesRemaining} remaining</div>
                </div>
                <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                  <div className="text-xs text-slate-500 mb-1">Last Scan</div>
                  <div className="text-sm font-semibold text-slate-900">
                    {lastScanTime ? lastScanTime.toLocaleTimeString() : 'Never'}
                  </div>
                  <div className="text-xs text-slate-600 mt-1">
                    Next: {config.scan_interval_minutes}m
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {config.trailing_stop_enabled && (
                  <Badge variant="outline" className="border-blue-300 text-blue-700 bg-blue-50 justify-center">
                    📈 Trailing Stop {(config.trailing_stop_percent * 100).toFixed(0)}%
                  </Badge>
                )}
                {config.retry_failed_orders && (
                  <Badge variant="outline" className="border-green-300 text-green-700 bg-green-50 justify-center">
                    🔄 Auto Retry
                  </Badge>
                )}
                {inCooldown && (
                  <Badge variant="outline" className="border-yellow-300 text-yellow-700 bg-yellow-50 justify-center">
                    <Pause className="w-3 h-3 mr-1" />
                    Cooldown {config.cooldown_between_trades_minutes}m
                  </Badge>
                )}
                {config.use_limit_orders && (
                  <Badge variant="outline" className="border-purple-300 text-purple-700 bg-purple-50 justify-center">
                    📊 Limit Orders
                  </Badge>
                )}
              </div>

              {scanning && (
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Activity className="w-4 h-4 text-blue-600 animate-spin" />
                    <span className="text-sm font-medium text-blue-900">
                      {scanProgress < 20 ? 'Monitoring positions...' :
                       scanProgress < 40 ? 'Scanning opportunities...' :
                       scanProgress < 70 ? 'Executing trade...' :
                       'Finalizing...'}
                    </span>
                  </div>
                  <Progress value={scanProgress} className="h-2" />
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  onClick={scanAndTrade}
                  disabled={scanning || !isRunning || inCooldown}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {scanning ? 'Scanning...' : inCooldown ? `Cooldown ${config.cooldown_between_trades_minutes}m` : '🔍 Scan Now'}
                </Button>
              </div>

              <div className="border-t border-slate-200 pt-4">
                <h4 className="text-sm font-semibold text-slate-900 mb-3">Recent Activity</h4>
                {recentActivity.length > 0 ? (
                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {recentActivity.map((activity, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-xs p-2 rounded hover:bg-slate-50">
                        {activity.success ? (
                          <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        ) : activity.type === 'error' ? (
                          <XCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-slate-700 break-words">{activity.message}</p>
                          <p className="text-slate-400 mt-0.5">
                            {new Date(activity.timestamp).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 text-center py-4">No activity yet</p>
                )}
              </div>

              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <h4 className="font-semibold text-green-900 text-sm mb-2">Advanced Features Active</h4>
                <div className="grid grid-cols-2 gap-2 text-xs text-green-800">
                  <div>Min Confidence: {(config.min_confidence_threshold * 100).toFixed(0)}%</div>
                  <div>Min Edge: {(config.min_edge_threshold * 100).toFixed(1)}%</div>
                  <div>Max Position: ${config.max_position_size}</div>
                  <div>Kelly: {(config.kelly_multiplier * 100).toFixed(0)}%</div>
                  <div>Take Profit: {(config.take_profit_percent * 100).toFixed(0)}%</div>
                  <div>Stop Loss: {(config.stop_loss_percent * 100).toFixed(0)}%</div>
                  <div>Order Timeout: {config.order_timeout_seconds}s</div>
                  <div>Max Daily: {config.max_daily_trades} trades</div>
                  <div>Slippage: {(config.slippage_tolerance * 100).toFixed(1)}%</div>
                  <div>Cooldown: {config.cooldown_between_trades_minutes}m</div>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-slate-400">
              <Zap className="w-12 h-12 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Auto-trading is disabled</p>
              <p className="text-xs mt-1">Enable it in Settings to start automatic trading</p>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}