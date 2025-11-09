import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  Legend, ResponsiveContainer 
} from "recharts";
import { 
  TrendingUp, TrendingDown, Clock, Zap, Target, 
  BarChart3, Activity, Award 
} from "lucide-react";

export default function AdvancedPortfolioAnalytics({ trades }) {
  // Calculate comprehensive metrics
  const analytics = useMemo(() => {
    if (!trades || trades.length === 0) return null;

    const closedTrades = trades.filter(t => t.status === 'Closed');
    const openTrades = trades.filter(t => t.status === 'Open');
    const autoTrades = trades.filter(t => t.auto_trade === true);
    const manualTrades = trades.filter(t => !t.auto_trade);

    // 1. P&L OVER TIME
    const pnlOverTime = closedTrades
      .sort((a, b) => new Date(a.close_date || a.created_date) - new Date(b.close_date || b.created_date))
      .reduce((acc, trade, idx) => {
        const prevPnL = idx > 0 ? acc[idx - 1].cumulative : 0;
        acc.push({
          date: new Date(trade.close_date || trade.created_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          pnl: trade.pnl || 0,
          cumulative: prevPnL + (trade.pnl || 0),
          trade_id: trade.id
        });
        return acc;
      }, []);

    // 2. WIN RATE BY PLATFORM
    const platformStats = {};
    closedTrades.forEach(trade => {
      if (!platformStats[trade.platform]) {
        platformStats[trade.platform] = { wins: 0, losses: 0, total: 0, pnl: 0 };
      }
      platformStats[trade.platform].total += 1;
      platformStats[trade.platform].pnl += trade.pnl || 0;
      if (trade.pnl > 0) platformStats[trade.platform].wins += 1;
      else if (trade.pnl < 0) platformStats[trade.platform].losses += 1;
    });

    const platformData = Object.entries(platformStats).map(([platform, stats]) => ({
      platform,
      winRate: stats.total > 0 ? (stats.wins / stats.total * 100).toFixed(1) : 0,
      wins: stats.wins,
      losses: stats.losses,
      total: stats.total,
      pnl: stats.pnl
    }));

    // 3. AUTO VS MANUAL
    const autoClosedTrades = closedTrades.filter(t => t.auto_trade);
    const manualClosedTrades = closedTrades.filter(t => !t.auto_trade);

    const autoStats = {
      trades: autoClosedTrades.length,
      wins: autoClosedTrades.filter(t => t.pnl > 0).length,
      totalPnL: autoClosedTrades.reduce((sum, t) => sum + (t.pnl || 0), 0),
      avgPnL: autoClosedTrades.length > 0 
        ? autoClosedTrades.reduce((sum, t) => sum + (t.pnl || 0), 0) / autoClosedTrades.length 
        : 0,
      winRate: autoClosedTrades.length > 0 
        ? (autoClosedTrades.filter(t => t.pnl > 0).length / autoClosedTrades.length * 100) 
        : 0
    };

    const manualStats = {
      trades: manualClosedTrades.length,
      wins: manualClosedTrades.filter(t => t.pnl > 0).length,
      totalPnL: manualClosedTrades.reduce((sum, t) => sum + (t.pnl || 0), 0),
      avgPnL: manualClosedTrades.length > 0 
        ? manualClosedTrades.reduce((sum, t) => sum + (t.pnl || 0), 0) / manualClosedTrades.length 
        : 0,
      winRate: manualClosedTrades.length > 0 
        ? (manualClosedTrades.filter(t => t.pnl > 0).length / manualClosedTrades.length * 100) 
        : 0
    };

    const autoVsManualData = [
      {
        name: 'Automated',
        'Win Rate': autoStats.winRate,
        'Avg P&L': autoStats.avgPnL,
        'Total Trades': autoStats.trades,
        'Total P&L': autoStats.totalPnL
      },
      {
        name: 'Manual',
        'Win Rate': manualStats.winRate,
        'Avg P&L': manualStats.avgPnL,
        'Total Trades': manualStats.trades,
        'Total P&L': manualStats.totalPnL
      }
    ];

    // 4. TRADE DURATION ANALYSIS
    const tradesDuration = closedTrades
      .filter(t => t.created_date && t.close_date)
      .map(trade => {
        const created = new Date(trade.created_date);
        const closed = new Date(trade.close_date);
        const durationMs = closed - created;
        const durationHours = durationMs / (1000 * 60 * 60);
        return {
          trade_id: trade.id,
          question: trade.question,
          duration: durationHours,
          pnl: trade.pnl || 0,
          platform: trade.platform
        };
      })
      .filter(t => t.duration > 0 && t.duration < 1000); // Filter out outliers

    const avgDuration = tradesDuration.length > 0 
      ? tradesDuration.reduce((sum, t) => sum + t.duration, 0) / tradesDuration.length 
      : 0;

    // Group by duration buckets
    const durationBuckets = {
      '< 1h': tradesDuration.filter(t => t.duration < 1).length,
      '1-6h': tradesDuration.filter(t => t.duration >= 1 && t.duration < 6).length,
      '6-24h': tradesDuration.filter(t => t.duration >= 6 && t.duration < 24).length,
      '1-3d': tradesDuration.filter(t => t.duration >= 24 && t.duration < 72).length,
      '3-7d': tradesDuration.filter(t => t.duration >= 72 && t.duration < 168).length,
      '> 7d': tradesDuration.filter(t => t.duration >= 168).length,
    };

    const durationData = Object.entries(durationBuckets).map(([bucket, count]) => ({
      bucket,
      count
    }));

    // 5. SHARPE RATIO CALCULATION
    const returns = closedTrades.map(t => {
      const positionSize = t.position_size || 1000;
      return (t.pnl || 0) / positionSize;
    });

    const avgReturn = returns.length > 0 
      ? returns.reduce((sum, r) => sum + r, 0) / returns.length 
      : 0;

    const variance = returns.length > 0
      ? returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length
      : 0;

    const stdDev = Math.sqrt(variance);
    const sharpeRatio = stdDev !== 0 ? (avgReturn / stdDev) : 0;
    const annualizedSharpe = sharpeRatio * Math.sqrt(252); // Assuming 252 trading days

    // 6. MONTHLY PERFORMANCE
    const monthlyPerformance = closedTrades.reduce((acc, trade) => {
      const date = new Date(trade.close_date || trade.created_date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!acc[monthKey]) {
        acc[monthKey] = { trades: 0, wins: 0, pnl: 0, month: monthKey };
      }
      
      acc[monthKey].trades += 1;
      acc[monthKey].pnl += trade.pnl || 0;
      if (trade.pnl > 0) acc[monthKey].wins += 1;
      
      return acc;
    }, {});

    const monthlyData = Object.values(monthlyPerformance)
      .sort((a, b) => a.month.localeCompare(b.month))
      .map(m => ({
        month: new Date(m.month + '-01').toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        pnl: m.pnl,
        trades: m.trades,
        winRate: m.trades > 0 ? (m.wins / m.trades * 100).toFixed(1) : 0
      }));

    // 7. POSITION SIZE ANALYSIS
    const positionSizeData = closedTrades.map(t => ({
      size: t.position_size || 0,
      pnl: t.pnl || 0,
      roi: t.position_size ? ((t.pnl || 0) / t.position_size * 100) : 0
    }));

    // 8. EDGE VS ACTUAL PERFORMANCE
    const edgeVsActual = closedTrades
      .filter(t => t.edge)
      .map(t => ({
        expectedEdge: Math.abs((t.edge || 0) * 100),
        actualReturn: t.position_size ? ((t.pnl || 0) / t.position_size * 100) : 0,
        platform: t.platform
      }));

    return {
      pnlOverTime,
      platformData,
      autoStats,
      manualStats,
      autoVsManualData,
      durationData,
      avgDuration,
      sharpeRatio: annualizedSharpe,
      monthlyData,
      positionSizeData,
      edgeVsActual,
      totalTrades: closedTrades.length,
      openTrades: openTrades.length,
      totalPnL: closedTrades.reduce((sum, t) => sum + (t.pnl || 0), 0),
      winRate: closedTrades.length > 0 
        ? (closedTrades.filter(t => t.pnl > 0).length / closedTrades.length * 100).toFixed(1)
        : 0
    };
  }, [trades]);

  if (!analytics) {
    return (
      <Card className="border border-slate-200">
        <CardContent className="p-12 text-center">
          <BarChart3 className="w-16 h-16 mx-auto text-slate-300 mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">No Analytics Available</h3>
          <p className="text-sm text-slate-600">Complete some trades to see detailed analytics</p>
        </CardContent>
      </Card>
    );
  }

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

  return (
    <div className="space-y-6">
      {/* Key Metrics Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border border-slate-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs text-slate-500 font-medium">Sharpe Ratio</div>
              <Award className="w-4 h-4 text-slate-400" />
            </div>
            <div className={`text-2xl font-bold ${
              analytics.sharpeRatio > 1 ? 'text-green-600' : 
              analytics.sharpeRatio > 0 ? 'text-blue-600' : 'text-red-600'
            }`}>
              {analytics.sharpeRatio.toFixed(2)}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              {analytics.sharpeRatio > 2 ? 'Excellent' : 
               analytics.sharpeRatio > 1 ? 'Good' : 
               analytics.sharpeRatio > 0 ? 'Fair' : 'Poor'}
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs text-slate-500 font-medium">Avg Duration</div>
              <Clock className="w-4 h-4 text-slate-400" />
            </div>
            <div className="text-2xl font-bold text-slate-900">
              {analytics.avgDuration < 24 
                ? `${analytics.avgDuration.toFixed(1)}h`
                : `${(analytics.avgDuration / 24).toFixed(1)}d`
              }
            </div>
            <div className="text-xs text-slate-500 mt-1">Per trade</div>
          </CardContent>
        </Card>

        <Card className="border border-slate-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs text-slate-500 font-medium">Auto Win Rate</div>
              <Zap className="w-4 h-4 text-slate-400" />
            </div>
            <div className="text-2xl font-bold text-purple-600">
              {analytics.autoStats.winRate.toFixed(0)}%
            </div>
            <div className="text-xs text-slate-500 mt-1">
              {analytics.autoStats.trades} trades
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs text-slate-500 font-medium">Avg P&L/Trade</div>
              <Target className="w-4 h-4 text-slate-400" />
            </div>
            <div className={`text-2xl font-bold ${
              (analytics.totalPnL / analytics.totalTrades) >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              ${(analytics.totalPnL / analytics.totalTrades).toFixed(2)}
            </div>
            <div className="text-xs text-slate-500 mt-1">Closed trades</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabbed Analytics */}
      <Tabs defaultValue="pnl" className="w-full">
        <TabsList className="grid w-full grid-cols-5 mb-6">
          <TabsTrigger value="pnl">P&L Over Time</TabsTrigger>
          <TabsTrigger value="platforms">Platforms</TabsTrigger>
          <TabsTrigger value="autoVsManual">Auto vs Manual</TabsTrigger>
          <TabsTrigger value="duration">Duration</TabsTrigger>
          <TabsTrigger value="monthly">Monthly</TabsTrigger>
        </TabsList>

        {/* P&L Over Time */}
        <TabsContent value="pnl" className="space-y-4">
          <Card className="border border-slate-200">
            <CardHeader>
              <CardTitle className="text-base flex items-center justify-between">
                <span>Cumulative P&L Over Time</span>
                <Badge variant="outline" className="border-slate-300">
                  {analytics.totalTrades} trades
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={analytics.pnlOverTime}>
                  <defs>
                    <linearGradient id="colorPnl" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
                  <YAxis stroke="#64748b" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ 
                      background: 'white', 
                      border: '1px solid #e2e8f0', 
                      borderRadius: '8px',
                      fontSize: '12px'
                    }}
                    formatter={(value) => [`$${value.toFixed(2)}`, '']}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="cumulative" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorPnl)" 
                  />
                </AreaChart>
              </ResponsiveContainer>

              <div className="grid grid-cols-2 gap-4 mt-6">
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-4 h-4 text-green-600" />
                    <span className="text-xs font-medium text-green-900">Best Trade</span>
                  </div>
                  <div className="text-2xl font-bold text-green-700">
                    ${Math.max(...analytics.pnlOverTime.map(t => t.pnl)).toFixed(2)}
                  </div>
                </div>
                <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingDown className="w-4 h-4 text-red-600" />
                    <span className="text-xs font-medium text-red-900">Worst Trade</span>
                  </div>
                  <div className="text-2xl font-bold text-red-700">
                    ${Math.min(...analytics.pnlOverTime.map(t => t.pnl)).toFixed(2)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Platform Analysis */}
        <TabsContent value="platforms" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="border border-slate-200">
              <CardHeader>
                <CardTitle className="text-base">Win Rate by Platform</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analytics.platformData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="platform" stroke="#64748b" fontSize={11} />
                    <YAxis stroke="#64748b" fontSize={12} />
                    <Tooltip 
                      contentStyle={{ 
                        background: 'white', 
                        border: '1px solid #e2e8f0', 
                        borderRadius: '8px',
                        fontSize: '12px'
                      }}
                      formatter={(value) => [`${value}%`, 'Win Rate']}
                    />
                    <Bar dataKey="winRate" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="border border-slate-200">
              <CardHeader>
                <CardTitle className="text-base">P&L by Platform</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={analytics.platformData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => `${entry.platform}: $${entry.pnl.toFixed(0)}`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="pnl"
                    >
                      {analytics.platformData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        background: 'white', 
                        border: '1px solid #e2e8f0', 
                        borderRadius: '8px',
                        fontSize: '12px'
                      }}
                      formatter={(value) => [`$${value.toFixed(2)}`, 'P&L']}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Platform Stats Table */}
          <Card className="border border-slate-200">
            <CardHeader>
              <CardTitle className="text-base">Platform Performance Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left p-3 text-slate-600 font-medium">Platform</th>
                      <th className="text-right p-3 text-slate-600 font-medium">Trades</th>
                      <th className="text-right p-3 text-slate-600 font-medium">Wins</th>
                      <th className="text-right p-3 text-slate-600 font-medium">Win Rate</th>
                      <th className="text-right p-3 text-slate-600 font-medium">Total P&L</th>
                      <th className="text-right p-3 text-slate-600 font-medium">Avg P&L</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.platformData.map(platform => (
                      <tr key={platform.platform} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="p-3 font-medium text-slate-900">{platform.platform}</td>
                        <td className="p-3 text-right text-slate-700">{platform.total}</td>
                        <td className="p-3 text-right text-green-600 font-medium">{platform.wins}</td>
                        <td className="p-3 text-right">
                          <Badge className={`${
                            parseFloat(platform.winRate) >= 60 ? 'bg-green-100 text-green-700' :
                            parseFloat(platform.winRate) >= 50 ? 'bg-blue-100 text-blue-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {platform.winRate}%
                          </Badge>
                        </td>
                        <td className={`p-3 text-right font-semibold ${
                          platform.pnl >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          ${platform.pnl.toFixed(2)}
                        </td>
                        <td className="p-3 text-right text-slate-700">
                          ${(platform.pnl / platform.total).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Auto vs Manual */}
        <TabsContent value="autoVsManual" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="border border-purple-200 bg-purple-50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base text-purple-900">🤖 Automated Trades</CardTitle>
                  <Zap className="w-5 h-5 text-purple-600" />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="text-xs text-purple-700 mb-1">Total Trades</div>
                  <div className="text-3xl font-bold text-purple-900">{analytics.autoStats.trades}</div>
                </div>
                <div>
                  <div className="text-xs text-purple-700 mb-1">Win Rate</div>
                  <div className="text-3xl font-bold text-purple-900">{analytics.autoStats.winRate.toFixed(1)}%</div>
                </div>
                <div>
                  <div className="text-xs text-purple-700 mb-1">Total P&L</div>
                  <div className={`text-3xl font-bold ${
                    analytics.autoStats.totalPnL >= 0 ? 'text-green-700' : 'text-red-700'
                  }`}>
                    ${analytics.autoStats.totalPnL.toFixed(2)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-purple-700 mb-1">Avg P&L per Trade</div>
                  <div className={`text-2xl font-bold ${
                    analytics.autoStats.avgPnL >= 0 ? 'text-green-700' : 'text-red-700'
                  }`}>
                    ${analytics.autoStats.avgPnL.toFixed(2)}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-blue-200 bg-blue-50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base text-blue-900">👤 Manual Trades</CardTitle>
                  <Activity className="w-5 h-5 text-blue-600" />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="text-xs text-blue-700 mb-1">Total Trades</div>
                  <div className="text-3xl font-bold text-blue-900">{analytics.manualStats.trades}</div>
                </div>
                <div>
                  <div className="text-xs text-blue-700 mb-1">Win Rate</div>
                  <div className="text-3xl font-bold text-blue-900">{analytics.manualStats.winRate.toFixed(1)}%</div>
                </div>
                <div>
                  <div className="text-xs text-blue-700 mb-1">Total P&L</div>
                  <div className={`text-3xl font-bold ${
                    analytics.manualStats.totalPnL >= 0 ? 'text-green-700' : 'text-red-700'
                  }`}>
                    ${analytics.manualStats.totalPnL.toFixed(2)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-blue-700 mb-1">Avg P&L per Trade</div>
                  <div className={`text-2xl font-bold ${
                    analytics.manualStats.avgPnL >= 0 ? 'text-green-700' : 'text-red-700'
                  }`}>
                    ${analytics.manualStats.avgPnL.toFixed(2)}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="border border-slate-200">
            <CardHeader>
              <CardTitle className="text-base">Performance Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics.autoVsManualData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                  <YAxis yAxisId="left" stroke="#64748b" fontSize={12} />
                  <YAxis yAxisId="right" orientation="right" stroke="#64748b" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ 
                      background: 'white', 
                      border: '1px solid #e2e8f0', 
                      borderRadius: '8px',
                      fontSize: '12px'
                    }}
                  />
                  <Legend />
                  <Bar yAxisId="left" dataKey="Win Rate" fill="#10b981" radius={[8, 8, 0, 0]} />
                  <Bar yAxisId="right" dataKey="Avg P&L" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Duration Analysis */}
        <TabsContent value="duration" className="space-y-4">
          <Card className="border border-slate-200">
            <CardHeader>
              <CardTitle className="text-base">Trade Duration Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics.durationData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="bucket" stroke="#64748b" fontSize={12} />
                  <YAxis stroke="#64748b" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ 
                      background: 'white', 
                      border: '1px solid #e2e8f0', 
                      borderRadius: '8px',
                      fontSize: '12px'
                    }}
                    formatter={(value) => [`${value} trades`, '']}
                  />
                  <Bar dataKey="count" fill="#f59e0b" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>

              <div className="mt-6 grid grid-cols-3 gap-4">
                <div className="p-4 bg-orange-50 rounded-lg border border-orange-200 text-center">
                  <Clock className="w-6 h-6 mx-auto text-orange-600 mb-2" />
                  <div className="text-2xl font-bold text-orange-900">
                    {analytics.avgDuration < 1 
                      ? `${(analytics.avgDuration * 60).toFixed(0)}m`
                      : analytics.avgDuration < 24 
                        ? `${analytics.avgDuration.toFixed(1)}h`
                        : `${(analytics.avgDuration / 24).toFixed(1)}d`
                    }
                  </div>
                  <div className="text-xs text-orange-700 mt-1">Average Duration</div>
                </div>
                <div className="p-4 bg-green-50 rounded-lg border border-green-200 text-center">
                  <TrendingUp className="w-6 h-6 mx-auto text-green-600 mb-2" />
                  <div className="text-2xl font-bold text-green-900">
                    {analytics.durationData.reduce((max, d) => d.count > max.count ? d : max, {count: 0, bucket: ''}).bucket}
                  </div>
                  <div className="text-xs text-green-700 mt-1">Most Common</div>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 text-center">
                  <BarChart3 className="w-6 h-6 mx-auto text-blue-600 mb-2" />
                  <div className="text-2xl font-bold text-blue-900">
                    {analytics.durationData.reduce((sum, d) => sum + d.count, 0)}
                  </div>
                  <div className="text-xs text-blue-700 mt-1">Total Analyzed</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Monthly Performance */}
        <TabsContent value="monthly" className="space-y-4">
          <Card className="border border-slate-200">
            <CardHeader>
              <CardTitle className="text-base">Monthly P&L Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analytics.monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="month" stroke="#64748b" fontSize={11} />
                  <YAxis stroke="#64748b" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ 
                      background: 'white', 
                      border: '1px solid #e2e8f0', 
                      borderRadius: '8px',
                      fontSize: '12px'
                    }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="pnl" 
                    stroke="#3b82f6" 
                    strokeWidth={3}
                    dot={{ r: 4 }}
                    name="Monthly P&L"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="border border-slate-200">
            <CardHeader>
              <CardTitle className="text-base">Monthly Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left p-3 text-slate-600 font-medium">Month</th>
                      <th className="text-right p-3 text-slate-600 font-medium">Trades</th>
                      <th className="text-right p-3 text-slate-600 font-medium">Win Rate</th>
                      <th className="text-right p-3 text-slate-600 font-medium">P&L</th>
                      <th className="text-right p-3 text-slate-600 font-medium">Avg/Trade</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.monthlyData.map(month => (
                      <tr key={month.month} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="p-3 font-medium text-slate-900">{month.month}</td>
                        <td className="p-3 text-right text-slate-700">{month.trades}</td>
                        <td className="p-3 text-right">
                          <Badge className={`${
                            parseFloat(month.winRate) >= 60 ? 'bg-green-100 text-green-700' :
                            parseFloat(month.winRate) >= 50 ? 'bg-blue-100 text-blue-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {month.winRate}%
                          </Badge>
                        </td>
                        <td className={`p-3 text-right font-semibold ${
                          month.pnl >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {month.pnl >= 0 ? '+' : ''}${month.pnl.toFixed(2)}
                        </td>
                        <td className="p-3 text-right text-slate-700">
                          ${(month.pnl / month.trades).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}