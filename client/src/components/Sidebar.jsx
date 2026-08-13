import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, CheckSquare, Sparkles, Search, Users, FolderOpen, UserCog, ClipboardList, X } from 'lucide-react';
import clsx from 'clsx';
import { useAuth } from '../context/AuthContext';

const Sidebar = ({ isOpen, onClose }) => {
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
      label: 'Tasks',
      items: [
        { to: '/tasks', icon: ClipboardList, label: 'My Tasks' },
      ],
    },
    {
      label: 'Handover',
      items: [
        { to: '/handover', icon: CheckSquare, label: 'Handover Access' },
        { to: '/ai-brief', icon: Sparkles, label: 'AI Brief Generator' },
        { to: '/search', icon: Search, label: 'Institutional Search' },
      ],
    },
    ...(isAdmin
      ? [
          {
            label: 'Administration',
            items: [
              { to: '/admin', icon: Users, label: 'HOD Dashboard' },
              { to: '/faculty', icon: UserCog, label: 'Faculty Management' },
              { to: '/roles', icon: FolderOpen, label: 'Role Directory' },
            ],
          },
        ]
      : []),
  ];

  const sidebarContent = (
    <>
      <div className="p-4 flex-1 overflow-y-auto">
        {/* Mobile close button */}
        <div className="flex items-center justify-between mb-4 md:hidden">
          <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">Menu</span>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

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
                    onClick={onClose}
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
    </>
  );

  return (
    <>
      {/* Desktop sidebar — always visible */}
      <aside className="w-64 border-r border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl hidden md:flex flex-col h-[calc(100vh-64px)] sticky top-[64px]">
        {sidebarContent}
      </aside>

      {/* Mobile sidebar — slide-in overlay */}
      {isOpen && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40 md:hidden animate-fade-in" onClick={onClose} />
          <aside className="fixed top-0 left-0 w-72 h-full bg-white dark:bg-slate-900 z-50 md:hidden flex flex-col shadow-2xl animate-slide-in-left">
            {sidebarContent}
          </aside>
        </>
      )}
    </>
  );
};

export default Sidebar;
