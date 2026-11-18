
import React, { useState, useEffect } from 'react';
import { MeetingGroup } from '../types';
import { createGroup, subscribeToGroups, deleteGroup } from '../services/firebase';

interface Props {
  onSelectGroup: (group: MeetingGroup) => void;
}

const GroupList: React.FC<Props> = ({ onSelectGroup }) => {
  const [groups, setGroups] = useState<MeetingGroup[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupPassword, setNewGroupPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // Check admin status from session storage on mount
  useEffect(() => {
    const adminStatus = sessionStorage.getItem('is_admin_active') === 'true';
    setIsAdmin(adminStatus);
    
    const unsubscribe = subscribeToGroups(setGroups);
    return () => unsubscribe();
  }, []);

  const handleAdminToggle = () => {
    if (isAdmin) {
      setIsAdmin(false);
      sessionStorage.removeItem('is_admin_active');
    } else {
      const password = prompt("សូមបញ្ចូលលេខកូដសម្ងាត់ដើម្បីគ្រប់គ្រងក្រុម (Master Code)៖");
      if (password === "168") { // Default admin master code: 168
        setIsAdmin(true);
        sessionStorage.setItem('is_admin_active', 'true');
      } else if (password !== null) {
        alert("លេខកូដសម្ងាត់មិនត្រឹមត្រូវទេ!");
      }
    }
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim() || !newGroupPassword.trim() || !isAdmin) {
      alert("សូមបំពេញឈ្មោះក្រុម និងកំណត់លេខសម្ងាត់ឱ្យបានត្រឹមត្រូវ!");
      return;
    }

    setLoading(true);
    try {
      await createGroup({
        name: newGroupName,
        description: '',
        password: newGroupPassword,
        timestamp: Date.now()
      });
      setNewGroupName('');
      setNewGroupPassword('');
      setShowModal(false);
    } catch (error) {
      alert("មិនអាចបង្កើតក្រុមបានទេ");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!isAdmin) return;
    
    if (confirm("តើអ្នកចង់លុបក្រុមនេះ និងទិន្នន័យទាំងអស់មែនទេ?")) {
      await deleteGroup(id);
    }
  };

  const handleSelectGroupAttempt = (group: MeetingGroup) => {
    // If you are admin, skip password check
    if (isAdmin) {
      onSelectGroup(group);
      return;
    }

    // If group has no password (older groups), let them in
    if (!group.password) {
      onSelectGroup(group);
      return;
    }

    const enteredPass = prompt(`សូមបញ្ចូលលេខសម្ងាត់សម្រាប់ក្រុម "${group.name}"៖`);
    if (enteredPass === group.password) {
      onSelectGroup(group);
    } else if (enteredPass !== null) {
      alert("លេខសម្ងាត់ក្រុមមិនត្រឹមត្រូវទេ! សូមទាក់ទងអ្នកគ្រប់គ្រង។");
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-8 flex justify-between items-end border-b border-gray-100 pb-6">
        <div>
          <h2 className="khmer-moul text-2xl text-gray-800">ក្រុមប្រជុំទាំងអស់</h2>
          <p className="text-gray-500 mt-1">ជ្រើសរើសក្រុមដើម្បីចាប់ផ្តើម</p>
        </div>
        
        <button 
          onClick={handleAdminToggle}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all font-bold text-sm ${
            isAdmin 
            ? 'bg-green-100 text-green-700 hover:bg-green-200' 
            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {isAdmin 
              ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 00-2 2z" />
              : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 00-2 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            }
          </svg>
          <span>{isAdmin ? 'បានដោះសោរ (Admin)' : 'ដោះសោរគ្រប់គ្រង'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Add Group Card - Only visible to Admin */}
        {isAdmin && (
          <button 
            onClick={() => setShowModal(true)}
            className="group h-48 border-2 border-dashed border-gray-300 rounded-[2rem] flex flex-col items-center justify-center hover:border-red-500 hover:bg-red-50 transition-all active:scale-95"
          >
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center group-hover:bg-red-500 group-hover:text-white transition-colors mb-3">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <span className="khmer-moul text-gray-400 group-hover:text-red-500">បង្កើតក្រុមថ្មី</span>
          </button>
        )}

        {/* Group Cards */}
        {groups.map((group) => (
          <div 
            key={group.id}
            onClick={() => handleSelectGroupAttempt(group)}
            className="relative h-48 bg-white rounded-[2rem] shadow-xl shadow-gray-100 border border-gray-100 p-6 flex flex-col justify-between hover:shadow-2xl hover:-translate-y-1 transition-all cursor-pointer group"
          >
            {/* Delete button - Only visible to Admin */}
            {isAdmin && (
              <button 
                onClick={(e) => handleDelete(e, group.id)}
                className="absolute top-4 right-4 p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}

            <div className="flex justify-between items-start">
              <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center text-red-600 mb-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              {group.password && !isAdmin && (
                <div className="text-gray-300" title="មានលេខសម្ងាត់">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 00-2 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
              )}
            </div>

            <div>
              <h3 className="khmer-moul text-gray-800 text-lg line-clamp-1">{group.name}</h3>
              
              {/* Show Password only if Admin is active */}
              {isAdmin && group.password && (
                <div className="mt-1 flex items-center space-x-1.5 px-2 py-0.5 bg-yellow-50 text-yellow-700 text-[10px] font-bold rounded-md border border-yellow-100 w-fit">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                  <span>លេខសម្ងាត់៖ {group.password}</span>
                </div>
              )}

              <p className="text-[10px] text-gray-400 mt-1">
                បង្កើតនៅ៖ {new Date(group.timestamp).toLocaleDateString('km-KH')}
              </p>
            </div>
          </div>
        ))}
        
        {/* If no groups and not admin, show a message */}
        {!isAdmin && groups.length === 0 && (
          <div className="col-span-full py-20 text-center">
            <div className="text-gray-300 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
            <p className="khmer-moul text-gray-400">មិនទាន់មានក្រុមប្រជុំនៅឡើយទេ</p>
            <p className="text-sm text-gray-400 mt-2">សូមទាក់ទងអ្នកគ្រប់គ្រងដើម្បីបង្កើតក្រុម</p>
          </div>
        )}
      </div>

      {/* Modal Create Group */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-[2rem] w-full max-w-md p-8 shadow-2xl animate-in fade-in zoom-in duration-300">
            <h3 className="khmer-moul text-xl text-gray-800 mb-6">បង្កើតក្រុមប្រជុំថ្មី</h3>
            <form onSubmit={handleCreateGroup} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">ឈ្មោះក្រុមប្រជុំ</label>
                <input 
                  autoFocus
                  required
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="ឧ. ក្រុមប្រជុំបច្ចេកទេស ក"
                  className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-red-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">កំណត់លេខសម្ងាត់សម្រាប់ក្រុម</label>
                <input 
                  required
                  type="text"
                  value={newGroupPassword}
                  onChange={(e) => setNewGroupPassword(e.target.value)}
                  placeholder="ឧ. 123"
                  className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-red-500 transition-all"
                />
                <p className="text-[10px] text-gray-400 mt-2">* អ្នកប្រើប្រាស់ទូទៅត្រូវការលេខកូដនេះដើម្បីចូលក្រុម</p>
              </div>
              <div className="flex gap-3 pt-4">
                <button 
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3 px-6 bg-gray-100 text-gray-600 rounded-xl font-bold hover:bg-gray-200"
                >
                  បោះបង់
                </button>
                <button 
                  type="submit"
                  disabled={loading || !newGroupName.trim() || !newGroupPassword.trim()}
                  className="flex-1 py-3 px-6 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 shadow-lg shadow-red-100 disabled:bg-gray-300 transition-all"
                >
                  {loading ? 'កំពុងបង្កើត...' : 'បង្កើតក្រុម'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default GroupList;
