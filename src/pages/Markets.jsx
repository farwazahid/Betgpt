import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Loader2, RefreshCw, AlertCircle, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import LiveOpportunityAnalyzer from "../components/opportunities/LiveOpportunityAnalyzer";

export default function Markets() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [activeStatus, setActiveStatus] = useState("all");
  const [selectedMarket, setSelectedMarket] = useState(null);
  const [fetchingMarkets, setFetchingMarkets] = useState(false);
  const [deletingOld, setDeletingOld] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const [fetchSuccess, setFetchSuccess] = useState(null);
  
  const queryClient = useQueryClient();

  const { data: markets = [], isLoading, error: queryError, refetch: refetchMarkets } = useQuery({
    queryKey: ['markets'],
    queryFn: async () => {
      try {
        console.log('[Markets UI] Fetching markets from database...');
        const result = await base44.entities.Market.list('-last_updated', 500);
        console.log('[Markets UI] Got', result?.length || 0, 'markets');
        return Array.isArray(result) ? result : [];
      } catch (err) {
        console.error('[Markets UI] Error:', err);
        return [];
      }
    },
    initialData: [],
    staleTime: 0,
    cacheTime: 0,
  });

  const deleteOldMarketsMutation = useMutation({
    mutationFn: async () => {
      console.log('[Markets UI] Deleting old markets...');
      const now = new Date();
      const toDelete = markets.filter(m => {
        if (!m || !m.close_date) return false;
        const closeDate = new Date(m.close_date);
        return closeDate < now || m.status === 'Closed';
      });
      
      console.log('[Markets UI] Deleting', toDelete.length, 'markets');
      
      for (const market of toDelete) {
        try {
          await base44.entities.Market.delete(market.id);
        } catch (err) {
          console.error('[Markets UI] Delete error:', err);
        }
      }
      
      return { deleted: toDelete.length };
    },
    onSuccess: (data) => {
      console.log('[Markets UI] Deleted', data.deleted, 'markets');
      setFetchSuccess(`Deleted ${data.deleted} old markets`);
      queryClient.invalidateQueries({ queryKey: ['markets'] });
      refetchMarkets();
      setTimeout(() => setFetchSuccess(null), 5000);
    },
    onError: (err) => {
      console.error('[Markets UI] Delete mutation error:', err);
      setFetchError(`Delete failed: ${err.message}`);
      setTimeout(() => setFetchError(null), 5000);
    }
  });

  const fetchMarketsMutation = useMutation({
    mutationFn: async () => {
      console.log('[Markets UI] ===== STARTING FETCH WITH API KEYS =====');
      setFetchError(null);
      setFetchSuccess(null);
      
      try {
        console.log('[Markets UI] Calling backend function with API authentication...');
        const response = await base44.functions.invoke('fetchLiveMarkets', {
          platform: 'all',
          category: 'all',
          limit: 100
        });
        
        console.log('[Markets UI] Backend response received');
        console.log('[Markets UI] Response data:', response.data);
        
        if (!response.data) {
          throw new Error('No data in response');
        }
        
        if (response.data.success === false) {
          throw new Error(response.data.error || 'Fetch failed');
        }
        
        return response.data;
      } catch (err) {
        console.error('[Markets UI] Fetch error:', err);
        throw err;
      }
    },
    onSuccess: async (data) => {
      console.log('[Markets UI] ===== FETCH SUCCESS =====');
      console.log('[Markets UI] Markets fetched:', data.markets_fetched);
      console.log('[Markets UI] New markets:', data.new_markets);
      console.log('[Markets UI] API keys used:', data.api_keys_used);
      
      setFetchSuccess(`✅ Fetched ${data.markets_fetched} REAL-TIME markets! (${data.new_markets} new) from ${data.platforms?.join(', ')}`);
      
      // CRITICAL: Force immediate refetch
      console.log('[Markets UI] Invalidating and refetching markets...');
      queryClient.resetQueries({ queryKey: ['markets'] });
      await queryClient.invalidateQueries({ queryKey: ['markets'] });
      await refetchMarkets();
      
      setTimeout(() => setFetchSuccess(null), 10000);
    },
    onError: (err) => {
      console.error('[Markets UI] ===== FETCH ERROR =====');
      console.error('[Markets UI] Error:', err);
      setFetchError(`Failed: ${err.message}`);
      setTimeout(() => setFetchError(null), 8000);
    }
  });

  const handleFetchMarkets = async () => {
    console.log('[Markets UI] User clicked Fetch Markets');
    setFetchingMarkets(true);
    setFetchError(null);
    setFetchSuccess(null);
    
    try {
      await fetchMarketsMutation.mutateAsync();
    } catch (err) {
      console.error('[Markets UI] Fetch mutation error:', err);
    } finally {
      setFetchingMarkets(false);
    }
  };

  const handleDeleteOld = async () => {
    console.log('[Markets UI] User clicked Delete Old');
    setDeletingOld(true);
    try {
      await deleteOldMarketsMutation.mutateAsync();
    } finally {
      setDeletingOld(false);
    }
  };

  const filteredMarkets = markets.filter(market => {
    if (!market) return false;
    
    const matchesSearch = !searchQuery || 
      (market.question && market.question.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = activeCategory === "all" || market.category === activeCategory;
    
    const matchesStatus = activeStatus === "all" || market.status === activeStatus;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const categories = ["all", ...new Set(
    markets
      .filter(m => m && m.category)
      .map(m => m.category)
  )];

  const activeMarketsCount = markets.filter(m => m && m.status === 'Active').length;
  const closedMarketsCount = markets.filter(m => m && m.status === 'Closed').length;

  console.log('[Markets UI] Rendering:', {
    total: markets.length,
    active: activeMarketsCount,
    closed: closedMarketsCount,
    filtered: filteredMarkets.length,
    isLoading,
    fetchingMarkets
  });

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="border-b border-slate-200 px-6 py-4 bg-white sticky top-0 z-10">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">Markets</h1>
              <p className="text-sm text-slate-500 mt-1">
                {markets.length} total · {activeMarketsCount} active · {closedMarketsCount} closed · {filteredMarkets.length} showing
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <Input
                  placeholder="Search markets..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-80 border-slate-300"
                />
              </div>
              {closedMarketsCount > 0 && (
                <Button 
                  variant="outline"
                  onClick={handleDeleteOld}
                  disabled={deletingOld || fetchingMarkets}
                  className="border-red-300 text-red-600 hover:bg-red-50"
                >
                  {deletingOld ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Old ({closedMarketsCount})
                    </>
                  )}
                </Button>
              )}
              <Button 
                variant="outline"
                onClick={() => {
                  console.log('[Markets UI] Manual refresh clicked');
                  refetchMarkets();
                }}
                disabled={isLoading || fetchingMarkets}
                className="border-slate-300"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button 
                onClick={handleFetchMarkets}
                disabled={fetchingMarkets || isLoading}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold"
              >
                {fetchingMarkets ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Fetching Real-Time Data...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Fetch Live Markets
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Status Filter */}
          <div className="flex gap-2 mb-3">
            <Button
              variant={activeStatus === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveStatus("all")}
              className={activeStatus === "all" ? "bg-blue-600 text-white" : ""}
            >
              All ({markets.length})
            </Button>
            <Button
              variant={activeStatus === "Active" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveStatus("Active")}
              className={activeStatus === "Active" ? "bg-green-600 text-white" : ""}
            >
              Active ({activeMarketsCount})
            </Button>
            <Button
              variant={activeStatus === "Closed" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveStatus("Closed")}
              className={activeStatus === "Closed" ? "bg-slate-600 text-white" : ""}
            >
              Closed ({closedMarketsCount})
            </Button>
          </div>

          {/* Category Filter */}
          <div className="flex gap-2 flex-wrap">
            {categories.map(cat => (
              <Button
                key={cat}
                variant={activeCategory === cat ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveCategory(cat)}
                className={activeCategory === cat ? "bg-purple-600 text-white" : ""}
              >
                {cat}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Alerts */}
      <div className="max-w-7xl mx-auto px-6 py-4">
        {fetchError && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Error:</strong> {fetchError}
              <br />
              <span className="text-xs mt-1 block">Check browser console (F12) and backend logs for details</span>
            </AlertDescription>
          </Alert>
        )}
        
        {fetchSuccess && (
          <Alert className="mb-4 bg-green-50 border-green-200">
            <AlertDescription className="text-green-800 font-medium">
              {fetchSuccess}
            </AlertDescription>
          </Alert>
        )}

        {queryError && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Database error: {queryError.message}</AlertDescription>
          </Alert>
        )}

        {closedMarketsCount > 0 && activeMarketsCount === 0 && !fetchSuccess && !fetchingMarkets && (
          <Alert className="mb-4 bg-yellow-50 border-yellow-200">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              <strong>All markets are closed/expired.</strong> Click "Delete Old" then "Fetch Live Markets" to get fresh real-time data.
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Markets Grid */}
      <div className="max-w-7xl mx-auto px-6 pb-6">
        {isLoading || fetchingMarkets ? (
          <div className="text-center py-20">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600 mb-3" />
            <p className="text-slate-600">
              {fetchingMarkets ? 'Fetching real-time market data from APIs...' : 'Loading markets...'}
            </p>
          </div>
        ) : filteredMarkets.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredMarkets.map(market => {
              if (!market) return null;
              
              const yesPrice = market.current_price || 0.5;
              const noPrice = 1 - yesPrice;
              const isClosed = market.status === 'Closed';

              return (
                <div 
                  key={market.id} 
                  className={`bg-white border rounded-lg p-4 hover:shadow-lg transition-all cursor-pointer ${
                    isClosed ? 'border-slate-300 opacity-60' : 'border-slate-200'
                  }`}
                  onClick={() => setSelectedMarket(market)}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {market.platform}
                      </Badge>
                      {isClosed && (
                        <Badge variant="outline" className="text-xs bg-slate-100">
                          Closed
                        </Badge>
                      )}
                    </div>
                    {market.category && (
                      <Badge variant="outline" className="text-xs">
                        {market.category}
                      </Badge>
                    )}
                  </div>

                  <h3 className="font-semibold text-sm text-slate-900 mb-3 line-clamp-2 min-h-[40px]">
                    {market.question}
                  </h3>

                  <div className="space-y-2 mb-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500">Yes</span>
                      <span className="text-lg font-bold text-slate-900">
                        {(yesPrice * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500">No</span>
                      <span className="text-lg font-bold text-slate-900">
                        {(noPrice * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>

                  {!isClosed && (
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      <button 
                        className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm font-medium"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedMarket(market);
                        }}
                      >
                        Buy Yes
                      </button>
                      <button 
                        className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm font-medium"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedMarket(market);
                        }}
                      >
                        Buy No
                      </button>
                    </div>
                  )}

                  <div className="pt-3 border-t border-slate-100 text-xs text-slate-500 space-y-1">
                    {market.volume > 0 && (
                      <div className="flex justify-between">
                        <span>Volume:</span>
                        <span className="font-medium">${(market.volume / 1000).toFixed(1)}K</span>
                      </div>
                    )}
                    {market.close_date && (
                      <div className="flex justify-between">
                        <span>Closes:</span>
                        <span className="font-medium">
                          {new Date(market.close_date).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                    {market.last_updated && (
                      <div className="flex justify-between">
                        <span>Updated:</span>
                        <span className="font-medium">
                          {new Date(market.last_updated).toLocaleTimeString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">📊</div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              {markets.length === 0 ? 'No Markets in Database' : 'No Markets Match Filters'}
            </h3>
            <p className="text-slate-600 mb-6">
              {markets.length === 0 
                ? "Click 'Fetch Live Markets' to load REAL-TIME data from Manifold, Kalshi, and Polymarket using API keys"
                : "Try adjusting your filters or search query"
              }
            </p>
            <Button 
              onClick={handleFetchMarkets} 
              disabled={fetchingMarkets}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {fetchingMarkets ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Fetching Real-Time Markets...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Fetch Live Markets Now
                </>
              )}
            </Button>
          </div>
        )}
      </div>

      {selectedMarket && (
        <LiveOpportunityAnalyzer 
          market={selectedMarket}
          onClose={() => setSelectedMarket(null)}
        />
      )}
    </div>
  );
}