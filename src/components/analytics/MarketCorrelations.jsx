import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link2, TrendingUp } from "lucide-react";

export default function MarketCorrelations({ marketId }) {
  const { data: correlations = [] } = useQuery({
    queryKey: ['correlations', marketId],
    queryFn: async () => {
      if (!marketId) return [];
      
      const markets = await base44.entities.Market.list();
      const targetMarket = markets.find(m => m.id === marketId);
      
      if (!targetMarket) return [];

      // Use AI to find correlated markets
      const prompt = `Given this prediction market: "${targetMarket.question}" on ${targetMarket.platform}

Find 5 other markets from this list that are MOST CORRELATED (likely to move together):

${markets.filter(m => m.id !== marketId).slice(0, 30).map(m => 
  `- ${m.question} (${m.platform})`
).join('\n')}

Return markets that:
1. Share common underlying factors
2. Would likely resolve similarly
3. Are influenced by same events
4. Have causal relationships

Rate correlation strength: Strong (0.7-1.0), Medium (0.4-0.7), Weak (0.2-0.4)`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            correlations: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  market_question: { type: "string" },
                  correlation_strength: { type: "string" },
                  correlation_score: { type: "number" },
                  reasoning: { type: "string" }
                }
              }
            }
          }
        }
      });

      return response.correlations || [];
    },
    enabled: !!marketId,
  });

  if (!marketId || correlations.length === 0) return null;

  const strengthColors = {
    Strong: "bg-green-100 text-green-700",
    Medium: "bg-yellow-100 text-yellow-700",
    Weak: "bg-slate-100 text-slate-700",
  };

  return (
    <Card className="border-none shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Link2 className="w-5 h-5 text-blue-600" />
          Correlated Markets
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {correlations.map((corr, idx) => (
            <div key={idx} className="p-3 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <p className="font-medium text-sm text-slate-900">{corr.market_question}</p>
                  <p className="text-xs text-slate-600 mt-1">{corr.reasoning}</p>
                </div>
                <Badge className={strengthColors[corr.correlation_strength] || ''}>
                  {corr.correlation_strength}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}