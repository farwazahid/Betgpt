import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, X, Check, Target, TrendingUp, AlertCircle, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const queryClient = useQueryClient();

  // Fetch unread alerts
  const { data: alerts = [] } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const result = await base44.entities.Alert.filter({ is_read: false }, '-created_date', 20);
      return Array.isArray(result) ? result : [];
    },
    initialData: [],
    refetchInterval: 10000, // Refetch every 10 seconds
  });

  // Update local notifications when alerts change
  useEffect(() => {
    if (alerts.length > 0) {
      const newNotifs = alerts.filter(
        alert => !notifications.find(n => n.id === alert.id)
      );
      
      if (newNotifs.length > 0) {
        // Show toast notifications for new alerts
        newNotifs.forEach(alert => {
          if (alert.alert_type === 'Opportunity' && alert.severity === 'Critical') {
            showToast(alert);
          }
        });
        
        setNotifications([...newNotifs, ...notifications].slice(0, 20));
      }
    }
  }, [alerts]);

  const showToast = (alert) => {
    // Create a temporary toast notification
    const toast = document.createElement('div');
    toast.className = 'fixed top-20 right-6 z-50 animate-in slide-in-from-right';
    toast.innerHTML = `
      <div class="bg-white border-2 border-red-500 rounded-lg shadow-2xl p-4 max-w-md">
        <div class="flex items-start gap-3">
          <div class="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0">
            <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div class="flex-1">
            <div class="font-bold text-slate-900 mb-1">${alert.title}</div>
            <div class="text-sm text-slate-600">${alert.message.substring(0, 80)}...</div>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.style.transition = 'all 0.3s ease-out';
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      setTimeout(() => toast.remove(), 300);
    }, 5000);
  };

  const markAsRead = async (alertId) => {
    try {
      await base44.entities.Alert.update(alertId, { is_read: true });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      setNotifications(notifications.filter(n => n.id !== alertId));
    } catch (err) {
      console.error('Error marking alert as read:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      const promises = alerts.map(alert => 
        base44.entities.Alert.update(alert.id, { is_read: true })
      );
      await Promise.all(promises);
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      setNotifications([]);
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  };

  const getIcon = (alertType) => {
    switch(alertType) {
      case 'Opportunity': return <Target className="w-4 h-4" />;
      case 'Trade Executed': return <TrendingUp className="w-4 h-4" />;
      case 'Position Closed': return <Activity className="w-4 h-4" />;
      case 'Risk Limit': return <AlertCircle className="w-4 h-4" />;
      default: return <Bell className="w-4 h-4" />;
    }
  };

  const getSeverityColor = (severity) => {
    switch(severity) {
      case 'Critical': return 'bg-red-500';
      case 'High': return 'bg-orange-500';
      case 'Medium': return 'bg-yellow-500';
      case 'Low': return 'bg-blue-500';
      default: return 'bg-slate-500';
    }
  };

  const unreadCount = alerts.length;

  return (
    <>
      {/* Notification Bell */}
      <div className="relative">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsOpen(!isOpen)}
          className="relative hover:bg-slate-100"
        >
          <Bell className="w-5 h-5 text-slate-600" />
          {unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </motion.span>
          )}
        </Button>

        {/* Notification Panel */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-2xl border border-slate-200 z-50 max-h-[600px] flex flex-col"
            >
              {/* Header */}
              <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-slate-900">Notifications</h3>
                  <p className="text-xs text-slate-500 mt-0.5">{unreadCount} unread</p>
                </div>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={markAllAsRead}
                      className="text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                    >
                      <Check className="w-3 h-3 mr-1" />
                      Mark all read
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsOpen(false)}
                    className="hover:bg-slate-100"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Notifications List */}
              <div className="overflow-y-auto flex-1">
                {alerts.length > 0 ? (
                  <div className="divide-y divide-slate-100">
                    {alerts.map(alert => (
                      <motion.div
                        key={alert.id}
                        layout
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="p-4 hover:bg-slate-50 transition-colors relative group"
                      >
                        {/* Severity Indicator */}
                        <div className={`absolute left-0 top-0 bottom-0 w-1 ${getSeverityColor(alert.severity)}`} />

                        <div className="flex items-start gap-3 ml-2">
                          {/* Icon */}
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                            alert.severity === 'Critical' ? 'bg-red-100 text-red-600' :
                            alert.severity === 'High' ? 'bg-orange-100 text-orange-600' :
                            alert.severity === 'Medium' ? 'bg-yellow-100 text-yellow-600' :
                            'bg-blue-100 text-blue-600'
                          }`}>
                            {getIcon(alert.alert_type)}
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <h4 className="font-semibold text-sm text-slate-900 line-clamp-1">
                                {alert.title}
                              </h4>
                              <Badge className={`text-xs flex-shrink-0 ${
                                alert.severity === 'Critical' ? 'bg-red-100 text-red-700 border-red-300' :
                                alert.severity === 'High' ? 'bg-orange-100 text-orange-700 border-orange-300' :
                                alert.severity === 'Medium' ? 'bg-yellow-100 text-yellow-700 border-yellow-300' :
                                'bg-blue-100 text-blue-700 border-blue-300'
                              }`}>
                                {alert.severity}
                              </Badge>
                            </div>

                            <p className="text-xs text-slate-600 line-clamp-2 mb-2 whitespace-pre-line">
                              {alert.message}
                            </p>

                            {/* Data Preview */}
                            {alert.data && (
                              <div className="text-xs text-slate-500 mb-2">
                                {alert.data.edge && (
                                  <span className="font-medium text-green-600">
                                    {(Math.abs(alert.data.edge) * 100).toFixed(1)}% edge
                                  </span>
                                )}
                                {alert.data.confidence && (
                                  <span className="ml-2">
                                    • {(alert.data.confidence * 100).toFixed(0)}% confidence
                                  </span>
                                )}
                                {alert.data.platform && (
                                  <span className="ml-2">• {alert.data.platform}</span>
                                )}
                              </div>
                            )}

                            <div className="flex items-center justify-between">
                              <span className="text-xs text-slate-400">
                                {new Date(alert.created_date).toLocaleTimeString([], { 
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                })}
                              </span>

                              <div className="flex items-center gap-2">
                                {alert.opportunity_id && (
                                  <Link
                                    to={createPageUrl("Opportunities")}
                                    onClick={() => setIsOpen(false)}
                                  >
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="text-xs h-7 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                    >
                                      View
                                    </Button>
                                  </Link>
                                )}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => markAsRead(alert.id)}
                                  className="text-xs h-7 hover:bg-slate-100 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <Check className="w-3 h-3 mr-1" />
                                  Mark read
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="p-12 text-center">
                    <Bell className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                    <h3 className="font-semibold text-slate-900 mb-1">All caught up!</h3>
                    <p className="text-sm text-slate-600">No new notifications</p>
                  </div>
                )}
              </div>

              {/* Footer */}
              {alerts.length > 0 && (
                <div className="p-3 border-t border-slate-200 bg-slate-50">
                  <Link
                    to={createPageUrl("Dashboard")}
                    onClick={() => setIsOpen(false)}
                  >
                    <Button
                      variant="ghost"
                      className="w-full text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                    >
                      View All Alerts
                    </Button>
                  </Link>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Click outside to close */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}