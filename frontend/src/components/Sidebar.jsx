import React from 'react';
import { LayoutDashboard, Globe, Database, Compass, ChevronLeft, ChevronRight } from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab, isCollapsed, setIsCollapsed }) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'globe', label: '3D Moon Globe', icon: Globe },
    { id: 'moontrek', label: 'Explore South Pole', icon: Compass },
    { id: 'dataset', label: 'Dataset & Reports', icon: Database },
  ];

  return (
    <aside
      className={`border-r border-[var(--border-color)] bg-[var(--bg-card)] flex flex-col justify-between transition-all duration-300 z-10 select-none ${
        isCollapsed ? 'w-16 min-w-[64px]' : 'w-56 min-w-[224px]'
      }`}
    >
      {/* Top Nav Links */}
      <div className="p-3 space-y-3">
        <div className="flex items-center justify-between px-2 py-1">
          {!isCollapsed && (
            <span className="text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
              Navigation
            </span>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 rounded-md bg-[var(--apple-parchment)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] border border-[var(--border-color)] transition-all ml-auto cursor-pointer active:scale-95"
            title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
          </button>
        </div>

        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs transition-all cursor-pointer active:scale-95 ${
                  isActive
                    ? 'bg-[#0066cc] text-white font-medium shadow-sm'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--apple-parchment)]'
                }`}
                title={isCollapsed ? item.label : undefined}
              >
                <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-white' : 'text-[var(--text-secondary)]'}`} />
                {!isCollapsed && <span className="truncate">{item.label}</span>}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Sidebar Footer */}
      <div className="p-3 border-t border-[var(--border-color)]">
        {!isCollapsed && (
          <div className="text-[11px] text-[var(--text-muted)] text-center font-normal">
            LunaAstra System
          </div>
        )}
      </div>
    </aside>
  );
}
