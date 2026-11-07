import React from 'react';
import { LayoutDashboard, Zap, CalendarDays, PiggyBank, Settings } from 'lucide-react';
import { triggerHaptic } from '../services/geolocation';
import { sound } from '../services/sound';

export type ActiveTab = 'home' | 'pad' | 'reports' | 'savings' | 'settings';

interface BottomNavProps {
  activeTab: ActiveTab;
  onChangeTab: (tab: ActiveTab) => void;
  todayCount: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onChangeTab,
  todayCount,
}) => {
  const tabs = [
    {
      id: 'home' as ActiveTab,
      label: 'Inicio',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'pad' as ActiveTab,
      label: 'Registrar',
      icon: Zap,
      badge: null,
      highlight: true,
    },
    {
      id: 'reports' as ActiveTab,
      label: 'Reportes',
      icon: CalendarDays,
      badge: todayCount > 0 ? todayCount : null,
    },
    {
      id: 'savings' as ActiveTab,
      label: 'Ahorros',
      icon: PiggyBank,
      badge: null,
    },
    {
      id: 'settings' as ActiveTab,
      label: 'Ajustes',
      icon: Settings,
      badge: null,
    },
  ];

  const handleTabClick = (tabId: ActiveTab) => {
    triggerHaptic('light');
    sound.playClick();
    onChangeTab(tabId);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-lg border-t border-slate-800 safe-bottom shadow-[0_-8px_20px_rgba(0,0,0,0.5)]">
      <div className="max-w-lg mx-auto flex items-center justify-around px-1.5 py-1.5">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className={`flex-1 flex flex-col items-center justify-center py-1 px-0.5 relative transition-all active:scale-95 ${
                isActive
                  ? 'text-emerald-400 font-bold'
                  : 'text-slate-400 hover:text-slate-200 font-medium'
              }`}
            >
              <div className="relative">
                <div
                  className={`p-1 rounded-xl transition-all ${
                    isActive
                      ? 'bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/40 shadow-sm'
                      : ''
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                {tab.badge !== null && (
                  <span className="absolute -top-1 -right-2 bg-emerald-500 text-slate-950 text-[10px] font-black px-1.5 py-0.2 rounded-full shadow">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] mt-0.5 tracking-tight truncate max-w-[65px]">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
