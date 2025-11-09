import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Brain, Loader2, TrendingUp } from "lucide-react";

export default function OpportunityAnalyzer({ market, onClose, onConfirm, analyzing }) {
  if (!market) return null;

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Brain className="w-6 h-6 text-blue-600" />
            AI Market Analysis
          </DialogTitle>
          <DialogDescription>
            Deep analysis with multi-source data and probability estimation
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
            <div className="flex items-center gap-2 mb-3">
              <Badge>{market.platform}</Badge>
              {market.category && <Badge variant="outline">{market.category}</Badge>}
            </div>
            <h3 className="font-semibold text-lg text-slate-900 mb-3">{market.question}</h3>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-slate-600">Current Market Price</div>
                <div className="text-2xl font-bold text-slate-900 mt-1">
                  {(market.current_price * 100).toFixed(1)}%
                </div>
              </div>
              {market.volume > 0 && (
                <div>
                  <div className="text-slate-600">Trading Volume</div>
                  <div className="text-2xl font-bold text-slate-900 mt-1">
                    ${(market.volume / 1000).toFixed(0)}K
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <h4 className="font-semibold text-slate-900 mb-2">AI Analysis Process</h4>
            <ul className="space-y-2 text-sm text-slate-700">
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                Scraping real-time data from multiple sources
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                Analyzing historical patterns and base rates
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                Estimating true probability using ensemble methods
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                Computing edge and expected value
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                Calculating optimal position sizing (Kelly Criterion)
              </li>
            </ul>
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={onClose} disabled={analyzing}>
              Cancel
            </Button>
            <Button 
              onClick={onConfirm}
              disabled={analyzing}
              className="bg-gradient-to-r from-blue-600 to-indigo-600"
            >
              {analyzing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing Market...
                </>
              ) : (
                <>
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Start Analysis
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}