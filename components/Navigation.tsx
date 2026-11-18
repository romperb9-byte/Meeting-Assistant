import React, { useState, useRef, useEffect } from 'react';
import { AppView } from '../types';

interface Props {
  activeView: AppView;
  onViewChange: (view: AppView) => void;
  isDocUnlocked?: boolean;
  onDocUnlockRequest?: () => void;
}

const Navigation: React.FC<Props> = ({ 
  activeView, 
  onViewChange, 
  isDocUnlocked = false, 
  onDocUnlockRequest 
}) => {
  const [showDocMenu, setShowDocMenu] = useState(false);
  const docMenuRef = useRef<HTMLDivElement>(null);

  const isDocumentActive = [AppView.MINUTES, AppView.REPORT, AppView.STRUCTURE].includes(activeView);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (docMenuRef.current && !docMenuRef.current.contains(event.target as Node)) {
        setShowDocMenu(false);
      }
    };
    if (showDocMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDocMenu]);

  const getActiveDocLabel = () => {
    switch (activeView) {
      case AppView.MINUTES:
        return 'កំណត់ហេតុ';
      case AppView.REPORT:
        return 'របាយការណ៍';
      case AppView.STRUCTURE:
        return 'រចនាសម្ព័ន្ធ';
      default:
        return 'ឯកសារ';
    }
  };

  const handleDocClick = () => {
    if (!isDocUnlocked && onDocUnlockRequest) {
      onDocUnlockRequest();
    } else {
      setShowDocMenu(prev => !prev);
    }
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-200 px-2 sm:px-4 py-1.5 shadow-2xl z-50">
      <div className="max-w-xl mx-auto flex justify-between items-center h-14 relative">
        {/* Home Button */}
        <button
          onClick={() => {
            setShowDocMenu(false);
            onViewChange(AppView.HOME);
          }}
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
          onClick={() => {
            setShowDocMenu(false);
            onViewChange(AppView.FORM);
          }}
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
          onClick={() => {
            setShowDocMenu(false);
            onViewChange(AppView.LIST);
          }}
          className={`flex flex-col items-center flex-1 transition-all ${
            activeView === AppView.LIST ? 'text-blue-600 font-extrabold scale-105' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
          </svg>
          <span className="text-[10px] sm:text-xs font-bold mt-1">បញ្ជីវត្តមាន</span>
        </button>

        {/* 3. Documents - ឯកសារ (រួមបញ្ចូល: កំណត់ហេតុ, របាយការណ៍, រចនាសម្ព័ន្ធ) */}
        <div className="flex-1 flex flex-col items-center relative" ref={docMenuRef}>
          {/* Popup Menu floating above bottom nav (when unlocked) */}
          {showDocMenu && isDocUnlocked && (
            <div className="absolute bottom-16 right-0 w-64 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 z-50 animate-in fade-in slide-in-from-bottom-2 duration-150">
              <div className="px-3 py-1.5 border-b border-gray-100 flex items-center justify-between">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">ជ្រើសរើសឯកសារ</span>
                <span className="text-[10px] bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full font-bold">🔓 ដោះសោរួច</span>
              </div>

              {/* A. Minutes */}
              <button
                type="button"
                onClick={() => {
                  onViewChange(AppView.MINUTES);
                  setShowDocMenu(false);
                }}
                className={`w-full flex items-center space-x-2.5 px-3 py-2 text-left hover:bg-red-50/70 transition-colors ${
                  activeView === AppView.MINUTES ? 'bg-red-50 text-red-600 font-bold' : 'text-gray-700'
                }`}
              >
                <div className="w-7 h-7 rounded-lg bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold">បង្កើតកំណត់ហេតុ</span>
                  <span className="text-[9px] text-gray-400">សង្ខេបកិច្ចប្រជុំដោយ AI</span>
                </div>
              </button>

              {/* B. Report */}
              <button
                type="button"
                onClick={() => {
                  onViewChange(AppView.REPORT);
                  setShowDocMenu(false);
                }}
                className={`w-full flex items-center space-x-2.5 px-3 py-2 text-left hover:bg-emerald-50/70 transition-colors ${
                  activeView === AppView.REPORT ? 'bg-emerald-50 text-emerald-600 font-bold' : 'text-gray-700'
                }`}
              >
                <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold">បង្កើតរបាយការណ៍</span>
                  <span className="text-[9px] text-gray-400">របាយការណ៍រដ្ឋបាលវគ្គ</span>
                </div>
              </button>

              {/* C. Structure */}
              <button
                type="button"
                onClick={() => {
                  onViewChange(AppView.STRUCTURE);
                  setShowDocMenu(false);
                }}
                className={`w-full flex items-center space-x-2.5 px-3 py-2 text-left hover:bg-indigo-50/70 transition-colors ${
                  activeView === AppView.STRUCTURE ? 'bg-indigo-50 text-indigo-600 font-bold' : 'text-gray-700'
                }`}
              >
                <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold">បង្កើតរចនាសម្ព័ន្ធ</span>
                  <span className="text-[9px] text-gray-400">អង្គការលេខ & មែកធាង</span>
                </div>
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={handleDocClick}
            className={`flex flex-col items-center w-full transition-all ${
              isDocumentActive ? 'text-indigo-600 font-extrabold scale-105' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <div className="relative">
              {!isDocUnlocked ? (
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              ) : (
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              )}
              {isDocumentActive && isDocUnlocked && (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-indigo-600 rounded-full"></span>
              )}
            </div>
            <span className="text-[10px] sm:text-xs font-bold mt-1 flex items-center gap-0.5">
              <span>{isDocumentActive ? getActiveDocLabel() : 'ឯកសារ'}</span>
              {!isDocUnlocked && <span className="text-[9px] text-amber-600 font-mono font-bold">🔒321</span>}
              {isDocUnlocked && (
                <svg className={`w-3 h-3 transition-transform ${showDocMenu ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" />
                </svg>
              )}
            </span>
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
