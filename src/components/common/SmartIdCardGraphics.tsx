import React from 'react';

export type CardThemeId = 'obsidian-gold' | 'cyber-blue' | 'emerald-tech' | 'aurora-violet' | 'titanium-carbon';

export interface CardThemeConfig {
  id: CardThemeId;
  name: string;
  thaiName: string;
  bgGradient: string;
  borderColor: string;
  accentColor: string;
  accentGlow: string;
  goldOrSilver: 'gold' | 'silver' | 'cyan' | 'emerald';
  chipColor: string;
  badgeBg: string;
  badgeText: string;
  hologramColor: string;
  textColor: string;
}

export const CARD_THEMES: Record<CardThemeId, CardThemeConfig> = {
  'obsidian-gold': {
    id: 'obsidian-gold',
    name: 'Royal Obsidian & Gold',
    thaiName: 'ออบซิเดียน & ทองคำหลวง',
    bgGradient: 'from-[#12141a] via-[#1a1c24] to-[#0b0d12]',
    borderColor: 'border-amber-400/50',
    accentColor: '#f59e0b',
    accentGlow: 'bg-amber-500/20',
    goldOrSilver: 'gold',
    chipColor: '#d97706',
    badgeBg: 'bg-amber-400/20',
    badgeText: 'text-amber-300',
    hologramColor: 'rgba(245, 158, 11, 0.15)',
    textColor: 'text-amber-200',
  },
  'cyber-blue': {
    id: 'cyber-blue',
    name: 'Cyber Nexus Cobalt',
    thaiName: 'ไซเบอร์เน็กซัส สีน้ำเงินอวกาศ',
    bgGradient: 'from-[#0d1b2e] via-[#162746] to-[#0a1220]',
    borderColor: 'border-cyan-400/50',
    accentColor: '#06b6d4',
    accentGlow: 'bg-cyan-500/25',
    goldOrSilver: 'cyan',
    chipColor: '#0284c7',
    badgeBg: 'bg-cyan-400/20',
    badgeText: 'text-cyan-300',
    hologramColor: 'rgba(6, 182, 212, 0.15)',
    textColor: 'text-cyan-200',
  },
  'emerald-tech': {
    id: 'emerald-tech',
    name: 'Emerald Jade Matrix',
    thaiName: 'มรกตหยก & เมทริกซ์',
    bgGradient: 'from-[#0a2318] via-[#113827] to-[#061710]',
    borderColor: 'border-emerald-400/50',
    accentColor: '#10b981',
    accentGlow: 'bg-emerald-500/20',
    goldOrSilver: 'emerald',
    chipColor: '#059669',
    badgeBg: 'bg-emerald-400/20',
    badgeText: 'text-emerald-300',
    hologramColor: 'rgba(16, 185, 129, 0.15)',
    textColor: 'text-emerald-200',
  },
  'aurora-violet': {
    id: 'aurora-violet',
    name: 'Aurora Amethyst',
    thaiName: 'ออโรร่าสีม่วงคราม',
    bgGradient: 'from-[#1e1333] via-[#2c1b4d] to-[#120a21]',
    borderColor: 'border-purple-400/50',
    accentColor: '#a855f7',
    accentGlow: 'bg-purple-500/25',
    goldOrSilver: 'gold',
    chipColor: '#c084fc',
    badgeBg: 'bg-purple-400/20',
    badgeText: 'text-purple-300',
    hologramColor: 'rgba(168, 85, 247, 0.15)',
    textColor: 'text-purple-200',
  },
  'titanium-carbon': {
    id: 'titanium-carbon',
    name: 'Titanium Carbon Weave',
    thaiName: 'ไทเทเนียม & คาร์บอนไฟเบอร์',
    bgGradient: 'from-[#1c1d22] via-[#282a30] to-[#141518]',
    borderColor: 'border-slate-400/40',
    accentColor: '#e2e8f0',
    accentGlow: 'bg-slate-400/20',
    goldOrSilver: 'silver',
    chipColor: '#94a3b8',
    badgeBg: 'bg-white/15',
    badgeText: 'text-slate-200',
    hologramColor: 'rgba(255, 255, 255, 0.12)',
    textColor: 'text-slate-200',
  },
};

export const GuillochePatternSvg: React.FC<{ themeId?: CardThemeId; opacity?: number }> = ({
  themeId = 'obsidian-gold',
  opacity = 0.18,
}) => {
  const strokeColor =
    themeId === 'obsidian-gold'
      ? '#fbbf24'
      : themeId === 'cyber-blue'
      ? '#38bdf8'
      : themeId === 'emerald-tech'
      ? '#34d399'
      : themeId === 'aurora-violet'
      ? '#c084fc'
      : '#cbd5e1';

  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ opacity }}
    >
      <defs>
        {/* Intricate Geometric Guilloche Wave Pattern */}
        <pattern
          id={`guilloche-${themeId}`}
          width="120"
          height="80"
          patternUnits="userSpaceOnUse"
        >
          <path
            d="M 0 40 Q 30 10 60 40 T 120 40"
            fill="none"
            stroke={strokeColor}
            strokeWidth="0.8"
            strokeOpacity="0.8"
          />
          <path
            d="M 0 40 Q 30 70 60 40 T 120 40"
            fill="none"
            stroke={strokeColor}
            strokeWidth="0.8"
            strokeOpacity="0.8"
          />
          <path
            d="M 0 20 Q 30 50 60 20 T 120 20"
            fill="none"
            stroke={strokeColor}
            strokeWidth="0.5"
            strokeOpacity="0.5"
          />
          <path
            d="M 0 60 Q 30 30 60 60 T 120 60"
            fill="none"
            stroke={strokeColor}
            strokeWidth="0.5"
            strokeOpacity="0.5"
          />
          <circle cx="60" cy="40" r="18" fill="none" stroke={strokeColor} strokeWidth="0.6" strokeDasharray="2 3" />
          <circle cx="60" cy="40" r="28" fill="none" stroke={strokeColor} strokeWidth="0.4" />
          <circle cx="0" cy="0" r="16" fill="none" stroke={strokeColor} strokeWidth="0.5" />
          <circle cx="120" cy="0" r="16" fill="none" stroke={strokeColor} strokeWidth="0.5" />
          <circle cx="0" cy="80" r="16" fill="none" stroke={strokeColor} strokeWidth="0.5" />
          <circle cx="120" cy="80" r="16" fill="none" stroke={strokeColor} strokeWidth="0.5" />
        </pattern>

        {/* Micro-dot security grid */}
        <pattern
          id={`microgrid-${themeId}`}
          width="16"
          height="16"
          patternUnits="userSpaceOnUse"
        >
          <circle cx="8" cy="8" r="0.8" fill={strokeColor} fillOpacity="0.4" />
        </pattern>
      </defs>

      <rect width="100%" height="100%" fill={`url(#microgrid-${themeId})`} />
      <rect width="100%" height="100%" fill={`url(#guilloche-${themeId})`} />
    </svg>
  );
};

export const SmartChipSvg: React.FC<{ size?: number; isGold?: boolean }> = ({
  size = 42,
  isGold = true,
}) => {
  return (
    <div
      className="relative rounded-lg overflow-hidden shrink-0 shadow-md border border-white/20"
      style={{
        width: `${size}px`,
        height: `${size * 0.78}px`,
        background: isGold
          ? 'linear-gradient(135deg, #fef08a 0%, #eab308 30%, #ca8a04 70%, #fef08a 100%)'
          : 'linear-gradient(135deg, #f1f5f9 0%, #cbd5e1 30%, #94a3b8 70%, #f8fafc 100%)',
      }}
    >
      <svg
        viewBox="0 0 44 34"
        className="w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Chip contact dividing lines */}
        <rect x="2" y="2" width="40" height="30" rx="3" fill="none" stroke="#713f12" strokeWidth="0.8" strokeOpacity="0.6" />
        <path d="M 2 12 L 18 12 M 26 12 L 42 12" stroke="#713f12" strokeWidth="0.8" strokeOpacity="0.6" />
        <path d="M 2 22 L 18 22 M 26 22 L 42 22" stroke="#713f12" strokeWidth="0.8" strokeOpacity="0.6" />
        <path d="M 18 2 L 18 32 M 26 2 L 26 32" stroke="#713f12" strokeWidth="0.8" strokeOpacity="0.6" />
        <rect x="18" y="12" width="8" height="10" rx="2" fill="none" stroke="#713f12" strokeWidth="0.8" strokeOpacity="0.6" />
      </svg>
    </div>
  );
};

export const HologramEmblemSvg: React.FC<{ themeId?: CardThemeId }> = ({
  themeId = 'obsidian-gold',
}) => {
  return (
    <div className="absolute top-1/2 right-4 -translate-y-1/2 w-28 h-28 pointer-events-none opacity-20 group-hover:opacity-30 transition-opacity">
      <svg viewBox="0 0 100 100" className="w-full h-full animate-spin-slow">
        <defs>
          <linearGradient id={`holoGrad-${themeId}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.8" />
            <stop offset="25%" stopColor="#06b6d4" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#ec4899" stopOpacity="0.8" />
            <stop offset="75%" stopColor="#10b981" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.8" />
          </linearGradient>
        </defs>
        {/* Radial Sunburst Crest */}
        <circle cx="50" cy="50" r="46" fill="none" stroke={`url(#holoGrad-${themeId})`} strokeWidth="1" strokeDasharray="3 3" />
        <circle cx="50" cy="50" r="38" fill="none" stroke={`url(#holoGrad-${themeId})`} strokeWidth="1.5" />
        <polygon
          points="50,15 62,38 85,38 66,54 74,78 50,63 26,78 34,54 15,38 38,38"
          fill="none"
          stroke={`url(#holoGrad-${themeId})`}
          strokeWidth="1.2"
        />
        <circle cx="50" cy="50" r="12" fill="none" stroke={`url(#holoGrad-${themeId})`} strokeWidth="1" />
      </svg>
    </div>
  );
};

export const ContactlessWaveSvg: React.FC<{ color?: string }> = ({ color = '#38bdf8' }) => {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round">
      <path d="M 6 18 A 8 8 0 0 1 6 6" />
      <path d="M 10 16 A 5 5 0 0 1 10 8" />
      <path d="M 14 14 A 2 2 0 0 1 14 10" />
    </svg>
  );
};
