import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Brain, Loader2, Search } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

export default function MarketScanner({ onClose }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [platform, setPlatform] = useState("Polymarket");
  const [category, setCategory] = useState("Politics");
  const [scanning, setScanning] = useState(false);
  const [results, setResults] = useState([]);

  const queryClient = useQueryClient();

  const scanMutation = useMutation({
    mutationFn: async (data) => {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a prediction market scanner. Find real, active prediction markets based on this query: "${data.query}" on ${data.platform} in the ${data.category} category.

Return 3-5 relevant prediction markets with realistic data. For each market, provide:
- question: The exact market question
- platform: ${data.platform}
- category: ${data.category}
- current_price: Current probability as decimal (0-1)
- volume: Trading volume in USD
- liquidity: Available liquidity
- close_date: Resolution date in ISO format
- url: Realistic URL to the market

Make sure the data is realistic and reflects actual prediction market behavior.`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            markets: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  question: { type: "string" },
                  platform: { type: "string" },
                  category: { type: "string" },
                  current_price: { type: "number" },
                  volume: { type: "number" },
                  liquidity: { type: "number" },
                  close_date: { type: "string" },
                  url: { type: "string" }
                }
              }
            }
          }
        }
      });

      return response.markets || [];
    },
    onSuccess: (data) => {
      setResults(data);
    },
  });

  const addMarketsMutation = useMutation({
    mutationFn: async (markets) => {
      const marketsToAdd = markets.map(m => ({
        ...m,
        status: 'Active',
        market_id: `${m.platform.toLowerCase()}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        last_scanned: new Date().toISOString()
      }));
      
      await base44.entities.Market.bulkCreate(marketsToAdd);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['markets'] });
      onClose();
    },
  });

  const handleScan = async () => {
    setScanning(true);
    setResults([]);
    await scanMutation.mutateAsync({ query: searchQuery, platform, category });
    setScanning(false);
  };

  const handleAddAll = () => {
    addMarketsMutation.mutate(results);
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Brain className="w-6 h-6 text-blue-600" />
            AI Market Scanner
          </DialogTitle>
          <DialogDescription>
            Use AI to discover prediction markets across platforms
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div>
            <Label htmlFor="query">Search Query</Label>
            <Textarea
              id="query"
              placeholder="e.g., 'US Presidential Election 2024' or 'Bitcoin price predictions'"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="mt-1.5"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="platform">Platform</Label>
              <Select value={platform} onValueChange={setPlatform}>
                <SelectTrigger id="platform" className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Polymarket">Polymarket</SelectItem>
                  <SelectItem value="Manifold">Manifold</SelectItem>
                  <SelectItem value="Kalshi">Kalshi</SelectItem>
                  <SelectItem value="PredictIt">PredictIt</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="category">Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger id="category" className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Politics">Politics</SelectItem>
                  <SelectItem value="Sports">Sports</SelectItem>
                  <SelectItem value="Crypto">Crypto</SelectItem>
                  <SelectItem value="Economics">Economics</SelectItem>
                  <SelectItem value="Entertainment">Entertainment</SelectItem>
                  <SelectItem value="Science">Science</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button 
            onClick={handleScan} 
            disabled={!searchQuery || scanning}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600"
          >
            {scanning ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Scanning Markets...
              </>
            ) : (
              <>
                <Search className="w-4 h-4 mr-2" />
                Scan Markets
              </>
            )}
          </Button>

          {/* Results */}
          {results.length > 0 && (
            <div className="space-y-3 mt-6">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg">Found {results.length} Markets</h3>
                <Button 
                  onClick={handleAddAll}
                  disabled={addMarketsMutation.isPending}
                  size="sm"
                >
                  {addMarketsMutation.isPending ? 'Adding...' : 'Add All'}
                </Button>
              </div>
              
              <div className="space-y-2">
                {results.map((market, idx) => (
                  <div key={idx} className="p-4 border border-slate-200 rounded-lg bg-slate-50">
                    <div className="font-medium text-sm mb-2">{market.question}</div>
                    <div className="flex items-center gap-4 text-xs text-slate-600">
                      <span>Price: {(market.current_price * 100).toFixed(1)}%</span>
                      <span>Volume: ${(market.volume / 1000).toFixed(0)}K</span>
                      <span>Closes: {new Date(market.close_date).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}