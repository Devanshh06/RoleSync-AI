import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, CheckSquare, Sparkles, Search, Users, FolderOpen, UserCog } from 'lucide-react';
import clsx from 'clsx';
import { useAuth } from '../context/AuthContext';

const Sidebar = () => {
  const { user } = useAuth();
  const isAdmin = user?.userType === 'Admin';

  const navGroups = [
    {
      label: 'Overview',
      items: [
        { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
      ],
    },
    {
      label: 'Handover',
      items: [
        { to: '/handover', icon: CheckSquare, label: 'Handover Workspace' },
        { to: '/ai-brief', icon: Sparkles, label: 'AI Brief Generator' },
        { to: '/search', icon: Search, label: 'Institutional Search' },
      ],
    },
    ...(isAdmin
      ? [
          {
            label: 'Administration',
            items: [
              { to: '/admin', icon: Users, label: 'HOD Analytics' },
              { to: '/faculty', icon: UserCog, label: 'Faculty Management' },
              { to: '/roles', icon: FolderOpen, label: 'Role Directory' },
            ],
          },
        ]
      : []),
  ];

  return (
    <aside className="w-64 border-r border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl hidden md:flex flex-col h-[calc(100vh-64px)] sticky top-[64px]">
      <div className="p-4 flex-1 overflow-y-auto">
        {navGroups.map((group) => (
          <div key={group.label} className="mb-6">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 px-3">
              {group.label}
            </div>
            <nav className="space-y-1">
              {group.items.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === '/'}
                    className={({ isActive }) => clsx(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group',
                      isActive 
                        ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 shadow-sm' 
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200'
                    )}
                  >
                    <Icon className="w-5 h-5 transition-transform group-hover:scale-110" />
                    {item.label}
                  </NavLink>
                );
              })}
            </nav>
          </div>
        ))}
      </div>
      
      {/* Handover progress card */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-4 text-white shadow-lg">
          <div className="text-sm font-bold mb-1">
            {user?.status === 'Leaving' ? 'Handover Active' : 'Role Status'}
          </div>
          <div className="text-xs opacity-90 mb-3">
            {user?.status === 'Leaving' ? '65% tasks completed' : 'All systems normal'}
          </div>
          <div className="w-full bg-white/20 rounded-full h-1.5">
            <div
              className="bg-white h-1.5 rounded-full transition-all duration-700"
              style={{ width: user?.status === 'Leaving' ? '65%' : '100%' }}
            />
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
