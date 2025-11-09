import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Brain, Loader2, TrendingUp, TrendingDown, Activity } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

export default function SentimentEngine() {
  const [analyzing, setAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);

  const { data: markets = [] } = useQuery({
    queryKey: ['markets'],
    queryFn: () => base44.entities.Market.list('-created_date', 50),
    initialData: [],
  });

  const { data: opportunities = [] } = useQuery({
    queryKey: ['opportunities'],
    queryFn: () => base44.entities.Opportunity.list('-created_date', 50),
    initialData: [],
  });

  const analyzeSentimentMutation = useMutation({
    mutationFn: async () => {
      setAnalyzing(true);
      setProgress(10);

      const marketTopics = markets.slice(0, 10).map(m => m.question).join('; ');

      setProgress(30);

      const prompt = `You are a market sentiment analysis AI. Analyze the CURRENT market sentiment across prediction markets, news, and social media.

MARKET DATA OVERVIEW:
${marketTopics}

Total active markets: ${markets.length}
Active opportunities: ${opportunities.length}

ANALYSIS REQUIREMENTS:

1. **News Sentiment Analysis**
   - Fetch latest news from major outlets (CNN, Bloomberg, Reuters, BBC)
   - Analyze tone, headlines, and breaking stories
   - Weight: 40%

2. **Social Media Sentiment**
   - Analyze Twitter/X trending topics and sentiment
   - Reddit discussions in relevant communities
   - Weight: 30%

3. **Market Data Sentiment**
   - Price movements and volatility in prediction markets
   - Trading volumes and liquidity
   - Opportunity distribution (bullish vs bearish)
   - Weight: 30%

4. **Calculate Overall Sentiment Score**
   - Scale: 0-100
   - 0-20: Extreme Fear 😱
   - 21-40: Fear 😟
   - 41-60: Neutral 😐
   - 61-80: Greed 😊
   - 81-100: Extreme Greed 🤑

5. **Provide Detailed Breakdown**
   - Key factors driving sentiment
   - Sector-specific sentiments (Politics, Crypto, Sports, etc.)
   - Sentiment shift indicators
   - Risk level assessment

Return comprehensive sentiment analysis with actionable insights.`;

      setProgress(60);

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            overall_sentiment_score: { type: "number" },
            sentiment_label: { type: "string" },
            sentiment_emoji: { type: "string" },
            trend: { type: "string" },
            news_sentiment: {
              type: "object",
              properties: {
                score: { type: "number" },
                summary: { type: "string" },
                key_headlines: { type: "array", items: { type: "string" } }
              }
            },
            social_sentiment: {
              type: "object",
              properties: {
                score: { type: "number" },
                summary: { type: "string" },
                trending_topics: { type: "array", items: { type: "string" } }
              }
            },
            market_sentiment: {
              type: "object",
              properties: {
                score: { type: "number" },
                summary: { type: "string" },
                volatility: { type: "string" }
              }
            },
            sector_sentiments: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  sector: { type: "string" },
                  score: { type: "number" },
                  emoji: { type: "string" }
                }
              }
            },
            key_drivers: { type: "array", items: { type: "string" } },
            risk_level: { type: "string" },
            recommendation: { type: "string" },
            last_updated: { type: "string" }
          }
        }
      });

      setProgress(100);
      return response;
    },
    onSettled: () => {
      setAnalyzing(false);
      setProgress(0);
    }
  });

  const sentimentData = analyzeSentimentMutation.data;

  const getSentimentColor = (score) => {
    if (score <= 20) return 'text-red-600';
    if (score <= 40) return 'text-orange-600';
    if (score <= 60) return 'text-yellow-600';
    if (score <= 80) return 'text-green-600';
    return 'text-emerald-600';
  };

  const getSentimentBg = (score) => {
    if (score <= 20) return 'bg-red-50 border-red-200';
    if (score <= 40) return 'bg-orange-50 border-orange-200';
    if (score <= 60) return 'bg-yellow-50 border-yellow-200';
    if (score <= 80) return 'bg-green-50 border-green-200';
    return 'bg-emerald-50 border-emerald-200';
  };

  return (
    <Card className="border-none shadow-sm">
      <CardHeader className="border-b border-slate-200">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-600" />
            Market Sentiment Engine
          </CardTitle>
          <Button
            onClick={() => analyzeSentimentMutation.mutate()}
            disabled={analyzing}
            size="sm"
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            {analyzing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Brain className="w-4 h-4 mr-2" />
                Analyze Sentiment
              </>
            )}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        {analyzing && (
          <div className="space-y-3 mb-6">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600">
                {progress < 30 ? 'Gathering market data...' :
                 progress < 60 ? 'Analyzing news & social media...' :
                 'Calculating sentiment scores...'}
              </span>
              <span className="text-slate-900 font-medium">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        {sentimentData ? (
          <div className="space-y-6">
            {/* Overall Sentiment Display */}
            <div className={`rounded-lg p-6 border-2 ${getSentimentBg(sentimentData.overall_sentiment_score)}`}>
              <div className="text-center">
                <div className="text-6xl mb-3">{sentimentData.sentiment_emoji}</div>
                <div className={`text-4xl font-bold mb-2 ${getSentimentColor(sentimentData.overall_sentiment_score)}`}>
                  {sentimentData.sentiment_label}
                </div>
                <div className="text-2xl font-semibold text-slate-900 mb-2">
                  {sentimentData.overall_sentiment_score}/100
                </div>
                <Badge variant="outline" className={
                  sentimentData.trend === 'Rising' ? 'border-green-300 text-green-700 bg-green-50' :
                  sentimentData.trend === 'Falling' ? 'border-red-300 text-red-700 bg-red-50' :
                  'border-slate-300 text-slate-700'
                }>
                  {sentimentData.trend === 'Rising' && <TrendingUp className="w-3 h-3 mr-1" />}
                  {sentimentData.trend === 'Falling' && <TrendingDown className="w-3 h-3 mr-1" />}
                  {sentimentData.trend === 'Stable' && <Activity className="w-3 h-3 mr-1" />}
                  {sentimentData.trend}
                </Badge>
              </div>
            </div>

            {/* Detailed Breakdown */}
            <div className="grid md:grid-cols-3 gap-4">
              <div className="border border-slate-200 rounded-lg p-4">
                <h4 className="font-semibold text-slate-900 mb-2 text-sm">📰 News Sentiment</h4>
                <div className={`text-3xl font-bold mb-2 ${getSentimentColor(sentimentData.news_sentiment.score)}`}>
                  {sentimentData.news_sentiment.score}/100
                </div>
                <p className="text-xs text-slate-600 mb-3">{sentimentData.news_sentiment.summary}</p>
                {sentimentData.news_sentiment.key_headlines?.slice(0, 2).map((headline, idx) => (
                  <p key={idx} className="text-xs text-slate-500 mb-1">• {headline}</p>
                ))}
              </div>

              <div className="border border-slate-200 rounded-lg p-4">
                <h4 className="font-semibold text-slate-900 mb-2 text-sm">💬 Social Sentiment</h4>
                <div className={`text-3xl font-bold mb-2 ${getSentimentColor(sentimentData.social_sentiment.score)}`}>
                  {sentimentData.social_sentiment.score}/100
                </div>
                <p className="text-xs text-slate-600 mb-3">{sentimentData.social_sentiment.summary}</p>
                {sentimentData.social_sentiment.trending_topics?.slice(0, 3).map((topic, idx) => (
                  <Badge key={idx} variant="outline" className="text-xs border-slate-300 mr-1 mb-1">
                    {topic}
                  </Badge>
                ))}
              </div>

              <div className="border border-slate-200 rounded-lg p-4">
                <h4 className="font-semibold text-slate-900 mb-2 text-sm">📊 Market Sentiment</h4>
                <div className={`text-3xl font-bold mb-2 ${getSentimentColor(sentimentData.market_sentiment.score)}`}>
                  {sentimentData.market_sentiment.score}/100
                </div>
                <p className="text-xs text-slate-600 mb-2">{sentimentData.market_sentiment.summary}</p>
                <Badge variant="outline" className="text-xs border-slate-300">
                  Volatility: {sentimentData.market_sentiment.volatility}
                </Badge>
              </div>
            </div>

            {/* Sector Sentiments */}
            {sentimentData.sector_sentiments && sentimentData.sector_sentiments.length > 0 && (
              <div className="border border-slate-200 rounded-lg p-4">
                <h4 className="font-semibold text-slate-900 mb-3 text-sm">Sector Breakdown</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {sentimentData.sector_sentiments.map((sector, idx) => (
                    <div key={idx} className="text-center p-3 bg-slate-50 rounded-lg">
                      <div className="text-2xl mb-1">{sector.emoji}</div>
                      <div className="text-xs font-medium text-slate-700 mb-1">{sector.sector}</div>
                      <div className={`text-lg font-bold ${getSentimentColor(sector.score)}`}>
                        {sector.score}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Key Drivers */}
            <div className="border border-slate-200 rounded-lg p-4">
              <h4 className="font-semibold text-slate-900 mb-3 text-sm">Key Drivers</h4>
              <ul className="space-y-2">
                {sentimentData.key_drivers?.map((driver, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-slate-700">
                    <span className="text-purple-600 mt-0.5">•</span>
                    <span>{driver}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Risk & Recommendation */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="border border-slate-200 rounded-lg p-4">
                <h4 className="font-semibold text-slate-900 mb-2 text-sm">Risk Level</h4>
                <Badge className={
                  sentimentData.risk_level === 'Low' ? 'bg-green-100 text-green-700' :
                  sentimentData.risk_level === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-red-100 text-red-700'
                }>
                  {sentimentData.risk_level}
                </Badge>
              </div>
              <div className="border border-slate-200 rounded-lg p-4">
                <h4 className="font-semibold text-slate-900 mb-2 text-sm">Recommendation</h4>
                <p className="text-sm text-slate-700">{sentimentData.recommendation}</p>
              </div>
            </div>

            <div className="text-xs text-slate-400 text-center">
              Last updated: {new Date().toLocaleString()}
            </div>
          </div>
        ) : (
          <div className="text-center py-12 text-slate-400">
            <Brain className="w-16 h-16 mx-auto mb-4 opacity-30" />
            <p className="text-sm mb-2">No sentiment data yet</p>
            <p className="text-xs">Click "Analyze Sentiment" to get real-time market mood</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}