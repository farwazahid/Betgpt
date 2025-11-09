import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, BarChart3, Activity, AlertTriangle } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

export default function AdvancedMetrics({ trades = [] }) {
  const metrics = useMemo(() => {
    const closedTrades = trades.filter(t => t && t.status === 'Closed' && t.close_date);
    
    if (closedTrades.length === 0) {
      return {
        sharpeRatio: 0,
        sortinoRatio: 0,
        maxDrawdown1M: 0,
        maxDrawdown3M: 0,
        maxDrawdownYTD: 0,
        returns1M: 0,
        returns3M: 0,
        returnsYTD: 0,
        winRate: 0,
        profitFactor: 0,
        avgWin: 0,
        avgLoss: 0,
        timeSeriesData: [],
        drawdownData: []
      };
    }

    // Sort by close date
    const sortedTrades = [...closedTrades].sort((a, b) => 
      new Date(a.close_date) - new Date(b.close_date)
    );

    // Calculate returns over time
    let cumulative = 0;
    const timeSeriesData = [];
    const dailyReturns = [];
    let peak = 0;
    const drawdowns = [];

    sortedTrades.forEach(trade => {
      const returnPct = (trade.pnl || 0) / (trade.position_size || 1);
      dailyReturns.push(returnPct);
      cumulative += (trade.pnl || 0);
      
      // Track peak for drawdown
      if (cumulative > peak) peak = cumulative;
      const currentDrawdown = peak > 0 ? (peak - cumulative) / peak : 0;
      
      timeSeriesData.push({
        date: new Date(trade.close_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        cumulative,
        drawdown: currentDrawdown * 100
      });
      
      drawdowns.push(currentDrawdown);
    });

    // Calculate Sharpe Ratio (assuming risk-free rate = 0 for simplicity)
    const avgReturn = dailyReturns.reduce((sum, r) => sum + r, 0) / dailyReturns.length;
    const variance = dailyReturns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / dailyReturns.length;
    const stdDev = Math.sqrt(variance);
    const sharpeRatio = stdDev > 0 ? (avgReturn / stdDev) * Math.sqrt(252) : 0; // Annualized

    // Calculate Sortino Ratio (only downside deviation)
    const negativeReturns = dailyReturns.filter(r => r < 0);
    const downsideVariance = negativeReturns.length > 0 
      ? negativeReturns.reduce((sum, r) => sum + Math.pow(r, 2), 0) / negativeReturns.length
      : 0;
    const downsideStdDev = Math.sqrt(downsideVariance);
    const sortinoRatio = downsideStdDev > 0 ? (avgReturn / downsideStdDev) * Math.sqrt(252) : 0;

    // Calculate max drawdown for different periods
    const now = Date.now();
    const oneMonthAgo = now - 30 * 24 * 60 * 60 * 1000;
    const threeMonthsAgo = now - 90 * 24 * 60 * 60 * 1000;
    const yearStart = new Date(new Date().getFullYear(), 0, 1).getTime();

    const getMaxDrawdown = (startTime) => {
      const periodTrades = sortedTrades.filter(t => new Date(t.close_date).getTime() >= startTime);
      let periodPeak = 0;
      let maxDD = 0;
      let cumSum = 0;
      
      periodTrades.forEach(t => {
        cumSum += (t.pnl || 0);
        if (cumSum > periodPeak) periodPeak = cumSum;
        const dd = periodPeak > 0 ? (periodPeak - cumSum) / periodPeak : 0;
        if (dd > maxDD) maxDD = dd;
      });
      
      return maxDD;
    };

    const maxDrawdown1M = getMaxDrawdown(oneMonthAgo);
    const maxDrawdown3M = getMaxDrawdown(threeMonthsAgo);
    const maxDrawdownYTD = getMaxDrawdown(yearStart);

    // Calculate returns for periods
    const getPeriodReturns = (startTime) => {
      const periodTrades = sortedTrades.filter(t => new Date(t.close_date).getTime() >= startTime);
      return periodTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
    };

    const returns1M = getPeriodReturns(oneMonthAgo);
    const returns3M = getPeriodReturns(threeMonthsAgo);
    const returnsYTD = getPeriodReturns(yearStart);

    // Win rate and profit factor
    const winners = closedTrades.filter(t => (t.pnl || 0) > 0);
    const losers = closedTrades.filter(t => (t.pnl || 0) < 0);
    const winRate = (winners.length / closedTrades.length) * 100;
    
    const totalWins = winners.reduce((sum, t) => sum + (t.pnl || 0), 0);
    const totalLosses = Math.abs(losers.reduce((sum, t) => sum + (t.pnl || 0), 0));
    const profitFactor = totalLosses > 0 ? totalWins / totalLosses : totalWins > 0 ? 999 : 0;
    
    const avgWin = winners.length > 0 ? totalWins / winners.length : 0;
    const avgLoss = losers.length > 0 ? totalLosses / losers.length : 0;

    return {
      sharpeRatio,
      sortinoRatio,
      maxDrawdown1M,
      maxDrawdown3M,
      maxDrawdownYTD,
      returns1M,
      returns3M,
      returnsYTD,
      winRate,
      profitFactor,
      avgWin,
      avgLoss,
      timeSeriesData: timeSeriesData.slice(-90), // Last 90 trades
      drawdownData: timeSeriesData.slice(-60) // Last 60 for drawdown chart
    };
  }, [trades]);

  const getRatingColor = (value, metric) => {
    if (metric === 'sharpe' || metric === 'sortino') {
      if (value > 2) return 'text-green-600 bg-green-50 border-green-300';
      if (value > 1) return 'text-blue-600 bg-blue-50 border-blue-300';
      if (value > 0) return 'text-yellow-600 bg-yellow-50 border-yellow-300';
      return 'text-red-600 bg-red-50 border-red-300';
    }
    if (metric === 'drawdown') {
      if (value < 0.05) return 'text-green-600 bg-green-50 border-green-300';
      if (value < 0.15) return 'text-yellow-600 bg-yellow-50 border-yellow-300';
      return 'text-red-600 bg-red-50 border-red-300';
    }
    return 'text-slate-600 bg-slate-50 border-slate-300';
  };

  const getRating = (value, metric) => {
    if (metric === 'sharpe' || metric === 'sortino') {
      if (value > 2) return 'Excellent';
      if (value > 1) return 'Good';
      if (value > 0) return 'Fair';
      return 'Poor';
    }
    if (metric === 'drawdown') {
      if (value < 0.05) return 'Low Risk';
      if (value < 0.15) return 'Moderate Risk';
      return 'High Risk';
    }
    return 'N/A';
  };

  return (
    <div className="space-y-6">
      {/* Risk-Adjusted Performance Metrics */}
      <Card className="border border-slate-200 bg-white">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            Risk-Adjusted Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div className={`p-6 rounded-lg border-2 ${getRatingColor(metrics.sharpeRatio, 'sharpe')}`}>
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm font-medium">Sharpe Ratio</div>
                <Badge className={getRatingColor(metrics.sharpeRatio, 'sharpe')}>
                  {getRating(metrics.sharpeRatio, 'sharpe')}
                </Badge>
              </div>
              <div className="text-4xl font-bold mb-2">
                {metrics.sharpeRatio.toFixed(2)}
              </div>
              <div className="text-xs opacity-80">
                Higher is better • {">"} 2 is excellent
              </div>
              <div className="text-xs mt-2 opacity-70">
                Measures return per unit of risk (volatility)
              </div>
            </div>

            <div className={`p-6 rounded-lg border-2 ${getRatingColor(metrics.sortinoRatio, 'sortino')}`}>
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm font-medium">Sortino Ratio</div>
                <Badge className={getRatingColor(metrics.sortinoRatio, 'sortino')}>
                  {getRating(metrics.sortinoRatio, 'sortino')}
                </Badge>
              </div>
              <div className="text-4xl font-bold mb-2">
                {metrics.sortinoRatio.toFixed(2)}
              </div>
              <div className="text-xs opacity-80">
                Higher is better • {">"} 2 is excellent
              </div>
              <div className="text-xs mt-2 opacity-70">
                Like Sharpe but only penalizes downside volatility
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="text-xs font-semibold text-blue-900 mb-2">💡 Understanding Risk-Adjusted Returns</div>
            <div className="text-xs text-blue-800 space-y-1">
              <div>• <strong>Sharpe Ratio:</strong> Compares returns to total volatility. A ratio of 1+ means good risk-adjusted returns.</div>
              <div>• <strong>Sortino Ratio:</strong> Only considers downside risk. Better for assessing strategies with asymmetric returns.</div>
              <div>• <strong>Industry Benchmark:</strong> Hedge funds aim for Sharpe {">"} 1.5, retail traders {">"} 1.0</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Maximum Drawdown Analysis */}
      <Card className="border border-slate-200 bg-white">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-600" />
            Maximum Drawdown Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4 mb-6">
            <div className={`p-4 rounded-lg border-2 ${getRatingColor(metrics.maxDrawdown1M, 'drawdown')}`}>
              <div className="text-xs font-medium mb-2">1 Month</div>
              <div className="text-3xl font-bold mb-1">
                {(metrics.maxDrawdown1M * 100).toFixed(1)}%
              </div>
              <div className="text-sm font-semibold mb-2">
                {metrics.returns1M >= 0 ? '+' : ''}${metrics.returns1M.toFixed(0)} return
              </div>
              <Badge variant="outline" className={getRatingColor(metrics.maxDrawdown1M, 'drawdown')}>
                {getRating(metrics.maxDrawdown1M, 'drawdown')}
              </Badge>
            </div>

            <div className={`p-4 rounded-lg border-2 ${getRatingColor(metrics.maxDrawdown3M, 'drawdown')}`}>
              <div className="text-xs font-medium mb-2">3 Months</div>
              <div className="text-3xl font-bold mb-1">
                {(metrics.maxDrawdown3M * 100).toFixed(1)}%
              </div>
              <div className="text-sm font-semibold mb-2">
                {metrics.returns3M >= 0 ? '+' : ''}${metrics.returns3M.toFixed(0)} return
              </div>
              <Badge variant="outline" className={getRatingColor(metrics.maxDrawdown3M, 'drawdown')}>
                {getRating(metrics.maxDrawdown3M, 'drawdown')}
              </Badge>
            </div>

            <div className={`p-4 rounded-lg border-2 ${getRatingColor(metrics.maxDrawdownYTD, 'drawdown')}`}>
              <div className="text-xs font-medium mb-2">Year to Date</div>
              <div className="text-3xl font-bold mb-1">
                {(metrics.maxDrawdownYTD * 100).toFixed(1)}%
              </div>
              <div className="text-sm font-semibold mb-2">
                {metrics.returnsYTD >= 0 ? '+' : ''}${metrics.returnsYTD.toFixed(0)} return
              </div>
              <Badge variant="outline" className={getRatingColor(metrics.maxDrawdownYTD, 'drawdown')}>
                {getRating(metrics.maxDrawdownYTD, 'drawdown')}
              </Badge>
            </div>
          </div>

          {/* Drawdown Chart */}
          {metrics.drawdownData.length > 0 && (
            <div className="mt-6">
              <div className="text-sm font-semibold text-slate-900 mb-3">Drawdown Over Time</div>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={metrics.drawdownData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 10 }}
                      stroke="#64748b"
                    />
                    <YAxis 
                      tick={{ fontSize: 10 }}
                      stroke="#64748b"
                      tickFormatter={(value) => `${value.toFixed(0)}%`}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        fontSize: '11px'
                      }}
                      formatter={(value) => [`${value.toFixed(2)}%`, 'Drawdown']}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="drawdown" 
                      stroke="#ef4444" 
                      fill="#fecaca"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="text-xs text-slate-500 mt-2">
                Shows % decline from peak equity. Lower is better. Target: {"<"}10% drawdowns.
              </div>
            </div>
          )}

          <div className="mt-6 p-4 bg-orange-50 rounded-lg border border-orange-200">
            <div className="text-xs font-semibold text-orange-900 mb-2">📉 What is Maximum Drawdown?</div>
            <div className="text-xs text-orange-800 space-y-1">
              <div>• The largest peak-to-trough decline in portfolio value</div>
              <div>• Shows worst-case scenario if you bought at the peak</div>
              <div>• Target: Keep drawdowns {"<"}15% for sustainable growth</div>
              <div>• Use trailing stops to limit drawdowns automatically</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Distribution */}
      <Card className="border border-slate-200 bg-white">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="w-5 h-5 text-slate-600" />
            Trade Performance Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-4 gap-4">
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="text-xs text-green-700 mb-1">Win Rate</div>
              <div className="text-2xl font-bold text-green-700">
                {metrics.winRate.toFixed(1)}%
              </div>
            </div>

            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="text-xs text-blue-700 mb-1">Profit Factor</div>
              <div className="text-2xl font-bold text-blue-700">
                {metrics.profitFactor > 99 ? '∞' : metrics.profitFactor.toFixed(2)}
              </div>
              <div className="text-xs text-blue-600 mt-1">
                {metrics.profitFactor > 2 ? 'Excellent' : metrics.profitFactor > 1.5 ? 'Good' : 'Fair'}
              </div>
            </div>

            <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
              <div className="text-xs text-purple-700 mb-1">Avg Win</div>
              <div className="text-2xl font-bold text-purple-700">
                ${metrics.avgWin.toFixed(0)}
              </div>
            </div>

            <div className="p-4 bg-red-50 rounded-lg border border-red-200">
              <div className="text-xs text-red-700 mb-1">Avg Loss</div>
              <div className="text-2xl font-bold text-red-700">
                ${metrics.avgLoss.toFixed(0)}
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
            <div className="text-xs font-semibold text-slate-700 mb-2">📊 Key Insights</div>
            <div className="text-xs text-slate-600 space-y-1">
              <div>• <strong>Profit Factor:</strong> Gross profits ÷ gross losses. Target {">"} 2.0 for strong systems.</div>
              <div>• <strong>Win/Loss Ratio:</strong> ${metrics.avgWin.toFixed(0)} / ${metrics.avgLoss.toFixed(0)} = {metrics.avgLoss > 0 ? (metrics.avgWin / metrics.avgLoss).toFixed(2) : '∞'}x</div>
              <div>• You need a {((1 / (1 + (metrics.avgWin / metrics.avgLoss))) * 100).toFixed(0)}% win rate to break even with this win/loss ratio</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Equity Curve */}
      {metrics.timeSeriesData.length > 0 && (
        <Card className="border border-slate-200 bg-white">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              Cumulative P&L Curve
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={metrics.timeSeriesData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 11 }}
                    stroke="#64748b"
                  />
                  <YAxis 
                    tick={{ fontSize: 11 }}
                    stroke="#64748b"
                    tickFormatter={(value) => `$${value.toFixed(0)}`}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '12px'
                    }}
                    formatter={(value) => [`$${value.toFixed(2)}`, 'Total P&L']}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="cumulative" 
                    stroke="#10b981" 
                    strokeWidth={3}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="text-xs text-slate-500 mt-2">
              Shows cumulative profit/loss over your last {metrics.timeSeriesData.length} closed trades
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}