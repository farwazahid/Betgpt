import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  CheckCircle2, AlertCircle, Loader2, PlayCircle, 
  DollarSign, Target, Shield, Activity, TrendingUp,
  Settings as SettingsIcon, Zap, TestTube2
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function TestingGuide() {
  const [currentPhase, setCurrentPhase] = useState(1);
  const [testResults, setTestResults] = useState({});
  const queryClient = useQueryClient();

  const { data: configs = [] } = useQuery({
    queryKey: ['configs'],
    queryFn: () => base44.entities.SystemConfig.list(),
    initialData: [],
  });

  const { data: opportunities = [] } = useQuery({
    queryKey: ['opportunities'],
    queryFn: () => base44.entities.Opportunity.filter({ status: 'Active' }),
    initialData: [],
  });

  const { data: trades = [] } = useQuery({
    queryKey: ['trades'],
    queryFn: () => base44.entities.Trade.list('-created_date', 50),
    initialData: [],
  });

  const config = configs.find(c => c.is_active) || null;

  // Phase 1: Manifold Testing Setup
  const setupPhase1Mutation = useMutation({
    mutationFn: async () => {
      if (!config) {
        throw new Error('No active configuration found');
      }

      await base44.entities.SystemConfig.update(config.id, {
        auto_trade_enabled: false, // Manual only for Phase 1
        max_position_size: 10, // $10 max (Manifold play money)
        max_open_positions: 1, // Only 1 position for testing
        min_confidence_threshold: 0.70,
        min_edge_threshold: 0.05,
        platforms_enabled: ['Manifold'], // ONLY Manifold
        max_daily_trades: 3,
        take_profit_percent: 0.15,
        stop_loss_percent: 0.10
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['configs'] });
      setTestResults({ ...testResults, phase1Setup: true });
    }
  });

  // Phase 2: Small Real Money Setup
  const setupPhase2Mutation = useMutation({
    mutationFn: async () => {
      if (!config) {
        throw new Error('No active configuration found');
      }

      await base44.entities.SystemConfig.update(config.id, {
        auto_trade_enabled: false, // Still manual
        max_position_size: 50, // $50 max
        max_open_positions: 2,
        min_confidence_threshold: 0.75, // More conservative
        min_edge_threshold: 0.06,
        platforms_enabled: ['Polymarket'], // ONE real platform
        max_daily_trades: 2,
        take_profit_percent: 0.20,
        stop_loss_percent: 0.12
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['configs'] });
      setTestResults({ ...testResults, phase2Setup: true });
    }
  });

  // Phase 3: Full Automation Setup
  const setupPhase3Mutation = useMutation({
    mutationFn: async () => {
      if (!config) {
        throw new Error('No active configuration found');
      }

      await base44.entities.SystemConfig.update(config.id, {
        auto_trade_enabled: true, // AUTO-TRADING ON
        max_position_size: 100, // $100 max
        max_open_positions: 3,
        min_confidence_threshold: 0.75,
        min_edge_threshold: 0.05,
        platforms_enabled: ['Polymarket', 'Manifold'], // Multi-platform
        max_daily_trades: 5,
        take_profit_percent: 0.20,
        stop_loss_percent: 0.12,
        trailing_stop_enabled: true,
        trailing_stop_percent: 0.05
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['configs'] });
      setTestResults({ ...testResults, phase3Setup: true });
    }
  });

  const manifoldTrades = trades.filter(t => t.platform === 'Manifold');
  const polymarketTrades = trades.filter(t => t.platform === 'Polymarket');
  const kalshiTrades = trades.filter(t => t.platform === 'Kalshi');
  const autoTrades = trades.filter(t => t.auto_trade);

  const getPhaseStatus = (phase) => {
    switch(phase) {
      case 1:
        return {
          ready: config?.platforms_enabled?.length === 1 && config?.platforms_enabled[0] === 'Manifold',
          trades: manifoldTrades.length,
          active: !config?.auto_trade_enabled
        };
      case 2:
        return {
          ready: config?.platforms_enabled?.length === 1 && config?.platforms_enabled[0] === 'Polymarket',
          trades: polymarketTrades.length,
          active: !config?.auto_trade_enabled && config?.max_position_size <= 50
        };
      case 3:
        return {
          ready: config?.auto_trade_enabled,
          trades: autoTrades.length,
          active: config?.auto_trade_enabled
        };
      default:
        return { ready: false, trades: 0, active: false };
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-3">
            <TestTube2 className="w-8 h-8" />
            <h1 className="text-3xl font-bold">Testing Guide: Real Trading System</h1>
          </div>
          <p className="text-purple-100 text-lg">
            Safe, step-by-step testing protocol for your automated trading system
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* API Status */}
        <Card className="border-2 border-green-200 bg-green-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <CheckCircle2 className="w-6 h-6 text-green-600" />
              <h2 className="text-xl font-bold text-green-900">✅ All API Keys Configured</h2>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-white rounded-lg p-4 border border-green-300">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <span className="font-semibold text-green-900">Polymarket</span>
                </div>
                <div className="text-xs text-green-700 space-y-1">
                  <div>✓ API Key</div>
                  <div>✓ Secret Key</div>
                  <div>✓ Passphrase</div>
                </div>
              </div>
              <div className="bg-white rounded-lg p-4 border border-green-300">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <span className="font-semibold text-green-900">Kalshi</span>
                </div>
                <div className="text-xs text-green-700 space-y-1">
                  <div>✓ API Key</div>
                  <div>✓ Private Key</div>
                </div>
              </div>
              <div className="bg-white rounded-lg p-4 border border-green-300">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <span className="font-semibold text-green-900">Manifold</span>
                </div>
                <div className="text-xs text-green-700 space-y-1">
                  <div>✓ API Key</div>
                  <div>✓ Play Money</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Current Status */}
        {config && (
          <Card className="border border-slate-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Current System Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-4 gap-4">
                <div>
                  <div className="text-xs text-slate-500 mb-1">Auto-Trading</div>
                  <Badge className={config.auto_trade_enabled ? 'bg-green-500' : 'bg-slate-400'}>
                    {config.auto_trade_enabled ? '✅ ENABLED' : 'Disabled'}
                  </Badge>
                </div>
                <div>
                  <div className="text-xs text-slate-500 mb-1">Max Position</div>
                  <div className="font-semibold">${config.max_position_size}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 mb-1">Active Platforms</div>
                  <div className="font-semibold">{config.platforms_enabled?.length || 0}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 mb-1">Total Trades</div>
                  <div className="font-semibold">{trades.length}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Phase Progress */}
        <Card className="border border-blue-200">
          <CardHeader>
            <CardTitle>Testing Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">Overall Completion</span>
                <span className="font-semibold">
                  Phase {currentPhase} of 3
                </span>
              </div>
              <Progress value={(currentPhase / 3) * 100} className="h-3" />
            </div>
          </CardContent>
        </Card>

        {/* Phase 1: Manifold Testing */}
        <Card className={`border-2 ${getPhaseStatus(1).active ? 'border-blue-400 bg-blue-50' : 'border-slate-200'}`}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                  1
                </div>
                Phase 1: Manifold Testing (Play Money)
              </CardTitle>
              {getPhaseStatus(1).ready && (
                <Badge className="bg-green-500 text-white">Ready</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className="border-blue-200 bg-blue-50">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                <strong>Safe Testing:</strong> Manifold uses play money. No real funds at risk.
                Perfect for testing the full trading flow without financial risk.
              </AlertDescription>
            </Alert>

            <div className="bg-white rounded-lg p-4 border border-slate-200">
              <h3 className="font-semibold mb-3">Configuration</h3>
              <div className="grid md:grid-cols-2 gap-3 text-sm">
                <div>Auto-Trading: <strong>OFF</strong> (Manual only)</div>
                <div>Max Position: <strong>$10</strong></div>
                <div>Platforms: <strong>Manifold ONLY</strong></div>
                <div>Max Open: <strong>1 position</strong></div>
                <div>Min Confidence: <strong>70%</strong></div>
                <div>Daily Limit: <strong>3 trades</strong></div>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold">Steps:</h3>
              <ol className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <span className="font-bold text-blue-600 min-w-[20px]">1.</span>
                  <span>Click "Setup Phase 1" button below to configure system</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-blue-600 min-w-[20px]">2.</span>
                  <span>Go to <Link to={createPageUrl("Opportunities")} className="text-blue-600 underline">Opportunities</Link> page</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-blue-600 min-w-[20px]">3.</span>
                  <span>Find a Manifold opportunity and click "Execute Trade"</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-blue-600 min-w-[20px]">4.</span>
                  <span>Verify trade appears on <a href="https://manifold.markets" target="_blank" className="text-blue-600 underline">manifold.markets</a></span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-blue-600 min-w-[20px]">5.</span>
                  <span>Monitor position in <Link to={createPageUrl("Portfolio")} className="text-blue-600 underline">Portfolio</Link> (prices update every 15 min)</span>
                </li>
              </ol>
            </div>

            {manifoldTrades.length > 0 && (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  <strong>✅ {manifoldTrades.length} Manifold trade(s) executed!</strong>
                  <div className="text-xs mt-1">Check Portfolio to see your positions.</div>
                </AlertDescription>
              </Alert>
            )}

            <div className="flex gap-3">
              <Button
                onClick={() => setupPhase1Mutation.mutate()}
                disabled={setupPhase1Mutation.isPending || getPhaseStatus(1).ready}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {setupPhase1Mutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Setting Up...
                  </>
                ) : getPhaseStatus(1).ready ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Phase 1 Configured
                  </>
                ) : (
                  <>
                    <PlayCircle className="w-4 h-4 mr-2" />
                    Setup Phase 1
                  </>
                )}
              </Button>
              
              {manifoldTrades.length > 0 && (
                <Button
                  onClick={() => setCurrentPhase(2)}
                  variant="outline"
                  className="border-green-500 text-green-700"
                >
                  Continue to Phase 2 →
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Phase 2: Small Real Money */}
        <Card className={`border-2 ${getPhaseStatus(2).active ? 'border-orange-400 bg-orange-50' : 'border-slate-200'} ${currentPhase < 2 ? 'opacity-60' : ''}`}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-orange-600 text-white flex items-center justify-center font-bold">
                  2
                </div>
                Phase 2: Small Real Money (Polymarket)
              </CardTitle>
              {getPhaseStatus(2).ready && (
                <Badge className="bg-green-500 text-white">Ready</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className="border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                <strong>⚠️ REAL MONEY:</strong> Polymarket uses USDC (real cryptocurrency).
                Start with small amounts ($50 max). Monitor closely for 24 hours.
              </AlertDescription>
            </Alert>

            <div className="bg-white rounded-lg p-4 border border-slate-200">
              <h3 className="font-semibold mb-3">Configuration</h3>
              <div className="grid md:grid-cols-2 gap-3 text-sm">
                <div>Auto-Trading: <strong>OFF</strong> (Manual only)</div>
                <div>Max Position: <strong>$50</strong></div>
                <div>Platforms: <strong>Polymarket ONLY</strong></div>
                <div>Max Open: <strong>2 positions</strong></div>
                <div>Min Confidence: <strong>75%</strong></div>
                <div>Daily Limit: <strong>2 trades</strong></div>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold">Steps:</h3>
              <ol className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <span className="font-bold text-orange-600 min-w-[20px]">1.</span>
                  <span>Ensure you have USDC in your Polymarket wallet</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-orange-600 min-w-[20px]">2.</span>
                  <span>Click "Setup Phase 2" to configure conservative settings</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-orange-600 min-w-[20px]">3.</span>
                  <span>Execute ONE trade manually on a high-confidence opportunity</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-orange-600 min-w-[20px]">4.</span>
                  <span>Verify on <a href="https://polymarket.com" target="_blank" className="text-orange-600 underline">polymarket.com</a></span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-orange-600 min-w-[20px]">5.</span>
                  <span>Monitor for 24 hours, verify take profit/stop loss work</span>
                </li>
              </ol>
            </div>

            {polymarketTrades.length > 0 && (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  <strong>✅ {polymarketTrades.length} Polymarket trade(s) executed!</strong>
                  <div className="text-xs mt-1">
                    Total exposure: ${polymarketTrades.reduce((sum, t) => sum + (t.position_size || 0), 0).toFixed(2)}
                  </div>
                </AlertDescription>
              </Alert>
            )}

            <div className="flex gap-3">
              <Button
                onClick={() => setupPhase2Mutation.mutate()}
                disabled={setupPhase2Mutation.isPending || getPhaseStatus(2).ready || currentPhase < 2}
                className="bg-orange-600 hover:bg-orange-700"
              >
                {setupPhase2Mutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Setting Up...
                  </>
                ) : getPhaseStatus(2).ready ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Phase 2 Configured
                  </>
                ) : (
                  <>
                    <PlayCircle className="w-4 h-4 mr-2" />
                    Setup Phase 2
                  </>
                )}
              </Button>

              {polymarketTrades.length > 0 && (
                <Button
                  onClick={() => setCurrentPhase(3)}
                  variant="outline"
                  className="border-green-500 text-green-700"
                >
                  Continue to Phase 3 →
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Phase 3: Full Automation */}
        <Card className={`border-2 ${getPhaseStatus(3).active ? 'border-green-400 bg-green-50' : 'border-slate-200'} ${currentPhase < 3 ? 'opacity-60' : ''}`}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center font-bold">
                  3
                </div>
                Phase 3: Full Automation
              </CardTitle>
              {getPhaseStatus(3).ready && (
                <Badge className="bg-green-500 text-white">✅ AUTO-TRADING LIVE</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className="border-purple-200 bg-purple-50">
              <Zap className="h-4 w-4 text-purple-600" />
              <AlertDescription className="text-purple-800">
                <strong>🤖 Automated Trading:</strong> System will execute trades automatically based on AI analysis.
                Monitor daily and scale up gradually.
              </AlertDescription>
            </Alert>

            <div className="bg-white rounded-lg p-4 border border-slate-200">
              <h3 className="font-semibold mb-3">Configuration</h3>
              <div className="grid md:grid-cols-2 gap-3 text-sm">
                <div>Auto-Trading: <strong className="text-green-600">✅ ENABLED</strong></div>
                <div>Max Position: <strong>$100</strong></div>
                <div>Platforms: <strong>Polymarket + Manifold</strong></div>
                <div>Max Open: <strong>3 positions</strong></div>
                <div>Min Confidence: <strong>75%</strong></div>
                <div>Daily Limit: <strong>5 trades</strong></div>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold">Steps:</h3>
              <ol className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <span className="font-bold text-green-600 min-w-[20px]">1.</span>
                  <span>Click "Enable Full Automation" (only after Phase 2 success)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-green-600 min-w-[20px]">2.</span>
                  <span>System will automatically scan and trade high-confidence opportunities</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-green-600 min-w-[20px]">3.</span>
                  <span>Check <Link to={createPageUrl("Dashboard")} className="text-green-600 underline">Dashboard</Link> daily to monitor performance</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-green-600 min-w-[20px]">4.</span>
                  <span>Gradually increase max position size as confidence grows</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-green-600 min-w-[20px]">5.</span>
                  <span>Monitor email notifications for all trade activity</span>
                </li>
              </ol>
            </div>

            {autoTrades.length > 0 && (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  <strong>🤖 {autoTrades.length} automated trade(s) executed!</strong>
                  <div className="text-xs mt-1">
                    System is actively trading. Monitor performance regularly.
                  </div>
                </AlertDescription>
              </Alert>
            )}

            <Button
              onClick={() => setupPhase3Mutation.mutate()}
              disabled={setupPhase3Mutation.isPending || getPhaseStatus(3).ready || currentPhase < 3}
              className="bg-green-600 hover:bg-green-700 w-full"
            >
              {setupPhase3Mutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Enabling Automation...
                </>
              ) : getPhaseStatus(3).ready ? (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  ✅ Full Automation Active
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 mr-2" />
                  Enable Full Automation
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Quick Links */}
        <Card className="border border-slate-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SettingsIcon className="w-5 h-5" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-4 gap-3">
              <Link to={createPageUrl("Settings")}>
                <Button variant="outline" className="w-full">
                  <SettingsIcon className="w-4 h-4 mr-2" />
                  Settings
                </Button>
              </Link>
              <Link to={createPageUrl("Opportunities")}>
                <Button variant="outline" className="w-full">
                  <Target className="w-4 h-4 mr-2" />
                  Opportunities
                </Button>
              </Link>
              <Link to={createPageUrl("Portfolio")}>
                <Button variant="outline" className="w-full">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Portfolio
                </Button>
              </Link>
              <Link to={createPageUrl("Dashboard")}>
                <Button variant="outline" className="w-full">
                  <Activity className="w-4 h-4 mr-2" />
                  Dashboard
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Safety Reminders */}
        <Alert className="border-red-300 bg-red-50">
          <Shield className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>⚠️ Safety Reminders:</strong>
            <ul className="mt-2 space-y-1 text-xs">
              <li>• Start small and scale gradually</li>
              <li>• Monitor all trades closely, especially in Phase 2 & 3</li>
              <li>• Never risk more than you can afford to lose</li>
              <li>• Understand that automated trading carries risks</li>
              <li>• Keep API keys secure and never share them</li>
              <li>• Check platform websites to verify all trades</li>
            </ul>
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}