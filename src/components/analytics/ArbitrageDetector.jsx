import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRightLeft, Zap, TrendingUp, AlertTriangle, Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export default function ArbitrageDetector() {
  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  
  const queryClient = useQueryClient();

  const { data: arbitrages = [] } = useQuery({
    queryKey: ['arbitrages'],
    queryFn: () => base44.entities.Arbitrage.filter({ status: 'Active' }, '-spread_percent'),
    initialData: [],
  });

  const scanMutation = useMutation({
    mutationFn: async () => {
      setScanning(true);
      setProgress(10);

      // Fetch all active markets
      const markets = await base44.entities.Market.filter({ status: 'Active' });
      
      setProgress(30);

      // Use AI to find similar markets across platforms
      const scanPrompt = `You are an arbitrage detection system for prediction markets.

Task: Analyze these ${markets.length} markets and find ARBITRAGE opportunities - markets with the SAME or VERY SIMILAR questions across different platforms with price differences.

Markets data: ${JSON.stringify(markets.slice(0, 50))}

Look for:
1. Exact same questions on different platforms
2. Very similar questions (e.g., "Trump wins 2024" vs "Trump elected president 2024")
3. Opposite positions (YES on one platform vs NO on another)
4. Price spreads >2%

For each arbitrage found, calculate:
- Spread = |price_a - price_b|
- Profit potential = (spread * 1000) - fees (assume 2% fees)
- Execution difficulty based on liquidity

Return top 10 arbitrage opportunities.`;

      setProgress(60);

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: scanPrompt,
        response_json_schema: {
          type: "object",
          properties: {
            arbitrages: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  question: { type: "string" },
                  platform_a: { type: "string" },
                  market_a_id: { type: "string" },
                  price_a: { type: "number" },
                  platform_b: { type: "string" },
                  market_b_id: { type: "string" },
                  price_b: { type: "number" },
                  spread: { type: "number" },
                  spread_percent: { type: "number" },
                  arbitrage_type: { type: "string" },
                  profit_potential: { type: "number" },
                  execution_difficulty: { type: "string" }
                }
              }
            }
          }
        }
      });

      setProgress(80);

      // Save arbitrages to database
      if (response.arbitrages && response.arbitrages.length > 0) {
        await base44.entities.Arbitrage.bulkCreate(
          response.arbitrages.map(arb => ({
            ...arb,
            status: 'Active'
          }))
        );
      }

      setProgress(100);
      queryClient.invalidateQueries({ queryKey: ['arbitrages'] });
      
      return response.arbitrages || [];
    },
    onSettled: () => {
      setScanning(false);
      setProgress(0);
    },
  });

  const executionColors = {
    Easy: "bg-green-100 text-green-700",
    Medium: "bg-yellow-100 text-yellow-700",
    Hard: "bg-red-100 text-red-700",
  };

  return (
    <Card className="border-none shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <ArrowRightLeft className="w-5 h-5 text-purple-600" />
          Arbitrage Opportunities
        </CardTitle>
        <Button
          onClick={() => scanMutation.mutate()}
          disabled={scanning}
          size="sm"
          className="bg-purple-600 hover:bg-purple-700"
        >
          {scanning ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Scanning...
            </>
          ) : (
            <>
              <Zap className="w-4 h-4 mr-2" />
              Detect Arbitrage
            </>
          )}
        </Button>
      </CardHeader>
      <CardContent>
        {scanning && (
          <div className="mb-4">
            <Progress value={progress} className="h-2" />
            <p className="text-xs text-slate-500 mt-2">
              Analyzing {progress < 30 ? 'markets' : progress < 60 ? 'similarities' : 'spreads'}...
            </p>
          </div>
        )}

        {arbitrages.length > 0 ? (
          <div className="space-y-3">
            {arbitrages.slice(0, 5).map((arb, idx) => (
              <div 
                key={arb.id || idx}
                className="p-4 border border-purple-200 rounded-lg bg-purple-50 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="font-semibold text-slate-900 mb-2">{arb.question}</div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <Badge variant="outline" className="mb-1">{arb.platform_a}</Badge>
                        <div className="text-2xl font-bold text-blue-600">
                          {(arb.price_a * 100).toFixed(1)}%
                        </div>
                      </div>
                      <div>
                        <Badge variant="outline" className="mb-1">{arb.platform_b}</Badge>
                        <div className="text-2xl font-bold text-indigo-600">
                          {(arb.price_b * 100).toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="ml-4 text-right">
                    <div className="text-xs text-slate-500 mb-1">Spread</div>
                    <div className="text-2xl font-bold text-green-600">
                      {(arb.spread_percent || arb.spread * 100).toFixed(1)}%
                    </div>
                    <div className="text-xs text-slate-600 mt-1">
                      ~${arb.profit_potential?.toFixed(0) || 0} profit
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <Badge className={executionColors[arb.execution_difficulty] || ''}>
                    {arb.execution_difficulty} Execution
                  </Badge>
                  <Badge variant="outline">{arb.arbitrage_type}</Badge>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-slate-400">
            <ArrowRightLeft className="w-12 h-12 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No arbitrage opportunities detected</p>
            <p className="text-xs mt-1">Run a scan to find cross-platform price differences</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}