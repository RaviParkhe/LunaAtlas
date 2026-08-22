import React from 'react';
import { LayoutDashboard, Database, ChevronLeft, ChevronRight } from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab, isCollapsed, setIsCollapsed }) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'dataset', label: 'Dataset', icon: Database },
  ];

  return (
    <aside
      className={`glass-panel border-r border-[rgba(45,66,105,0.5)] flex flex-col justify-between transition-all duration-300 z-10 ${
        isCollapsed ? 'w-16 min-w-[64px]' : 'w-56 min-w-[224px]'
      }`}
    >
      {/* Top Nav Links */}
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between px-2 py-1">
          {!isCollapsed && (
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Navigation
            </span>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 rounded-lg bg-[#0b101d] text-slate-400 hover:text-white hover:bg-blue-600/30 border border-slate-700/60 transition-all ml-auto"
            title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        <nav className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-blue-600/20 text-blue-400 border border-blue-500/40 shadow-lg shadow-blue-500/10 font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
                title={isCollapsed ? item.label : undefined}
              >
                <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-blue-400' : 'text-slate-400'}`} />
                {!isCollapsed && <span className="truncate">{item.label}</span>}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Sidebar Footer */}
      <div className="p-4 border-t border-[rgba(45,66,105,0.4)]">
        {!isCollapsed && (
          <div className="text-xs text-slate-500 text-center font-medium">
            LunarHabitat System
          </div>
        )}
      </div>
    </aside>
  );
}
