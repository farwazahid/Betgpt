import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Activity } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function MarketMoodMeter({ sentimentScore = 50, sentimentLabel = "Neutral", trend = "Stable" }) {
  // Calculate needle rotation (-90 to 90 degrees)
  const rotation = (sentimentScore / 100) * 180 - 90;

  // Determine segment colors and positions
  const getSegmentColor = (start, end) => {
    if (sentimentScore >= start && sentimentScore < end) {
      return 'opacity-100';
    }
    return 'opacity-40';
  };

  const getSentimentEmoji = (score) => {
    if (score <= 20) return '😱';
    if (score <= 40) return '😟';
    if (score <= 60) return '😐';
    if (score <= 80) return '😊';
    return '🤑';
  };

  const getSentimentText = (score) => {
    if (score <= 20) return 'Extreme Fear';
    if (score <= 40) return 'Fear';
    if (score <= 60) return 'Neutral';
    if (score <= 80) return 'Greed';
    return 'Extreme Greed';
  };

  return (
    <Card className="border-none shadow-sm overflow-hidden">
      <CardHeader className="border-b border-slate-200 pb-4">
        <CardTitle className="text-base flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-purple-600" />
            Market Mood Meter
          </span>
          <Badge variant="outline" className={
            trend === 'Rising' ? 'border-green-300 text-green-700 bg-green-50' :
            trend === 'Falling' ? 'border-red-300 text-red-700 bg-red-50' :
            'border-slate-300 text-slate-700'
          }>
            {trend === 'Rising' && <TrendingUp className="w-3 h-3 mr-1" />}
            {trend === 'Falling' && <TrendingDown className="w-3 h-3 mr-1" />}
            {trend === 'Stable' && <Activity className="w-3 h-3 mr-1" />}
            {trend}
          </Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className="p-6">
        {/* Gauge Container */}
        <div className="relative w-full max-w-md mx-auto">
          {/* SVG Gauge */}
          <svg viewBox="0 0 200 120" className="w-full">
            {/* Background Arc */}
            <path
              d="M 20 100 A 80 80 0 0 1 180 100"
              fill="none"
              stroke="#E2E8F0"
              strokeWidth="20"
              strokeLinecap="round"
            />
            
            {/* Extreme Fear - Red */}
            <path
              d="M 20 100 A 80 80 0 0 1 52 56"
              fill="none"
              stroke="#DC2626"
              strokeWidth="20"
              strokeLinecap="round"
              className={getSegmentColor(0, 20)}
            />
            
            {/* Fear - Orange */}
            <path
              d="M 52 56 A 80 80 0 0 1 84 32"
              fill="none"
              stroke="#F97316"
              strokeWidth="20"
              strokeLinecap="round"
              className={getSegmentColor(20, 40)}
            />
            
            {/* Neutral - Yellow */}
            <path
              d="M 84 32 A 80 80 0 0 1 116 32"
              fill="none"
              stroke="#EAB308"
              strokeWidth="20"
              strokeLinecap="round"
              className={getSegmentColor(40, 60)}
            />
            
            {/* Greed - Light Green */}
            <path
              d="M 116 32 A 80 80 0 0 1 148 56"
              fill="none"
              stroke="#22C55E"
              strokeWidth="20"
              strokeLinecap="round"
              className={getSegmentColor(60, 80)}
            />
            
            {/* Extreme Greed - Dark Green */}
            <path
              d="M 148 56 A 80 80 0 0 1 180 100"
              fill="none"
              stroke="#10B981"
              strokeWidth="20"
              strokeLinecap="round"
              className={getSegmentColor(80, 100)}
            />

            {/* Needle */}
            <g transform={`rotate(${rotation}, 100, 100)`}>
              <line
                x1="100"
                y1="100"
                x2="100"
                y2="35"
                stroke="#1E293B"
                strokeWidth="3"
                strokeLinecap="round"
              />
              <circle cx="100" cy="100" r="6" fill="#1E293B" />
            </g>

            {/* Center Circle */}
            <circle cx="100" cy="100" r="4" fill="white" />
          </svg>

          {/* Labels */}
          <div className="flex justify-between text-xs font-medium text-slate-600 mt-2 px-2">
            <span>😱 Fear</span>
            <span>😐 Neutral</span>
            <span>🤑 Greed</span>
          </div>
        </div>

        {/* Current Sentiment Display */}
        <div className="text-center mt-6">
          <div className="text-6xl mb-3">{getSentimentEmoji(sentimentScore)}</div>
          <div className="text-2xl font-bold text-slate-900 mb-1">
            {getSentimentText(sentimentScore)}
          </div>
          <div className="text-4xl font-bold text-purple-600">
            {sentimentScore}
          </div>
          <p className="text-sm text-slate-600 mt-2">
            Overall market sentiment score
          </p>
        </div>

        {/* Scale Reference */}
        <div className="mt-6 bg-slate-50 rounded-lg p-4 border border-slate-200">
          <div className="grid grid-cols-5 gap-2 text-xs text-center">
            <div>
              <div className="text-red-600 font-bold mb-1">0-20</div>
              <div className="text-slate-600">Extreme Fear</div>
            </div>
            <div>
              <div className="text-orange-600 font-bold mb-1">21-40</div>
              <div className="text-slate-600">Fear</div>
            </div>
            <div>
              <div className="text-yellow-600 font-bold mb-1">41-60</div>
              <div className="text-slate-600">Neutral</div>
            </div>
            <div>
              <div className="text-green-600 font-bold mb-1">61-80</div>
              <div className="text-slate-600">Greed</div>
            </div>
            <div>
              <div className="text-emerald-600 font-bold mb-1">81-100</div>
              <div className="text-slate-600">Extreme Greed</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}