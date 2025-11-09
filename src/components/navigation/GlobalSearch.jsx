import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Search, Target, TrendingUp, Activity, Globe, 
  Clock, ExternalLink, Command
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function GlobalSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState({
    opportunities: [],
    markets: [],
    trades: []
  });

  // Fetch all data for searching
  const { data: opportunities = [] } = useQuery({
    queryKey: ['opportunities'],
    queryFn: () => base44.entities.Opportunity.filter({ status: 'Active' }),
    initialData: [],
    enabled: isOpen
  });

  const { data: markets = [] } = useQuery({
    queryKey: ['markets'],
    queryFn: () => base44.entities.Market.filter({ status: 'Active' }),
    initialData: [],
    enabled: isOpen
  });

  const { data: trades = [] } = useQuery({
    queryKey: ['trades'],
    queryFn: () => base44.entities.Trade.list('-created_date', 50),
    initialData: [],
    enabled: isOpen
  });

  // Handle keyboard shortcut (Cmd/Ctrl + K)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Search logic
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults({ opportunities: [], markets: [], trades: [] });
      return;
    }

    const query = searchQuery.toLowerCase();

    const filteredOpportunities = opportunities
      .filter(o => 
        o && (
          o.question?.toLowerCase().includes(query) ||
          o.platform?.toLowerCase().includes(query)
        )
      )
      .slice(0, 5);

    const filteredMarkets = markets
      .filter(m => 
        m && (
          m.question?.toLowerCase().includes(query) ||
          m.platform?.toLowerCase().includes(query) ||
          m.category?.toLowerCase().includes(query)
        )
      )
      .slice(0, 5);

    const filteredTrades = trades
      .filter(t => 
        t && (
          t.question?.toLowerCase().includes(query) ||
          t.platform?.toLowerCase().includes(query)
        )
      )
      .slice(0, 5);

    setSearchResults({
      opportunities: filteredOpportunities,
      markets: filteredMarkets,
      trades: filteredTrades
    });
  }, [searchQuery, opportunities, markets, trades]);

  const totalResults = 
    searchResults.opportunities.length + 
    searchResults.markets.length + 
    searchResults.trades.length;

  const handleResultClick = () => {
    setIsOpen(false);
    setSearchQuery("");
  };

  return (
    <>
      {/* Search Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors text-sm text-slate-600 hover:text-slate-900 w-64"
      >
        <Search className="w-4 h-4" />
        <span>Search...</span>
        <kbd className="ml-auto px-2 py-0.5 bg-white border border-slate-300 rounded text-xs font-mono">
          ⌘K
        </kbd>
      </button>

      {/* Search Modal */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto p-0">
          <div className="sticky top-0 bg-white z-10 border-b border-slate-200 p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search markets, opportunities, trades..."
                className="pl-12 pr-4 py-6 text-base border-0 focus-visible:ring-0"
                autoFocus
              />
            </div>
            {searchQuery && (
              <div className="mt-2 text-xs text-slate-500">
                {totalResults} result{totalResults !== 1 ? 's' : ''} found
              </div>
            )}
          </div>

          <div className="p-4 space-y-6">
            {!searchQuery ? (
              <div className="text-center py-12">
                <Search className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                <h3 className="text-sm font-semibold text-slate-900 mb-1">Quick Search</h3>
                <p className="text-xs text-slate-500 mb-4">
                  Search across markets, opportunities, and trades
                </p>
                <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
                  <Command className="w-3 h-3" />
                  <span>Press</span>
                  <kbd className="px-2 py-1 bg-slate-100 border border-slate-300 rounded">⌘K</kbd>
                  <span>to open anytime</span>
                </div>
              </div>
            ) : totalResults === 0 ? (
              <div className="text-center py-12">
                <div className="text-4xl mb-3">🔍</div>
                <h3 className="text-sm font-semibold text-slate-900 mb-1">No results found</h3>
                <p className="text-xs text-slate-500">
                  Try different keywords or check your spelling
                </p>
              </div>
            ) : (
              <>
                {/* Opportunities Results */}
                {searchResults.opportunities.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Target className="w-4 h-4 text-purple-600" />
                      <h3 className="text-sm font-semibold text-slate-900">
                        Opportunities ({searchResults.opportunities.length})
                      </h3>
                    </div>
                    <div className="space-y-2">
                      {searchResults.opportunities.map(opp => (
                        <Link
                          key={opp.id}
                          to={createPageUrl("Opportunities")}
                          onClick={handleResultClick}
                          className="block p-3 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg transition-colors"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-slate-900 line-clamp-1 mb-1">
                                {opp.question}
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs border-slate-300">
                                  {opp.platform}
                                </Badge>
                                <Badge className="text-xs bg-purple-600 text-white">
                                  {(Math.abs(opp.edge || 0) * 100).toFixed(1)}% edge
                                </Badge>
                              </div>
                            </div>
                            <ExternalLink className="w-4 h-4 text-purple-600 flex-shrink-0" />
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* Markets Results */}
                {searchResults.markets.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Globe className="w-4 h-4 text-blue-600" />
                      <h3 className="text-sm font-semibold text-slate-900">
                        Markets ({searchResults.markets.length})
                      </h3>
                    </div>
                    <div className="space-y-2">
                      {searchResults.markets.map(market => (
                        <Link
                          key={market.id}
                          to={createPageUrl("Markets")}
                          onClick={handleResultClick}
                          className="block p-3 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-slate-900 line-clamp-1 mb-1">
                                {market.question}
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs border-slate-300">
                                  {market.platform}
                                </Badge>
                                {market.category && (
                                  <Badge variant="outline" className="text-xs border-slate-300">
                                    {market.category}
                                  </Badge>
                                )}
                                <span className="text-xs text-slate-600">
                                  {((market.current_price || 0) * 100).toFixed(0)}% Yes
                                </span>
                              </div>
                            </div>
                            <ExternalLink className="w-4 h-4 text-blue-600 flex-shrink-0" />
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* Trades Results */}
                {searchResults.trades.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Activity className="w-4 h-4 text-green-600" />
                      <h3 className="text-sm font-semibold text-slate-900">
                        Your Trades ({searchResults.trades.length})
                      </h3>
                    </div>
                    <div className="space-y-2">
                      {searchResults.trades.map(trade => {
                        const pnl = trade.status === 'Open' 
                          ? (trade.unrealized_pnl || 0) 
                          : (trade.pnl || 0);
                        
                        return (
                          <Link
                            key={trade.id}
                            to={createPageUrl("Portfolio")}
                            onClick={handleResultClick}
                            className="block p-3 bg-green-50 hover:bg-green-100 border border-green-200 rounded-lg transition-colors"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-slate-900 line-clamp-1 mb-1">
                                  {trade.question}
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="text-xs border-slate-300">
                                    {trade.platform}
                                  </Badge>
                                  <Badge className={`text-xs ${
                                    trade.status === 'Open' 
                                      ? 'bg-blue-100 text-blue-700'
                                      : 'bg-slate-200 text-slate-700'
                                  }`}>
                                    {trade.status}
                                  </Badge>
                                  <span className={`text-xs font-semibold ${
                                    pnl >= 0 ? 'text-green-600' : 'text-red-600'
                                  }`}>
                                    {pnl >= 0 ? '+' : ''}${pnl.toFixed(2)}
                                  </span>
                                </div>
                              </div>
                              <ExternalLink className="w-4 h-4 text-green-600 flex-shrink-0" />
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}