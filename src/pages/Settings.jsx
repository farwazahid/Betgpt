
import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Save, Shield, CheckCircle2, Bell, Sliders, Globe, AlertTriangle, TrendingUp, Mail } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import PlatformBadge from "../components/trading/PlatformBadge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";

export default function Settings() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("risk");

  // Mock user for email display, replace with actual user context/auth if available
  const user = { email: 'your-account@example.com' };

  const { data: configs = [] } = useQuery({
    queryKey: ['configs'],
    queryFn: async () => {
      try {
        const result = await base44.entities.SystemConfig.list();
        return Array.isArray(result) ? result : [];
      } catch (error) {
        console.error('Error fetching configs:', error);
        return [];
      }
    },
    initialData: [],
    refetchInterval: 30000,
    refetchIntervalInBackground: true,
  });

  const activeConfig = Array.isArray(configs) ? configs.find(c => c.is_active) : null;

  const [formData, setFormData] = useState({
    min_confidence_threshold: 0.65,
    min_edge_threshold: 0.03,
    max_position_size: 500,
    max_portfolio_exposure: 5000,
    kelly_multiplier: 0.25,
    scan_interval_minutes: 5,
    auto_trade_enabled: true,
    take_profit_percent: 0.20,
    stop_loss_percent: 0.12,
    max_open_positions: 3,
    platforms_enabled: ['Polymarket', 'Kalshi', 'Manifold', 'Gnosis', 'Augur', 'PredictIt'],
    categories_enabled: ['Politics', 'Sports', 'Crypto', 'Economics'],
    alert_enabled: true,
    alert_on_opportunity: true,
    alert_on_trade_executed: true,
    alert_on_position_closed: true,
    alert_on_risk_limit: true,
    // Push notification thresholds
    push_notification_enabled: true,
    push_min_edge_threshold: 0.05,
    push_min_confidence_threshold: 0.7,
    push_on_critical_only: false,
    push_on_high_and_critical: true,
    slippage_tolerance: 0.03,
    order_timeout_seconds: 30,
    retry_failed_orders: true,
    max_daily_trades: 10,
    cooldown_between_trades_minutes: 5,
    min_liquidity_usd: 1000,
    use_limit_orders: false,
    trailing_stop_enabled: false,
    trailing_stop_percent: 0.05,
    // New email notification settings
    email_alerts_enabled: true,
    email_on_critical_alpha: true,
    email_on_high_alpha: true,
    email_scan_complete: false,
    email_on_trade_execution: true,
    email_on_position_closed: true,
    email_daily_summary: true,
  });

  useEffect(() => {
    if (activeConfig) {
      setFormData({
        min_confidence_threshold: activeConfig.min_confidence_threshold || 0.65,
        min_edge_threshold: activeConfig.min_edge_threshold || 0.03,
        max_position_size: activeConfig.max_position_size || 500,
        max_portfolio_exposure: activeConfig.max_portfolio_exposure || 5000,
        kelly_multiplier: activeConfig.kelly_multiplier || 0.25,
        scan_interval_minutes: activeConfig.scan_interval_minutes || 5,
        auto_trade_enabled: activeConfig.auto_trade_enabled !== false,
        take_profit_percent: activeConfig.take_profit_percent || 0.20,
        stop_loss_percent: activeConfig.stop_loss_percent || 0.12,
        max_open_positions: activeConfig.max_open_positions || 3,
        platforms_enabled: activeConfig.platforms_enabled || ['Polymarket', 'Kalshi', 'Manifold', 'Gnosis', 'Augur', 'PredictIt'],
        categories_enabled: activeConfig.categories_enabled || ['Politics', 'Sports', 'Crypto', 'Economics'],
        alert_enabled: activeConfig.alert_enabled !== false,
        alert_on_opportunity: activeConfig.alert_on_opportunity !== false,
        alert_on_trade_executed: activeConfig.alert_on_trade_executed !== false,
        alert_on_position_closed: activeConfig.alert_on_position_closed !== false,
        alert_on_risk_limit: activeConfig.alert_on_risk_limit !== false,
        // Push notification thresholds
        push_notification_enabled: activeConfig.push_notification_enabled !== false,
        push_min_edge_threshold: activeConfig.push_min_edge_threshold || 0.05,
        push_min_confidence_threshold: activeConfig.push_min_confidence_threshold || 0.7,
        push_on_critical_only: activeConfig.push_on_critical_only || false,
        push_on_high_and_critical: activeConfig.push_on_high_and_critical !== false,
        slippage_tolerance: activeConfig.slippage_tolerance || 0.03,
        order_timeout_seconds: activeConfig.order_timeout_seconds || 30,
        retry_failed_orders: activeConfig.retry_failed_orders !== false,
        max_daily_trades: activeConfig.max_daily_trades || 10,
        cooldown_between_trades_minutes: activeConfig.cooldown_between_trades_minutes || 5,
        min_liquidity_usd: activeConfig.min_liquidity_usd || 1000,
        use_limit_orders: activeConfig.use_limit_orders || false,
        trailing_stop_enabled: activeConfig.trailing_stop_enabled || false,
        trailing_stop_percent: activeConfig.trailing_stop_percent || 0.05,
        // Initialize new email notification settings
        email_alerts_enabled: activeConfig.email_alerts_enabled !== false,
        email_on_critical_alpha: activeConfig.email_on_critical_alpha !== false,
        email_on_high_alpha: activeConfig.email_on_high_alpha !== false,
        email_scan_complete: activeConfig.email_scan_complete || false,
        email_on_trade_execution: activeConfig.email_on_trade_execution !== false,
        email_on_position_closed: activeConfig.email_on_position_closed !== false,
        email_daily_summary: activeConfig.email_daily_summary !== false,
      });
    }
  }, [activeConfig]);

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (activeConfig?.id) {
        await base44.entities.SystemConfig.update(activeConfig.id, data);
      } else {
        await base44.entities.SystemConfig.create({
          ...data,
          config_name: 'Default Trading Config',
          is_active: true
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['configs'] });
    },
  });

  const handleSave = () => {
    saveMutation.mutate(formData);
  };

  const togglePlatform = (platform) => {
    const platforms = [...formData.platforms_enabled];
    const index = platforms.indexOf(platform);
    if (index > -1) {
      platforms.splice(index, 1);
    } else {
      platforms.push(platform);
    }
    setFormData({...formData, platforms_enabled: platforms});
  };

  const toggleCategory = (category) => {
    const categories = [...formData.categories_enabled];
    const index = categories.indexOf(category);
    if (index > -1) {
      categories.splice(index, 1);
    } else {
      categories.push(category);
    }
    setFormData({...formData, categories_enabled: categories});
  };

  const allPlatforms = ['Polymarket', 'Kalshi', 'Manifold', 'Gnosis', 'Augur', 'PredictIt'];
  const allCategories = ['Politics', 'Sports', 'Crypto', 'Economics', 'Entertainment', 'Science', 'Other'];

  const applyPreset = (preset) => {
    const presets = {
      conservative: {
        min_confidence_threshold: 0.75,
        min_edge_threshold: 0.05,
        max_position_size: 300,
        kelly_multiplier: 0.15,
        take_profit_percent: 0.15,
        stop_loss_percent: 0.08,
        max_open_positions: 2,
        slippage_tolerance: 0.02,
        max_daily_trades: 5
      },
      moderate: {
        min_confidence_threshold: 0.65,
        min_edge_threshold: 0.03,
        max_position_size: 500,
        kelly_multiplier: 0.25,
        take_profit_percent: 0.20,
        stop_loss_percent: 0.12,
        max_open_positions: 3,
        slippage_tolerance: 0.03,
        max_daily_trades: 10
      },
      aggressive: {
        min_confidence_threshold: 0.55,
        min_edge_threshold: 0.02,
        max_position_size: 1000,
        kelly_multiplier: 0.35,
        take_profit_percent: 0.30,
        stop_loss_percent: 0.15,
        max_open_positions: 5,
        slippage_tolerance: 0.05,
        max_daily_trades: 20
      }
    };
    setFormData({...formData, ...presets[preset]});
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">Settings</h1>
              <p className="text-sm text-slate-600 mt-1">Configure multi-platform trading system</p>
            </div>
            <Button 
              onClick={handleSave}
              disabled={saveMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold"
            >
              <Save className="w-4 h-4 mr-2" />
              {saveMutation.isPending ? 'Saving...' : 'Save All Settings'}
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        {saveMutation.isSuccess && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            <span className="text-green-800 font-medium">Settings saved successfully!</span>
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-6 mb-6">
            <TabsTrigger value="risk" className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Risk Management
            </TabsTrigger>
            <TabsTrigger value="platforms" className="flex items-center gap-2">
              <Globe className="w-4 h-4" />
              Platforms
            </TabsTrigger>
            {/* New Email Notifications Tab Trigger */}
            <TabsTrigger value="email" className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Email
            </TabsTrigger>
            <TabsTrigger value="alerts" className="flex items-center gap-2">
              <Bell className="w-4 h-4" />
              App Alerts
            </TabsTrigger>
            <TabsTrigger value="advanced" className="flex items-center gap-2">
              <Sliders className="w-4 h-4" />
              Advanced
            </TabsTrigger>
            <TabsTrigger value="presets" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Presets
            </TabsTrigger>
          </TabsList>

          {/* Risk Management Tab */}
          <TabsContent value="risk" className="space-y-6">
            <div className="bg-white rounded-lg border border-slate-200 p-6">
              <h3 className="text-base font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-600" />
                Risk Parameters
              </h3>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-700">
                    Minimum Confidence Threshold
                  </Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    max="1"
                    value={formData.min_confidence_threshold}
                    onChange={(e) => setFormData({...formData, min_confidence_threshold: parseFloat(e.target.value)})}
                    className="border-slate-300"
                  />
                  <p className="text-xs text-slate-500">
                    Only act on opportunities with confidence ≥ {(formData.min_confidence_threshold * 100).toFixed(0)}%
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-700">
                    Minimum Edge Threshold
                  </Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    max="1"
                    value={formData.min_edge_threshold}
                    onChange={(e) => setFormData({...formData, min_edge_threshold: parseFloat(e.target.value)})}
                    className="border-slate-300"
                  />
                  <p className="text-xs text-slate-500">
                    Only trade when edge ≥ {(formData.min_edge_threshold * 100).toFixed(1)}%
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-700">
                    Maximum Position Size ($)
                  </Label>
                  <Input
                    type="number"
                    min="0"
                    value={formData.max_position_size}
                    onChange={(e) => setFormData({...formData, max_position_size: parseInt(e.target.value)})}
                    className="border-slate-300"
                  />
                  <p className="text-xs text-slate-500">
                    Maximum size per position: ${formData.max_position_size}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-700">
                    Maximum Portfolio Exposure ($)
                  </Label>
                  <Input
                    type="number"
                    min="0"
                    value={formData.max_portfolio_exposure}
                    onChange={(e) => setFormData({...formData, max_portfolio_exposure: parseInt(e.target.value)})}
                    className="border-slate-300"
                  />
                  <p className="text-xs text-slate-500">
                    Total exposure limit: ${formData.max_portfolio_exposure}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-700">
                    Kelly Multiplier
                  </Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    max="1"
                    value={formData.kelly_multiplier}
                    onChange={(e) => setFormData({...formData, kelly_multiplier: parseFloat(e.target.value)})}
                    className="border-slate-300"
                  />
                  <p className="text-xs text-slate-500">
                    Use {(formData.kelly_multiplier * 100).toFixed(0)}% of Kelly recommendation
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-700">
                    Max Open Positions
                  </Label>
                  <Input
                    type="number"
                    min="1"
                    value={formData.max_open_positions}
                    onChange={(e) => setFormData({...formData, max_open_positions: parseInt(e.target.value)})}
                    className="border-slate-300"
                  />
                  <p className="text-xs text-slate-500">
                    Maximum concurrent positions: {formData.max_open_positions}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-700">
                    Auto Take Profit (%)
                  </Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    max="1"
                    value={formData.take_profit_percent}
                    onChange={(e) => setFormData({...formData, take_profit_percent: parseFloat(e.target.value)})}
                    className="border-slate-300"
                  />
                  <p className="text-xs text-slate-500">
                    Close at {(formData.take_profit_percent * 100).toFixed(0)}% profit
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-700">
                    Auto Stop Loss (%)
                  </Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    max="1"
                    value={formData.stop_loss_percent}
                    onChange={(e) => setFormData({...formData, stop_loss_percent: parseFloat(e.target.value)})}
                    className="border-slate-300"
                  />
                  <p className="text-xs text-slate-500">
                    Close at {(formData.stop_loss_percent * 100).toFixed(0)}% loss
                  </p>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-slate-200">
                <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                  <div>
                    <Label className="text-sm font-medium text-slate-900">
                      🤖 Automatic Trading
                    </Label>
                    <p className="text-xs text-slate-600 mt-1">
                      Enable AI-powered automatic trade execution
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={formData.auto_trade_enabled}
                      onCheckedChange={(checked) => setFormData({...formData, auto_trade_enabled: checked})}
                    />
                    <Badge variant="outline" className={formData.auto_trade_enabled ? "bg-green-50 text-green-700 border-green-300 font-semibold" : "bg-slate-50 text-slate-700 border-slate-300"}>
                      {formData.auto_trade_enabled ? '✅ ENABLED' : 'Disabled'}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Platforms Tab */}
          <TabsContent value="platforms" className="space-y-6">
            <div className="bg-white rounded-lg border border-slate-200 p-6">
              <h3 className="text-base font-semibold text-slate-900 mb-4">
                Active Platforms ({formData.platforms_enabled.length}/{allPlatforms.length})
              </h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {allPlatforms.map(platform => (
                  <div key={platform} className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:border-blue-300 transition-colors">
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={formData.platforms_enabled.includes(platform)}
                        onCheckedChange={() => togglePlatform(platform)}
                      />
                      <PlatformBadge platform={platform} showEmoji />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-lg border border-slate-200 p-6">
              <h3 className="text-base font-semibold text-slate-900 mb-4">
                Market Categories ({formData.categories_enabled.length}/{allCategories.length})
              </h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                {allCategories.map(category => (
                  <div key={category} className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg hover:border-blue-300 transition-colors">
                    <Checkbox
                      checked={formData.categories_enabled.includes(category)}
                      onCheckedChange={() => toggleCategory(category)}
                    />
                    <Badge variant="outline" className="border-slate-300 text-slate-700">
                      {category}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-lg border border-slate-200 p-6">
              <h3 className="text-base font-semibold text-slate-900 mb-4">Market Filters</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-700">
                    Minimum Liquidity (USD)
                  </Label>
                  <Input
                    type="number"
                    min="0"
                    value={formData.min_liquidity_usd}
                    onChange={(e) => setFormData({...formData, min_liquidity_usd: parseInt(e.target.value)})}
                    className="border-slate-300"
                  />
                  <p className="text-xs text-slate-500">
                    Only scan markets with liquidity ≥ ${formData.min_liquidity_usd}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-700">
                    Scan Interval (minutes)
                  </Label>
                  <Input
                    type="number"
                    min="1"
                    value={formData.scan_interval_minutes}
                    onChange={(e) => setFormData({...formData, scan_interval_minutes: parseInt(e.target.value)})}
                    className="border-slate-300"
                  />
                  <p className="text-xs text-slate-500">
                    Scan markets every {formData.scan_interval_minutes} minutes
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Email Notifications Tab */}
          <TabsContent value="email" className="space-y-4">
            <Card className="border border-slate-200">
              <CardContent className="p-6 space-y-4">
                <div>
                  <h3 className="text-base font-semibold text-slate-900 mb-4">Email Notifications</h3>
                  <p className="text-sm text-slate-600 mb-6">
                    Configure email alerts via Resend API. Get notified instantly about critical opportunities, trade executions, and daily summaries.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="flex-1">
                      <div className="font-medium text-sm text-slate-900">Master Email Switch</div>
                      <div className="text-xs text-slate-600 mt-1">Enable/disable all email notifications</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={formData.email_alerts_enabled}
                      onChange={(e) => setFormData({...formData, email_alerts_enabled: e.target.checked})}
                      className="h-5 w-5 rounded border-slate-300 text-blue-600"
                    />
                  </div>

                  <div className="border-t border-slate-200 pt-4">
                    <h4 className="font-semibold text-sm text-slate-900 mb-3">📊 Alpha Opportunities</h4>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm text-slate-700">Critical Alpha (10%+ edge)</div>
                          <div className="text-xs text-slate-500">Immediate email for high-value opportunities</div>
                        </div>
                        <input
                          type="checkbox"
                          checked={formData.email_on_critical_alpha}
                          onChange={(e) => setFormData({...formData, email_on_critical_alpha: e.target.checked})}
                          disabled={!formData.email_alerts_enabled}
                          className="h-4 w-4 rounded border-slate-300 text-blue-600 disabled:opacity-50"
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm text-slate-700">High Alpha (7%+ edge)</div>
                          <div className="text-xs text-slate-500">Email for significant opportunities</div>
                        </div>
                        <input
                          type="checkbox"
                          checked={formData.email_on_high_alpha}
                          onChange={(e) => setFormData({...formData, email_on_high_alpha: e.target.checked})}
                          disabled={!formData.email_alerts_enabled}
                          className="h-4 w-4 rounded border-slate-300 text-blue-600 disabled:opacity-50"
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm text-slate-700">Scan Complete Summary</div>
                          <div className="text-xs text-slate-500">Email after each alpha scan with results</div>
                        </div>
                        <input
                          type="checkbox"
                          checked={formData.email_scan_complete}
                          onChange={(e) => setFormData({...formData, email_scan_complete: e.target.checked})}
                          disabled={!formData.email_alerts_enabled}
                          className="h-4 w-4 rounded border-slate-300 text-blue-600 disabled:opacity-50"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-slate-200 pt-4">
                    <h4 className="font-semibold text-sm text-slate-900 mb-3">💰 Trading Activity</h4>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm text-slate-700">Trade Executed</div>
                          <div className="text-xs text-slate-500">Email when trades are opened (manual or auto)</div>
                        </div>
                        <input
                          type="checkbox"
                          checked={formData.email_on_trade_execution}
                          onChange={(e) => setFormData({...formData, email_on_trade_execution: e.target.checked})}
                          disabled={!formData.email_alerts_enabled}
                          className="h-4 w-4 rounded border-slate-300 text-blue-600 disabled:opacity-50"
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm text-slate-700">Position Closed</div>
                          <div className="text-xs text-slate-500">Email when trades close (P&L summary)</div>
                        </div>
                        <input
                          type="checkbox"
                          checked={formData.email_on_position_closed}
                          onChange={(e) => setFormData({...formData, email_on_position_closed: e.target.checked})}
                          disabled={!formData.email_alerts_enabled}
                          className="h-4 w-4 rounded border-slate-300 text-blue-600 disabled:opacity-50"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-slate-200 pt-4">
                    <h4 className="font-semibold text-sm text-slate-900 mb-3">📅 Scheduled Reports</h4>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm text-slate-700">Daily Summary</div>
                        <div className="text-xs text-slate-500">Morning email with P&L, positions, and top opportunities</div>
                      </div>
                      <input
                        type="checkbox"
                        checked={formData.email_daily_summary}
                        onChange={(e) => setFormData({...formData, email_daily_summary: e.target.checked})}
                        disabled={!formData.email_alerts_enabled}
                        className="h-4 w-4 rounded border-slate-300 text-blue-600 disabled:opacity-50"
                      />
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                    <h4 className="font-semibold text-blue-900 text-sm mb-2">📧 Email Features</h4>
                    <ul className="text-xs text-blue-800 space-y-1">
                      <li>✅ Instant delivery via Resend API (fastest email service)</li>
                      <li>✅ Beautiful HTML templates with charts and metrics</li>
                      <li>✅ Click to view detailed analysis in dashboard</li>
                      <li>✅ Mobile-optimized for alerts on the go</li>
                      <li>✅ Sent to: {user?.email || 'your account email'}</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Alerts Tab */}
          <TabsContent value="alerts" className="space-y-6">
            <div className="bg-white rounded-lg border border-slate-200 p-6">
              <h3 className="text-base font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <Bell className="w-5 h-5 text-blue-600" />
                Alert Preferences
              </h3>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div>
                    <Label className="text-sm font-medium text-slate-900">
                      Enable Alerts
                    </Label>
                    <p className="text-xs text-slate-600 mt-1">
                      Master switch for all alert notifications
                    </p>
                  </div>
                  <Switch
                    checked={formData.alert_enabled}
                    onCheckedChange={(checked) => setFormData({...formData, alert_enabled: checked})}
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
                    <div>
                      <Label className="text-sm font-medium text-slate-900">
                        New Opportunities
                      </Label>
                      <p className="text-xs text-slate-600 mt-1">
                        Alert when new opportunities detected
                      </p>
                    </div>
                    <Switch
                      checked={formData.alert_on_opportunity}
                      onCheckedChange={(checked) => setFormData({...formData, alert_on_opportunity: checked})}
                      disabled={!formData.alert_enabled}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
                    <div>
                      <Label className="text-sm font-medium text-slate-900">
                        Trade Executed
                      </Label>
                      <p className="text-xs text-slate-600 mt-1">
                        Alert when trades are executed
                      </p>
                    </div>
                    <Switch
                      checked={formData.alert_on_trade_executed}
                      onCheckedChange={(checked) => setFormData({...formData, alert_on_trade_executed: checked})}
                      disabled={!formData.alert_enabled}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
                    <div>
                      <Label className="text-sm font-medium text-slate-900">
                        Position Closed
                      </Label>
                      <p className="text-xs text-slate-600 mt-1">
                        Alert when positions are closed
                      </p>
                    </div>
                    <Switch
                      checked={formData.alert_on_position_closed}
                      onCheckedChange={(checked) => setFormData({...formData, alert_on_position_closed: checked})}
                      disabled={!formData.alert_enabled}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
                    <div>
                      <Label className="text-sm font-medium text-slate-900">
                        Risk Limits
                      </Label>
                      <p className="text-xs text-slate-600 mt-1">
                        Alert when risk limits are reached
                      </p>
                    </div>
                    <Switch
                      checked={formData.alert_on_risk_limit}
                      onCheckedChange={(checked) => setFormData({...formData, alert_on_risk_limit: checked})}
                      disabled={!formData.alert_enabled}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Push Notification Thresholds */}
            <div className="bg-white rounded-lg border border-slate-200 p-6">
              <h3 className="text-base font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <Bell className="w-5 h-5 text-purple-600" />
                Push Notification Thresholds
              </h3>
              <p className="text-sm text-slate-600 mb-6">
                Configure when to receive real-time push notifications for new alpha opportunities
              </p>

              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <div>
                    <Label className="text-sm font-medium text-slate-900">
                      🔔 Enable Push Notifications
                    </Label>
                    <p className="text-xs text-slate-600 mt-1">
                      Get instant in-app notifications for alpha opportunities
                    </p>
                  </div>
                  <Switch
                    checked={formData.push_notification_enabled}
                    onCheckedChange={(checked) => setFormData({...formData, push_notification_enabled: checked})}
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-700">
                      Minimum Edge for Notifications (%)
                    </Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      max="1"
                      value={formData.push_min_edge_threshold}
                      onChange={(e) => setFormData({...formData, push_min_edge_threshold: parseFloat(e.target.value)})}
                      className="border-slate-300"
                      disabled={!formData.push_notification_enabled}
                    />
                    <p className="text-xs text-slate-500">
                      Only notify when edge ≥ {(formData.push_min_edge_threshold * 100).toFixed(1)}%
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-700">
                      Minimum Confidence for Notifications (%)
                    </Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      max="1"
                      value={formData.push_min_confidence_threshold}
                      onChange={(e) => setFormData({...formData, push_min_confidence_threshold: parseFloat(e.target.value)})}
                      className="border-slate-300"
                      disabled={!formData.push_notification_enabled}
                    />
                    <p className="text-xs text-slate-500">
                      Only notify when confidence ≥ {(formData.push_min_confidence_threshold * 100).toFixed(0)}%
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="text-sm font-medium text-slate-700">Notification Severity Filter</Label>
                  
                  <div className="flex items-center justify-between p-3 border border-slate-200 rounded-lg">
                    <div>
                      <div className="text-sm text-slate-700">Critical Only (10%+ edge)</div>
                      <div className="text-xs text-slate-500">Only receive notifications for critical opportunities</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={formData.push_on_critical_only}
                      onChange={(e) => setFormData({
                        ...formData, 
                        push_on_critical_only: e.target.checked,
                        push_on_high_and_critical: false
                      })}
                      disabled={!formData.push_notification_enabled}
                      className="h-4 w-4 rounded border-slate-300 text-purple-600 disabled:opacity-50"
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 border border-slate-200 rounded-lg">
                    <div>
                      <div className="text-sm text-slate-700">High & Critical (7%+ edge)</div>
                      <div className="text-xs text-slate-500">Receive notifications for high and critical opportunities</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={formData.push_on_high_and_critical}
                      onChange={(e) => setFormData({
                        ...formData, 
                        push_on_high_and_critical: e.target.checked,
                        push_on_critical_only: false
                      })}
                      disabled={!formData.push_notification_enabled}
                      className="h-4 w-4 rounded border-slate-300 text-purple-600 disabled:opacity-50"
                    />
                  </div>
                </div>

                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <h4 className="font-semibold text-purple-900 text-sm mb-2">⚡ Real-Time Push Notifications</h4>
                  <ul className="text-xs text-purple-800 space-y-1">
                    <li>✅ Instant desktop notifications for new alpha</li>
                    <li>✅ In-app notification center with live badge counter</li>
                    <li>✅ Auto-triggered during alpha scans</li>
                    <li>✅ One-click to view opportunity details</li>
                    <li>✅ Mark as read to dismiss</li>
                  </ul>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Advanced Tab */}
          <TabsContent value="advanced" className="space-y-6">
            <div className="bg-white rounded-lg border border-slate-200 p-6">
              <h3 className="text-base font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <Sliders className="w-5 h-5 text-blue-600" />
                Order Execution
              </h3>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-700">
                    Slippage Tolerance (%)
                  </Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    max="0.1"
                    value={formData.slippage_tolerance}
                    onChange={(e) => setFormData({...formData, slippage_tolerance: parseFloat(e.target.value)})}
                    className="border-slate-300"
                  />
                  <p className="text-xs text-slate-500">
                    Accept up to {(formData.slippage_tolerance * 100).toFixed(1)}% price slippage
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-700">
                    Order Timeout (seconds)
                  </Label>
                  <Input
                    type="number"
                    min="5"
                    max="300"
                    value={formData.order_timeout_seconds}
                    onChange={(e) => setFormData({...formData, order_timeout_seconds: parseInt(e.target.value)})}
                    className="border-slate-300"
                  />
                  <p className="text-xs text-slate-500">
                    Cancel orders after {formData.order_timeout_seconds} seconds
                  </p>
                </div>
              </div>

              <div className="mt-6 space-y-4">
                <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
                  <div>
                    <Label className="text-sm font-medium text-slate-900">
                      Retry Failed Orders
                    </Label>
                    <p className="text-xs text-slate-600 mt-1">
                      Automatically retry orders that fail
                    </p>
                  </div>
                  <Switch
                    checked={formData.retry_failed_orders}
                    onCheckedChange={(checked) => setFormData({...formData, retry_failed_orders: checked})}
                  />
                </div>

                <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
                  <div>
                    <Label className="text-sm font-medium text-slate-900">
                      Use Limit Orders
                    </Label>
                    <p className="text-xs text-slate-600 mt-1">
                      Use limit orders instead of market orders (lower fees)
                    </p>
                  </div>
                  <Switch
                    checked={formData.use_limit_orders}
                    onCheckedChange={(checked) => setFormData({...formData, use_limit_orders: checked})}
                  />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-slate-200 p-6">
              <h3 className="text-base font-semibold text-slate-900 mb-4">Trading Limits</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-700">
                    Max Daily Trades
                  </Label>
                  <Input
                    type="number"
                    min="1"
                    value={formData.max_daily_trades}
                    onChange={(e) => setFormData({...formData, max_daily_trades: parseInt(e.target.value)})}
                    className="border-slate-300"
                  />
                  <p className="text-xs text-slate-500">
                    Maximum {formData.max_daily_trades} trades per day
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-700">
                    Cooldown Between Trades (minutes)
                  </Label>
                  <Input
                    type="number"
                    min="0"
                    value={formData.cooldown_between_trades_minutes}
                    onChange={(e) => setFormData({...formData, cooldown_between_trades_minutes: parseInt(e.target.value)})}
                    className="border-slate-300"
                  />
                  <p className="text-xs text-slate-500">
                    Wait {formData.cooldown_between_trades_minutes} minutes between trades
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-slate-200 p-6">
              <h3 className="text-base font-semibold text-slate-900 mb-4">Advanced Risk Features</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
                  <div>
                    <Label className="text-sm font-medium text-slate-900">
                      Trailing Stop Loss
                    </Label>
                    <p className="text-xs text-slate-600 mt-1">
                      Automatically adjust stop loss as price moves in your favor
                    </p>
                  </div>
                  <Switch
                    checked={formData.trailing_stop_enabled}
                    onCheckedChange={(checked) => setFormData({...formData, trailing_stop_enabled: checked})}
                  />
                </div>

                {formData.trailing_stop_enabled && (
                  <div className="space-y-2 pl-4">
                    <Label className="text-sm font-medium text-slate-700">
                      Trailing Stop Distance (%)
                    </Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      max="0.5"
                      value={formData.trailing_stop_percent}
                      onChange={(e) => setFormData({...formData, trailing_stop_percent: parseFloat(e.target.value)})}
                      className="border-slate-300 max-w-xs"
                    />
                    <p className="text-xs text-slate-500">
                      Trail by {(formData.trailing_stop_percent * 100).toFixed(1)}%
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-yellow-800">
                <strong>Warning:</strong> Advanced settings can significantly impact trading performance. Only modify these if you understand their implications.
              </div>
            </div>
          </TabsContent>

          {/* Presets Tab */}
          <TabsContent value="presets" className="space-y-6">
            <div className="bg-white rounded-lg border border-slate-200 p-6">
              <h3 className="text-base font-semibold text-slate-900 mb-4">Risk Profile Presets</h3>
              <p className="text-sm text-slate-600 mb-6">
                Quickly apply predefined risk profiles to match your trading style
              </p>

              <div className="grid md:grid-cols-3 gap-4">
                <div className="border-2 border-slate-200 rounded-lg p-6 hover:border-blue-400 transition-colors cursor-pointer"
                     onClick={() => applyPreset('conservative')}>
                  <div className="flex items-center gap-2 mb-3">
                    <Shield className="w-5 h-5 text-blue-600" />
                    <h4 className="font-semibold text-slate-900">Conservative</h4>
                  </div>
                  <p className="text-sm text-slate-600 mb-4">Low risk, high confidence trades</p>
                  <div className="space-y-2 text-xs text-slate-600">
                    <div className="flex justify-between">
                      <span>Min Confidence:</span>
                      <span className="font-semibold">75%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Min Edge:</span>
                      <span className="font-semibold">5%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Max Position:</span>
                      <span className="font-semibold">$300</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Kelly Multiplier:</span>
                      <span className="font-semibold">15%</span>
                    </div>
                  </div>
                  <Button className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white">
                    Apply Conservative
                  </Button>
                </div>

                <div className="border-2 border-blue-400 rounded-lg p-6 hover:border-blue-500 transition-colors cursor-pointer bg-blue-50"
                     onClick={() => applyPreset('moderate')}>
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingUp className="w-5 h-5 text-blue-600" />
                    <h4 className="font-semibold text-slate-900">Moderate</h4>
                    <Badge className="bg-blue-600 text-white text-xs">Recommended</Badge>
                  </div>
                  <p className="text-sm text-slate-600 mb-4">Balanced risk-reward approach</p>
                  <div className="space-y-2 text-xs text-slate-600">
                    <div className="flex justify-between">
                      <span>Min Confidence:</span>
                      <span className="font-semibold">65%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Min Edge:</span>
                      <span className="font-semibold">3%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Max Position:</span>
                      <span className="font-semibold">$500</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Kelly Multiplier:</span>
                      <span className="font-semibold">25%</span>
                    </div>
                  </div>
                  <Button className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white">
                    Apply Moderate
                  </Button>
                </div>

                <div className="border-2 border-slate-200 rounded-lg p-6 hover:border-orange-400 transition-colors cursor-pointer"
                     onClick={() => applyPreset('aggressive')}>
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle className="w-5 h-5 text-orange-600" />
                    <h4 className="font-semibold text-slate-900">Aggressive</h4>
                  </div>
                  <p className="text-sm text-slate-600 mb-4">Higher risk, more opportunities</p>
                  <div className="space-y-2 text-xs text-slate-600">
                    <div className="flex justify-between">
                      <span>Min Confidence:</span>
                      <span className="font-semibold">55%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Min Edge:</span>
                      <span className="font-semibold">2%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Max Position:</span>
                      <span className="font-semibold">$1000</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Kelly Multiplier:</span>
                      <span className="font-semibold">35%</span>
                    </div>
                  </div>
                  <Button className="w-full mt-4 bg-orange-600 hover:bg-orange-700 text-white">
                    Apply Aggressive
                  </Button>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
              <h3 className="font-semibold text-slate-900 mb-3 text-sm">💡 Preset Information</h3>
              <ul className="space-y-2 text-sm text-slate-700">
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5">•</span>
                  <span><strong>Conservative:</strong> Best for beginners or those prioritizing capital preservation</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5">•</span>
                  <span><strong>Moderate:</strong> Balanced approach recommended for most traders</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5">•</span>
                  <span><strong>Aggressive:</strong> For experienced traders comfortable with higher risk</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5">•</span>
                  <span>You can apply a preset and then fine-tune individual parameters</span>
                </li>
              </ul>
            </div>
          </TabsContent>
        </Tabs>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button 
            onClick={handleSave}
            disabled={saveMutation.isPending}
            size="lg"
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8"
          >
            <Save className="w-4 h-4 mr-2" />
            {saveMutation.isPending ? 'Saving...' : 'Save All Settings'}
          </Button>
        </div>
      </div>
    </div>
  );
}
