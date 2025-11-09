import React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle2 } from "lucide-react";

export default function ConfirmCloseModal({ trade, open, onClose, onConfirm }) {
  if (!trade) return null;

  const pnl = trade.unrealized_pnl || trade.pnl || 0;
  const isProfit = pnl >= 0;
  const pnlPercent = trade.position_size > 0 ? (pnl / trade.position_size) * 100 : 0;

  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            {isProfit ? (
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-orange-600" />
            )}
            Confirm Position Close
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-4 pt-4">
            <div>
              <div className="text-sm font-medium text-slate-900 mb-2">
                {trade.question}
              </div>
              <div className="flex items-center gap-2 mb-3">
                <Badge variant="outline" className="text-xs">
                  {trade.platform}
                </Badge>
                <Badge className={`text-xs ${
                  trade.direction === 'Long' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {trade.direction}
                </Badge>
              </div>
            </div>

            <div className="bg-slate-50 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-600">Position Size</span>
                <span className="text-sm font-semibold">${trade.position_size?.toFixed(2) || '0.00'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-600">Entry Price</span>
                <span className="text-sm font-semibold">{((trade.entry_price || 0) * 100).toFixed(1)}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-600">Current Price</span>
                <span className="text-sm font-semibold">{((trade.current_price || 0) * 100).toFixed(1)}%</span>
              </div>
              <div className="border-t border-slate-200 pt-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-700">Unrealized P&L</span>
                  <div className="text-right">
                    <div className={`text-lg font-bold ${isProfit ? 'text-green-600' : 'text-red-600'}`}>
                      {isProfit ? '+' : ''}${pnl.toFixed(2)}
                    </div>
                    {pnlPercent !== 0 && (
                      <div className={`text-xs ${isProfit ? 'text-green-600' : 'text-red-600'}`}>
                        {isProfit ? '+' : ''}{pnlPercent.toFixed(1)}%
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className={`p-3 rounded-lg border-2 ${
              isProfit 
                ? 'bg-green-50 border-green-300' 
                : 'bg-orange-50 border-orange-300'
            }`}>
              <div className="flex items-start gap-2">
                {isProfit ? (
                  <>
                    <TrendingUp className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <div className="text-xs text-green-800">
                      <strong>Closing profitable position:</strong> You will realize a gain of ${pnl.toFixed(2)}. 
                      This action cannot be undone.
                    </div>
                  </>
                ) : (
                  <>
                    <TrendingDown className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
                    <div className="text-xs text-orange-800">
                      <strong>Closing losing position:</strong> You will realize a loss of ${Math.abs(pnl).toFixed(2)}. 
                      Consider if you want to wait for recovery.
                    </div>
                  </>
                )}
              </div>
            </div>

            {trade.auto_trade && (
              <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                <div className="text-xs text-purple-800">
                  ℹ️ This position was opened by the auto-trader. Closing manually will not affect future automated trades.
                </div>
              </div>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className={isProfit ? 'bg-green-600 hover:bg-green-700' : 'bg-orange-600 hover:bg-orange-700'}
          >
            {isProfit ? 'Confirm Close & Take Profit' : 'Confirm Close Position'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}