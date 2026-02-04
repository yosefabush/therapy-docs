'use client';

import React from 'react';
import { Sidebar, MobileMenuProvider } from './Sidebar';
import { Header } from './Header';
import { BottomNav } from './BottomNav';

interface ResponsiveLayoutProps {
  children: React.ReactNode;
  user: {
    name: string;
    role: string;
    organization: string;
  };
  headerTitle: string;
  headerSubtitle?: string;
  headerActions?: React.ReactNode;
  onLogout?: () => void;
  onSessionNotificationClick?: (sessionId: string, notificationId: string, markAsRead: () => void) => void;
}

/**
 * Inner layout component that can use the mobile menu context
 */
function ResponsiveLayoutInner({
  children,
  user,
  headerTitle,
  headerSubtitle,
  headerActions,
  onLogout,
  onSessionNotificationClick,
}: ResponsiveLayoutProps) {
  return (
    <div className="min-h-screen bg-warm-50">
      <Sidebar user={user} onLogout={onLogout} />

      {/* Main content area - full width on mobile, offset for sidebar on desktop */}
      <main className="md:mr-64 pb-20 md:pb-0">
        <Header
          title={headerTitle}
          subtitle={headerSubtitle}
          actions={headerActions}
          onSessionNotificationClick={onSessionNotificationClick}
        />
        {children}
      </main>

      {/* Mobile Bottom Navigation */}
      <BottomNav />
    </div>
  );
}

/**
 * ResponsiveLayout provides a responsive page layout with:
 * - Desktop: Fixed sidebar on the right, main content with margin
 * - Mobile: Hidden sidebar with hamburger menu to toggle slide-out panel
 */
export function ResponsiveLayout(props: ResponsiveLayoutProps) {
  return (
    <MobileMenuProvider>
      <ResponsiveLayoutInner {...props} />
    </MobileMenuProvider>
  );
}
