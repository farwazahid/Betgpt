import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Zap, Crown, Loader2, Sparkles, Shield } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function Pricing() {
  const [loading, setLoading] = useState(null);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      try {
        return await base44.auth.me();
      } catch (error) {
        return null;
      }
    }
  });

  const handleSubscribe = async (tier, priceId) => {
    if (!user) {
      await base44.auth.redirectToLogin(window.location.href);
      return;
    }

    setLoading(tier);
    try {
      const response = await base44.functions.invoke('createCheckoutSession', {
        priceId,
        tier
      });

      if (response.data.url) {
        window.location.href = response.data.url;
      }
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Failed to start checkout. Please try again.');
      setLoading(null);
    }
  };

  const currentTier = user?.subscription_tier || 'free';
  const isActive = user?.subscription_status === 'active';
  const isAdmin = user?.role === 'admin';

  // NOTE: Replace these with your actual Stripe Price IDs from dashboard.stripe.com/products
  const tiers = [
    {
      name: "Free",
      tier: "free",
      price: "$0",
      period: "forever",
      description: "Perfect for trying out BetGPT",
      icon: Sparkles,
      color: "slate",
      features: [
        { text: "5 alpha scans per day", included: true },
        { text: "View opportunities (read-only)", included: true },
        { text: "Basic analytics", included: true },
        { text: "Manual trading only", included: true },
        { text: "Community support", included: true },
        { text: "Auto-trading", included: false },
        { text: "Advanced analytics", included: false },
        { text: "Email alerts", included: false },
        { text: "Backtesting", included: false }
      ]
    },
    {
      name: "Pro",
      tier: "pro",
      price: "$39",
      period: "per month",
      priceId: "price_1234567890", // REPLACE WITH YOUR STRIPE PRICE ID
      description: "For serious traders who want automation",
      icon: Zap,
      color: "blue",
      popular: true,
      features: [
        { text: "Unlimited alpha scans", included: true },
        { text: "Auto-trading enabled", included: true },
        { text: "Advanced analytics (Sharpe, Sortino, Drawdown)", included: true },
        { text: "Email alerts & notifications", included: true },
        { text: "Backtesting engine", included: true },
        { text: "Up to 10 open positions", included: true },
        { text: "Priority support", included: true },
        { text: "News sentiment analysis", included: true },
        { text: "Performance tracking", included: true }
      ]
    },
    {
      name: "Enterprise",
      tier: "enterprise",
      price: "$99",
      period: "per month",
      priceId: "price_0987654321", // REPLACE WITH YOUR STRIPE PRICE ID
      description: "For institutions and power users",
      icon: Crown,
      color: "purple",
      features: [
        { text: "Everything in Pro", included: true },
        { text: "API access", included: true },
        { text: "Unlimited open positions", included: true },
        { text: "White-label options", included: true },
        { text: "Custom risk parameters", included: true },
        { text: "Dedicated account manager", included: true },
        { text: "Custom integrations", included: true },
        { text: "SLA guarantee", included: true },
        { text: "Advanced reporting", included: true }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl font-bold text-slate-900 mb-3">
            Choose Your Plan
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Unlock the full power of AI-driven prediction market trading. Start with a free trial or go Pro.
          </p>
          {user && (
            <div className="mt-4 flex items-center justify-center gap-3">
              <Badge className="bg-blue-100 text-blue-700 border-blue-300 px-3 py-1">
                Current Plan: {currentTier.charAt(0).toUpperCase() + currentTier.slice(1)}
                {isActive && currentTier !== 'free' && ' (Active)'}
              </Badge>
              {isAdmin && (
                <Badge className="bg-purple-100 text-purple-700 border-purple-300 px-3 py-1">
                  <Shield className="w-3 h-3 mr-1" />
                  Admin - Full Access
                </Badge>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Admin Notice */}
        {isAdmin && (
          <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-4 mb-8 text-center">
            <h3 className="font-semibold text-purple-900 mb-2">🎉 Admin Access Granted</h3>
            <p className="text-sm text-purple-800">
              As an admin, you have full access to all features regardless of subscription tier. No payment required!
            </p>
          </div>
        )}

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8">
          {tiers.map((tier) => {
            const Icon = tier.icon;
            const isCurrent = currentTier === tier.tier;
            const canUpgrade = (
              (currentTier === 'free' && tier.tier !== 'free') ||
              (currentTier === 'pro' && tier.tier === 'enterprise')
            );

            return (
              <Card 
                key={tier.tier}
                className={`relative ${
                  tier.popular 
                    ? 'border-2 border-blue-500 shadow-xl scale-105' 
                    : 'border border-slate-200'
                }`}
              >
                {tier.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <Badge className="bg-blue-600 text-white px-4 py-1">
                      Most Popular
                    </Badge>
                  </div>
                )}

                <CardContent className="p-8">
                  {/* Icon & Name */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`p-3 rounded-lg bg-${tier.color}-100`}>
                      <Icon className={`w-6 h-6 text-${tier.color}-600`} />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-slate-900">{tier.name}</h3>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="mb-4">
                    <div className="flex items-baseline gap-2">
                      <span className="text-5xl font-bold text-slate-900">{tier.price}</span>
                      <span className="text-slate-600">/{tier.period}</span>
                    </div>
                    <p className="text-sm text-slate-600 mt-2">{tier.description}</p>
                  </div>

                  {/* CTA Button */}
                  {isAdmin ? (
                    <Button className="w-full mb-6 bg-purple-600 hover:bg-purple-700" disabled>
                      <Shield className="w-4 h-4 mr-2" />
                      Admin Access Granted
                    </Button>
                  ) : tier.tier === 'free' ? (
                    <Button 
                      className="w-full mb-6 bg-slate-600 hover:bg-slate-700"
                      disabled={isCurrent}
                    >
                      {isCurrent ? 'Current Plan' : 'Get Started Free'}
                    </Button>
                  ) : isCurrent && isActive ? (
                    <Link to={createPageUrl("Subscription")}>
                      <Button className="w-full mb-6 bg-green-600 hover:bg-green-700">
                        Manage Subscription
                      </Button>
                    </Link>
                  ) : canUpgrade ? (
                    <Button 
                      onClick={() => handleSubscribe(tier.tier, tier.priceId)}
                      disabled={loading === tier.tier}
                      className={`w-full mb-6 ${
                        tier.popular 
                          ? 'bg-blue-600 hover:bg-blue-700' 
                          : 'bg-purple-600 hover:bg-purple-700'
                      }`}
                    >
                      {loading === tier.tier ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        `Upgrade to ${tier.name}`
                      )}
                    </Button>
                  ) : (
                    <Button className="w-full mb-6" variant="outline" disabled>
                      Not Available
                    </Button>
                  )}

                  {/* Features */}
                  <div className="space-y-3">
                    {tier.features.map((feature, idx) => (
                      <div key={idx} className="flex items-start gap-3">
                        <Check className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                          feature.included 
                            ? 'text-green-600' 
                            : 'text-slate-300'
                        }`} />
                        <span className={`text-sm ${
                          feature.included 
                            ? 'text-slate-700' 
                            : 'text-slate-400 line-through'
                        }`}>
                          {feature.text}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Setup Instructions */}
        <div className="mt-12 bg-yellow-50 border-2 border-yellow-200 rounded-lg p-6">
          <h3 className="font-semibold text-yellow-900 mb-3">⚠️ Stripe Setup Required</h3>
          <div className="text-sm text-yellow-800 space-y-2">
            <p><strong>Step 1:</strong> Go to <a href="https://dashboard.stripe.com/test/products" target="_blank" className="underline">Stripe Dashboard → Products</a></p>
            <p><strong>Step 2:</strong> Create two products:</p>
            <ul className="ml-6 list-disc">
              <li>"BetGPT Pro" - $39/month → Copy Price ID</li>
              <li>"BetGPT Enterprise" - $99/month → Copy Price ID</li>
            </ul>
            <p><strong>Step 3:</strong> Replace <code>price_1234567890</code> and <code>price_0987654321</code> in <code>pages/Pricing.jsx</code> lines 68 and 89</p>
            <p><strong>Step 4:</strong> Set up webhook endpoint and add <code>STRIPE_WEBHOOK_SECRET</code> to secrets</p>
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-16 max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 mb-6 text-center">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6 bg-white rounded-lg border border-slate-200 p-8">
            <div>
              <h3 className="font-semibold text-slate-900 mb-2">Can I cancel anytime?</h3>
              <p className="text-sm text-slate-600">
                Yes! You can cancel your subscription at any time from the Subscription page. You'll retain access until the end of your billing period.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 mb-2">What payment methods do you accept?</h3>
              <p className="text-sm text-slate-600">
                We accept all major credit cards (Visa, Mastercard, Amex) through Stripe's secure payment processing.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 mb-2">Do you offer refunds?</h3>
              <p className="text-sm text-slate-600">
                We offer a 14-day money-back guarantee on all paid plans. If you're not satisfied, contact support for a full refund.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 mb-2">What's included in auto-trading?</h3>
              <p className="text-sm text-slate-600">
                Auto-trading automatically executes trades based on AI-detected opportunities with configurable risk parameters, Kelly sizing, and stop-loss/take-profit targets.
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-12 text-center">
          <p className="text-slate-600 mb-4">
            Have questions? <a href="mailto:support@betgpt.com" className="text-blue-600 hover:underline">Contact our team</a>
          </p>
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