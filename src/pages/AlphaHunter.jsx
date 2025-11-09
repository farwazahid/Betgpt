import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Target, TrendingUp, Brain, Zap, Activity, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import AlphaScanner from "../components/alpha/AlphaScanner";
import PredictionEngine from "../components/alpha/PredictionEngine";

export default function AlphaHunter() {
  const [liveStats, setLiveStats] = useState(null);

  const { data: opportunities = [] } = useQuery({
    queryKey: ['opportunities'],
    queryFn: () => base44.entities.Opportunity.filter({ status: 'Active' }, '-edge'),
    initialData: [],
    refetchInterval: 30000, // Refresh every 30s
  });

  const { data: markets = [] } = useQuery({
    queryKey: ['markets'],
    queryFn: () => base44.entities.Market.filter({ status: 'Active' }),
    initialData: [],
    refetchInterval: 60000, // Refresh every 60s
  });

  // Calculate real-time stats
  useEffect(() => {
    if (opportunities.length > 0 || markets.length > 0) {
      const recentOpps = opportunities.filter(o => {
        if (!o.created_date) return false;
        const age = Date.now() - new Date(o.created_date).getTime();
        return age < 24 * 60 * 60 * 1000; // Last 24 hours
      });

      const highValueAlpha = opportunities.filter(o => Math.abs(o.edge || 0) >= 0.1);
      
      const avgEdge = opportunities.length > 0
        ? opportunities.reduce((sum, o) => sum + Math.abs(o.edge || 0), 0) / opportunities.length
        : 0;
      
      const avgConfidence = opportunities.length > 0
        ? opportunities.reduce((sum, o) => sum + (o.confidence_score || 0), 0) / opportunities.length
        : 0;

      const recentMarkets = markets.filter(m => {
        if (!m.last_updated) return false;
        const age = Date.now() - new Date(m.last_updated).getTime();
        return age < 10 * 60 * 1000; // Last 10 minutes
      });

      setLiveStats({
        totalOpportunities: opportunities.length,
        recentOpportunities: recentOpps.length,
        highValueAlpha: highValueAlpha.length,
        avgEdge,
        avgConfidence,
        totalMarkets: markets.length,
        recentMarkets: recentMarkets.length
      });
    }
  }, [opportunities, markets]);

  const getLastScanTime = () => {
    if (opportunities.length === 0) return null;
    const mostRecent = opportunities.reduce((latest, opp) => {
      if (!opp.created_date) return latest;
      const oppDate = new Date(opp.created_date);
      return oppDate > latest ? oppDate : latest;
    }, new Date(0));
    
    if (mostRecent.getTime() === 0) return null;
    
    const minutesAgo = Math.floor((Date.now() - mostRecent.getTime()) / (1000 * 60));
    if (minutesAgo < 60) return `${minutesAgo}m ago`;
    const hoursAgo = Math.floor(minutesAgo / 60);
    if (hoursAgo < 24) return `${hoursAgo}h ago`;
    return `${Math.floor(hoursAgo / 24)}d ago`;
  };

  const lastScan = getLastScanTime();

  return (
    <div className="min-h-screen bg-white">
      {/* Header - Clean minimal style */}
      <div className="bg-white border-b border-slate-200 px-6 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Target className="w-6 h-6 text-slate-600" />
              <div>
                <h1 className="text-2xl font-semibold text-slate-900">Alpha Hunter</h1>
                <p className="text-sm text-slate-500 mt-1">
                  AI-powered detection of profitable market inefficiencies with real-time data
                </p>
              </div>
            </div>
            {lastScan && (
              <div className="flex items-center gap-2 text-sm text-slate-600 bg-slate-50 px-4 py-2 rounded-lg border border-slate-200">
                <Clock className="w-4 h-4" />
                <span>Last scan: {lastScan}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        {/* Live Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border border-slate-200 bg-white">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs text-slate-500">Alpha Opportunities</div>
                <Target className="w-4 h-4 text-slate-400" />
              </div>
              <div className="text-3xl font-semibold text-slate-900">
                {liveStats?.totalOpportunities || 0}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="text-xs border-green-300 text-green-700">
                  {liveStats?.highValueAlpha || 0} high-value
                </Badge>
                {liveStats?.recentOpportunities > 0 && (
                  <Badge variant="outline" className="text-xs border-blue-300 text-blue-700">
                    <Activity className="w-3 h-3 mr-1" />
                    {liveStats.recentOpportunities} today
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border border-slate-200 bg-white">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs text-slate-500">Avg Edge Found</div>
                <TrendingUp className="w-4 h-4 text-slate-400" />
              </div>
              <div className="text-3xl font-semibold text-slate-900">
                {((liveStats?.avgEdge || 0) * 100).toFixed(1)}%
              </div>
              <div className="text-xs text-slate-600 mt-1">Average mispricing</div>
            </CardContent>
          </Card>

          <Card className="border border-slate-200 bg-white">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs text-slate-500">AI Confidence</div>
                <Brain className="w-4 h-4 text-slate-400" />
              </div>
              <div className="text-3xl font-semibold text-slate-900">
                {((liveStats?.avgConfidence || 0) * 100).toFixed(0)}%
              </div>
              <div className="text-xs text-slate-600 mt-1">Average certainty</div>
            </CardContent>
          </Card>

          <Card className="border border-slate-200 bg-white">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs text-slate-500">Live Markets</div>
                <Zap className="w-4 h-4 text-slate-400" />
              </div>
              <div className="text-3xl font-semibold text-slate-900">
                {liveStats?.totalMarkets || 0}
              </div>
              <div className="flex items-center gap-2 mt-1">
                {liveStats?.recentMarkets > 0 && (
                  <Badge variant="outline" className="text-xs border-green-300 text-green-700">
                    <Activity className="w-3 h-3 mr-1" />
                    {liveStats.recentMarkets} fresh
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* What is Alpha Info */}
        <Card className="border border-slate-200 bg-white">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-slate-100 rounded-lg">
                <Target className="w-6 h-6 text-slate-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-slate-900 mb-2">What is "Alpha"?</h3>
                <p className="text-sm text-slate-600 mb-3">
                  Alpha is the edge you have over the market. It's when you know something the market doesn't, 
                  or when the market is systematically wrong due to behavioral biases, information gaps, or mathematical errors.
                </p>
                <div className="grid md:grid-cols-2 gap-4 text-sm text-slate-700">
                  <div>
                    <strong className="text-slate-900 block mb-1">How We Find Alpha:</strong>
                    <ul className="mt-1 space-y-1 text-xs text-slate-600">
                      <li>• Fetch LIVE prices from Polymarket, Kalshi, Manifold</li>
                      <li>• AI analyzes with real-time news + sentiment data</li>
                      <li>• Compare AI prediction to market price</li>
                      <li>• If difference {">"} 3%, that's exploitable alpha</li>
                      <li>• Calculate expected value and optimal bet size</li>
                    </ul>
                  </div>
                  <div>
                    <strong className="text-slate-900 block mb-1">Why Markets Get It Wrong:</strong>
                    <ul className="mt-1 space-y-1 text-xs text-slate-600">
                      <li>• Recency bias (overweight recent events)</li>
                      <li>• Herding behavior (everyone follows the crowd)</li>
                      <li>• Information asymmetry (news not priced in yet)</li>
                      <li>• Low liquidity (small markets easily manipulated)</li>
                      <li>• Emotional trading (fear and greed)</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Alpha Scanner */}
        <AlphaScanner />

        {/* Prediction Engine */}
        <PredictionEngine />

        {/* How It Works */}
        <Card className="border border-slate-200 bg-white">
          <CardContent className="p-6">
            <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Brain className="w-5 h-5 text-slate-600" />
              How Alpha Hunter Works (With Real-Time Data)
            </h3>
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-3">
                  <span className="text-xl font-bold text-blue-600">1</span>
                </div>
                <h4 className="font-semibold text-slate-900 mb-2 text-sm">Live Data Ingestion</h4>
                <p className="text-xs text-slate-600">
                  Fetches REAL-TIME prices, volumes, and liquidity from Polymarket, Kalshi, and Manifold APIs. 
                  Updates every scan with fresh data - no stale prices.
                </p>
              </div>

              <div>
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mb-3">
                  <span className="text-xl font-bold text-purple-600">2</span>
                </div>
                <h4 className="font-semibold text-slate-900 mb-2 text-sm">AI + News Analysis</h4>
                <p className="text-xs text-slate-600">
                  Uses NewsAPI for breaking news, analyzes sentiment, polls, historical data, and statistical models. 
                  AI estimates true probability independently with NO market bias.
                </p>
              </div>

              <div>
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mb-3">
                  <span className="text-xl font-bold text-green-600">3</span>
                </div>
                <h4 className="font-semibold text-slate-900 mb-2 text-sm">Alpha Detection</h4>
                <p className="text-xs text-slate-600">
                  Compares AI prediction to LIVE market price. If difference {">"} 3%, flags as alpha. 
                  Calculates edge, expected value, Kelly sizing, and risk factors.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Trading Strategy */}
        <Card className="border border-slate-200 bg-white">
          <CardContent className="p-6">
            <h3 className="font-semibold text-slate-900 mb-3">Trading Strategy</h3>
            <div className="grid md:grid-cols-2 gap-4 text-sm text-slate-700">
              <div>
                <strong className="text-slate-900 block mb-2">When to Trade:</strong>
                <ul className="space-y-1 text-xs text-slate-600">
                  <li>✓ Edge {">"} 5% (strong mispricing)</li>
                  <li>✓ Confidence {">"} 70% (AI is certain)</li>
                  <li>✓ Liquidity {">"} $1000 (can exit easily)</li>
                  <li>✓ Fresh data (scanned within last hour)</li>
                  <li>✓ Time sensitivity low (edge won't disappear fast)</li>
                </ul>
              </div>
              <div>
                <strong className="text-slate-900 block mb-2">Position Sizing:</strong>
                <ul className="space-y-1 text-xs text-slate-600">
                  <li>• Use Kelly Criterion (optimal bet size)</li>
                  <li>• Typically 25-50% of full Kelly (conservative)</li>
                  <li>• Never risk more than 5% of bankroll per trade</li>
                  <li>• Diversify across multiple opportunities</li>
                  <li>• Size up on high-confidence, high-edge plays</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Data Sources */}
        <Card className="border border-slate-200 bg-white">
          <CardContent className="p-6">
            <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <Activity className="w-5 h-5 text-slate-600" />
              Real-Time Data Sources
            </h3>
            <div className="grid md:grid-cols-3 gap-4 text-xs">
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <strong className="text-blue-900 block mb-2">Market Data APIs</strong>
                <ul className="space-y-1 text-blue-800">
                  <li>• Polymarket API (real prices)</li>
                  <li>• Kalshi API (real prices)</li>
                  <li>• Manifold API (real prices)</li>
                  <li>• Yahoo Finance (stocks)</li>
                </ul>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                <strong className="text-purple-900 block mb-2">News & Sentiment</strong>
                <ul className="space-y-1 text-purple-800">
                  <li>• NewsAPI (breaking news)</li>
                  <li>• Google News (headlines)</li>
                  <li>• Reuters (financial)</li>
                  <li>• Bloomberg (markets)</li>
                </ul>
              </div>
              <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                <strong className="text-green-900 block mb-2">AI Analysis</strong>
                <ul className="space-y-1 text-green-800">
                  <li>• LLM probability estimation</li>
                  <li>• Sentiment analysis</li>
                  <li>• Historical pattern matching</li>
                  <li>• Bayesian inference</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}