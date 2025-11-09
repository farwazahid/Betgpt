import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bell, CheckCircle2, AlertTriangle, TrendingUp, X, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function AlertCenter() {
  const [filter, setFilter] = useState("all"); // all, unread, critical
  const queryClient = useQueryClient();

  const { data: alerts = [], isLoading } = useQuery({
    queryKey: ['alerts'],
    queryFn: () => base44.entities.Alert.list('-created_date', 50),
    initialData: [],
    refetchInterval: 10000, // Refresh every 10 seconds for real-time updates
  });

  const markAsReadMutation = useMutation({
    mutationFn: (alertId) => base44.entities.Alert.update(alertId, { is_read: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    },
  });

  const markActionTakenMutation = useMutation({
    mutationFn: (alertId) => base44.entities.Alert.update(alertId, { action_taken: true, is_read: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    },
  });

  const deleteAlertMutation = useMutation({
    mutationFn: (alertId) => base44.entities.Alert.delete(alertId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    },
  });

  const filteredAlerts = alerts.filter(alert => {
    if (filter === "unread") return !alert.is_read;
    if (filter === "critical") return alert.severity === "Critical" || alert.severity === "High";
    return true;
  });

  const unreadCount = alerts.filter(a => !a.is_read).length;
  const criticalCount = alerts.filter(a => (a.severity === "Critical" || a.severity === "High") && !a.is_read).length;

  const getSeverityColor = (severity) => {
    switch (severity) {
      case "Critical": return "bg-red-100 text-red-800 border-red-300";
      case "High": return "bg-orange-100 text-orange-800 border-orange-300";
      case "Medium": return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "Low": return "bg-blue-100 text-blue-800 border-blue-300";
      default: return "bg-slate-100 text-slate-800 border-slate-300";
    }
  };

  const getAlertIcon = (alertType) => {
    switch (alertType) {
      case "Opportunity": return <TrendingUp className="w-4 h-4" />;
      case "Risk Limit": return <AlertTriangle className="w-4 h-4" />;
      default: return <Bell className="w-4 h-4" />;
    }
  };

  const formatTimestamp = (date) => {
    if (!date) return '';
    const now = Date.now();
    const created = new Date(date).getTime();
    const diffMinutes = Math.floor((now - created) / (1000 * 60));
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  return (
    <Card className="border border-slate-200">
      <CardHeader className="border-b border-slate-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Bell className="w-5 h-5 text-slate-600" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </div>
            <CardTitle className="text-base">Alert Center</CardTitle>
            {criticalCount > 0 && (
              <Badge className="bg-red-500 text-white">
                {criticalCount} Critical
              </Badge>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant={filter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("all")}
              className={filter === "all" ? "bg-blue-600" : ""}
            >
              All ({alerts.length})
            </Button>
            <Button
              variant={filter === "unread" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("unread")}
              className={filter === "unread" ? "bg-blue-600" : ""}
            >
              Unread ({unreadCount})
            </Button>
            <Button
              variant={filter === "critical" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("critical")}
              className={filter === "critical" ? "bg-blue-600" : ""}
            >
              Critical ({criticalCount})
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {isLoading ? (
          <div className="p-6 text-center text-slate-500">Loading alerts...</div>
        ) : filteredAlerts.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {filteredAlerts.map(alert => (
              <div 
                key={alert.id} 
                className={`p-4 hover:bg-slate-50 transition-colors ${
                  !alert.is_read ? 'bg-blue-50/30' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${getSeverityColor(alert.severity)}`}>
                    {getAlertIcon(alert.alert_type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-semibold text-sm text-slate-900">
                          {alert.title}
                        </h4>
                        <Badge variant="outline" className={`text-xs ${getSeverityColor(alert.severity)}`}>
                          {alert.severity}
                        </Badge>
                        {alert.data?.deep_analysis_used && (
                          <Badge variant="outline" className="text-xs bg-purple-100 text-purple-800 border-purple-300">
                            Deep Analysis
                          </Badge>
                        )}
                        {!alert.is_read && (
                          <Badge className="text-xs bg-blue-500 text-white">New</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteAlertMutation.mutate(alert.id)}
                          className="h-6 w-6 p-0"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>

                    <p className="text-sm text-slate-700 mb-2 whitespace-pre-line">
                      {alert.message}
                    </p>

                    {/* Additional Data */}
                    {alert.data && (
                      <div className="flex flex-wrap gap-3 mb-3 text-xs text-slate-600">
                        {alert.data.platform && (
                          <span>📍 {alert.data.platform}</span>
                        )}
                        {alert.data.edge !== undefined && (
                          <span>📈 Edge: <strong>{(alert.data.edge * 100).toFixed(1)}%</strong></span>
                        )}
                        {alert.data.confidence !== undefined && (
                          <span>🎯 Confidence: <strong>{(alert.data.confidence * 100).toFixed(0)}%</strong></span>
                        )}
                        {alert.data.news_count && (
                          <span>📰 {alert.data.news_count} articles</span>
                        )}
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500">
                        {formatTimestamp(alert.created_date)}
                      </span>
                      
                      <div className="flex gap-2">
                        {alert.opportunity_id && (
                          <Link to={createPageUrl("Opportunities")}>
                            <Button size="sm" variant="outline" className="h-7 text-xs">
                              <ExternalLink className="w-3 h-3 mr-1" />
                              View Opportunity
                            </Button>
                          </Link>
                        )}
                        
                        {!alert.action_taken && (
                          <Button
                            size="sm"
                            onClick={() => markActionTakenMutation.mutate(alert.id)}
                            className="h-7 text-xs bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Mark Acted
                          </Button>
                        )}
                        
                        {!alert.is_read && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => markAsReadMutation.mutate(alert.id)}
                            className="h-7 text-xs"
                          >
                            Mark Read
                          </Button>
                        )}

                        {alert.action_taken && (
                          <Badge className="text-xs bg-green-100 text-green-800 border-green-300">
                            ✓ Acted
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center">
            <Bell className="w-12 h-12 mx-auto text-slate-300 mb-3" />
            <h3 className="text-sm font-semibold text-slate-900 mb-1">No Alerts</h3>
            <p className="text-xs text-slate-600">
              {filter === "unread" 
                ? "All caught up! No unread alerts."
                : filter === "critical"
                  ? "No critical alerts at this time."
                  : "New opportunities and alerts will appear here."
              }
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}