
import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { TrendingUp, Target, DollarSign, Activity } from "lucide-react";
import ArbitrageDetector from "../components/analytics/ArbitrageDetector";
import AlertCenter from "../components/analytics/AlertCenter";
import SentimentEngine from "../components/analytics/SentimentEngine";
import MarketMoodMeter from "../components/analytics/MarketMoodMeter";
import AdvancedMetrics from "../components/analytics/AdvancedMetrics";
import FeatureGate from "../components/subscription/FeatureGate";

export default function Analytics() {
  const { data: opportunities = [] } = useQuery({
    queryKey: ['opportunities'],
    queryFn: () => base44.entities.Opportunity.list('-created_date', 200),
    initialData: [],
    refetchInterval: 45000,
    refetchIntervalInBackground: true,
  });

  const { data: trades = [] } = useQuery({
    queryKey: ['trades'],
    queryFn: () => base44.entities.Trade.list('-created_date', 200),
    initialData: [],
    refetchInterval: 30000,
    refetchIntervalInBackground: true,
  });

  const closedTrades = trades.filter(t => t.status === 'Closed');
  const totalPnL = closedTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
  const winningTrades = closedTrades.filter(t => t.pnl > 0);
  const winRate = closedTrades.length > 0
    ? (winningTrades.length / closedTrades.length * 100).toFixed(0)
    : 0;
  const avgEdge = opportunities.length > 0
    ? opportunities.reduce((sum, o) => sum + Math.abs(o.edge || 0), 0) / opportunities.length
    : 0;

  // Platform performance
  const platformPerformance = {};
  trades.forEach(trade => {
    if (!platformPerformance[trade.platform]) {
      platformPerformance[trade.platform] = { platform: trade.platform, trades: 0, pnl: 0 };
    }
    platformPerformance[trade.platform].trades += 1;
    if (trade.status === 'Closed') {
      platformPerformance[trade.platform].pnl += (trade.pnl || 0);
    }
  });

  const platformData = Object.values(platformPerformance);

  // Edge distribution
  const edgeDistribution = [
    { name: 'Small (0-3%)', value: opportunities.filter(o => Math.abs(o.edge) < 0.03).length },
    { name: 'Medium (3-7%)', value: opportunities.filter(o => Math.abs(o.edge) >= 0.03 && Math.abs(o.edge) < 0.07).length },
    { name: 'Large (7%+)', value: opportunities.filter(o => Math.abs(o.edge) >= 0.07).length }
  ];

  const COLORS = ['#94a3b8', '#3b82f6', '#10b981'];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-semibold text-slate-900">Analytics</h1>
          <p className="text-sm text-slate-500 mt-1">Track performance, analyze trends, and optimize your strategy</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border border-slate-200">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs text-slate-500 font-medium">Total P&L</div>
                <DollarSign className="w-4 h-4 text-slate-400" />
              </div>
              <div className={`text-3xl font-semibold tracking-tight ${totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {totalPnL >= 0 ? '+' : ''}${totalPnL.toFixed(0)}
              </div>
              <div className="text-xs text-slate-600 mt-1">
                {closedTrades.length} trades closed
              </div>
            </CardContent>
          </Card>

          <Card className="border border-slate-200">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs text-slate-500 font-medium">Win Rate</div>
                <Target className="w-4 h-4 text-slate-400" />
              </div>
              <div className="text-3xl font-semibold text-slate-900 tracking-tight">
                {winRate}%
              </div>
              <div className="text-xs text-slate-600 mt-1">
                {winningTrades.length}W / {(closedTrades.length - winningTrades.length)}L
              </div>
            </CardContent>
          </Card>

          <Card className="border border-slate-200">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs text-slate-500 font-medium">Avg Edge</div>
                <TrendingUp className="w-4 h-4 text-slate-400" />
              </div>
              <div className="text-3xl font-semibold text-slate-900 tracking-tight">
                {(avgEdge * 100).toFixed(1)}%
              </div>
              <div className="text-xs text-slate-600 mt-1">
                {opportunities.length} opportunities
              </div>
            </CardContent>
          </Card>

          <Card className="border border-slate-200">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs text-slate-500 font-medium">Active Trades</div>
                <Activity className="w-4 h-4 text-slate-400" />
              </div>
              <div className="text-3xl font-semibold text-slate-900 tracking-tight">
                {trades.filter(t => t.status === 'Open').length}
              </div>
              <div className="text-xs text-slate-600 mt-1">
                {trades.length} total trades
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Market Analysis */}
        <div className="grid md:grid-cols-2 gap-6">
          <MarketMoodMeter />
          <SentimentEngine />
        </div>

        {/* Advanced Metrics - GATED FOR PRO */}
        <FeatureGate requiredTier="pro" feature="Advanced Analytics">
          <AdvancedMetrics trades={trades} />
        </FeatureGate>

        {/* Charts: Platform Performance & Edge Distribution */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="border border-slate-200">
            <CardHeader>
              <CardTitle className="text-base">Platform Performance</CardTitle>
            </CardHeader>
            <CardContent>
              {platformData.length > 0 ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={platformData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="platform" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip contentStyle={{ backgroundColor: 'white', border: '1px solid #e2e8f0' }} />
                      <Bar dataKey="pnl" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-slate-400 text-sm">
                  No platform data yet
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border border-slate-200">
            <CardHeader>
              <CardTitle className="text-base">Edge Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              {edgeDistribution.some(d => d.value > 0) ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={edgeDistribution}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {edgeDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-slate-400 text-sm">
                  No edge data yet
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Platform Breakdown */}
        <Card className="border border-slate-200">
          <CardHeader>
            <CardTitle className="text-base">Platform Performance Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            {platformData.length > 0 ? (
              <div className="space-y-3">
                {platformData.map(platform => (
                  <div key={platform.platform} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div>
                      <div className="font-medium text-slate-900">{platform.platform}</div>
                      <div className="text-xs text-slate-600">{platform.trades} trades</div>
                    </div>
                    <div className={`text-lg font-bold ${platform.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {platform.pnl >= 0 ? '+' : ''}${platform.pnl.toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-400 text-sm">
                No platform trades yet
              </div>
            )}
          </CardContent>
        </Card>

        {/* Arbitrage & Alerts */}
        <div className="grid md:grid-cols-2 gap-6">
          <ArbitrageDetector />
          <AlertCenter />
        </div>
      </div>
    </div>
  );
}
