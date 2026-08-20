import React from 'react';
import { Sidebar } from './Sidebar';
import { TopHeader } from './TopHeader';

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-[#0A0A0A] flex font-sans text-white">
      <Sidebar />
      <div className="flex-1 ml-[220px] flex flex-col min-w-0">
        <TopHeader />
        <main className="flex-1 p-6 max-w-[1400px] w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
