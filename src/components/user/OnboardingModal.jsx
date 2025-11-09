import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  ChevronRight, ChevronLeft, CheckCircle2, Target, 
  TrendingUp, Brain, Zap, Camera
} from "lucide-react";
import { Progress } from "@/components/ui/progress";

export default function OnboardingModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [userData, setUserData] = useState({
    full_name: '',
    profile_picture: '',
    bio: '',
    onboarded: false
  });
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const checkOnboarding = async () => {
      try {
        const user = await base44.auth.me();
        // Show onboarding if user hasn't been onboarded yet
        if (!user.onboarded) {
          setIsOpen(true);
          setUserData({
            full_name: user.full_name || '',
            profile_picture: user.profile_picture || '',
            bio: user.bio || '',
            onboarded: false
          });
        }
      } catch (error) {
        console.error('Error checking onboarding:', error);
      }
    };

    checkOnboarding();
  }, []);

  const completeOnboardingMutation = useMutation({
    mutationFn: async (data) => {
      await base44.auth.updateMe({ ...data, onboarded: true });
    },
    onSuccess: () => {
      setIsOpen(false);
    }
  });

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setUserData({ ...userData, profile_picture: file_url });
    } catch (error) {
      console.error('Error uploading file:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleComplete = () => {
    completeOnboardingMutation.mutate(userData);
  };

  const steps = [
    {
      title: "Welcome to BetGPT! 🎯",
      description: "Your AI-powered prediction market trading platform",
      content: (
        <div className="space-y-6 py-6">
          <div className="text-center">
            <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
              <Brain className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">
              Trade Smarter with AI
            </h3>
            <p className="text-sm text-slate-600 max-w-md mx-auto">
              BetGPT uses artificial intelligence to scan prediction markets, identify mispricings, 
              and help you make profitable trades across multiple platforms.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center mb-3">
                <Target className="w-5 h-5 text-white" />
              </div>
              <h4 className="font-semibold text-slate-900 text-sm mb-1">Alpha Detection</h4>
              <p className="text-xs text-slate-600">
                AI scans markets to find profitable opportunities with edge
              </p>
            </div>

            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center mb-3">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <h4 className="font-semibold text-slate-900 text-sm mb-1">Auto-Trading</h4>
              <p className="text-xs text-slate-600">
                Automated execution based on your risk parameters
              </p>
            </div>

            <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
              <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center mb-3">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <h4 className="font-semibold text-slate-900 text-sm mb-1">Multi-Platform</h4>
              <p className="text-xs text-slate-600">
                Trade on Polymarket, Kalshi, Manifold, and more
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Set Up Your Profile",
      description: "Let's personalize your account",
      content: (
        <div className="space-y-6 py-6">
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden">
                {userData.profile_picture ? (
                  <img src={userData.profile_picture} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-3xl font-bold text-blue-600">
                    {userData.full_name ? userData.full_name[0].toUpperCase() : '?'}
                  </span>
                )}
              </div>
              <input
                type="file"
                id="onboarding-pic"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
                disabled={uploading}
              />
              <Button
                size="sm"
                variant="outline"
                className="absolute -bottom-2 -right-2 rounded-full"
                onClick={() => document.getElementById('onboarding-pic')?.click()}
                disabled={uploading}
              >
                <Camera className="w-4 h-4" />
              </Button>
            </div>
            {uploading && (
              <Badge variant="outline" className="border-blue-300 text-blue-700">
                Uploading...
              </Badge>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium text-slate-700">Full Name</Label>
              <Input
                value={userData.full_name}
                onChange={(e) => setUserData({ ...userData, full_name: e.target.value })}
                placeholder="Enter your full name"
                className="mt-1"
              />
            </div>

            <div>
              <Label className="text-sm font-medium text-slate-700">Bio (optional)</Label>
              <textarea
                value={userData.bio}
                onChange={(e) => setUserData({ ...userData, bio: e.target.value })}
                placeholder="Tell us about yourself..."
                className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-md text-sm resize-none"
                rows={3}
              />
            </div>
          </div>
        </div>
      )
    },
    {
      title: "You're All Set! 🚀",
      description: "Ready to start trading with AI",
      content: (
        <div className="space-y-6 py-6">
          <div className="text-center">
            <div className="w-20 h-20 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">
              Welcome Aboard! 🎉
            </h3>
            <p className="text-sm text-slate-600 max-w-md mx-auto mb-6">
              Your account is ready. Here's what you can do next:
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-white text-xs font-bold">1</span>
              </div>
              <div>
                <div className="font-semibold text-slate-900 text-sm">Configure Settings</div>
                <div className="text-xs text-slate-600 mt-1">
                  Set your risk parameters, trading limits, and enable auto-trading
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
              <div className="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-white text-xs font-bold">2</span>
              </div>
              <div>
                <div className="font-semibold text-slate-900 text-sm">Scan for Alpha</div>
                <div className="text-xs text-slate-600 mt-1">
                  Run the Alpha Hunter to discover profitable opportunities
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
              <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-white text-xs font-bold">3</span>
              </div>
              <div>
                <div className="font-semibold text-slate-900 text-sm">Start Trading</div>
                <div className="text-xs text-slate-600 mt-1">
                  Execute trades manually or let the AI auto-trader handle it
                </div>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-xs text-yellow-800">
              💡 <strong>Tip:</strong> Start with small position sizes and test the system before scaling up. 
              Review the Testing Guide for best practices.
            </p>
          </div>
        </div>
      )
    }
  ];

  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="mb-4">
            <Progress value={progress} className="h-2" />
            <div className="flex justify-between mt-2">
              {steps.map((_, idx) => (
                <Badge
                  key={idx}
                  variant={idx <= currentStep ? "default" : "outline"}
                  className={idx <= currentStep ? "bg-blue-600" : ""}
                >
                  Step {idx + 1}
                </Badge>
              ))}
            </div>
          </div>
          <DialogTitle className="text-2xl">{steps[currentStep].title}</DialogTitle>
          <DialogDescription>{steps[currentStep].description}</DialogDescription>
        </DialogHeader>

        {steps[currentStep].content}

        <div className="flex justify-between pt-4 border-t border-slate-200">
          <Button
            variant="outline"
            onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
            disabled={currentStep === 0}
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          {currentStep < steps.length - 1 ? (
            <Button
              onClick={() => setCurrentStep(currentStep + 1)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Next
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleComplete}
              disabled={completeOnboardingMutation.isPending || !userData.full_name}
              className="bg-green-600 hover:bg-green-700"
            >
              {completeOnboardingMutation.isPending ? 'Completing...' : 'Complete Setup'}
              <CheckCircle2 className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}