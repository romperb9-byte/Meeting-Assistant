
import React, { useState, useEffect, useRef } from 'react';
import { AppView, AttendanceRecord, MeetingGroup } from './types';
import AttendanceForm from './components/AttendanceForm';
import AttendanceList from './components/AttendanceList';
import Navigation from './components/Navigation';
import MinutesGenerator from './components/MinutesGenerator';
import ReportGenerator from './components/ReportGenerator';
import StructureGenerator from './components/StructureGenerator';
import GroupList from './components/GroupList';
import { 
  subscribeToRecords, 
  deleteRecordFromFirebase, 
  clearAllRecordsForGroup 
} from './services/firebase';

const INACTIVITY_LIMIT = 5 * 60 * 1000; // 5 minutes in milliseconds

const App: React.FC = () => {
  const [view, setView] = useState<AppView>(AppView.HOME);
  const [selectedGroup, setSelectedGroup] = useState<MeetingGroup | null>(null);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showDocMenu, setShowDocMenu] = useState(false);
  const [copied, setCopied] = useState(false);
  const inactivityTimerRef = useRef<number | null>(null);
  const docMenuRef = useRef<HTMLDivElement>(null);

  // Close doc menu when clicking outside
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

  // Auto-logout functionality
  const resetInactivityTimer = () => {
    if (inactivityTimerRef.current) {
      window.clearTimeout(inactivityTimerRef.current);
    }
    
    // Only set timer if a group is selected (logged in)
    if (selectedGroup) {
      inactivityTimerRef.current = window.setTimeout(() => {
        handleLogout();
      }, INACTIVITY_LIMIT);
    }
  };

  useEffect(() => {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    
    const handler = () => resetInactivityTimer();
    
    events.forEach(event => {
      window.addEventListener(event, handler);
    });

    resetInactivityTimer();

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, handler);
      });
      if (inactivityTimerRef.current) {
        window.clearTimeout(inactivityTimerRef.current);
      }
    };
  }, [selectedGroup]);

  const handleLogout = () => {
    setSelectedGroup(null);
    setView(AppView.HOME);
    setShowShareModal(false);
    setShowDocMenu(false);
  };

  // Sync records only when a group is selected
  useEffect(() => {
    if (!selectedGroup) {
      setRecords([]);
      return;
    }

    setLoading(true);
    const unsubscribe = subscribeToRecords(
      selectedGroup.id,
      (updatedRecords) => {
        setRecords(updatedRecords);
        setLoading(false);
      },
      (err) => {
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, [selectedGroup]);

  const handleSelectGroup = (group: MeetingGroup) => {
    setSelectedGroup(group);
    setView(AppView.FORM);
  };

  const handleViewChange = (newView: AppView) => {
    if (newView === AppView.HOME) {
      handleLogout();
    } else {
      setView(newView);
    }
  };

  // Get valid app URL
  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(currentUrl)}`;

  const handleCopyLink = () => {
    if (navigator.clipboard && currentUrl) {
      navigator.clipboard.writeText(currentUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 pb-24">
      <header className="bg-white border-b p-4 sticky top-0 z-50 print:hidden shadow-sm">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div 
              className={`w-10 h-10 ${selectedGroup ? 'bg-red-50 text-red-600' : 'bg-red-600 text-white'} rounded-lg flex items-center justify-center font-bold text-xl shadow-sm`}
            >
              M
            </div>
            <div className="flex flex-col">
              <h1 className="khmer-moul text-red-600 text-base sm:text-xl pt-1 truncate max-w-[150px] sm:max-w-xs">
                {selectedGroup ? selectedGroup.name : 'ជំនួយការប្រជុំ'}
              </h1>
            </div>
            
            {/* Share & Documents Buttons */}
            <div className="flex items-center space-x-1.5 sm:space-x-2">
              {/* Share Button */}
              <button 
                onClick={() => setShowShareModal(true)}
                className="flex items-center space-x-1 px-2.5 py-1.5 text-xs sm:text-sm font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-all shadow-xs"
                title="យកតំណភ្ជាប់ / ចែករំលែក"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                <span>ចែករំលែក</span>
              </button>

              {/* Documents Button (ឯកសារ) with Dropdown */}
              <div className="relative" ref={docMenuRef}>
                <button
                  type="button"
                  onClick={() => setShowDocMenu(prev => !prev)}
                  className={`flex items-center space-x-1 px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm font-bold rounded-lg transition-all shadow-xs ${
                    [AppView.MINUTES, AppView.REPORT, AppView.STRUCTURE].includes(view)
                      ? 'bg-indigo-600 text-white shadow-indigo-200'
                      : 'text-indigo-700 bg-indigo-50 hover:bg-indigo-100'
                  }`}
                  title="ម៉ឺនុយឯកសារ (កំណត់ហេតុ, របាយការណ៍, រចនាសម្ព័ន្ធ)"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>ឯកសារ</span>
                  <svg className={`w-3.5 h-3.5 transition-transform duration-200 ${showDocMenu ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {showDocMenu && (
                  <div className="absolute left-0 mt-2 w-72 sm:w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="px-3 py-2 border-b border-gray-100 flex items-center justify-between">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">ឯកសាររដ្ឋបាល</p>
                      <span className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full font-bold">៣ មុខងារ</span>
                    </div>

                    {/* 1. Minutes Generator */}
                    <button
                      type="button"
                      onClick={() => {
                        setView(AppView.MINUTES);
                        setShowDocMenu(false);
                      }}
                      className={`w-full flex items-center space-x-3 px-3 py-2.5 text-left hover:bg-red-50/70 transition-colors ${
                        view === AppView.MINUTES ? 'bg-red-50 text-red-600 font-bold' : 'text-gray-700'
                      }`}
                    >
                      <div className="w-8 h-8 rounded-lg bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold">បង្កើតកំណត់ហេតុ</span>
                        <span className="text-[10px] text-gray-400">បង្កើតកំណត់ហេតុប្រជុំដោយ AI & Word/PDF</span>
                      </div>
                    </button>

                    {/* 2. Report Generator */}
                    <button
                      type="button"
                      onClick={() => {
                        setView(AppView.REPORT);
                        setShowDocMenu(false);
                      }}
                      className={`w-full flex items-center space-x-3 px-3 py-2.5 text-left hover:bg-emerald-50/70 transition-colors ${
                        view === AppView.REPORT ? 'bg-emerald-50 text-emerald-600 font-bold' : 'text-gray-700'
                      }`}
                    >
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold">បង្កើតរបាយការណ៍</span>
                        <span className="text-[10px] text-gray-400">របាយការណ៍រដ្ឋបាលវគ្គ/កម្មវិធី & រូបភាព</span>
                      </div>
                    </button>

                    {/* 3. Structure / Organigram Generator */}
                    <button
                      type="button"
                      onClick={() => {
                        setView(AppView.STRUCTURE);
                        setShowDocMenu(false);
                      }}
                      className={`w-full flex items-center space-x-3 px-3 py-2.5 text-left hover:bg-indigo-50/70 transition-colors ${
                        view === AppView.STRUCTURE ? 'bg-indigo-50 text-indigo-600 font-bold' : 'text-gray-700'
                      }`}
                    >
                      <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold">បង្កើតរចនាសម្ព័ន្ធ ឬ អង្គការលេខ</span>
                        <span className="text-[10px] text-gray-400">គំនូសបំព្រួញមែកធាងគណៈកម្មការ & ទំហំបន្ទាត់</span>
                      </div>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="hidden md:block text-gray-400 text-xs font-medium mr-4">
              {new Date().toLocaleDateString('km-KH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
            
            {(selectedGroup || view !== AppView.HOME) && (
              <button 
                onClick={handleLogout}
                className="flex items-center space-x-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-900 rounded-xl transition-all font-bold text-sm active:scale-95 border border-transparent"
                title="ត្រឡប់ក្រោយ"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span className="hidden sm:inline">ត្រឡប់ក្រោយ</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowShareModal(false)}></div>
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all animate-in fade-in zoom-in duration-300">
            <div className="p-6 text-center">
              <div className="flex justify-between items-center mb-4">
                <h2 className="khmer-moul text-gray-800 text-base sm:text-lg">
                  {selectedGroup ? `ចែករំលែកក្រុម៖ ${selectedGroup.name}` : 'តំណភ្ជាប់ប្រើប្រាស់កម្មវិធី'}
                </h2>
                <button onClick={() => setShowShareModal(false)} className="text-gray-400 hover:text-gray-600 p-1">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              <p className="text-xs sm:text-sm text-gray-500 mb-4">
                អ្នកអាចចម្លងតំណភ្ជាប់ខាងក្រោម ឬស្កែនកូដ QR ដើម្បីបើកប្រើប្រាស់កម្មវិធី
              </p>

              {/* QR Code */}
              <div className="bg-gray-50 p-4 rounded-2xl mb-4 inline-block border border-gray-100">
                <img src={qrCodeUrl} alt="Meeting QR Code" className="w-44 h-44 mx-auto rounded-lg"/>
                <p className="mt-2 text-xs text-gray-400 font-medium">ស្កែន QR Code ដើម្បីបើក</p>
              </div>

              {/* Link Input with Copy Button */}
              <div className="mb-4">
                <div className="flex items-center border border-gray-200 rounded-xl bg-gray-50 p-2">
                  <input 
                    type="text" 
                    readOnly 
                    value={currentUrl} 
                    className="bg-transparent text-xs text-gray-600 flex-1 px-2 focus:outline-none truncate select-all"
                  />
                  <button 
                    onClick={handleCopyLink}
                    className="ml-2 px-3 py-1.5 text-xs font-bold bg-white text-red-600 border border-red-200 rounded-lg shadow-sm hover:bg-red-50 transition-all shrink-0"
                  >
                    {copied ? 'ចម្លងរួច!' : 'ចម្លង'}
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2">
                <button 
                  onClick={handleCopyLink} 
                  className={`w-full py-3.5 px-6 rounded-xl font-bold flex items-center justify-center space-x-2 transition-all active:scale-95 ${
                    copied 
                      ? 'bg-green-600 text-white' 
                      : 'bg-red-600 text-white hover:bg-red-700 shadow-lg shadow-red-200'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {copied ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                    )}
                  </svg>
                  <span>{copied ? 'បានចម្លងតំណភ្ជាប់រួចរាល់!' : 'ចម្លងតំណភ្ជាប់ (Copy Link)'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <main className="flex-grow">
        {view === AppView.HOME && (
          <GroupList onSelectGroup={handleSelectGroup} />
        )}
        
        {(selectedGroup || [AppView.MINUTES, AppView.REPORT, AppView.STRUCTURE].includes(view)) && view !== AppView.HOME && (
          <div className="max-w-5xl mx-auto w-full p-4 md:p-8">
            {view === AppView.FORM && selectedGroup && (
              <AttendanceForm groupId={selectedGroup.id} onAddSuccess={() => setView(AppView.LIST)} />
            )}
            {view === AppView.LIST && selectedGroup && (
              <AttendanceList 
                records={records} 
                onDelete={deleteRecordFromFirebase} 
                onClear={() => clearAllRecordsForGroup(selectedGroup.id)}
              />
            )}
            {view === AppView.MINUTES && (
              <MinutesGenerator records={records} />
            )}
            {view === AppView.REPORT && (
              <ReportGenerator records={records} />
            )}
            {view === AppView.STRUCTURE && (
              <StructureGenerator records={records} selectedGroup={selectedGroup} />
            )}
          </div>
        )}
      </main>

      {(selectedGroup || view !== AppView.HOME) && <Navigation activeView={view} onViewChange={handleViewChange} />}
    </div>
  );
};

export default App;
