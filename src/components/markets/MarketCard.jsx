import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, TrendingUp } from "lucide-react";
import { format } from "date-fns";

export default function MarketCard({ market }) {
  const platformColors = {
    Polymarket: "bg-blue-50 text-blue-700 border-blue-200",
    Manifold: "bg-purple-50 text-purple-700 border-purple-200",
    Kalshi: "bg-green-50 text-green-700 border-green-200",
    PredictIt: "bg-orange-50 text-orange-700 border-orange-200",
  };

  return (
    <Card className="border border-slate-200 shadow-sm hover:shadow-md transition-shadow duration-200 bg-white">
      <CardContent className="p-5">
        <div className="flex flex-col gap-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className={platformColors[market.platform] || "bg-slate-50"}>
                  {market.platform}
                </Badge>
                {market.category && (
                  <Badge variant="outline" className="text-slate-600 border-slate-300">
                    {market.category}
                  </Badge>
                )}
              </div>
              <h3 className="text-base font-medium text-slate-900 leading-snug mb-3">
                {market.question}
              </h3>
            </div>
          </div>

          {/* Price and Stats */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div>
                <div className="text-xs text-slate-500 mb-1">Probability</div>
                <div className="text-2xl font-semibold text-slate-900">
                  {(market.current_price * 100).toFixed(0)}%
                </div>
              </div>
              
              {market.volume > 0 && (
                <div className="border-l border-slate-200 pl-4">
                  <div className="text-xs text-slate-500 mb-1">Volume</div>
                  <div className="text-sm font-medium text-slate-700">
                    ${(market.volume / 1000).toFixed(0)}K
                  </div>
                </div>
              )}
            </div>

            {market.url && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(market.url, '_blank')}
                className="border-slate-300 hover:bg-slate-50"
              >
                <ExternalLink className="w-3 h-3 mr-1" />
                View
              </Button>
            )}
          </div>

          {/* Footer Info */}
          {market.close_date && (
            <div className="text-xs text-slate-500 pt-2 border-t border-slate-100">
              Closes {format(new Date(market.close_date), 'MMM d, yyyy')}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}