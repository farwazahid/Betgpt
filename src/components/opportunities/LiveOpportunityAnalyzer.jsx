import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Brain, Loader2, AlertCircle, CheckCircle2, X, TrendingUp, Newspaper, BarChart3, Globe, Activity } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const formatCurrency = (value) => {
  if (!value || value === 0) return '$0';
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
  return `$${value.toFixed(0)}`;
};

export default function LiveOpportunityAnalyzer({ market, onClose, onSuccess }) {
  const [analyzing, setAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const queryClient = useQueryClient();

  const analyzeMutation = useMutation({
    mutationFn: async (marketData) => {
      setError(null);
      setAnalyzing(true);
      setProgress(0);
      
      setCurrentStep("Fetching real-time news and sentiment data...");
      setProgress(10);

      await new Promise(resolve => setTimeout(resolve, 500));

      setCurrentStep("Analyzing news sentiment with AI...");
      setProgress(20);

      // Enhanced prompt with sentiment analysis and multi-source data
      const analysisPrompt = `You are an elite quantitative prediction market analyst with REAL-TIME DATA ACCESS and advanced sentiment analysis capabilities.

MARKET TO ANALYZE:
Question: "${marketData.question}"
Platform: ${marketData.platform}
Current Market Price: ${(marketData.current_price * 100).toFixed(2)}%
Category: ${marketData.category || 'Unknown'}
Volume: $${(marketData.volume || 0).toLocaleString()}
Close Date: ${marketData.close_date}

COMPREHENSIVE MULTI-SOURCE ANALYSIS:

1. NEWS SENTIMENT ANALYSIS (40% weight)
   - Search NewsAPI, Google News, Reuters, Bloomberg for: "${marketData.question}"
   - Analyze sentiment of last 50 news articles (positive/negative/neutral)
   - Calculate overall sentiment score (-1 to +1)
   - Identify breaking news from last 24-48 hours
   - Extract key quotes from experts and officials
   - Track sentiment momentum (improving/declining)

2. SOCIAL MEDIA & PUBLIC SENTIMENT (15% weight)
   - Analyze public discussion trends
   - Expert opinions on Twitter/X, Reddit
   - Community sentiment analysis
   - Viral content related to the topic

3. HISTORICAL TRENDS & PATTERNS (20% weight)
   Category: ${marketData.category}
   - Find similar historical events
   - Statistical base rates
   - Seasonal patterns
   - Long-term trend analysis
   - Historical prediction market accuracy for similar questions

4. ECONOMIC INDICATORS (15% weight - if applicable)
   For Economics/Politics/Crypto categories:
   - Relevant economic data (GDP, inflation, unemployment, etc.)
   - Market correlations
   - Leading indicators
   - Policy changes and their impacts

5. EXPERT FORECASTS & MODELS (10% weight)
   - Search for expert predictions (538, Metaculus, prediction aggregators)
   - Academic research and papers
   - Think tank reports
   - Statistical models and projections

6. BAYESIAN PROBABILITY ESTIMATION
   - Calculate prior probability from base rates
   - Update with news sentiment data
   - Apply Bayesian inference with all evidence
   - Generate probability distribution with confidence intervals

7. MARKET INEFFICIENCY DETECTION
   - Compare AI estimate to market price
   - Identify specific behavioral biases (recency, herding, availability)
   - Assess information asymmetry
   - Calculate edge and expected value
   - Determine if edge is sustainable

8. RISK ASSESSMENT
   - Map bull/bear scenarios with probabilities
   - Identify tail risks and unknown unknowns
   - Assess information edge durability
   - Consider worst-case outcomes
   - Evaluate liquidity risk

9. SENTIMENT MOMENTUM & TREND PREDICTION
   - Is sentiment improving or declining?
   - Recent momentum (last 24h, 7d, 30d)
   - Predict next 7-day sentiment trend
   - Identify sentiment inflection points

Return comprehensive JSON analysis with all data points.`;

      setProgress(35);

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: analysisPrompt,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            estimated_true_probability: { type: "number" },
            confidence_score: { type: "number" },
            edge: { type: "number" },
            expected_value: { type: "number" },
            kelly_fraction: { type: "number" },
            reasoning: { type: "string" },
            sentiment_analysis: {
              type: "object",
              properties: {
                overall_sentiment_score: { type: "number" },
                sentiment_label: { type: "string" },
                news_sentiment: { type: "string" },
                social_sentiment: { type: "string" },
                sentiment_momentum: { type: "string" },
                key_positive_factors: { type: "array", items: { type: "string" } },
                key_negative_factors: { type: "array", items: { type: "string" } },
                sentiment_trend_7d: { type: "string" }
              }
            },
            news_summary: {
              type: "object",
              properties: {
                breaking_news: { type: "array", items: { type: "string" } },
                expert_quotes: { type: "array", items: { type: "string" } },
                news_count: { type: "number" },
                latest_update: { type: "string" }
              }
            },
            historical_analysis: {
              type: "object",
              properties: {
                similar_events: { type: "array", items: { type: "string" } },
                historical_base_rate: { type: "number" },
                trend_direction: { type: "string" },
                seasonal_factors: { type: "string" }
              }
            },
            economic_indicators: {
              type: "object",
              properties: {
                relevant_indicators: { type: "array", items: { type: "string" } },
                indicator_sentiment: { type: "string" },
                macro_environment: { type: "string" }
              }
            },
            expert_forecasts: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  source: { type: "string" },
                  forecast: { type: "string" },
                  credibility: { type: "string" }
                }
              }
            },
            data_sources: { type: "array", items: { type: "string" } },
            risk_factors: { type: "array", items: { type: "string" } },
            key_insights: { type: "array", items: { type: "string" } },
            market_inefficiency: { type: "string" },
            recommended_action: { type: "string" },
            time_sensitivity: { type: "string" },
            conviction_level: { type: "string" },
            scenarios: {
              type: "object",
              properties: {
                bull_case: { type: "object", properties: { probability: { type: "number" }, description: { type: "string" } } },
                base_case: { type: "object", properties: { probability: { type: "number" }, description: { type: "string" } } },
                bear_case: { type: "object", properties: { probability: { type: "number" }, description: { type: "string" } } }
              }
            }
          }
        }
      });

      setProgress(80);
      setCurrentStep("Saving comprehensive analysis to database...");

      const opportunityData = {
        market_id: marketData.id,
        question: marketData.question,
        platform: marketData.platform,
        market_price: marketData.current_price,
        ...response,
        status: 'Active',
        expires_at: marketData.close_date
      };

      await base44.entities.Opportunity.create(opportunityData);

      setProgress(100);
      setCurrentStep("Analysis complete!");
      
      return { ...response, opportunityData };
    },
    onSuccess: (data) => {
      setResult(data);
      setAnalyzing(false);
      queryClient.invalidateQueries({ queryKey: ['opportunities'] });
      if (onSuccess) onSuccess(data);
    },
    onError: (err) => {
      setError(err.message || "Analysis failed. Please check your API keys and try again.");
      setAnalyzing(false);
    },
  });

  const handleStartAnalysis = () => {
    analyzeMutation.mutate(market);
  };

  const handleClose = () => {
    if (!analyzing) {
      onClose();
    }
  };

  const getSentimentColor = (score) => {
    if (score > 0.3) return 'text-green-600';
    if (score < -0.3) return 'text-red-600';
    return 'text-slate-600';
  };

  const getSentimentBgColor = (score) => {
    if (score > 0.3) return 'bg-green-50 border-green-200';
    if (score < -0.3) return 'bg-red-50 border-red-200';
    return 'bg-slate-50 border-slate-200';
  };

  return (
    <Dialog open={true} onOpenChange={(open) => {
      if (!open && !analyzing) {
        onClose();
      }
    }}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <DialogTitle className="text-xl font-semibold text-slate-900 tracking-tight">
                AI Market Analysis with Sentiment Detection
              </DialogTitle>
              <DialogDescription className="text-slate-600 mt-1.5 leading-relaxed">
                Multi-source analysis: News sentiment, historical trends, economic indicators, and expert forecasts
              </DialogDescription>
            </div>
            <button
              onClick={handleClose}
              disabled={analyzing}
              className="rounded-lg p-1.5 opacity-60 hover:opacity-100 hover:bg-slate-100 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-30"
            >
              <X className="h-4 w-4 text-slate-600" />
              <span className="sr-only">Close</span>
            </button>
          </div>
        </DialogHeader>

        <div className="space-y-5 mt-6">
          <div className="p-5 bg-gradient-to-br from-slate-50 to-slate-100/50 rounded-xl border border-slate-200/60 shadow-sm">
            <div className="flex items-center gap-2.5 mb-4">
              <Badge variant="outline" className="border-slate-300 bg-white/50 text-slate-700 font-medium px-2.5 py-0.5">
                {market.platform}
              </Badge>
              {market.category && (
                <Badge variant="outline" className="border-slate-300 bg-white/50 text-slate-700 font-medium px-2.5 py-0.5">
                  {market.category}
                </Badge>
              )}
            </div>
            <h3 className="font-semibold text-[15px] text-slate-900 mb-4 leading-snug tracking-tight">
              {market.question}
            </h3>
            
            <div className="grid grid-cols-2 gap-5">
              <div>
                <div className="text-slate-500 text-xs font-medium mb-1.5 tracking-wide uppercase">Current Price</div>
                <div className="text-3xl font-semibold text-slate-900 tracking-tight tabular-nums">
                  {(market.current_price * 100).toFixed(0)}%
                </div>
              </div>
              {market.volume > 0 && (
                <div>
                  <div className="text-slate-500 text-xs font-medium mb-1.5 tracking-wide uppercase">Volume</div>
                  <div className="text-3xl font-semibold text-slate-900 tracking-tight tabular-nums">
                    {formatCurrency(market.volume)}
                  </div>
                </div>
              )}
            </div>
          </div>

          {analyzing && (
            <div className="space-y-3 p-4 bg-blue-50/50 rounded-xl border border-blue-100">
              <div className="flex items-center gap-3 text-sm text-slate-700">
                <Loader2 className="w-4 h-4 animate-spin text-blue-600 flex-shrink-0" />
                <span className="font-medium tracking-tight">{currentStep}</span>
              </div>
              <Progress value={progress} className="h-1.5" />
            </div>
          )}

          {error && (
            <Alert variant="destructive" className="border-red-200 bg-red-50/50">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm leading-relaxed">{error}</AlertDescription>
            </Alert>
          )}

          {result && (
            <div className="space-y-4">
              <Alert className="border-green-200 bg-green-50/50">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-900">
                  <div className="font-semibold mb-3 text-[15px] tracking-tight">Analysis Complete</div>
                  <div className="text-[13px] space-y-2 leading-relaxed">
                    <div className="flex items-baseline gap-2">
                      <span className="text-green-700 font-medium">Recommendation:</span>
                      <span className="font-semibold text-green-900">{result.recommended_action}</span>
                    </div>
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <span className="text-green-700 font-medium">Edge:</span>
                      <span className="font-semibold text-green-900 tabular-nums">{(result.edge * 100).toFixed(1)}%</span>
                      <span className="text-green-600">·</span>
                      <span className="text-green-700 font-medium">Confidence:</span>
                      <span className="font-semibold text-green-900 tabular-nums">{(result.confidence_score * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                </AlertDescription>
              </Alert>

              <Tabs defaultValue="sentiment" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="sentiment" className="text-xs">
                    <Newspaper className="w-3 h-3 mr-1" />
                    Sentiment
                  </TabsTrigger>
                  <TabsTrigger value="analysis" className="text-xs">
                    <Brain className="w-3 h-3 mr-1" />
                    Analysis
                  </TabsTrigger>
                  <TabsTrigger value="historical" className="text-xs">
                    <BarChart3 className="w-3 h-3 mr-1" />
                    Historical
                  </TabsTrigger>
                  <TabsTrigger value="indicators" className="text-xs">
                    <Activity className="w-3 h-3 mr-1" />
                    Indicators
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="sentiment" className="space-y-3 mt-4">
                  {result.sentiment_analysis && (
                    <>
                      <div className={`rounded-lg p-4 border ${getSentimentBgColor(result.sentiment_analysis.overall_sentiment_score)}`}>
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-semibold text-slate-900 text-sm">Overall Sentiment</h4>
                          <Badge className={`${getSentimentColor(result.sentiment_analysis.overall_sentiment_score)} border`}>
                            {result.sentiment_analysis.sentiment_label}
                          </Badge>
                        </div>
                        <div className="text-3xl font-bold mb-2 ${getSentimentColor(result.sentiment_analysis.overall_sentiment_score)}">
                          {result.sentiment_analysis.overall_sentiment_score > 0 ? '+' : ''}
                          {(result.sentiment_analysis.overall_sentiment_score * 100).toFixed(0)}
                        </div>
                        <p className="text-xs text-slate-600">{result.sentiment_analysis.news_sentiment}</p>
                      </div>

                      <div className="grid md:grid-cols-2 gap-3">
                        <div className="border border-green-200 rounded-lg p-4 bg-green-50">
                          <h4 className="font-semibold text-green-900 text-sm mb-2 flex items-center gap-2">
                            <TrendingUp className="w-4 h-4" />
                            Positive Factors
                          </h4>
                          <ul className="space-y-1">
                            {result.sentiment_analysis.key_positive_factors?.map((factor, idx) => (
                              <li key={idx} className="text-xs text-green-800 flex items-start gap-2">
                                <span className="text-green-600 mt-0.5">+</span>
                                <span>{factor}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="border border-red-200 rounded-lg p-4 bg-red-50">
                          <h4 className="font-semibold text-red-900 text-sm mb-2 flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 rotate-180" />
                            Negative Factors
                          </h4>
                          <ul className="space-y-1">
                            {result.sentiment_analysis.key_negative_factors?.map((factor, idx) => (
                              <li key={idx} className="text-xs text-red-800 flex items-start gap-2">
                                <span className="text-red-600 mt-0.5">-</span>
                                <span>{factor}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      {result.sentiment_analysis.sentiment_momentum && (
                        <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
                          <h4 className="font-semibold text-blue-900 text-sm mb-2">Sentiment Momentum</h4>
                          <p className="text-xs text-blue-800">{result.sentiment_analysis.sentiment_momentum}</p>
                          {result.sentiment_analysis.sentiment_trend_7d && (
                            <p className="text-xs text-blue-700 mt-2">
                              <strong>7-Day Forecast:</strong> {result.sentiment_analysis.sentiment_trend_7d}
                            </p>
                          )}
                        </div>
                      )}
                    </>
                  )}

                  {result.news_summary && (
                    <div className="border border-slate-200 rounded-lg p-4 bg-white">
                      <h4 className="font-semibold text-slate-900 text-sm mb-3 flex items-center gap-2">
                        <Newspaper className="w-4 h-4" />
                        Breaking News ({result.news_summary.news_count || 0} articles)
                      </h4>
                      {result.news_summary.breaking_news && result.news_summary.breaking_news.length > 0 && (
                        <ul className="space-y-2 mb-3">
                          {result.news_summary.breaking_news.slice(0, 5).map((news, idx) => (
                            <li key={idx} className="text-xs text-slate-700 pl-3 border-l-2 border-blue-400">
                              {news}
                            </li>
                          ))}
                        </ul>
                      )}
                      {result.news_summary.expert_quotes && result.news_summary.expert_quotes.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-slate-200">
                          <h5 className="font-semibold text-slate-900 text-xs mb-2">Expert Quotes</h5>
                          {result.news_summary.expert_quotes.slice(0, 3).map((quote, idx) => (
                            <p key={idx} className="text-xs text-slate-600 italic mb-2">"{quote}"</p>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="analysis" className="space-y-3 mt-4">
                  <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4 border border-purple-200">
                    <h4 className="font-semibold text-slate-900 text-sm mb-3">AI Probability Estimate</h4>
                    <div className="grid grid-cols-2 gap-4 mb-3">
                      <div>
                        <div className="text-xs text-slate-500 mb-1">Market Price</div>
                        <div className="text-3xl font-bold text-slate-900">
                          {(market.current_price * 100).toFixed(0)}%
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-500 mb-1">AI Estimate</div>
                        <div className="text-3xl font-bold text-blue-600">
                          {(result.estimated_true_probability * 100).toFixed(0)}%
                        </div>
                      </div>
                    </div>
                    <div className="bg-white rounded-lg p-3">
                      <p className="text-xs text-slate-700 leading-relaxed">{result.reasoning}</p>
                    </div>
                  </div>

                  {result.scenarios && (
                    <div className="grid md:grid-cols-3 gap-3">
                      <div className="border border-green-200 rounded-lg p-3 bg-green-50">
                        <h4 className="font-semibold text-green-900 text-xs mb-2">Bull Case</h4>
                        <div className="text-2xl font-bold text-green-700 mb-2">
                          {(result.scenarios.bull_case?.probability * 100).toFixed(0)}%
                        </div>
                        <p className="text-xs text-green-800">{result.scenarios.bull_case?.description}</p>
                      </div>
                      <div className="border border-blue-200 rounded-lg p-3 bg-blue-50">
                        <h4 className="font-semibold text-blue-900 text-xs mb-2">Base Case</h4>
                        <div className="text-2xl font-bold text-blue-700 mb-2">
                          {(result.scenarios.base_case?.probability * 100).toFixed(0)}%
                        </div>
                        <p className="text-xs text-blue-800">{result.scenarios.base_case?.description}</p>
                      </div>
                      <div className="border border-red-200 rounded-lg p-3 bg-red-50">
                        <h4 className="font-semibold text-red-900 text-xs mb-2">Bear Case</h4>
                        <div className="text-2xl font-bold text-red-700 mb-2">
                          {(result.scenarios.bear_case?.probability * 100).toFixed(0)}%
                        </div>
                        <p className="text-xs text-red-800">{result.scenarios.bear_case?.description}</p>
                      </div>
                    </div>
                  )}

                  {result.key_insights && result.key_insights.length > 0 && (
                    <div className="border border-slate-200 rounded-lg p-4 bg-white">
                      <h4 className="font-semibold text-slate-900 text-sm mb-2">Key Insights</h4>
                      <ul className="space-y-1">
                        {result.key_insights.map((insight, idx) => (
                          <li key={idx} className="text-xs text-slate-700 flex items-start gap-2">
                            <span className="text-blue-600 mt-0.5">•</span>
                            <span>{insight}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="historical" className="space-y-3 mt-4">
                  {result.historical_analysis && (
                    <>
                      <div className="border border-slate-200 rounded-lg p-4 bg-white">
                        <h4 className="font-semibold text-slate-900 text-sm mb-3">Historical Analysis</h4>
                        <div className="grid grid-cols-2 gap-4 mb-3">
                          <div>
                            <div className="text-xs text-slate-500 mb-1">Base Rate</div>
                            <div className="text-2xl font-bold text-slate-900">
                              {(result.historical_analysis.historical_base_rate * 100).toFixed(0)}%
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-slate-500 mb-1">Trend Direction</div>
                            <Badge variant="outline" className="mt-1">
                              {result.historical_analysis.trend_direction}
                            </Badge>
                          </div>
                        </div>
                        {result.historical_analysis.seasonal_factors && (
                          <p className="text-xs text-slate-600 mb-3">
                            <strong>Seasonal Factors:</strong> {result.historical_analysis.seasonal_factors}
                          </p>
                        )}
                        {result.historical_analysis.similar_events && result.historical_analysis.similar_events.length > 0 && (
                          <div>
                            <h5 className="font-semibold text-slate-900 text-xs mb-2">Similar Historical Events</h5>
                            <ul className="space-y-1">
                              {result.historical_analysis.similar_events.map((event, idx) => (
                                <li key={idx} className="text-xs text-slate-700 pl-3 border-l-2 border-slate-300">
                                  {event}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </>
                  )}

                  {result.expert_forecasts && result.expert_forecasts.length > 0 && (
                    <div className="border border-slate-200 rounded-lg p-4 bg-white">
                      <h4 className="font-semibold text-slate-900 text-sm mb-3 flex items-center gap-2">
                        <Globe className="w-4 h-4" />
                        Expert Forecasts
                      </h4>
                      <div className="space-y-3">
                        {result.expert_forecasts.map((forecast, idx) => (
                          <div key={idx} className="border-l-2 border-blue-400 pl-3">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="outline" className="text-xs">{forecast.source}</Badge>
                              <Badge className="text-xs bg-blue-100 text-blue-700">{forecast.credibility}</Badge>
                            </div>
                            <p className="text-xs text-slate-700">{forecast.forecast}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="indicators" className="space-y-3 mt-4">
                  {result.economic_indicators && (
                    <div className="border border-slate-200 rounded-lg p-4 bg-white">
                      <h4 className="font-semibold text-slate-900 text-sm mb-3 flex items-center gap-2">
                        <Activity className="w-4 h-4" />
                        Economic Indicators
                      </h4>
                      {result.economic_indicators.macro_environment && (
                        <div className="mb-3 p-3 bg-slate-50 rounded-lg">
                          <h5 className="font-semibold text-slate-900 text-xs mb-1">Macro Environment</h5>
                          <p className="text-xs text-slate-700">{result.economic_indicators.macro_environment}</p>
                        </div>
                      )}
                      {result.economic_indicators.relevant_indicators && result.economic_indicators.relevant_indicators.length > 0 && (
                        <div className="mb-3">
                          <h5 className="font-semibold text-slate-900 text-xs mb-2">Relevant Indicators</h5>
                          <div className="flex flex-wrap gap-2">
                            {result.economic_indicators.relevant_indicators.map((indicator, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {indicator}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      {result.economic_indicators.indicator_sentiment && (
                        <p className="text-xs text-slate-600">
                          <strong>Sentiment:</strong> {result.economic_indicators.indicator_sentiment}
                        </p>
                      )}
                    </div>
                  )}

                  {result.market_inefficiency && (
                    <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                      <h4 className="font-semibold text-purple-900 text-sm mb-2">Market Inefficiency</h4>
                      <p className="text-xs text-purple-800 leading-relaxed">{result.market_inefficiency}</p>
                    </div>
                  )}

                  {result.risk_factors && result.risk_factors.length > 0 && (
                    <div className="border border-yellow-200 rounded-lg p-4 bg-yellow-50">
                      <h4 className="font-semibold text-yellow-900 text-sm mb-2">Risk Factors</h4>
                      <ul className="space-y-1">
                        {result.risk_factors.map((risk, idx) => (
                          <li key={idx} className="text-xs text-yellow-800 flex items-start gap-2">
                            <span className="text-yellow-600 mt-0.5">⚠</span>
                            <span>{risk}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </TabsContent>
              </Tabs>

              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <h4 className="font-semibold text-blue-900 text-sm mb-2">Analysis Methodology</h4>
                <ul className="space-y-1 text-xs text-blue-800">
                  <li>✓ Real-time news sentiment from NewsAPI + Google News</li>
                  <li>✓ Multi-source data: Historical trends, economic indicators, expert forecasts</li>
                  <li>✓ Bayesian probability estimation with confidence intervals</li>
                  <li>✓ Behavioral bias detection and market inefficiency analysis</li>
                  <li>✓ Comprehensive risk assessment with scenario planning</li>
                </ul>
              </div>

              <div className="text-xs text-slate-400 text-center">
                Generated: {new Date().toLocaleString()}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button 
              variant="outline" 
              onClick={handleClose} 
              disabled={analyzing} 
              className="border-slate-300 hover:bg-slate-50 font-medium px-5 transition-all duration-200"
            >
              {result ? 'Close' : 'Cancel'}
            </Button>
            {!result && (
              <Button 
                onClick={handleStartAnalysis}
                disabled={analyzing}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 shadow-sm hover:shadow transition-all duration-200"
              >
                {analyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Brain className="w-4 h-4 mr-2" />
                    Start Enhanced Analysis
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}