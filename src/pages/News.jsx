import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Loader2, RefreshCw, ExternalLink, AlertCircle, TrendingUp, 
  TrendingDown, Target, Activity, Search, Filter, Link as LinkIcon
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function News() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterPlatform, setFilterPlatform] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterSentiment, setFilterSentiment] = useState("all");
  const [showOnlyRelevant, setShowOnlyRelevant] = useState(false);

  // Fetch opportunities and trades for context
  const { data: opportunities = [] } = useQuery({
    queryKey: ['opportunities'],
    queryFn: async () => {
      const result = await base44.entities.Opportunity.filter({ status: 'Active' });
      return Array.isArray(result) ? result : [];
    },
    initialData: [],
  });

  const { data: trades = [] } = useQuery({
    queryKey: ['trades'],
    queryFn: async () => {
      const result = await base44.entities.Trade.filter({ status: 'Open' });
      return Array.isArray(result) ? result : [];
    },
    initialData: [],
  });

  // Fetch relevant news with sentiment analysis
  const { data: newsData, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['relevantNews', filterPlatform, filterCategory, filterSentiment, showOnlyRelevant],
    queryFn: async () => {
      console.log('[News Page] Fetching relevant news with filters...');
      
      const filters = {};
      if (filterPlatform !== 'all') filters.platform = filterPlatform;
      if (filterCategory !== 'all') filters.category = filterCategory;
      if (filterSentiment !== 'all') filters.sentiment = filterSentiment;
      if (showOnlyRelevant) filters.has_opportunities = true;

      const response = await base44.functions.invoke('fetchRelevantNews', { filters });
      
      console.log('[News Page] Received data:', {
        total: response.data?.total_fetched || 0,
        analyzed: response.data?.total_analyzed || 0,
        filtered: response.data?.total_filtered || 0
      });
      
      return response.data;
    },
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
    staleTime: 2 * 60 * 1000,
    retry: 2,
    enabled: true // Always fetch on mount
  });

  const handleRefresh = async () => {
    console.log('[News Page] Manual refresh triggered');
    await refetch();
  };

  // Filter articles by search query
  const filteredArticles = React.useMemo(() => {
    if (!newsData?.articles) return [];
    
    if (!searchQuery) return newsData.articles;
    
    const query = searchQuery.toLowerCase();
    return newsData.articles.filter(article => 
      article.title?.toLowerCase().includes(query) ||
      article.description?.toLowerCase().includes(query) ||
      article.key_themes?.some(theme => theme.toLowerCase().includes(query))
    );
  }, [newsData, searchQuery]);

  // Extract unique platforms from opportunities and trades
  const platforms = React.useMemo(() => {
    const platformSet = new Set([
      ...opportunities.map(o => o.platform),
      ...trades.map(t => t.platform)
    ]);
    return ['all', ...Array.from(platformSet).filter(Boolean).sort()];
  }, [opportunities, trades]);

  const getSentimentColor = (label) => {
    switch(label) {
      case 'Very Positive': return 'text-green-700 bg-green-100 border-green-300';
      case 'Positive': return 'text-green-600 bg-green-50 border-green-200';
      case 'Neutral': return 'text-slate-600 bg-slate-100 border-slate-300';
      case 'Negative': return 'text-red-600 bg-red-50 border-red-200';
      case 'Very Negative': return 'text-red-700 bg-red-100 border-red-300';
      default: return 'text-slate-600 bg-slate-100 border-slate-300';
    }
  };

  const getMarketImpactIcon = (impact) => {
    switch(impact) {
      case 'Bullish': return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'Bearish': return <TrendingDown className="w-4 h-4 text-red-600" />;
      default: return <Activity className="w-4 h-4 text-slate-600" />;
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">Market News Feed</h1>
              <p className="text-sm text-slate-500 mt-1">
                Real-time news with AI sentiment analysis • Linked to your opportunities
              </p>
            </div>
            <Button
              onClick={handleRefresh}
              disabled={isLoading || isFetching}
              variant="outline"
              className="border-slate-300"
            >
              {(isLoading || isFetching) ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              Refresh
            </Button>
          </div>

          {/* Stats Bar */}
          {newsData && (
            <div className="grid grid-cols-4 gap-4 mb-4">
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="text-xs text-blue-600 font-medium">Articles Analyzed</div>
                <div className="text-2xl font-bold text-blue-900">{newsData.total_analyzed}</div>
              </div>
              <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                <div className="text-xs text-green-600 font-medium">Showing</div>
                <div className="text-2xl font-bold text-green-900">{filteredArticles.length}</div>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                <div className="text-xs text-purple-600 font-medium">Your Opportunities</div>
                <div className="text-2xl font-bold text-purple-900">{newsData.opportunities_tracked}</div>
              </div>
              <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                <div className="text-xs text-orange-600 font-medium">Open Trades</div>
                <div className="text-2xl font-bold text-orange-900">{newsData.trades_tracked}</div>
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <Input
                placeholder="Search news..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 border-slate-300"
              />
            </div>

            <Select value={filterPlatform} onValueChange={setFilterPlatform}>
              <SelectTrigger className="w-40 border-slate-300">
                <SelectValue placeholder="Platform" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Platforms</SelectItem>
                {platforms.filter(p => p !== 'all').map(platform => (
                  <SelectItem key={platform} value={platform}>{platform}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-40 border-slate-300">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="Politics">Politics</SelectItem>
                <SelectItem value="Crypto">Crypto</SelectItem>
                <SelectItem value="Sports">Sports</SelectItem>
                <SelectItem value="Economics">Economics</SelectItem>
                <SelectItem value="Science">Science</SelectItem>
                <SelectItem value="Climate">Climate</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterSentiment} onValueChange={setFilterSentiment}>
              <SelectTrigger className="w-40 border-slate-300">
                <SelectValue placeholder="Sentiment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sentiment</SelectItem>
                <SelectItem value="Bullish">Bullish</SelectItem>
                <SelectItem value="Bearish">Bearish</SelectItem>
                <SelectItem value="Neutral">Neutral</SelectItem>
                <SelectItem value="Mixed">Mixed</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant={showOnlyRelevant ? "default" : "outline"}
              onClick={() => setShowOnlyRelevant(!showOnlyRelevant)}
              className={showOnlyRelevant ? "bg-blue-600" : "border-slate-300"}
            >
              <Filter className="w-4 h-4 mr-2" />
              Only Relevant
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Error State */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Error loading news:</strong> {error.message}
              <br />
              <Button onClick={handleRefresh} variant="outline" size="sm" className="mt-2">
                Try Again
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Loading State */}
        {(isLoading || isFetching) && !newsData ? (
          <div className="text-center py-20">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600 mb-3" />
            <p className="text-slate-600 font-medium">Fetching and analyzing news with AI...</p>
            <p className="text-xs text-slate-500 mt-2">This may take 20-30 seconds</p>
          </div>
        ) : newsData && filteredArticles.length > 0 ? (
          <div className="space-y-4">
            {isFetching && (
              <Alert className="bg-blue-50 border-blue-200">
                <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                <AlertDescription className="text-blue-900 text-sm">
                  Refreshing news feed with latest articles...
                </AlertDescription>
              </Alert>
            )}

            {filteredArticles.map((article, idx) => (
              <Card key={idx} className="border border-slate-200 hover:border-slate-300 transition-colors">
                <CardContent className="p-6">
                  <div className="flex gap-4">
                    {/* Article Image */}
                    {article.image && (
                      <img 
                        src={article.image} 
                        alt="" 
                        className="w-32 h-32 object-cover rounded-lg flex-shrink-0"
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    )}

                    {/* Article Content */}
                    <div className="flex-1 min-w-0">
                      {/* Header Row */}
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div className="flex-1">
                          <a 
                            href={article.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group"
                          >
                            <h3 className="font-semibold text-slate-900 text-base mb-2 group-hover:text-blue-600 flex items-start gap-2">
                              {article.title}
                              <ExternalLink className="w-4 h-4 flex-shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </h3>
                          </a>
                          
                          {article.description && (
                            <p className="text-sm text-slate-600 line-clamp-2 mb-3">
                              {article.description}
                            </p>
                          )}

                          {/* Metadata */}
                          <div className="flex items-center gap-3 flex-wrap text-xs text-slate-500">
                            <Badge variant="outline" className="border-slate-300">
                              {article.source}
                            </Badge>
                            <span>{new Date(article.publishedAt).toLocaleString()}</span>
                          </div>
                        </div>

                        {/* Sentiment & Impact */}
                        <div className="flex flex-col gap-2 items-end flex-shrink-0">
                          <Badge className={getSentimentColor(article.sentiment_label)}>
                            {article.sentiment_label}
                          </Badge>
                          <div className="flex items-center gap-1">
                            {getMarketImpactIcon(article.market_impact)}
                            <span className="text-xs text-slate-600">{article.market_impact}</span>
                          </div>
                        </div>
                      </div>

                      {/* Key Themes */}
                      {article.key_themes && article.key_themes.length > 0 && (
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-xs text-slate-500">Themes:</span>
                          {article.key_themes.map((theme, themeIdx) => (
                            <Badge key={themeIdx} variant="outline" className="text-xs border-blue-300 text-blue-700">
                              {theme}
                            </Badge>
                          ))}
                        </div>
                      )}

                      {/* Linked Opportunities */}
                      {article.relevant_opportunities && article.relevant_opportunities.length > 0 && (
                        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <Target className="w-4 h-4 text-green-600" />
                            <span className="text-xs font-semibold text-green-900">
                              Related Opportunities ({article.relevant_opportunities.length})
                            </span>
                          </div>
                          <div className="space-y-2">
                            {article.relevant_opportunities.map((opp, oppIdx) => (
                              <Link 
                                key={oppIdx}
                                to={createPageUrl("Opportunities")}
                                className="block p-2 bg-white border border-green-300 rounded hover:border-green-400 transition-colors"
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex-1 min-w-0">
                                    <div className="text-xs font-medium text-slate-900 line-clamp-1">
                                      {opp.question}
                                    </div>
                                    <div className="flex items-center gap-2 mt-1">
                                      <Badge variant="outline" className="text-xs border-slate-300">
                                        {opp.platform}
                                      </Badge>
                                      <span className="text-xs text-green-600 font-semibold">
                                        {(Math.abs(opp.edge) * 100).toFixed(1)}% edge
                                      </span>
                                    </div>
                                  </div>
                                  <LinkIcon className="w-4 h-4 text-green-600 flex-shrink-0" />
                                </div>
                              </Link>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Linked Trades */}
                      {article.relevant_trades && article.relevant_trades.length > 0 && (
                        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <Activity className="w-4 h-4 text-blue-600" />
                            <span className="text-xs font-semibold text-blue-900">
                              Your Open Trades ({article.relevant_trades.length})
                            </span>
                          </div>
                          <div className="space-y-2">
                            {article.relevant_trades.map((trade, tradeIdx) => (
                              <Link
                                key={tradeIdx}
                                to={createPageUrl("Portfolio")}
                                className="block p-2 bg-white border border-blue-300 rounded hover:border-blue-400 transition-colors"
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex-1 min-w-0">
                                    <div className="text-xs font-medium text-slate-900 line-clamp-1">
                                      {trade.question}
                                    </div>
                                    <div className="flex items-center gap-2 mt-1">
                                      <Badge variant="outline" className="text-xs border-slate-300">
                                        {trade.platform}
                                      </Badge>
                                      <Badge className={`text-xs ${
                                        trade.direction === 'Long' 
                                          ? 'bg-green-100 text-green-700'
                                          : 'bg-red-100 text-red-700'
                                      }`}>
                                        {trade.direction}
                                      </Badge>
                                      <span className={`text-xs font-semibold ${
                                        trade.pnl >= 0 ? 'text-green-600' : 'text-red-600'
                                      }`}>
                                        {trade.pnl >= 0 ? '+' : ''}${trade.pnl.toFixed(2)}
                                      </span>
                                    </div>
                                  </div>
                                  <LinkIcon className="w-4 h-4 text-blue-600 flex-shrink-0" />
                                </div>
                              </Link>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <AlertCircle className="w-16 h-16 mx-auto text-slate-300 mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No News Found</h3>
            <p className="text-sm text-slate-600 mb-6">
              {searchQuery || filterPlatform !== 'all' || filterCategory !== 'all' || filterSentiment !== 'all' || showOnlyRelevant
                ? "Try adjusting your filters or search query"
                : "Click refresh to fetch real-time news with AI analysis"
              }
            </p>
            <Button onClick={handleRefresh} className="bg-blue-600 hover:bg-blue-700 text-white">
              <RefreshCw className="w-4 h-4 mr-2" />
              Fetch Real-Time News
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}