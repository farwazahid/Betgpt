import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  TrendingUp, TrendingDown, DollarSign, Target, 
  AlertCircle, CheckCircle2, Loader2, Zap, Activity
} from "lucide-react";
import PlatformAdapter from "./PlatformAdapter";

export default function TradeExecutor({ opportunity, onClose }) {
  const queryClient = useQueryClient();
  const [executing, setExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState(null);
  const [error, setError] = useState(null);

  const { data: configs = [] } = useQuery({
    queryKey: ['configs'],
    queryFn: () => base44.entities.SystemConfig.list(),
    initialData: [],
  });

  const config = configs.find(c => c.is_active) || configs[0];

  const [tradeParams, setTradeParams] = useState({
    direction: opportunity.edge > 0 ? 'Long' : 'Short',
    positionSize: config?.max_position_size || 500,
    takeProfit: opportunity.edge > 0 
      ? opportunity.market_price * 1.2 
      : opportunity.market_price * 0.8,
    stopLoss: opportunity.edge > 0
      ? opportunity.market_price * 0.9
      : opportunity.market_price * 1.1,
  });

  const handleExecute = async () => {
    setExecuting(true);
    setError(null);
    setExecutionResult(null);

    try {
      console.log('[TradeExecutor] Executing REAL trade via backend...');

      // Call the REAL trade execution backend function
      const response = await base44.functions.invoke('executeRealTrade', {
        opportunity_id: opportunity.id,
        auto_trade: false
      });

      console.log('[TradeExecutor] Response:', response.data);

      if (!response.data || !response.data.success) {
        throw new Error(response.data?.error || 'Trade execution failed');
      }

      setExecutionResult(response.data);
      queryClient.invalidateQueries({ queryKey: ['trades'] });
      queryClient.invalidateQueries({ queryKey: ['opportunities'] });

    } catch (err) {
      console.error('[TradeExecutor] Error:', err);
      setError(err.message || 'Failed to execute trade');
    } finally {
      setExecuting(false);
    }
  };

  const kellyFraction = opportunity.kelly_fraction || 0.05;
  const recommendedSize = Math.min(
    kellyFraction * (config?.kelly_multiplier || 0.25) * 10000,
    config?.max_position_size || 500
  );

  const quantity = Math.floor(tradeParams.positionSize / opportunity.market_price);
  const maxProfit = tradeParams.direction === 'Long'
    ? (tradeParams.takeProfit - opportunity.market_price) * quantity
    : (opportunity.market_price - tradeParams.takeProfit) * quantity;
  const maxLoss = tradeParams.direction === 'Long'
    ? (opportunity.market_price - tradeParams.stopLoss) * quantity
    : (tradeParams.stopLoss - opportunity.market_price) * quantity;

  const riskRewardRatio = maxLoss > 0 ? (maxProfit / maxLoss).toFixed(2) : '∞';

  const isPlatformSupported = PlatformAdapter.isPlatformSupported(opportunity.platform);

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-purple-600" />
            Execute REAL Trade
            <Badge className="bg-green-500 text-white ml-2">
              LIVE TRADING
            </Badge>
          </DialogTitle>
        </DialogHeader>

        {!executionResult ? (
          <div className="space-y-4">
            {/* Platform Status */}
            <Alert className={isPlatformSupported ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
              <Activity className={`h-4 w-4 ${isPlatformSupported ? 'text-green-600' : 'text-red-600'}`} />
              <AlertDescription className={isPlatformSupported ? 'text-green-800' : 'text-red-800'}>
                {isPlatformSupported ? (
                  <>
                    <strong>✅ {opportunity.platform} API Connected</strong>
                    <div className="text-xs mt-1">This will execute a REAL trade using your configured API keys</div>
                  </>
                ) : (
                  <>
                    <strong>❌ Platform Not Supported</strong>
                    <div className="text-xs mt-1">{opportunity.platform} real trading not yet implemented</div>
                  </>
                )}
              </AlertDescription>
            </Alert>

            {/* Opportunity Details */}
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
              <h3 className="font-semibold text-slate-900 mb-3 text-sm">Opportunity Details</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600">Platform:</span>
                  <Badge variant="outline">{opportunity.platform}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Market Price:</span>
                  <span className="font-semibold">{(opportunity.market_price * 100).toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">AI Estimate:</span>
                  <span className="font-semibold text-purple-600">
                    {(opportunity.estimated_true_probability * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Edge:</span>
                  <Badge className={opportunity.edge > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
                    {(Math.abs(opportunity.edge) * 100).toFixed(1)}%
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Confidence:</span>
                  <span className="font-semibold">{(opportunity.confidence_score * 100).toFixed(0)}%</span>
                </div>
              </div>
            </div>

            {/* Trade Configuration */}
            <div className="space-y-3">
              <h3 className="font-semibold text-slate-900 text-sm">Trade Configuration</h3>
              
              <div>
                <Label className="text-xs">Direction</Label>
                <div className="flex gap-2 mt-1">
                  <Button
                    variant={tradeParams.direction === 'Long' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setTradeParams({...tradeParams, direction: 'Long'})}
                    className={tradeParams.direction === 'Long' ? 'bg-green-600' : ''}
                  >
                    <TrendingUp className="w-4 h-4 mr-1" />
                    Long (YES)
                  </Button>
                  <Button
                    variant={tradeParams.direction === 'Short' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setTradeParams({...tradeParams, direction: 'Short'})}
                    className={tradeParams.direction === 'Short' ? 'bg-red-600' : ''}
                  >
                    <TrendingDown className="w-4 h-4 mr-1" />
                    Short (NO)
                  </Button>
                </div>
              </div>

              <div>
                <Label className="text-xs">
                  Position Size (${tradeParams.positionSize})
                </Label>
                <Input
                  type="number"
                  value={tradeParams.positionSize}
                  onChange={(e) => setTradeParams({...tradeParams, positionSize: parseFloat(e.target.value)})}
                  className="mt-1"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Recommended (Kelly): ${recommendedSize.toFixed(2)}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Take Profit ({(tradeParams.takeProfit * 100).toFixed(1)}%)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={tradeParams.takeProfit}
                    onChange={(e) => setTradeParams({...tradeParams, takeProfit: parseFloat(e.target.value)})}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs">Stop Loss ({(tradeParams.stopLoss * 100).toFixed(1)}%)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={tradeParams.stopLoss}
                    onChange={(e) => setTradeParams({...tradeParams, stopLoss: parseFloat(e.target.value)})}
                    className="mt-1"
                  />
                </div>
              </div>
            </div>

            {/* Risk/Reward Analysis */}
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <h3 className="font-semibold text-blue-900 mb-3 text-sm">Risk/Reward Analysis</h3>
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div>
                  <div className="text-xs text-blue-600 mb-1">Quantity</div>
                  <div className="font-semibold text-blue-900">{quantity} shares</div>
                </div>
                <div>
                  <div className="text-xs text-blue-600 mb-1">Max Profit</div>
                  <div className="font-semibold text-green-600">+${maxProfit.toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-xs text-blue-600 mb-1">Max Loss</div>
                  <div className="font-semibold text-red-600">-${maxLoss.toFixed(2)}</div>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-blue-200">
                <div className="flex justify-between text-sm">
                  <span className="text-blue-600">Risk/Reward Ratio:</span>
                  <span className="font-semibold text-blue-900">{riskRewardRatio}</span>
                </div>
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <Alert variant="destructive" className="border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-red-800">
                  <strong>Execution Failed:</strong> {error}
                </AlertDescription>
              </Alert>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t">
              <Button
                variant="outline"
                onClick={onClose}
                disabled={executing}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleExecute}
                disabled={executing || !isPlatformSupported}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              >
                {executing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Executing REAL Trade...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 mr-2" />
                    Execute REAL Trade
                  </>
                )}
              </Button>
            </div>

            {/* Warning */}
            <Alert className="border-yellow-200 bg-yellow-50">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800 text-xs">
                <strong>⚠️ Real Money Trading:</strong> This will place a REAL order on {opportunity.platform} using your configured API keys. 
                Make sure you understand the risks before proceeding.
              </AlertDescription>
            </Alert>
          </div>
        ) : (
          /* Execution Success */
          <div className="space-y-4">
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                <div className="font-semibold mb-2">✅ REAL Trade Executed Successfully!</div>
                <div className="text-sm space-y-1">
                  <div>Platform: <strong>{executionResult.platform}</strong></div>
                  <div>Order ID: <strong>{executionResult.order_id}</strong></div>
                  <div>Status: <strong>{executionResult.execution_status}</strong></div>
                  <div>Executed Price: <strong>{(executionResult.executed_price * 100).toFixed(1)}%</strong></div>
                  <div>Quantity: <strong>{executionResult.executed_quantity}</strong></div>
                  <div>Position Size: <strong>${executionResult.position_size?.toFixed(2)}</strong></div>
                </div>
              </AlertDescription>
            </Alert>

            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
              <h3 className="font-semibold text-slate-900 mb-2 text-sm">What Happens Next?</h3>
              <ul className="text-sm text-slate-700 space-y-1">
                <li>✅ Order has been placed on {executionResult.platform}</li>
                <li>📊 Position is now being monitored with REAL prices</li>
                <li>🎯 Take profit: {(tradeParams.takeProfit * 100).toFixed(1)}%</li>
                <li>🛑 Stop loss: {(tradeParams.stopLoss * 100).toFixed(1)}%</li>
                <li>📧 You'll receive email notifications on position changes</li>
                <li>💼 View your position in the Portfolio page</li>
              </ul>
            </div>

            <Button
              onClick={onClose}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              Close
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}