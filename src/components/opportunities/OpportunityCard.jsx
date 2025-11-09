import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, Brain, AlertTriangle, Zap } from "lucide-react";

export default function OpportunityCard({ opportunity, onTradeClick }) {
  const [expanded, setExpanded] = useState(false);

  const actionColors = {
    'Strong Buy': 'bg-green-600 text-white',
    'Buy': 'bg-blue-600 text-white',
    'Hold': 'bg-yellow-500 text-white',
    'Sell': 'bg-orange-600 text-white',
    'Pass': 'bg-slate-400 text-white',
  };

  const edgePercent = (opportunity.edge * 100).toFixed(1);
  const confidencePercent = (opportunity.confidence_score * 100).toFixed(0);

  return (
    <Card className="border border-slate-200 hover:border-blue-400 hover:shadow-lg transition-all duration-200 bg-white">
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <Badge variant="outline" className="border-slate-300 text-slate-700 font-medium">
                  {opportunity.platform}
                </Badge>
                <Badge className={actionColors[opportunity.recommended_action] || actionColors['Pass']}>
                  {opportunity.recommended_action}
                </Badge>
                {Math.abs(opportunity.edge) > 0.1 && (
                  <Badge className="bg-yellow-100 text-yellow-800 border border-yellow-300">
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    High Edge
                  </Badge>
                )}
              </div>
              <h3 className="text-base font-semibold text-slate-900 leading-snug mb-4">
                {opportunity.question}
              </h3>

              {/* Price Comparison */}
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                  <div className="text-xs text-slate-500 mb-1">Market Price</div>
                  <div className="text-xl font-bold text-slate-900">
                    {(opportunity.market_price * 100).toFixed(0)}%
                  </div>
                </div>
                <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                  <div className="text-xs text-blue-600 mb-1 flex items-center gap-1">
                    <Brain className="w-3 h-3" />
                    AI Estimate
                  </div>
                  <div className="text-xl font-bold text-blue-700">
                    {(opportunity.estimated_true_probability * 100).toFixed(0)}%
                  </div>
                </div>
                <div className={`rounded-lg p-3 border ${opportunity.edge > 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                  <div className={`text-xs mb-1 ${opportunity.edge > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    Edge
                  </div>
                  <div className={`text-xl font-bold ${opportunity.edge > 0 ? 'text-green-700' : 'text-red-700'}`}>
                    {opportunity.edge > 0 ? '+' : ''}{edgePercent}%
                  </div>
                </div>
              </div>

              {/* Key Metrics */}
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div>
                  <div className="text-xs text-slate-500 mb-1">Expected Value</div>
                  <div className="font-semibold text-purple-600">
                    {opportunity.expected_value > 0 ? '+' : ''}{(opportunity.expected_value * 100).toFixed(1)}%
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 mb-1">Confidence</div>
                  <div className="font-semibold text-slate-900">{confidencePercent}%</div>
                </div>
                {opportunity.kelly_fraction && (
                  <div>
                    <div className="text-xs text-slate-500 mb-1">Kelly Size</div>
                    <div className="font-semibold text-slate-900">
                      {(opportunity.kelly_fraction * 100).toFixed(1)}%
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Expandable Details */}
          {expanded && (
            <div className="border-t border-slate-200 pt-4 space-y-4">
              <div>
                <h4 className="font-semibold text-slate-900 mb-2 flex items-center gap-2 text-sm">
                  <Brain className="w-4 h-4 text-blue-600" />
                  AI Analysis
                </h4>
                <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-lg">
                  {opportunity.reasoning}
                </p>
              </div>

              {opportunity.data_sources && opportunity.data_sources.length > 0 && (
                <div>
                  <h4 className="font-semibold text-slate-900 mb-2 text-sm">Data Sources</h4>
                  <div className="flex flex-wrap gap-2">
                    {opportunity.data_sources.map((source, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs border-slate-300">
                        {source}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {opportunity.risk_factors && opportunity.risk_factors.length > 0 && (
                <div>
                  <h4 className="font-semibold text-slate-900 mb-2 flex items-center gap-2 text-sm">
                    <AlertTriangle className="w-4 h-4 text-orange-500" />
                    Risk Factors
                  </h4>
                  <ul className="space-y-1 bg-orange-50 p-3 rounded-lg border border-orange-200">
                    {opportunity.risk_factors.map((risk, idx) => (
                      <li key={idx} className="text-sm text-slate-700 flex items-start gap-2">
                        <span className="text-orange-500 mt-0.5">•</span>
                        <span>{risk}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              className="flex-1 border-slate-300 hover:bg-slate-50"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? (
                <>
                  <ChevronUp className="w-4 h-4 mr-2" />
                  Show Less
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4 mr-2" />
                  Show Analysis
                </>
              )}
            </Button>
            {onTradeClick && (
              <Button
                onClick={() => onTradeClick(opportunity)}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              >
                <Zap className="w-4 h-4 mr-2" />
                Trade Now
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}