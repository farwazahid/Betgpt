import React from "react";
import { Badge } from "@/components/ui/badge";

const platformConfig = {
  'Polymarket': {
    color: 'bg-purple-100 text-purple-700 border-purple-300',
    emoji: '🟣',
    description: 'CLOB Markets'
  },
  'Kalshi': {
    color: 'bg-blue-100 text-blue-700 border-blue-300',
    emoji: '🔵',
    description: 'Regulated Markets'
  },
  'Manifold': {
    color: 'bg-green-100 text-green-700 border-green-300',
    emoji: '🟢',
    description: 'Community Markets'
  },
  'Gnosis': {
    color: 'bg-teal-100 text-teal-700 border-teal-300',
    emoji: '🌐',
    description: 'Conditional Tokens'
  },
  'Augur': {
    color: 'bg-orange-100 text-orange-700 border-orange-300',
    emoji: '🟠',
    description: 'Decentralized Oracle'
  },
  'PredictIt': {
    color: 'bg-red-100 text-red-700 border-red-300',
    emoji: '🔴',
    description: 'Political Markets'
  }
};

export default function PlatformBadge({ platform, showEmoji = false, size = "default" }) {
  const config = platformConfig[platform] || {
    color: 'bg-slate-100 text-slate-700 border-slate-300',
    emoji: '⚪',
    description: 'Market'
  };

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    default: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5'
  };

  return (
    <Badge 
      variant="outline" 
      className={`${config.color} ${sizeClasses[size]} font-medium`}
    >
      {showEmoji && <span className="mr-1">{config.emoji}</span>}
      {platform}
    </Badge>
  );
}

export { platformConfig };