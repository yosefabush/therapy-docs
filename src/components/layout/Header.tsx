'use client';

import React, { useState } from 'react';
import { Input, Button } from '@/components/ui';

interface HeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export function Header({ title, subtitle, actions }: HeaderProps) {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <header className="sticky top-0 z-40 bg-warm-50/95 backdrop-blur-sm border-b border-sage-100">
      <div className="px-8 py-4">
        <div className="flex items-center justify-between gap-8">
          {/* Title Section */}
          <div>
            <h1
              className="text-2xl font-semibold text-clinical-900"
              style={{ fontFamily: '"David Libre", Georgia, serif' }}
            >
              {title}
            </h1>
            {subtitle && (
              <p className="text-sm text-clinical-500 mt-0.5">{subtitle}</p>
            )}
          </div>

          {/* Search & Actions */}
          <div className="flex items-center gap-4">
            {/* Global Search */}
            <div className="relative">
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
              <input
                type="search"
                placeholder="חפש מטופלים, מפגשים..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64 pr-10 pl-4 py-2 rounded-lg border border-sage-200 bg-white text-sm placeholder:text-clinical-400 focus:outline-none focus:ring-2 focus:ring-sage-500 focus:border-transparent"
              />
              <kbd className="absolute left-3 top-1/2 -translate-y-1/2 hidden sm:inline-flex items-center px-1.5 py-0.5 rounded bg-sage-100 text-xs text-clinical-500 font-mono">
                ⌘K
              </kbd>
            </div>

            {/* Notifications */}
            <button className="relative p-2 rounded-lg text-clinical-500 hover:bg-sage-50 hover:text-sage-700 transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>

            {/* Quick Actions */}
            {actions}
          </div>
        </div>
      </div>
    </header>
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
