'use client';

import React, { useState, useEffect, useRef, useContext } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui';
import { useNotifications } from '@/lib/hooks';
import { SearchModal } from './SearchModal';
import { Notification } from '@/types';

// Import mobile menu context type (we'll check for it dynamically)
interface MobileMenuContextType {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
}

interface HeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  onSessionNotificationClick?: (sessionId: string, notificationId: string, markAsRead: () => void) => void;
  onMobileMenuToggle?: () => void;
}

export function Header({ title, subtitle, actions, onSessionNotificationClick, onMobileMenuToggle }: HeaderProps) {
  const router = useRouter();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);

  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    dismissNotification,
  } = useNotifications();

  // Keyboard shortcut for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close notifications dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(e.target as Node)
      ) {
        setIsNotificationsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = (notification: Notification) => {
    if (notification.relatedId && notification.relatedType === 'session') {
      // If callback provided, use it (allows showing action modal)
      if (onSessionNotificationClick) {
        setIsNotificationsOpen(false);
        onSessionNotificationClick(
          notification.relatedId,
          notification.id,
          () => markAsRead(notification.id)
        );
      } else {
        // Default behavior: navigate to session
        markAsRead(notification.id);
        router.push(`/sessions/${notification.relatedId}`);
        setIsNotificationsOpen(false);
      }
    } else if (notification.relatedId && notification.relatedType === 'patient') {
      markAsRead(notification.id);
      router.push(`/patients/${notification.relatedId}`);
      setIsNotificationsOpen(false);
    }
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'session_reminder':
        return (
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
            <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
      case 'session_overdue':
        return (
          <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
            <svg className="w-4 h-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
        );
      case 'unsigned_session':
        return (
          <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
            <svg className="w-4 h-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="w-8 h-8 rounded-full bg-sage-100 flex items-center justify-center">
            <svg className="w-4 h-4 text-sage-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
    }
  };

  return (
    <>
      <header className="sticky top-0 z-30 bg-warm-50/95 backdrop-blur-sm border-b border-sage-100">
        <div className="px-4 md:px-8 py-4">
          <div className="flex items-center justify-between gap-4 md:gap-8">
            {/* Mobile Menu Button */}
            {onMobileMenuToggle && (
              <button
                onClick={onMobileMenuToggle}
                className="md:hidden p-2 rounded-lg text-clinical-500 hover:bg-sage-50 hover:text-sage-700 transition-colors"
                aria-label="Open menu"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            )}

            {/* Title Section */}
            <div className="flex-1 min-w-0">
              <h1
                className="text-lg md:text-2xl font-semibold text-clinical-900 truncate"
                style={{ fontFamily: '"David Libre", Georgia, serif' }}
              >
                {title}
              </h1>
              {subtitle && (
                <p className="text-sm text-clinical-500 mt-0.5 truncate hidden sm:block">{subtitle}</p>
              )}
            </div>

            {/* Search & Actions */}
            <div className="flex items-center gap-2 md:gap-4">
              {/* Global Search Button - Full on desktop, icon only on mobile */}
              <button
                onClick={() => setIsSearchOpen(true)}
                className="hidden md:flex relative w-64 pr-10 pl-4 py-2 rounded-lg border border-sage-200 bg-white text-sm text-clinical-400 text-right hover:border-sage-300 transition-colors cursor-pointer"
              >
                <svg
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-clinical-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <span>חפש מטופלים, מפגשים...</span>
                <kbd className="absolute left-3 top-1/2 -translate-y-1/2 hidden sm:inline-flex items-center px-1.5 py-0.5 rounded bg-sage-100 text-xs text-clinical-500 font-mono">
                  ⌘K
                </kbd>
              </button>
              {/* Mobile search icon */}
              <button
                onClick={() => setIsSearchOpen(true)}
                className="md:hidden p-2 rounded-lg text-clinical-500 hover:bg-sage-50 hover:text-sage-700 transition-colors"
                aria-label="Search"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>

              {/* Notifications */}
              <div className="relative" ref={notificationRef}>
                <button
                  onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                  className="relative p-2 rounded-lg text-clinical-500 hover:bg-sage-50 hover:text-sage-700 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                    />
                  </svg>
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -left-1 min-w-[18px] h-[18px] px-1 bg-red-500 rounded-full text-[10px] text-white font-medium flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                {/* Notifications Dropdown */}
                {isNotificationsOpen && (
                  <div className="fixed md:absolute left-4 right-4 md:left-0 md:right-auto top-16 md:top-auto md:mt-2 w-auto md:w-80 bg-white rounded-xl shadow-lg border border-sage-200 overflow-hidden z-50">
                    {/* Header */}
                    <div className="px-4 py-3 border-b border-sage-100 flex items-center justify-between">
                      <h3 className="text-sm font-medium text-clinical-900">התראות</h3>
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllAsRead}
                          className="text-xs text-sage-600 hover:text-sage-700"
                        >
                          סמן הכל כנקרא
                        </button>
                      )}
                    </div>

                    {/* Notifications List */}
                    <div className="max-h-80 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="px-4 py-8 text-center">
                          <svg
                            className="w-12 h-12 mx-auto text-clinical-300 mb-2"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1.5}
                              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                            />
                          </svg>
                          <p className="text-sm text-clinical-500">אין התראות חדשות</p>
                        </div>
                      ) : (
                        notifications.map((notification) => (
                          <div
                            key={notification.id}
                            className={`px-4 py-3 border-b border-sage-50 last:border-b-0 hover:bg-sage-50/50 transition-colors cursor-pointer ${
                              !notification.isRead ? 'bg-blue-50/30' : ''
                            }`}
                            onClick={() => handleNotificationClick(notification)}
                          >
                            <div className="flex items-start gap-3">
                              {getNotificationIcon(notification.type)}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-clinical-900">
                                  {notification.title}
                                </p>
                                <p className="text-xs text-clinical-500 mt-0.5">
                                  {notification.message}
                                </p>
                              </div>
                              {/* Only show dismiss button for read notifications */}
                              {notification.isRead && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    dismissNotification(notification.id);
                                  }}
                                  className="text-clinical-400 hover:text-clinical-600 p-1"
                                >
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Quick Actions - hidden on mobile, shown on md+ */}
              <div className="hidden md:flex items-center gap-4">
                {actions}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Search Modal */}
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
}

// Quick Action Button Component
interface QuickActionButtonProps {
  label: string;
  onClick: () => void;
  icon?: React.ReactNode;
}

export function QuickActionButton({ label, onClick, icon }: QuickActionButtonProps) {
  return (
    <Button variant="primary" onClick={onClick}>
      {icon && <span className="ml-2">{icon}</span>}
      {label}
    </Button>
  );
}
