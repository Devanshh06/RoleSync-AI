import React, { useState, useEffect } from 'react';
import { Bell, Search, UserCircle, GraduationCap, Sun, Moon, LogOut, ChevronDown, Menu, Check } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { fetchNotifications, markAsRead, markAllAsRead } from '../services/notificationService';

const Navbar = ({ onToggleSidebar }) => {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (user?.id) {
      loadNotifications();
      // Simple polling for new notifications every 60s
      const interval = setInterval(loadNotifications, 60000);
      return () => clearInterval(interval);
    }
  }, [user?.id]);

  const loadNotifications = async () => {
    try {
      const data = await fetchNotifications(user.id);
      setNotifications(data || []);
    } catch (err) {
      console.error('Failed to load notifications', err);
    }
  };

  const handleMarkAsRead = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      await markAsRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch (err) {
      console.error('Failed to mark as read', err);
    }
  };

  const handleMarkAllAsRead = async (e) => {
    if (e) e.stopPropagation();
    try {
      await markAllAsRead(user.id);
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (err) {
      console.error('Failed to mark all as read', err);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleSearchFocus = () => {
    navigate('/search');
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <nav className="glass sticky top-0 z-50 px-4 sm:px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-2">
        {/* Hamburger — mobile only */}
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors md:hidden"
          aria-label="Toggle menu"
        >
          <Menu className="w-5 h-5 text-slate-600 dark:text-slate-400" />
        </button>

        <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
          <GraduationCap className="w-7 h-7 sm:w-8 sm:h-8" />
          <span className="text-lg sm:text-xl font-bold tracking-tight">RoleSync</span>
          <span className="text-[10px] font-bold bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded-md uppercase tracking-wider ml-1">AI</span>
        </div>
      </div>
      
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Quick search */}
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Quick search..." 
            onFocus={handleSearchFocus}
            readOnly
            className="pl-9 pr-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 border border-transparent dark:border-slate-700 w-56 transition-all cursor-pointer"
          />
        </div>
        
        {/* Theme toggle */}
        <button 
          onClick={toggleTheme}
          className="p-2 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors"
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        {/* Notifications */}
        <div className="relative">
          <button 
            onClick={() => { setShowNotifications(!showNotifications); setShowUserMenu(false); }}
            className="relative p-2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
            )}
          </button>
          
          {showNotifications && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
              <div className="absolute right-0 top-full mt-2 w-80 max-h-[28rem] overflow-y-auto bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 z-50 animate-slide-down scrollbar-thin">
                <div className="sticky top-0 bg-white dark:bg-slate-900 px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between z-10">
                  <div className="text-sm font-bold text-slate-800 dark:text-slate-200">Notifications</div>
                  {unreadCount > 0 && (
                    <button onClick={handleMarkAllAsRead} className="text-xs text-blue-600 hover:underline">
                      Mark all as read
                    </button>
                  )}
                </div>
                
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-sm text-slate-500">
                    No notifications yet.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {notifications.map(notif => (
                      <div key={notif.id} className={`p-4 transition-colors ${notif.is_read ? 'opacity-70' : 'bg-blue-50/50 dark:bg-blue-900/10'}`}>
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">{notif.title}</div>
                            <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">{notif.message}</div>
                            <div className="text-[10px] text-slate-400 mt-2">
                              {new Date(notif.created_at).toLocaleString()}
                            </div>
                          </div>
                          {!notif.is_read && (
                            <button 
                              onClick={(e) => handleMarkAsRead(notif.id, e)}
                              className="p-1 text-slate-400 hover:text-blue-600 transition-colors"
                              title="Mark as read"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
        
        {/* User profile dropdown */}
        <div className="relative">
          <button
            onClick={() => { setShowUserMenu(!showUserMenu); setShowNotifications(false); }}
            className="flex items-center gap-2 sm:gap-3 sm:pl-4 sm:border-l border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg px-2 sm:px-3 py-1.5 transition-colors"
          >
            <div className="text-right hidden sm:block">
              <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                {user?.name || 'User'}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                {user?.userType === 'Admin' ? 'HOD / Admin' : user?.department || 'Faculty'}
              </div>
            </div>
            <div className="relative">
              <UserCircle className="w-8 h-8 sm:w-9 sm:h-9 text-slate-400" />
              {user?.status === 'Leaving' && (
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-amber-500 rounded-full border-2 border-white dark:border-slate-900" />
              )}
            </div>
            <ChevronDown className="w-4 h-4 text-slate-400 hidden sm:block" />
          </button>

          {/* Dropdown menu */}
          {showUserMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
              <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 py-2 z-50 animate-slide-down">
                <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="text-sm font-bold text-slate-800 dark:text-slate-200">{user?.name}</div>
                  <div className="text-xs text-slate-500">{user?.email}</div>
                </div>
                <button
                  onClick={() => { setShowUserMenu(false); navigate('/profile'); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <UserCircle className="w-4 h-4" />
                  My Profile
                </button>
                <button
                  onClick={() => { setShowUserMenu(false); navigate('/settings'); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <Menu className="w-4 h-4" />
                  Settings
                </button>
                <div className="border-t border-slate-100 dark:border-slate-800 mt-1 pt-1">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign out
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
