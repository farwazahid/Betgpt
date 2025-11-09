import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Target, Brain, Search, RefreshCw } from "lucide-react";
import TradeExecutor from "../components/trading/TradeExecutor";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Badge } from "@/components/ui/badge";

export default function Opportunities() {
  const [selectedOpportunity, setSelectedOpportunity] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { data: opportunities = [], isLoading, refetch: refetchOpportunities } = useQuery({
    queryKey: ['opportunities'],
    queryFn: async () => {
      const result = await base44.entities.Opportunity.filter({ status: 'Active' }, '-edge');
      return Array.isArray(result) ? result : [];
    },
    initialData: [],
    refetchInterval: 30000,
  });

  const { data: markets = [], refetch: refetchMarkets } = useQuery({
    queryKey: ['markets'],
    queryFn: async () => {
      const result = await base44.entities.Market.filter({ status: 'Active' });
      return Array.isArray(result) ? result : [];
    },
    initialData: [],
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        refetchOpportunities(),
        refetchMarkets()
      ]);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Filter opportunities
  const filteredOpportunities = opportunities.filter(opp => {
    if (!opp) return false;
    
    const matchesSearch = !searchQuery || 
      (opp.question && opp.question.toLowerCase().includes(searchQuery.toLowerCase()));
    
    // Find the market for this opportunity using market_id
    const oppMarket = markets.find(m => m.id === opp.market_id);
    
    const matchesCategory = activeCategory === "All" || 
      (oppMarket && oppMarket.category === activeCategory);
    
    return matchesSearch && matchesCategory;
  });

  const categories = ["All", "Politics", "Sports", "Crypto", "Economics", "Science", "Climate"];

  return (
    <div className="min-h-screen bg-[#f8f9fb]">
      {/* Top Navigation */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-[1600px] mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-8">
              <h1 className="text-[20px] font-bold text-slate-900">Alpha Opportunities</h1>
              <div className="flex items-center gap-1">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-4 py-2 text-[14px] font-medium rounded-md transition-colors ${
                      activeCategory === cat
                        ? 'bg-slate-100 text-slate-900'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <Input
                  placeholder="Search opportunities..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-[280px] h-9 border-slate-300 text-[14px]"
                />
              </div>
              <Button 
                variant="outline"
                onClick={handleRefresh}
                disabled={isRefreshing || isLoading}
                className="border-slate-300 h-9 px-3"
                size="sm"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              </Button>
              <Link to={createPageUrl("AlphaHunter")}>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white h-9 px-4" size="sm">
                  <Brain className="w-4 h-4 mr-2" />
                  Scan for Alpha
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Opportunities Grid */}
      <div className="max-w-[1600px] mx-auto px-6 py-6">
        {isLoading ? (
          <div className="text-center py-20">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600 mb-3" />
            <p className="text-[14px] text-slate-600">Loading opportunities...</p>
          </div>
        ) : filteredOpportunities.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredOpportunities.map(opp => {
              const marketPrice = opp.market_price || 0.5;
              const aiPrice = opp.estimated_true_probability || 0.5;
              const isUndervalued = opp.edge > 0;
              const market = markets.find(m => m.id === opp.market_id);
              const edgePercent = Math.abs((opp.edge || 0) * 100);

              return (
                <div 
                  key={opp.id}
                  className="bg-white border border-slate-200 rounded-lg hover:shadow-lg transition-all cursor-pointer"
                  onClick={() => setSelectedOpportunity(opp)}
                >
                  {/* Card Content */}
                  <div className="p-4">
                    {/* Edge Badge + Category - Top */}
                    <div className="flex items-center justify-between mb-3">
                      <Badge 
                        className={`text-[10px] font-bold px-2 py-0.5 uppercase ${
                          edgePercent >= 10 
                            ? 'bg-green-500 text-white' 
                            : edgePercent >= 5 
                              ? 'bg-yellow-500 text-white' 
                              : 'bg-blue-500 text-white'
                        }`}
                      >
                        {edgePercent.toFixed(1)}% Edge
                      </Badge>
                      {market?.category && (
                        <Badge variant="outline" className="text-[10px] font-medium px-1.5 py-0">
                          {market.category}
                        </Badge>
                      )}
                    </div>

                    {/* Icon + Question */}
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                        <span className="text-white font-bold text-sm">
                          {opp.platform?.charAt(0) || 'M'}
                        </span>
                      </div>
                      <h3 className="text-[13px] font-medium text-slate-900 leading-tight line-clamp-2 flex-1">
                        {opp.question}
                      </h3>
                    </div>

                    {/* Market Price vs AI Estimate */}
                    <div className="mb-4">
                      <div className="flex items-baseline justify-between mb-1">
                        <span className="text-[11px] text-slate-500">Market</span>
                        <span className="text-[32px] font-bold text-slate-900 leading-none">
                          {(marketPrice * 100).toFixed(0)}%
                        </span>
                      </div>
                      <div className="flex items-baseline justify-between">
                        <span className="text-[11px] text-blue-600 font-medium">AI Estimate</span>
                        <span className="text-[24px] font-bold text-blue-600 leading-none">
                          {(aiPrice * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>

                    {/* Recommended Action */}
                    {opp.recommended_action && (
                      <div className="mb-3">
                        <Badge className={`w-full justify-center text-[12px] font-semibold py-1.5 ${
                          opp.recommended_action === 'Strong Buy' 
                            ? 'bg-green-600 text-white hover:bg-green-700'
                            : opp.recommended_action === 'Buy'
                              ? 'bg-blue-600 text-white hover:bg-blue-700'
                              : 'bg-slate-200 text-slate-700'
                        }`}>
                          {opp.recommended_action}
                        </Badge>
                      </div>
                    )}

                    {/* Bottom Stats */}
                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-3 border-t border-slate-100">
                      <div className="flex items-center gap-2">
                        {market && market.volume > 0 && (
                          <>
                            <span>${(market.volume / 1000).toFixed(0)}K vol</span>
                            <span>·</span>
                          </>
                        )}
                        <span>Conf: {((opp.confidence_score || 0) * 100).toFixed(0)}%</span>
                      </div>
                      <Badge variant="outline" className="text-[10px] font-medium px-1.5 py-0">
                        {opp.platform}
                      </Badge>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-24 bg-white rounded-lg border border-slate-200">
            <Target className="w-16 h-16 mx-auto text-slate-300 mb-4" />
            <h3 className="text-[18px] font-semibold text-slate-900 mb-2">
              {opportunities.length === 0 ? 'No Opportunities Found' : 'No Matches'}
            </h3>
            <p className="text-[14px] text-slate-600 mb-6 max-w-md mx-auto">
              {opportunities.length === 0 
                ? "Run the Alpha Scanner to discover profitable mispricings with real-time data and AI analysis"
                : "Try adjusting your search or category filters"
              }
            </p>
            {opportunities.length === 0 && (
              <Link to={createPageUrl("AlphaHunter")}>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                  <Brain className="w-4 h-4 mr-2" />
                  Scan for Alpha
                </Button>
              </Link>
            )}
          </div>
        )}
      </div>

      {selectedOpportunity && (
        <TradeExecutor
          opportunity={selectedOpportunity}
          onClose={() => setSelectedOpportunity(null)}
        />
      )}
    </div>
  );
}