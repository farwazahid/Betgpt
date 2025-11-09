import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, DollarSign, Target, Activity, X, BarChart3,
  Loader2, ChevronDown, ChevronUp
} from "lucide-react";
import AutoTrader from "../components/trading/AutoTrader";
import AdvancedPortfolioAnalytics from "../components/analytics/AdvancedPortfolioAnalytics";
import AdvancedMetrics from "../components/analytics/AdvancedMetrics";
import ConfirmCloseModal from "../components/modals/ConfirmCloseModal";

export default function Portfolio() {
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterPlatform, setFilterPlatform] = useState("All");
  const [showAnalytics, setShowAnalytics] = useState(true);
  const [showAdvancedMetrics, setShowAdvancedMetrics] = useState(false);
  const [tradeToClose, setTradeToClose] = useState(null);
  
  const queryClient = useQueryClient();

  const { data: trades = [], isLoading } = useQuery({
    queryKey: ['trades'],
    queryFn: async () => {
      const result = await base44.entities.Trade.list('-created_date', 200);
      return Array.isArray(result) ? result : [];
    },
    initialData: [],
    refetchInterval: 30000,
  });

  const closePositionMutation = useMutation({
    mutationFn: async ({ tradeId, currentPrice }) => {
      const trade = trades.find(t => t && t.id === tradeId);
      if (!trade) throw new Error('Trade not found');

      const exitPrice = currentPrice || trade.entry_price || 0.5;
      const entryPrice = trade.entry_price || 0.5;
      const quantity = trade.quantity || 0;
      const positionSize = trade.position_size || 0;
      
      const priceChange = trade.direction === 'Long' 
        ? (exitPrice - entryPrice) 
        : (entryPrice - exitPrice);
      
      const pnl = priceChange * quantity;
      const pnlPercent = positionSize > 0 ? (pnl / positionSize) * 100 : 0;

      await base44.entities.Trade.update(tradeId, {
        status: 'Closed',
        exit_price: exitPrice,
        pnl: pnl,
        pnl_percent: pnlPercent,
        close_date: new Date().toISOString()
      });

      return { pnl, pnlPercent };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trades'] });
      setTradeToClose(null);
    }
  });

  const handleClosePositionClick = (trade) => {
    if (!trade) return;
    setTradeToClose(trade);
  };

  const handleConfirmClose = async () => {
    if (!tradeToClose) return;
    const currentPrice = tradeToClose.current_price || tradeToClose.entry_price || 0.5;
    await closePositionMutation.mutateAsync({ 
      tradeId: tradeToClose.id, 
      currentPrice 
    });
  };

  // Calculate metrics with null safety
  const safeTrades = Array.isArray(trades) ? trades.filter(t => t != null) : [];
  const openTrades = safeTrades.filter(t => t.status === 'Open');
  const closedTrades = safeTrades.filter(t => t.status === 'Closed');
  
  const totalPnL = closedTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
  const totalExposure = openTrades.reduce((sum, t) => sum + (t.position_size || 0), 0);
  
  const winningTrades = closedTrades.filter(t => (t.pnl || 0) > 0);
  const losingTrades = closedTrades.filter(t => (t.pnl || 0) < 0);
  const winRate = closedTrades.length > 0 
    ? (winningTrades.length / closedTrades.length * 100).toFixed(0)
    : 0;

  const avgWin = winningTrades.length > 0
    ? winningTrades.reduce((sum, t) => sum + (t.pnl || 0), 0) / winningTrades.length
    : 0;

  const avgLoss = losingTrades.length > 0
    ? losingTrades.reduce((sum, t) => sum + Math.abs(t.pnl || 0), 0) / losingTrades.length
    : 0;

  // Filter trades with null safety
  const filteredTrades = safeTrades.filter(t => {
    if (!t) return false;
    const statusMatch = filterStatus === "All" || t.status === filterStatus;
    const platformMatch = filterPlatform === "All" || t.platform === filterPlatform;
    return statusMatch && platformMatch;
  });

  const platforms = ["All", ...new Set(safeTrades.map(t => t && t.platform).filter(Boolean))];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">Portfolio</h1>
              <p className="text-sm text-slate-500 mt-1">
                Track your trading performance and manage positions
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                onClick={() => setShowAdvancedMetrics(!showAdvancedMetrics)}
                variant={showAdvancedMetrics ? "default" : "outline"}
                className={showAdvancedMetrics ? "bg-blue-600" : "border-slate-300"}
              >
                {showAdvancedMetrics ? (
                  <>
                    <ChevronUp className="w-4 h-4 mr-2" />
                    Hide Advanced Metrics
                  </>
                ) : (
                  <>
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Show Advanced Metrics
                  </>
                )}
              </Button>
              <Button
                onClick={() => setShowAnalytics(!showAnalytics)}
                variant="outline"
                className="border-slate-300"
              >
                {showAnalytics ? (
                  <>
                    <ChevronUp className="w-4 h-4 mr-2" />
                    Hide Analytics
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4 mr-2" />
                    Show Analytics
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border border-slate-200 bg-white">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs text-slate-500 font-medium">Total P&L</div>
                <DollarSign className="w-4 h-4 text-slate-400" />
              </div>
              <div className={`text-3xl font-semibold tracking-tight tabular-nums ${
                totalPnL >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {totalPnL >= 0 ? '+' : ''}${(totalPnL || 0).toFixed(2)}
              </div>
              <div className="text-xs text-slate-600 mt-1 font-medium">
                {closedTrades.length} trades closed
              </div>
            </CardContent>
          </Card>

          <Card className="border border-slate-200 bg-white">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs text-slate-500 font-medium">Win Rate</div>
                <Target className="w-4 h-4 text-slate-400" />
              </div>
              <div className="text-3xl font-semibold text-slate-900 tracking-tight tabular-nums">
                {winRate}%
              </div>
              <div className="text-xs text-slate-600 mt-1 font-medium">
                {winningTrades.length}W / {losingTrades.length}L
              </div>
            </CardContent>
          </Card>

          <Card className="border border-slate-200 bg-white">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs text-slate-500 font-medium">Open Positions</div>
                <Activity className="w-4 h-4 text-slate-400" />
              </div>
              <div className="text-3xl font-semibold text-slate-900 tracking-tight tabular-nums">
                {openTrades.length}
              </div>
              <div className="text-xs text-slate-600 mt-1 font-medium">
                ${(totalExposure || 0).toFixed(0)} exposure
              </div>
            </CardContent>
          </Card>

          <Card className="border border-slate-200 bg-white">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs text-slate-500 font-medium">Avg Win/Loss</div>
                <TrendingUp className="w-4 h-4 text-slate-400" />
              </div>
              <div className="text-3xl font-semibold text-slate-900 tracking-tight tabular-nums">
                {avgLoss > 0 ? ((avgWin || 0) / (avgLoss || 1)).toFixed(2) : '∞'}
              </div>
              <div className="text-xs text-slate-600 mt-1 font-medium">
                Risk/Reward Ratio
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Auto-Trader */}
        <AutoTrader />

        {/* Advanced Metrics */}
        {showAdvancedMetrics && (
          <AdvancedMetrics trades={safeTrades} />
        )}

        {/* Advanced Analytics */}
        {showAnalytics && (
          <div>
            <div className="flex items-center gap-3 mb-4">
              <BarChart3 className="w-5 h-5 text-slate-600" />
              <h2 className="text-xl font-semibold text-slate-900">Portfolio Analytics</h2>
            </div>
            <AdvancedPortfolioAnalytics trades={safeTrades} />
          </div>
        )}

        {/* Filters */}
        <Card className="border border-slate-200 bg-white">
          <CardContent className="p-4">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-600 font-medium">Status:</span>
                <div className="flex gap-2">
                  {["All", "Open", "Closed"].map(status => (
                    <Button
                      key={status}
                      variant={filterStatus === status ? "default" : "outline"}
                      size="sm"
                      onClick={() => setFilterStatus(status)}
                      className={filterStatus === status ? "bg-blue-600" : ""}
                    >
                      {status}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-600 font-medium">Platform:</span>
                <div className="flex gap-2 flex-wrap">
                  {platforms.map(platform => (
                    <Button
                      key={platform}
                      variant={filterPlatform === platform ? "default" : "outline"}
                      size="sm"
                      onClick={() => setFilterPlatform(platform)}
                      className={filterPlatform === platform ? "bg-blue-600" : ""}
                    >
                      {platform}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Trades Table */}
        <Card className="border border-slate-200 bg-white">
          <CardHeader className="border-b border-slate-200">
            <CardTitle className="text-base">
              Trade History ({filteredTrades.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="text-center py-12">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600 mb-3" />
                <p className="text-sm text-slate-600">Loading trades...</p>
              </div>
            ) : filteredTrades.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="text-left p-4 text-slate-600 font-medium">Market</th>
                      <th className="text-left p-4 text-slate-600 font-medium">Platform</th>
                      <th className="text-center p-4 text-slate-600 font-medium">Direction</th>
                      <th className="text-right p-4 text-slate-600 font-medium">Size</th>
                      <th className="text-right p-4 text-slate-600 font-medium">Entry</th>
                      <th className="text-right p-4 text-slate-600 font-medium">Current/Exit</th>
                      <th className="text-right p-4 text-slate-600 font-medium">P&L</th>
                      <th className="text-center p-4 text-slate-600 font-medium">Status</th>
                      <th className="text-center p-4 text-slate-600 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTrades.map(trade => {
                      if (!trade) return null;
                      
                      const isOpen = trade.status === 'Open';
                      const currentPnL = isOpen && trade.unrealized_pnl !== undefined 
                        ? trade.unrealized_pnl 
                        : trade.pnl || 0;
                      
                      const entryPrice = trade.entry_price || 0.5;
                      const currentPrice = trade.current_price || entryPrice;
                      const exitPrice = trade.exit_price || entryPrice;
                      const positionSize = trade.position_size || 0;
                      const pnlPercent = trade.pnl_percent || 0;

                      // Check if trailing stop is active
                      const hasTrailingStop = trade.execution_details?.trailing_stop_enabled;

                      return (
                        <tr key={trade.id} className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="p-4">
                            <div className="max-w-xs">
                              <div className="font-medium text-slate-900 text-sm line-clamp-1">
                                {trade.question || 'Unknown Market'}
                              </div>
                              <div className="text-xs text-slate-500 mt-1">
                                {trade.created_date ? new Date(trade.created_date).toLocaleDateString() : 'N/A'}
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <Badge variant="outline" className="border-slate-300 text-xs">
                              {trade.platform || 'Unknown'}
                            </Badge>
                          </td>
                          <td className="p-4 text-center">
                            <Badge className={`${
                              trade.direction === 'Long' 
                                ? 'bg-green-100 text-green-700 border-green-300'
                                : 'bg-red-100 text-red-700 border-red-300'
                            }`}>
                              {trade.direction || 'N/A'}
                            </Badge>
                          </td>
                          <td className="p-4 text-right font-medium text-slate-900">
                            ${(positionSize || 0).toFixed(2)}
                          </td>
                          <td className="p-4 text-right text-slate-700">
                            {((entryPrice || 0) * 100).toFixed(1)}%
                          </td>
                          <td className="p-4 text-right text-slate-700">
                            {isOpen 
                              ? `${((currentPrice || 0) * 100).toFixed(1)}%`
                              : `${((exitPrice || 0) * 100).toFixed(1)}%`
                            }
                          </td>
                          <td className="p-4 text-right">
                            <div className={`font-semibold ${
                              (currentPnL || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {(currentPnL || 0) >= 0 ? '+' : ''}${(currentPnL || 0).toFixed(2)}
                            </div>
                            {pnlPercent !== 0 && (
                              <div className={`text-xs ${
                                pnlPercent >= 0 ? 'text-green-600' : 'text-red-600'
                              }`}>
                                {pnlPercent >= 0 ? '+' : ''}{(pnlPercent || 0).toFixed(1)}%
                              </div>
                            )}
                          </td>
                          <td className="p-4 text-center">
                            <div className="flex flex-col items-center gap-1">
                              <Badge className={`${
                                trade.status === 'Open' 
                                  ? 'bg-blue-100 text-blue-700 border-blue-300'
                                  : 'bg-slate-100 text-slate-700 border-slate-300'
                              }`}>
                                {trade.status || 'Unknown'}
                              </Badge>
                              {trade.auto_trade && (
                                <Badge className="bg-purple-100 text-purple-700 border-purple-300 text-xs">
                                  Auto
                                </Badge>
                              )}
                              {hasTrailingStop && isOpen && (
                                <Badge className="bg-orange-100 text-orange-700 border-orange-300 text-xs">
                                  Trail Stop
                                </Badge>
                              )}
                            </div>
                          </td>
                          <td className="p-4 text-center">
                            {isOpen && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleClosePositionClick(trade)}
                                disabled={closePositionMutation.isPending}
                                className="border-red-300 text-red-600 hover:bg-red-50"
                              >
                                <X className="w-3 h-3 mr-1" />
                                Close
                              </Button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <Activity className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                <h3 className="text-sm font-semibold text-slate-900 mb-2">No Trades Found</h3>
                <p className="text-sm text-slate-600">
                  {filterStatus !== "All" || filterPlatform !== "All" 
                    ? "Try adjusting your filters"
                    : "Start trading to see your portfolio"
                  }
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Confirmation Modal */}
      <ConfirmCloseModal
        trade={tradeToClose}
        open={!!tradeToClose}
        onClose={() => setTradeToClose(null)}
        onConfirm={handleConfirmClose}
      />
    </div>
  );
}