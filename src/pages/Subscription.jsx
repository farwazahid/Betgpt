import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle2, CreditCard, Calendar, Zap, Crown, Sparkles, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function Subscription() {
  const [canceling, setCanceling] = useState(false);
  const queryClient = useQueryClient();

  const { data: user, isLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      try {
        return await base44.auth.me();
      } catch (error) {
        return null;
      }
    }
  });

  const cancelMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('cancelSubscription', {});
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      setCanceling(false);
    },
    onError: (error) => {
      alert('Failed to cancel subscription: ' + error.message);
      setCanceling(false);
    }
  });

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel your subscription? You will lose access to Pro features at the end of your billing period.')) {
      return;
    }
    setCanceling(true);
    cancelMutation.mutate();
  };

  const managePaymentMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('createPortalSession', {});
      return response.data;
    },
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      }
    }
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-slate-900 mb-2">Please Sign In</h2>
            <p className="text-slate-600 mb-6">You need to be signed in to manage your subscription.</p>
            <Button onClick={() => base44.auth.redirectToLogin()} className="bg-blue-600">
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const tier = user.subscription_tier || 'free';
  const status = user.subscription_status;
  const isActive = status === 'active';
  const isCanceled = status === 'canceled';
  const isPastDue = status === 'past_due';

  const tierIcons = {
    free: Sparkles,
    pro: Zap,
    enterprise: Crown
  };

  const TierIcon = tierIcons[tier] || Sparkles;

  const tierColors = {
    free: 'slate',
    pro: 'blue',
    enterprise: 'purple'
  };

  const color = tierColors[tier];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-semibold text-slate-900">Subscription Management</h1>
          <p className="text-sm text-slate-600 mt-1">Manage your BetGPT subscription and billing</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        {/* Status Alert */}
        {isPastDue && (
          <Alert className="border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              <strong>Payment Failed</strong> - Your subscription payment is past due. Please update your payment method to avoid losing access.
            </AlertDescription>
          </Alert>
        )}

        {isCanceled && (
          <Alert className="border-yellow-200 bg-yellow-50">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              <strong>Subscription Canceled</strong> - Your subscription will remain active until {user.subscription_end_date ? new Date(user.subscription_end_date).toLocaleDateString() : 'the end of your billing period'}.
            </AlertDescription>
          </Alert>
        )}

        {/* Current Plan Card */}
        <Card className="border-2 border-slate-200">
          <CardHeader className="border-b border-slate-200">
            <CardTitle className="flex items-center gap-2">
              <TierIcon className={`w-5 h-5 text-${color}-600`} />
              Current Plan
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-3xl font-bold text-slate-900 capitalize">{tier}</h2>
                  <Badge className={`bg-${color}-100 text-${color}-700 border-${color}-300`}>
                    {isActive ? 'Active' : status || 'Free'}
                  </Badge>
                </div>
                
                {tier !== 'free' && (
                  <div className="space-y-2 mt-4 text-sm text-slate-600">
                    {user.subscription_start_date && (
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>Started: {new Date(user.subscription_start_date).toLocaleDateString()}</span>
                      </div>
                    )}
                    {user.subscription_end_date && (
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>
                          {isCanceled ? 'Access until' : 'Renews on'}: {new Date(user.subscription_end_date).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="text-right">
                {tier === 'free' ? (
                  <div>
                    <div className="text-3xl font-bold text-slate-900">$0</div>
                    <div className="text-sm text-slate-600">forever</div>
                  </div>
                ) : tier === 'pro' ? (
                  <div>
                    <div className="text-3xl font-bold text-slate-900">$39</div>
                    <div className="text-sm text-slate-600">/month</div>
                  </div>
                ) : (
                  <div>
                    <div className="text-3xl font-bold text-slate-900">$99</div>
                    <div className="text-sm text-slate-600">/month</div>
                  </div>
                )}
              </div>
            </div>

            {/* Usage Stats for Free Tier */}
            {tier === 'free' && (
              <div className="mt-6 pt-6 border-t border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-600">Daily Alpha Scans</span>
                  <span className="text-sm font-semibold text-slate-900">
                    {user.daily_scans_used || 0} / 5 used today
                  </span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{ width: `${((user.daily_scans_used || 0) / 5) * 100}%` }}
                  />
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  Upgrade to Pro for unlimited scans
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 mt-6">
              {tier === 'free' ? (
                <Link to={createPageUrl("Pricing")} className="flex-1">
                  <Button className="w-full bg-blue-600 hover:bg-blue-700">
                    <Zap className="w-4 h-4 mr-2" />
                    Upgrade to Pro
                  </Button>
                </Link>
              ) : (
                <>
                  {!isCanceled && isActive && (
                    <>
                      <Button
                        onClick={() => managePaymentMutation.mutate()}
                        disabled={managePaymentMutation.isPending}
                        variant="outline"
                        className="flex-1 border-slate-300"
                      >
                        <CreditCard className="w-4 h-4 mr-2" />
                        Update Payment
                      </Button>
                      <Button
                        onClick={handleCancel}
                        disabled={canceling}
                        variant="outline"
                        className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
                      >
                        {canceling ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Canceling...
                          </>
                        ) : (
                          'Cancel Subscription'
                        )}
                      </Button>
                    </>
                  )}
                  {tier === 'pro' && (
                    <Link to={createPageUrl("Pricing")} className="flex-1">
                      <Button className="w-full bg-purple-600 hover:bg-purple-700">
                        <Crown className="w-4 h-4 mr-2" />
                        Upgrade to Enterprise
                      </Button>
                    </Link>
                  )}
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Features Card */}
        <Card>
          <CardHeader>
            <CardTitle>Your Features</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid md:grid-cols-2 gap-4">
              <FeatureItem 
                enabled={true}
                text="View opportunities"
              />
              <FeatureItem 
                enabled={tier !== 'free'}
                text="Unlimited alpha scans"
                locked={tier === 'free'}
              />
              <FeatureItem 
                enabled={tier !== 'free'}
                text="Auto-trading"
                locked={tier === 'free'}
              />
              <FeatureItem 
                enabled={tier !== 'free'}
                text="Advanced analytics"
                locked={tier === 'free'}
              />
              <FeatureItem 
                enabled={tier !== 'free'}
                text="Email alerts"
                locked={tier === 'free'}
              />
              <FeatureItem 
                enabled={tier !== 'free'}
                text="Backtesting"
                locked={tier === 'free'}
              />
              <FeatureItem 
                enabled={tier === 'enterprise'}
                text="API access"
                locked={tier !== 'enterprise'}
              />
              <FeatureItem 
                enabled={tier === 'enterprise'}
                text="Unlimited positions"
                locked={tier !== 'enterprise'}
              />
            </div>
          </CardContent>
        </Card>

        {/* Billing History */}
        {tier !== 'free' && user.stripe_customer_id && (
          <Card>
            <CardHeader>
              <CardTitle>Billing History</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <Button
                onClick={() => managePaymentMutation.mutate()}
                disabled={managePaymentMutation.isPending}
                variant="outline"
                className="border-slate-300"
              >
                {managePaymentMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4 mr-2" />
                    View Invoices & Payment Methods
                  </>
                )}
              </Button>
              <p className="text-xs text-slate-500 mt-2">
                Manage your payment methods and view invoice history through Stripe
              </p>
            </CardContent>
          </Card>
        )}

        {/* Back Button */}
        <div className="text-center">
          <Link to={createPageUrl("Dashboard")}>
            <Button variant="outline" className="border-slate-300">
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

function FeatureItem({ enabled, text, locked }) {
  return (
    <div className="flex items-center gap-2">
      {enabled ? (
        <CheckCircle2 className="w-5 h-5 text-green-600" />
      ) : (
        <div className="w-5 h-5 rounded-full border-2 border-slate-300" />
      )}
      <span className={`text-sm ${enabled ? 'text-slate-700' : 'text-slate-400'}`}>
        {text}
      </span>
      {locked && (
        <Badge variant="outline" className="ml-auto text-xs border-slate-300 text-slate-600">
          Locked
        </Badge>
      )}
    </div>
  );
}