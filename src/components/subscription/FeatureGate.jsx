import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lock, Zap, Crown } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

/**
 * FeatureGate Component
 * 
 * Wraps content and shows upgrade prompt if user doesn't have required tier
 * **ADMINS ARE NEVER BLOCKED** - they bypass all gates
 * 
 * Usage:
 * <FeatureGate requiredTier="pro" feature="Auto-Trading">
 *   <YourProtectedComponent />
 * </FeatureGate>
 */
export default function FeatureGate({ 
  children, 
  requiredTier = "pro", 
  feature = "this feature",
  fallback = null 
}) {
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

  // CRITICAL: Admins bypass ALL feature gates
  if (user?.role === 'admin') {
    return <>{children}</>;
  }

  const currentTier = user?.subscription_tier || 'free';
  const isActive = user?.subscription_status === 'active' || currentTier === 'free';

  // Tier hierarchy
  const tierLevels = {
    'free': 0,
    'pro': 1,
    'enterprise': 2
  };

  const hasAccess = tierLevels[currentTier] >= tierLevels[requiredTier];

  // If user has access and subscription is active (or free), show the content
  if (hasAccess && isActive) {
    return <>{children}</>;
  }

  // Show custom fallback if provided
  if (fallback) {
    return <>{fallback}</>;
  }

  // Default upgrade prompt
  return (
    <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
      <CardContent className="p-8 text-center">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Lock className="w-8 h-8 text-blue-600" />
        </div>
        <h3 className="text-xl font-bold text-slate-900 mb-2">
          {requiredTier === 'pro' ? 'Pro' : 'Enterprise'} Feature
        </h3>
        <p className="text-slate-600 mb-6 max-w-md mx-auto">
          Unlock <strong>{feature}</strong> by upgrading to{' '}
          <span className="capitalize font-semibold">{requiredTier}</span>
        </p>
        <div className="flex gap-3 justify-center">
          <Link to={createPageUrl("Pricing")}>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Zap className="w-4 h-4 mr-2" />
              Upgrade Now
            </Button>
          </Link>
          <Link to={createPageUrl("Pricing")}>
            <Button variant="outline" className="border-slate-300">
              View Plans
            </Button>
          </Link>
        </div>
        
        {requiredTier === 'pro' && (
          <div className="mt-6 pt-6 border-t border-slate-200">
            <p className="text-sm text-slate-600 mb-3">Pro includes:</p>
            <div className="flex flex-wrap gap-2 justify-center text-xs">
              <span className="px-3 py-1 bg-white rounded-full border border-slate-200">Unlimited scans</span>
              <span className="px-3 py-1 bg-white rounded-full border border-slate-200">Auto-trading</span>
              <span className="px-3 py-1 bg-white rounded-full border border-slate-200">Advanced analytics</span>
              <span className="px-3 py-1 bg-white rounded-full border border-slate-200">Email alerts</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Hook version for conditional logic
 * **ADMINS ALWAYS HAVE ACCESS**
 * 
 * Usage:
 * const { hasAccess, currentTier, isAdmin } = useFeatureAccess('pro');
 * 
 * if (!hasAccess) {
 *   return <UpgradePrompt />;
 * }
 */
export function useFeatureAccess(requiredTier = 'pro') {
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

  const isAdmin = user?.role === 'admin';
  const currentTier = user?.subscription_tier || 'free';
  const isActive = user?.subscription_status === 'active' || currentTier === 'free';

  const tierLevels = {
    'free': 0,
    'pro': 1,
    'enterprise': 2
  };

  // Admins always have access
  const hasAccess = isAdmin || (tierLevels[currentTier] >= tierLevels[requiredTier] && isActive);

  return {
    hasAccess,
    currentTier,
    isActive,
    isAdmin,
    user
  };
}