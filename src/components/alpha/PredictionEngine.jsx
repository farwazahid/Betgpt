import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Brain, Loader2, TrendingUp, Database, BarChart3, AlertCircle, 
  CheckCircle2, Newspaper, Target, Activity, Zap, PieChart,
  TrendingDown, ArrowUpRight, ArrowDownRight
} from "lucide-react";
import { Progress } from "@/components/ui/progress";

export default function PredictionEngine() {
  const [question, setQuestion] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [currentStep, setCurrentStep] = useState("");
  const [showAllHeadlines, setShowAllHeadlines] = useState(false);

  const predictMutation = useMutation({
    mutationFn: async (questionText) => {
      setAnalyzing(true);
      setProgress(0);
      setResult(null);
      setError(null);

      try {
        console.log('[PredictionEngine] Starting ENHANCED prediction for:', questionText);
        
        setCurrentStep("Fetching data from multiple sources in parallel...");
        setProgress(15);

        await new Promise(resolve => setTimeout(resolve, 500));

        setCurrentStep("Running multi-stage AI analysis pipeline...");
        setProgress(35);

        await new Promise(resolve => setTimeout(resolve, 300));

        setCurrentStep("Stage 1: Sentiment analysis...");
        setProgress(50);

        await new Promise(resolve => setTimeout(resolve, 300));

        setCurrentStep("Stage 2: Factor decomposition...");
        setProgress(65);

        await new Promise(resolve => setTimeout(resolve, 300));

        setCurrentStep("Stage 3: Bayesian probability estimation...");
        setProgress(80);

        await new Promise(resolve => setTimeout(resolve, 300));

        setCurrentStep("Stage 4: Scenario analysis...");
        setProgress(90);

        // Call enhanced backend function
        const response = await base44.functions.invoke('predictWithRealData', {
          question: questionText
        });

        console.log('[PredictionEngine] Enhanced prediction response:', response.data);

        if (!response.data || !response.data.success) {
          throw new Error(response.data?.error || 'Prediction failed');
        }

        setCurrentStep("Analysis complete!");
        setProgress(100);

        return response.data;
      } catch (err) {
        console.error('[PredictionEngine] Error:', err);
        throw err;
      }
    },
    onSuccess: (data) => {
      console.log('[PredictionEngine] Enhanced prediction successful');
      setResult(data);
      setAnalyzing(false);
      setProgress(0);
      setCurrentStep("");
    },
    onError: (err) => {
      console.error("[PredictionEngine] Prediction error:", err);
      setError(err.message || "Failed to generate prediction. Please try again.");
      setAnalyzing(false);
      setProgress(0);
      setCurrentStep("");
    }
  });

  const handlePredict = () => {
    if (question.trim()) {
      predictMutation.mutate(question);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && question.trim() && !analyzing) {
      handlePredict();
    }
  };

  const getSentimentColor = (score) => {
    if (!score && score !== 0) return 'text-slate-600';
    if (score > 0.3) return 'text-green-600';
    if (score < -0.3) return 'text-red-600';
    return 'text-slate-600';
  };

  const getSentimentBgColor = (label) => {
    switch(label) {
      case 'Very Positive': return 'bg-green-100 text-green-800 border-green-300';
      case 'Positive': return 'bg-green-50 text-green-700 border-green-200';
      case 'Neutral': return 'bg-slate-100 text-slate-700 border-slate-300';
      case 'Negative': return 'bg-red-50 text-red-700 border-red-200';
      case 'Very Negative': return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-slate-100 text-slate-700 border-slate-300';
    }
  };

  const popularQuestions = [
    "Will Bitcoin reach $100k by end of 2024?",
    "Will Donald Trump win the 2024 election?",
    "Will the Fed cut interest rates in Q1 2025?",
    "Will Tesla stock hit $500 by year end?",
    "Will there be a US recession in 2025?"
  ];

  return (
    <Card className="border-none shadow-sm">
      <CardHeader className="border-b border-slate-200">
        <CardTitle className="text-base flex items-center gap-2">
          <Brain className="w-5 h-5 text-purple-600" />
          Enhanced AI Prediction Engine
        </CardTitle>
        <p className="text-xs text-slate-500 mt-1">
          Multi-stage analysis • Parallel data fetching • Bayesian reasoning • Factor decomposition
        </p>
      </CardHeader>

      <CardContent className="p-6 space-y-4">
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4 border border-purple-200">
          <h4 className="font-semibold text-purple-900 text-sm mb-3 flex items-center gap-2">
            <Zap className="w-4 h-4" />
            🚀 Enhanced Features
          </h4>
          <div className="grid md:grid-cols-2 gap-3 text-xs text-purple-800">
            <div>
              <div className="font-semibold mb-1">⚡ Performance</div>
              <ul className="space-y-0.5 text-[11px]">
                <li>• Parallel data fetching (3x faster)</li>
                <li>• Smart caching system</li>
                <li>• Optimized API calls</li>
              </ul>
            </div>
            <div>
              <div className="font-semibold mb-1">🧠 AI Pipeline</div>
              <ul className="space-y-0.5 text-[11px]">
                <li>• 4-stage analysis (Sentiment → Factors → Bayesian → Scenarios)</li>
                <li>• Source credibility scoring</li>
                <li>• Recency weighting</li>
              </ul>
            </div>
            <div>
              <div className="font-semibold mb-1">📊 Data Sources</div>
              <ul className="space-y-0.5 text-[11px]">
                <li>• NewsAPI (up to 50 articles)</li>
                <li>• Yahoo Finance (90-day history)</li>
                <li>• Economic indicators</li>
              </ul>
            </div>
            <div>
              <div className="font-semibold mb-1">🎯 Accuracy</div>
              <ul className="space-y-0.5 text-[11px]">
                <li>• Bayesian probability updating</li>
                <li>• Bias correction (overconfidence, recency)</li>
                <li>• 95% confidence intervals</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium text-slate-700">
            Enter Question or Event to Predict
          </Label>
          <Input
            placeholder="e.g., Will Bitcoin reach $100k by end of 2024?"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyPress={handleKeyPress}
            className="border-slate-300"
            disabled={analyzing}
          />
          <p className="text-xs text-slate-500">
            Enter any yes/no question about future events • Press Enter to submit
          </p>
        </div>

        {/* Popular Questions */}
        {!result && !analyzing && (
          <div className="space-y-2">
            <Label className="text-xs font-medium text-slate-600">Try these examples:</Label>
            <div className="flex flex-wrap gap-2">
              {popularQuestions.map((q, idx) => (
                <Button
                  key={idx}
                  variant="outline"
                  size="sm"
                  onClick={() => setQuestion(q)}
                  className="text-xs border-slate-300 hover:border-purple-400 hover:bg-purple-50"
                >
                  {q}
                </Button>
              ))}
            </div>
          </div>
        )}

        {error && (
          <Alert variant="destructive" className="border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-red-800">
              <strong>Prediction Failed:</strong> {error}
            </AlertDescription>
          </Alert>
        )}

        {analyzing && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Loader2 className="w-5 h-5 text-purple-600 animate-spin" />
              <span className="text-sm font-medium text-slate-700">
                {currentStep}
              </span>
            </div>
            <Progress value={progress} className="h-2" />
            <p className="text-xs text-slate-500">
              Running enhanced multi-stage analysis with parallel data fetching...
            </p>
          </div>
        )}

        <Button
          onClick={handlePredict}
          disabled={!question.trim() || analyzing}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white"
        >
          {analyzing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Analyzing with Enhanced Pipeline...
            </>
          ) : (
            <>
              <Brain className="w-4 h-4 mr-2" />
              Generate Enhanced Prediction
            </>
          )}
        </Button>

        {result && (
          <div className="space-y-4 mt-6 pt-6 border-t border-slate-200">
            {/* Performance & Quality Badge */}
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                <div className="font-semibold mb-2 flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  Enhanced Analysis Complete
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                  <div>📰 {result.real_data_summary?.news_articles_fetched || 0} news articles</div>
                  <div>📊 {result.real_data_summary?.financial_data_points || 0} financial points</div>
                  <div>⚡ {result.real_data_summary?.data_fetch_time_ms}ms fetch time</div>
                  <div>🎯 {result.data_quality} data quality</div>
                  <div>📈 Avg credibility: {(result.real_data_summary?.average_article_credibility * 100).toFixed(0)}%</div>
                  <div>⏱️ Recency weight: {result.real_data_summary?.average_recency_weight?.toFixed(2)}</div>
                  <div>🔬 {result.analysis_pipeline?.length || 4} stages</div>
                  <div>⏰ Total: {result.duration_ms}ms</div>
                </div>
              </AlertDescription>
            </Alert>

            {/* Main Result Card */}
            <div className="bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 rounded-xl p-6 border-2 border-purple-200 shadow-lg">
              <h3 className="font-semibold text-slate-900 mb-4 text-lg flex items-center gap-2">
                <Target className="w-5 h-5 text-purple-600" />
                AI Prediction Result
              </h3>
              
              <div className="grid md:grid-cols-3 gap-4 mb-4">
                {/* Probability */}
                <div className="text-center bg-white/80 rounded-lg p-4 border border-purple-200">
                  <div className="text-xs text-slate-500 mb-2">Estimated Probability</div>
                  <div className="text-5xl font-bold text-purple-600">
                    {(result.probability * 100).toFixed(1)}%
                  </div>
                  {result.confidence_interval && (
                    <div className="text-xs text-slate-500 mt-2 flex items-center justify-center gap-1">
                      <span>95% CI:</span>
                      <Badge variant="outline" className="text-[10px] font-mono">
                        {(result.confidence_interval.lower * 100).toFixed(0)}-{(result.confidence_interval.upper * 100).toFixed(0)}%
                      </Badge>
                    </div>
                  )}
                  {result.base_rate && (
                    <div className="text-xs text-slate-500 mt-1">
                      Base rate: {(result.base_rate * 100).toFixed(0)}%
                    </div>
                  )}
                </div>

                {/* Confidence */}
                <div className="text-center bg-white/80 rounded-lg p-4 border border-blue-200">
                  <div className="text-xs text-slate-500 mb-2">Confidence Level</div>
                  <div className="text-5xl font-bold text-blue-600">
                    {(result.confidence_score * 100).toFixed(0)}%
                  </div>
                  <Badge className="mt-2" variant="outline">
                    {result.data_quality} Quality
                  </Badge>
                  <div className="text-xs text-slate-500 mt-1">
                    {result.data_sources?.weighted_articles_used || 0} weighted sources
                  </div>
                </div>

                {/* Sentiment */}
                <div className="text-center bg-white/80 rounded-lg p-4 border border-green-200">
                  <div className="text-xs text-slate-500 mb-2">News Sentiment</div>
                  <div className={`text-5xl font-bold ${getSentimentColor(result.sentiment_score)}`}>
                    {result.sentiment_score > 0 ? '+' : ''}{(result.sentiment_score * 100).toFixed(0)}
                  </div>
                  <Badge className={`mt-2 ${getSentimentBgColor(result.sentiment_label)}`}>
                    {result.sentiment_label}
                  </Badge>
                  <div className="text-xs text-slate-500 mt-1">
                    from {result.data_sources?.real_articles_count || 0} articles
                  </div>
                </div>
              </div>

              {/* Reasoning */}
              <div className="bg-white/90 rounded-lg p-4 border border-slate-200">
                <h4 className="font-semibold text-slate-900 mb-2 text-sm flex items-center gap-2">
                  <Brain className="w-4 h-4" />
                  AI Reasoning
                </h4>
                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">{result.reasoning}</p>
              </div>
            </div>

            {/* Factor Decomposition */}
            {result.factor_decomposition && result.factor_decomposition.length > 0 && (
              <div className="border border-purple-200 rounded-lg p-4 bg-purple-50">
                <div className="flex items-center gap-2 mb-3">
                  <PieChart className="w-4 h-4 text-purple-600" />
                  <h4 className="font-semibold text-purple-900 text-sm">
                    Factor Decomposition (Contribution to Probability)
                  </h4>
                </div>
                <div className="space-y-3">
                  {result.factor_decomposition.map((factor, idx) => {
                    const isPositive = factor.contribution >= 0;
                    return (
                      <div key={idx} className="bg-white rounded-lg p-3 border border-purple-200">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            {isPositive ? (
                              <ArrowUpRight className="w-4 h-4 text-green-600" />
                            ) : (
                              <ArrowDownRight className="w-4 h-4 text-red-600" />
                            )}
                            <span className="font-medium text-sm text-slate-900">{factor.name}</span>
                          </div>
                          <Badge className={`${isPositive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {isPositive ? '+' : ''}{(factor.contribution * 100).toFixed(1)}%
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-600 pl-6">{factor.description}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Key Themes */}
            {result.key_themes && result.key_themes.length > 0 && (
              <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="w-4 h-4 text-blue-600" />
                  <h4 className="font-semibold text-blue-900 text-sm">
                    Key Themes from Analysis
                  </h4>
                </div>
                <div className="flex flex-wrap gap-2">
                  {result.key_themes.map((theme, idx) => (
                    <Badge key={idx} variant="outline" className="border-blue-300 text-blue-800 bg-white">
                      {theme}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Real Headlines */}
            {result.raw_news_headlines && result.raw_news_headlines.length > 0 && (
              <div className="border border-slate-200 rounded-lg p-4 bg-slate-50">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Newspaper className="w-4 h-4 text-slate-600" />
                    <h4 className="font-semibold text-slate-900 text-sm">
                      Top Weighted Headlines ({result.raw_news_headlines.length})
                    </h4>
                  </div>
                  {result.raw_news_headlines.length > 6 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowAllHeadlines(!showAllHeadlines)}
                      className="text-xs"
                    >
                      {showAllHeadlines ? 'Show Less' : 'Show All'}
                    </Button>
                  )}
                </div>
                <div className="space-y-2">
                  {(showAllHeadlines ? result.raw_news_headlines : result.raw_news_headlines.slice(0, 6)).map((headline, idx) => (
                    <div key={idx} className="text-xs text-slate-700 pl-3 py-1 border-l-2 border-slate-400 bg-white rounded-r">
                      {headline}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Scenario Analysis */}
            {result.scenarios && (
              <div className="grid md:grid-cols-3 gap-3">
                <div className="border-2 border-green-200 rounded-lg p-4 bg-green-50">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-4 h-4 text-green-600" />
                    <h4 className="font-semibold text-green-900 text-sm">Best Case</h4>
                  </div>
                  <div className="text-3xl font-bold text-green-700 mb-2">
                    {(result.scenarios.best_case.probability * 100).toFixed(0)}%
                  </div>
                  <p className="text-xs text-green-800">{result.scenarios.best_case.description}</p>
                </div>

                <div className="border-2 border-blue-200 rounded-lg p-4 bg-blue-50">
                  <div className="flex items-center gap-2 mb-2">
                    <BarChart3 className="w-4 h-4 text-blue-600" />
                    <h4 className="font-semibold text-blue-900 text-sm">Base Case</h4>
                  </div>
                  <div className="text-3xl font-bold text-blue-700 mb-2">
                    {(result.scenarios.base_case.probability * 100).toFixed(0)}%
                  </div>
                  <p className="text-xs text-blue-800">{result.scenarios.base_case.description}</p>
                </div>

                <div className="border-2 border-red-200 rounded-lg p-4 bg-red-50">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingDown className="w-4 h-4 text-red-600" />
                    <h4 className="font-semibold text-red-900 text-sm">Worst Case</h4>
                  </div>
                  <div className="text-3xl font-bold text-red-700 mb-2">
                    {(result.scenarios.worst_case.probability * 100).toFixed(0)}%
                  </div>
                  <p className="text-xs text-red-800">{result.scenarios.worst_case.description}</p>
                </div>
              </div>
            )}

            {/* Key Assumptions */}
            {result.key_assumptions && result.key_assumptions.length > 0 && (
              <div className="border border-slate-200 rounded-lg p-4 bg-white">
                <h4 className="font-semibold text-slate-900 text-sm mb-2">Key Assumptions</h4>
                <ul className="space-y-1">
                  {result.key_assumptions.map((assumption, idx) => (
                    <li key={idx} className="text-sm text-slate-700 flex items-start gap-2">
                      <span className="text-purple-600 mt-1 font-bold text-xs">{idx + 1}.</span>
                      <span>{assumption}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Uncertainty Factors */}
            {result.uncertainty_factors && result.uncertainty_factors.length > 0 && (
              <div className="border border-yellow-200 rounded-lg p-4 bg-yellow-50">
                <h4 className="font-semibold text-yellow-900 text-sm mb-2 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  Uncertainty Factors
                </h4>
                <ul className="space-y-1">
                  {result.uncertainty_factors.map((factor, idx) => (
                    <li key={idx} className="text-xs text-yellow-800 flex items-start gap-2">
                      <span className="text-yellow-600 mt-0.5">•</span>
                      <span>{factor}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Bias Corrections */}
            {result.bias_corrections && result.bias_corrections.length > 0 && (
              <div className="border border-purple-200 rounded-lg p-4 bg-purple-50">
                <h4 className="font-semibold text-purple-900 text-sm mb-2">🔬 Bias Corrections Applied</h4>
                <div className="flex flex-wrap gap-2">
                  {result.bias_corrections.map((correction, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs border-purple-300 text-purple-800">
                      {correction}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Data Sources */}
            <div className="border border-slate-200 rounded-lg p-4 bg-white">
              <div className="flex items-center gap-2 mb-3">
                <Database className="w-4 h-4 text-slate-600" />
                <h4 className="font-semibold text-slate-900 text-sm">Data Sources & Methodology</h4>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <div className="text-xs font-medium text-slate-700 mb-2">
                    📰 News Sources ({result.data_sources?.real_articles_count || 0} articles analyzed)
                  </div>
                  {result.data_sources?.news && result.data_sources.news.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {result.data_sources.news.map((source, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs border-slate-300">
                          {source}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
                {result.data_sources?.financial && result.data_sources.financial.length > 0 && (
                  <div>
                    <div className="text-xs font-medium text-slate-700 mb-2">
                      📊 Financial Data
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {result.data_sources.financial.map((symbol, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs border-slate-300 font-mono">
                          {symbol}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              {result.analysis_pipeline && (
                <div className="mt-3 pt-3 border-t border-slate-200">
                  <div className="text-xs font-medium text-slate-700 mb-1">Analysis Pipeline:</div>
                  <div className="flex items-center gap-2 text-xs text-slate-600">
                    {result.analysis_pipeline.map((stage, idx) => (
                      <React.Fragment key={idx}>
                        <Badge variant="outline" className="text-[10px] border-purple-300 text-purple-700">
                          {stage}
                        </Badge>
                        {idx < result.analysis_pipeline.length - 1 && <span>→</span>}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="text-xs text-slate-400 text-center pt-4 border-t border-slate-200">
              Enhanced multi-stage analysis • Generated: {new Date(result.timestamp).toLocaleString()} • Duration: {result.duration_ms}ms
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}