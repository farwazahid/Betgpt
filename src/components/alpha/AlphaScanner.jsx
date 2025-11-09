import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Target, TrendingUp, AlertCircle, CheckCircle2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function AlphaScanner() {
  const [scanStatus, setScanStatus] = useState(null);
  const [scanProgress, setScanProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState("");
  
  const queryClient = useQueryClient();

  const scanMutation = useMutation({
    mutationFn: async () => {
      setCurrentStep("Initializing scan...");
      setScanProgress(5);

      setCurrentStep("Fetching live markets...");
      setScanProgress(20);

      const response = await base44.functions.invoke('scanForAlpha', {
        minEdge: 0.03
      });

      setScanProgress(100);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['opportunities'] });
      setScanStatus({
        type: 'success',
        data: data
      });
      setScanProgress(0);
      setCurrentStep("");
    },
    onError: (error) => {
      setScanStatus({
        type: 'error',
        message: error.message
      });
      setScanProgress(0);
      setCurrentStep("");
    }
  });

  const handleScan = () => {
    setScanStatus(null);
    scanMutation.mutate();
  };

  return (
    <Card className="border border-slate-200 bg-white">
      <CardHeader className="border-b border-slate-200">
        <CardTitle className="text-base flex items-center gap-2">
          <Target className="w-5 h-5 text-blue-600" />
          Alpha Scanner
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
            <h4 className="font-semibold text-slate-900 text-sm mb-2">What This Does:</h4>
            <ul className="text-sm text-slate-600 space-y-1">
              <li>• Fetches LIVE prices from Polymarket, Kalshi, Manifold</li>
              <li>• AI analyzes each market with news + sentiment data</li>
              <li>• Identifies mispricings where market is systematically wrong</li>
              <li>• Calculates edge, expected value, and Kelly sizing</li>
              <li>• Creates opportunities ready for trading</li>
            </ul>
          </div>

          {scanMutation.isPending && (
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <div className="flex items-center gap-2 mb-3">
                <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                <span className="font-semibold text-blue-900">{currentStep}</span>
              </div>
              <Progress value={scanProgress} className="h-2 mb-2" />
              <p className="text-xs text-blue-700">
                This typically takes 30-60 seconds for a full scan...
              </p>
            </div>
          )}

          {scanStatus?.type === 'success' && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                <strong>Scan Complete!</strong>
                <div className="mt-2 text-sm space-y-1">
                  <div>✅ Markets scanned: {scanStatus.data.markets_scanned}</div>
                  <div>✅ Opportunities found: {scanStatus.data.opportunities_created}</div>
                  <div>✅ Trades executed: {scanStatus.data.trades_executed || 0}</div>
                  {scanStatus.data.platforms && (
                    <div>✅ Platforms: {scanStatus.data.platforms.join(', ')}</div>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {scanStatus?.type === 'error' && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Scan Failed:</strong> {scanStatus.message}
              </AlertDescription>
            </Alert>
          )}

          <Button
            onClick={handleScan}
            disabled={scanMutation.isPending}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold"
            size="lg"
          >
            {scanMutation.isPending ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Scanning for Alpha...
              </>
            ) : (
              <>
                <TrendingUp className="w-5 h-5 mr-2" />
                Scan for Alpha Opportunities
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}