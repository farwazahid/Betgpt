import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Brain, Loader2, Search, AlertCircle, CheckCircle2, Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";

export default function RealMarketScanner({ onClose }) {
  const [platform, setPlatform] = useState("all");
  const [category, setCategory] = useState("all");
  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  const queryClient = useQueryClient();

  const scanMutation = useMutation({
    mutationFn: async (data) => {
      setError(null);
      setResults(null);
      setProgress(20);

      // Call backend function to fetch live markets
      const response = await base44.functions.invoke('fetchLiveMarkets', {
        platform: data.platform,
        category: data.category,
        limit: 100
      });

      setProgress(100);
      return response.data;
    },
    onSuccess: (data) => {
      setResults(data);
      queryClient.invalidateQueries({ queryKey: ['markets'] });
    },
    onError: (err) => {
      setError(err.message || "Failed to fetch markets. Please try again.");
    },
  });

  const handleScan = async () => {
    setScanning(true);
    setProgress(0);
    await scanMutation.mutateAsync({ platform, category });
    setScanning(false);
  };

  const handleClose = () => {
    if (!scanning) {
      onClose();
    }
  };

  return (
    <Dialog open={true} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-slate-900">
            Scan Live Markets
          </DialogTitle>
          <DialogDescription className="text-slate-600">
            Fetch real-time markets directly from prediction market platform APIs via backend
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <Alert className="border-blue-200 bg-blue-50">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800 text-sm">
              <strong>Direct API Integration:</strong> Backend function makes direct API calls to {platform === 'all' ? 'Polymarket, Kalshi, and Manifold' : platform}.
              Data includes real prices, volumes, traders, and liquidity.
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block text-slate-700">Platform</label>
              <Select value={platform} onValueChange={setPlatform}>
                <SelectTrigger className="border-slate-300">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Platforms (Recommended)</SelectItem>
                  <SelectItem value="Polymarket">Polymarket Only</SelectItem>
                  <SelectItem value="Manifold">Manifold Markets Only</SelectItem>
                  <SelectItem value="Kalshi">Kalshi Only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block text-slate-700">Category</label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="border-slate-300">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="Politics">Politics</SelectItem>
                  <SelectItem value="Sports">Sports</SelectItem>
                  <SelectItem value="Crypto">Crypto</SelectItem>
                  <SelectItem value="Economics">Economics</SelectItem>
                  <SelectItem value="Entertainment">Entertainment</SelectItem>
                  <SelectItem value="Science">Science</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {scanning && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">
                  {progress < 50 ? 'Connecting to APIs...' : 'Processing market data...'}
                </span>
                <span className="text-slate-900 font-medium">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
              <p className="text-xs text-slate-500">
                This may take 10-30 seconds depending on the number of platforms
              </p>
            </div>
          )}

          {error && (
            <Alert variant="destructive" className="border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Error:</strong> {error}
              </AlertDescription>
            </Alert>
          )}

          {results && (
            <div className="space-y-3">
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  <strong>Success!</strong> Fetched {results.markets_fetched} markets from {results.platforms?.join(', ')}
                </AlertDescription>
              </Alert>

              <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                <h3 className="font-semibold text-slate-900 mb-3">Scan Results</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Total Markets Fetched:</span>
                    <span className="font-semibold text-green-600">{results.markets_fetched}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">New Markets Added:</span>
                    <span className="font-semibold text-blue-600">{results.new_markets || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Markets Updated:</span>
                    <span className="font-semibold text-purple-600">{results.updated_markets || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Platforms Scanned:</span>
                    <span className="font-semibold text-slate-900">{results.platforms?.join(', ')}</span>
                  </div>
                  {results.errors && results.errors.length > 0 && (
                    <div className="pt-2 border-t border-slate-200">
                      <span className="text-slate-600 block mb-1">Errors:</span>
                      {results.errors.map((err, idx) => (
                        <div key={idx} className="text-xs text-red-600 ml-2">
                          • {err.platform}: {err.error}
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex justify-between pt-2 border-t border-slate-200">
                    <span className="text-slate-600">Timestamp:</span>
                    <span className="font-semibold text-xs text-slate-700">
                      {new Date(results.timestamp).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-3">
            {results ? (
              <Button
                onClick={handleClose}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Done
              </Button>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={handleClose}
                  disabled={scanning}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleScan} 
                  disabled={scanning}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {scanning ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Fetching...
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4 mr-2" />
                      Fetch Live Data
                    </>
                  )}
                </Button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}