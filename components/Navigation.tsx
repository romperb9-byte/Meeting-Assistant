import React from 'react';
import { AppView } from '../types';

interface Props {
  activeView: AppView;
  onViewChange: (view: AppView) => void;
}

const Navigation: React.FC<Props> = ({ activeView, onViewChange }) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-200 px-3 sm:px-6 py-1.5 shadow-2xl z-50">
      <div className="max-w-md mx-auto flex justify-around items-center h-14">
        {/* Home Button */}
        <button
          onClick={() => onViewChange(AppView.HOME)}
          className={`flex flex-col items-center flex-1 transition-all ${
            activeView === AppView.HOME ? 'text-gray-900 font-extrabold scale-105' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          <span className="text-[10px] sm:text-xs font-bold mt-1">ទំព័រដើម</span>
        </button>

        {/* 1. Form - ចុះវត្តមាន */}
        <button
          onClick={() => onViewChange(AppView.FORM)}
          className={`flex flex-col items-center flex-1 transition-all ${
            activeView === AppView.FORM ? 'text-blue-600 font-extrabold scale-105' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          <span className="text-[10px] sm:text-xs font-bold mt-1">ចុះវត្តមាន</span>
        </button>

        {/* 2. List - បញ្ជីវត្តមាន */}
        <button
          onClick={() => onViewChange(AppView.LIST)}
          className={`flex flex-col items-center flex-1 transition-all ${
            activeView === AppView.LIST ? 'text-blue-600 font-extrabold scale-105' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
          </svg>
          <span className="text-[10px] sm:text-xs font-bold mt-1">បញ្ជីវត្តមាន</span>
        </button>
      </div>
    </nav>
  );
};

export default Navigation;
