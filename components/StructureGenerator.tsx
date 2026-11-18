import React, { useState, useRef } from 'react';
import { AttendanceRecord, MeetingGroup, StructureData, StructureMember } from '../types';
import { exportElementToPdf } from '../services/pdfExport';

interface Props {
  records: AttendanceRecord[];
  selectedGroup: MeetingGroup | null;
}

const StructureGenerator: React.FC<Props> = ({ records, selectedGroup }) => {
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [activeTab, setActiveTab] = useState<'chart' | 'table'>('chart');
  const structureContainerRef = useRef<HTMLDivElement>(null);

  // Form State
  const [structureInfo, setStructureInfo] = useState<Omit<StructureData, 'members'>>({
    title: 'គណៈកម្មការគ្រប់គ្រងសាលារៀន (School Management Committee)',
    institution: selectedGroup?.name || 'សាលាបឋមសិក្សា ភ្នំលៀប',
    department: 'ការិយាល័យអប់រំ យុវជន និងកីឡា',
    district: 'ស្រុកព្រះនេត្រព្រះ',
    province: 'បន្ទាយមានជ័យ',
    academicYear: 'ឆ្នាំសិក្សា ២០២៦-២០២៧',
    referenceDecision: 'យោងសេចក្ដីសម្រេចស្ដីពីការបង្កើត និងកែសម្រួលសមាសភាពគណៈកម្មការគ្រប់គ្រង'
  });

  // Default Members with realistic Khmer school committee roles
  const [members, setMembers] = useState<StructureMember[]>([
    {
      id: '1',
      name: 'ស៊ាន សាវុធ',
      role: 'ប្រធានគណៈកម្មការ',
      originalPosition: 'នាយកសាលា',
      phone: '012 345 678',
      level: 'leader',
      photo: ''
    },
    {
      id: '2',
      name: 'គឹម ហេង',
      role: 'អនុប្រធានទី១',
      originalPosition: 'តំណាងសហគមន៍/មេភូមិ',
      phone: '097 888 999',
      level: 'deputy',
      photo: ''
    },
    {
      id: '3',
      name: 'ប៊ន សំរុង',
      role: 'អនុប្រធានទី២',
      originalPosition: 'នាយករងសាលា',
      phone: '010 223 344',
      level: 'deputy',
      photo: ''
    },
    {
      id: '4',
      name: 'ជា សុខា',
      role: 'លេខាធិការ',
      originalPosition: 'គ្រូបង្រៀនថ្នាក់ទី៦',
      phone: '088 112 233',
      level: 'member',
      photo: ''
    },
    {
      id: '5',
      name: 'មាស សុផល',
      role: 'បេឡាធិកា',
      originalPosition: 'តំណាងមាតាបិតាសិស្ស',
      phone: '012 990 011',
      level: 'member',
      photo: ''
    },
    {
      id: '6',
      name: 'ហេង ចិន្តា',
      role: 'សមាជិក',
      originalPosition: 'គ្រូបង្រៀនថ្នាក់ទី១',
      phone: '096 445 566',
      level: 'member',
      photo: ''
    }
  ]);

  // New member modal or form input state
  const [newMember, setNewMember] = useState<Omit<StructureMember, 'id'>>({
    name: '',
    role: 'សមាជិក',
    originalPosition: '',
    phone: '',
    level: 'member',
    photo: ''
  });
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleInfoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setStructureInfo({ ...structureInfo, [e.target.name]: e.target.value });
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>, forEditing: boolean = false, memberId?: string) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        if (forEditing && memberId) {
          setMembers(prev => prev.map(m => m.id === memberId ? { ...m, photo: base64 } : m));
        } else {
          setNewMember(prev => ({ ...prev, photo: base64 }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMember.name.trim()) {
      alert("សូមបញ្ចូលឈ្មោះសមាជិក!");
      return;
    }

    if (editingId) {
      setMembers(prev => prev.map(m => m.id === editingId ? { ...newMember, id: editingId } : m));
      setEditingId(null);
    } else {
      const added: StructureMember = {
        ...newMember,
        id: Date.now().toString()
      };
      setMembers(prev => [...prev, added]);
    }

    setNewMember({
      name: '',
      role: 'សមាជិក',
      originalPosition: '',
      phone: '',
      level: 'member',
      photo: ''
    });
    setShowAddModal(false);
  };

  const handleEditMember = (member: StructureMember) => {
    setNewMember({
      name: member.name,
      role: member.role,
      originalPosition: member.originalPosition || '',
      phone: member.phone || '',
      level: member.level,
      photo: member.photo || ''
    });
    setEditingId(member.id);
    setShowAddModal(true);
  };

  const handleDeleteMember = (id: string) => {
    if (window.confirm("តើអ្នកពិតជាចង់លុបសមាសភាពនេះមែនទេ?")) {
      setMembers(prev => prev.filter(m => m.id !== id));
    }
  };

  const handleImportFromRecords = () => {
    if (!records || records.length === 0) {
      alert("មិនទាន់មានទិន្នន័យក្នុងបញ្ជីវត្តមានដើម្បីទាញយកទេ!");
      return;
    }

    const imported: StructureMember[] = records.map((r, idx) => ({
      id: `imported_${r.id || idx}_${Date.now()}`,
      name: r.name,
      role: idx === 0 ? 'ប្រធាន' : idx <= 2 ? 'អនុប្រធាន' : 'សមាជិក',
      originalPosition: `${r.position || ''} ${r.organization ? `(${r.organization})` : ''}`.trim(),
      phone: r.phone || '',
      level: idx === 0 ? 'leader' : idx <= 2 ? 'deputy' : 'member',
      photo: ''
    }));

    if (window.confirm(`តើអ្នកចង់បន្ថែមសមាជិកចំនួន ${imported.length} នាក់ពីបញ្ជីវត្តមានមែនទេ?`)) {
      setMembers(prev => [...prev, ...imported]);
    }
  };

  const handleDownloadPdf = async () => {
    if (!structureContainerRef.current) return;
    setIsExportingPdf(true);
    try {
      const cleanTitle = (structureInfo.title || 'រចនាសម្ព័ន្ធ').replace(/[/\\?%*:|"<>]/g, '_').substring(0, 20);
      await exportElementToPdf({
        element: structureContainerRef.current,
        filename: `រចនាសម្ព័ន្ធ_${cleanTitle}.pdf`,
        orientation: 'landscape',
        marginMm: 8,
      });
    } catch (error) {
      console.error('PDF export error:', error);
      alert('មានបញ្ហាក្នុងការទាញយកជា PDF');
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadWord = () => {
    const header = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>រចនាសម្ព័ន្ធ ឬ អង្គការលេខ</title>
        <style>
          @page Section1 {
            size: 841.95pt 595.35pt; /* A4 Landscape */
            mso-page-orientation: landscape;
            margin: 36.0pt 36.0pt 36.0pt 36.0pt;
          }
          div.Section1 { page: Section1; }
          body { font-family: 'Kantumruy Pro', 'Khmer OS Battambang', serif; line-height: 1.3; }
          .khmer-moul { font-family: 'Moul', serif; font-weight: bold; }
          .text-center { text-align: center; }
          table { width: 100%; border-collapse: collapse; margin-top: 15px; }
          th, td { border: 0.5pt solid black; padding: 6px; font-size: 10pt; }
          th { background-color: #f2f2f2; text-align: center; }
        </style>
      </head>
      <body>
        <div class="Section1">
          <div class="text-center" style="margin-bottom: 10px;">
            <p class="khmer-moul" style="font-size: 14pt; margin: 0;">ព្រះរាជាណាចក្រកម្ពុជា</p>
            <p class="khmer-moul" style="font-size: 14pt; margin: 0;">ជាតិ សាសនា ព្រះមហាក្សត្រ</p>
            <p style="margin: 0; font-size: 14pt;">~ ~ ~ ~ ~ ❀ ~ ~ ~ ~ ~</p>
          </div>

          <div style="font-weight: bold; font-size: 10pt; margin-bottom: 15px;">
            <p class="khmer-moul" style="margin: 0;">រដ្ឋបាល${structureInfo.district}</p>
            <p class="khmer-moul" style="margin: 0;">${structureInfo.department}</p>
            <p class="khmer-moul" style="margin: 0;">${structureInfo.institution}</p>
          </div>

          <div class="text-center" style="margin-top: 10px; margin-bottom: 20px;">
            <p class="khmer-moul" style="font-size: 14pt; margin: 0;">${structureInfo.title}</p>
            <p style="font-size: 10pt; margin: 5px 0;">${structureInfo.academicYear} | ${structureInfo.referenceDecision}</p>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 40px;">ល.រ</th>
                <th>គោត្តនាម-នាម</th>
                <th>តួនាទីក្នុងគណៈកម្មការ</th>
                <th>តួនាទីដើម/អង្គភាព</th>
                <th>លេខទូរស័ព្ទ</th>
                <th>ផ្សេងៗ</th>
              </tr>
            </thead>
            <tbody>
              ${members.map((m, idx) => `
                <tr>
                  <td style="text-align: center;">${idx + 1}</td>
                  <td style="font-weight: bold;">${m.name}</td>
                  <td style="text-align: center;"><b>${m.role}</b></td>
                  <td>${m.originalPosition || ''}</td>
                  <td style="text-align: center;">${m.phone || ''}</td>
                  <td></td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <table style="width: 100%; border: none; margin-top: 40px;">
            <tr>
              <td style="border: none; text-align: center; width: 50%;">
                <p><b>បានឃើញ និងឯកភាព</b></p>
                <p><b>ប្រធានការិយាល័យអប់រំ យុវជន និងកីឡា</b></p>
                <br/><br/><br/>
              </td>
              <td style="border: none; text-align: right; width: 50%;">
                <p style="font-size: 9pt; margin: 0;">ថ្ងៃ..................ខែ.........ឆ្នាំ........................ព.ស ២៥៦...</p>
                <p style="font-size: 9pt; margin: 0;">......... ថ្ងៃទី......ខែ............ឆ្នាំ ២០២...</p>
                <p style="text-align: center; margin-right: 40px;"><b>ប្រធានគណៈកម្មការ</b></p>
                <br/><br/><br/>
              </td>
            </tr>
          </table>
        </div>
      </body>
      </html>
    `;
    const blob = new Blob(['\ufeff', header], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `រចនាសម្ព័ន្ធ_${structureInfo.title.substring(0, 15)}.doc`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const leaders = members.filter(m => m.level === 'leader');
  const deputies = members.filter(m => m.level === 'deputy');
  const normalMembers = members.filter(m => m.level === 'member');

  return (
    <div className="max-w-6xl mx-auto pb-48 px-2 sm:px-4">
      {/* Configuration Header Card */}
      <div className="bg-white rounded-[2rem] shadow-xl overflow-hidden border border-gray-100 mb-8 print:hidden">
        <div className="bg-indigo-600 p-6 sm:p-8 text-center text-white">
          <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl mx-auto flex items-center justify-center mb-3">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h2 className="khmer-moul text-xl sm:text-2xl">ជំនួយការរៀបចំរចនាសម្ព័ន្ធ ឬ អង្គការលេខ</h2>
          <p className="text-indigo-100 text-xs sm:text-sm mt-1">រៀបចំគណៈកម្មការ គណៈគ្រប់គ្រង និងសមាសភាពស្ថាប័នជាគំនូសបំព្រួញ និងតារាង</p>
        </div>

        <div className="p-6 md:p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex flex-col gap-1.5 md:col-span-2">
              <label className="khmer-moul text-gray-500 text-[10px]">ចំណងជើងរចនាសម្ព័ន្ធ / ឈ្មោះគណៈកម្មការ</label>
              <input name="title" value={structureInfo.title} onChange={handleInfoChange} className="p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none text-sm font-bold text-gray-800"/>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="khmer-moul text-gray-500 text-[10px]">ឆ្នាំសិក្សា / អាណត្តិ</label>
              <input name="academicYear" value={structureInfo.academicYear} onChange={handleInfoChange} className="p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none text-sm font-semibold"/>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="khmer-moul text-gray-500 text-[10px]">ឈ្មោះស្ថាប័ន / សាលារៀន</label>
              <input name="institution" value={structureInfo.institution} onChange={handleInfoChange} className="p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none text-sm"/>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="khmer-moul text-gray-500 text-[10px]">ការិយាល័យ / អង្គភាព</label>
              <input name="department" value={structureInfo.department} onChange={handleInfoChange} className="p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none text-sm"/>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="khmer-moul text-gray-500 text-[10px]">រដ្ឋបាលក្រុង/ស្រុក - ខេត្ត</label>
              <div className="flex gap-2">
                <input name="district" value={structureInfo.district} onChange={handleInfoChange} placeholder="ស្រុក/ក្រុង" className="w-1/2 p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none text-sm"/>
                <input name="province" value={structureInfo.province} onChange={handleInfoChange} placeholder="ខេត្ត" className="w-1/2 p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none text-sm"/>
              </div>
            </div>
          </div>

          {/* Action Row */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-gray-100">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setNewMember({ name: '', role: 'សមាជិក', originalPosition: '', phone: '', level: 'member', photo: '' });
                  setEditingId(null);
                  setShowAddModal(true);
                }}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs sm:text-sm flex items-center space-x-2 shadow-md shadow-indigo-200 transition-all active:scale-95"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                <span>+ បន្ថែមសមាសភាពថ្មី</span>
              </button>

              {records && records.length > 0 && (
                <button
                  type="button"
                  onClick={handleImportFromRecords}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold px-3 py-2.5 rounded-xl text-xs sm:text-sm flex items-center space-x-1.5 transition-all"
                  title="ទាញយកឈ្មោះពីបញ្ជីវត្តមានដែលមានស្រាប់"
                >
                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1M16 10l-4 4m0 0l-4-4m4 4V4" /></svg>
                  <span>ទាញពីបញ្ជីវត្តមាន ({records.length})</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setActiveTab('chart')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'chart' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}
              >
                គំនូសបំព្រួញ (Org Chart)
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('table')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'table' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}
              >
                តារាងបញ្ជីសមាសភាព
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Action Toolbar on Top of Chart */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 print:hidden">
        <div className="text-sm font-bold text-gray-600">
          សមាសភាពសរុប៖ <span className="text-indigo-600">{members.length}</span> នាក់
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button 
            onClick={handleDownloadPdf}
            disabled={isExportingPdf}
            className="flex items-center space-x-2 bg-rose-600 hover:bg-rose-700 disabled:bg-rose-400 text-white px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-rose-200 transition-all active:scale-95"
            title="ទាញយកជាឯកសារ PDF A4 Landscape ស្អាតស្ដង់ដារ"
          >
            {isExportingPdf ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 9h1m0 4h6m-6 4h6" />
              </svg>
            )}
            <span>{isExportingPdf ? "កំពុងបង្កើត PDF..." : "ទាញយកជា PDF (.pdf)"}</span>
          </button>

          <button 
            onClick={handleDownloadWord} 
            className="flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-blue-200 transition-all active:scale-95"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1M16 10l-4 4m0 0l-4-4m4 4V4" /></svg>
            <span>ទាញយកជា Word (.doc)</span>
          </button>

          <button 
            onClick={handlePrint}
            className="flex items-center space-x-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all shadow-sm active:scale-95"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            <span>បោះពុម្ព</span>
          </button>
        </div>
      </div>

      {/* Main Printable & Exportable Structure Container */}
      <div 
        ref={structureContainerRef} 
        className="print-container bg-white shadow-2xl rounded-2xl p-6 sm:p-10 border border-gray-100 relative print:shadow-none print:border-none print:p-0 min-w-full overflow-x-auto"
      >
        {/* National Motto */}
        <div className="text-center space-y-1 mb-6">
          <h3 className="khmer-moul text-base sm:text-lg tracking-widest">ព្រះរាជាណាចក្រកម្ពុជា</h3>
          <h3 className="khmer-moul text-base sm:text-lg tracking-widest">ជាតិ សាសនា ព្រះមហាក្សត្រ</h3>
          <div className="flex justify-center py-1">
            <span className="text-base font-serif">~ ~ ~ ~ ~ ❀ ~ ~ ~ ~ ~</span>
          </div>
        </div>

        {/* Institution Info */}
        <div className="text-left font-bold text-xs sm:text-[13px] space-y-0.5 mb-6 max-w-[450px]">
          <p className="khmer-moul text-gray-800 leading-tight">រដ្ឋបាល{structureInfo.district}</p>
          <p className="khmer-moul text-gray-800 leading-tight">{structureInfo.department}</p>
          <p className="khmer-moul text-gray-800 leading-tight">{structureInfo.institution}</p>
        </div>

        {/* Title */}
        <div className="text-center mb-10 space-y-1">
          <h2 className="khmer-moul text-lg sm:text-xl text-indigo-900 underline underline-offset-8 inline-block">
            {structureInfo.title}
          </h2>
          <p className="text-xs sm:text-sm text-gray-600 font-semibold pt-1">
            {structureInfo.academicYear}
          </p>
          {structureInfo.referenceDecision && (
            <p className="text-[11px] text-gray-400 italic">
              ({structureInfo.referenceDecision})
            </p>
          )}
        </div>

        {/* VIEW 1: Visual Organigram Chart */}
        {activeTab === 'chart' && (
          <div className="space-y-8 my-6">
            {/* Level 1: Leaders (ប្រធាន) */}
            {leaders.length > 0 && (
              <div className="flex flex-col items-center">
                <div className="text-xs font-bold text-amber-700 bg-amber-50 px-3 py-1 rounded-full border border-amber-200 mb-3 uppercase tracking-wider print:hidden no-pdf">
                  ថ្នាក់ដឹកនាំកំពូល (ប្រធាន)
                </div>
                <div className="flex flex-wrap justify-center gap-6">
                  {leaders.map(member => (
                    <div 
                      key={member.id} 
                      className="relative bg-gradient-to-b from-amber-50/40 via-white to-amber-50/20 border-2 border-amber-400 rounded-2xl p-4 w-64 shadow-md text-center group transition-all"
                    >
                      {/* Action buttons (hidden on print/pdf) */}
                      <div className="absolute top-2 right-2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity print:hidden no-pdf">
                        <button onClick={() => handleEditMember(member)} className="p-1 bg-white shadow-sm border border-gray-200 rounded text-blue-600 hover:bg-blue-50" title="កែប្រែ">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                        </button>
                        <button onClick={() => handleDeleteMember(member.id)} className="p-1 bg-white shadow-sm border border-gray-200 rounded text-red-600 hover:bg-red-50" title="លុប">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>

                      <div className="w-20 h-24 mx-auto mb-3 rounded-xl border-2 border-amber-400 overflow-hidden bg-gray-100 flex items-center justify-center shadow-inner">
                        {member.photo ? (
                          <img src={member.photo} alt={member.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="text-amber-300 flex flex-col items-center">
                            <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" /></svg>
                            <span className="text-[9px] text-gray-400 mt-0.5">រូបថត</span>
                          </div>
                        )}
                      </div>

                      <div className="bg-amber-600 text-white font-bold text-xs py-1 px-3 rounded-lg inline-block shadow-sm mb-2">
                        {member.role}
                      </div>

                      <h4 className="khmer-moul text-gray-900 text-sm leading-tight mb-1">{member.name}</h4>
                      {member.originalPosition && (
                        <p className="text-[11px] text-gray-600 font-medium">{member.originalPosition}</p>
                      )}
                      {member.phone && (
                        <p className="text-[10px] text-gray-400 mt-1">ទូរស័ព្ទ៖ {member.phone}</p>
                      )}
                    </div>
                  ))}
                </div>

                {/* Connecting Line Down */}
                {deputies.length > 0 && (
                  <div className="w-0.5 h-8 bg-gray-300 my-1"></div>
                )}
              </div>
            )}

            {/* Level 2: Deputies (អនុប្រធាន) */}
            {deputies.length > 0 && (
              <div className="flex flex-col items-center">
                <div className="text-xs font-bold text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-200 mb-3 uppercase tracking-wider print:hidden no-pdf">
                  ថ្នាក់អនុប្រធាន
                </div>
                <div className="flex flex-wrap justify-center gap-6">
                  {deputies.map(member => (
                    <div 
                      key={member.id} 
                      className="relative bg-gradient-to-b from-blue-50/30 via-white to-blue-50/20 border-2 border-blue-300 rounded-2xl p-3.5 w-56 shadow-sm text-center group transition-all"
                    >
                      {/* Action buttons */}
                      <div className="absolute top-2 right-2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity print:hidden no-pdf">
                        <button onClick={() => handleEditMember(member)} className="p-1 bg-white shadow-sm border border-gray-200 rounded text-blue-600 hover:bg-blue-50" title="កែប្រែ">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                        </button>
                        <button onClick={() => handleDeleteMember(member.id)} className="p-1 bg-white shadow-sm border border-gray-200 rounded text-red-600 hover:bg-red-50" title="លុប">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>

                      <div className="w-18 h-22 mx-auto mb-2 rounded-xl border border-blue-300 overflow-hidden bg-gray-100 flex items-center justify-center">
                        {member.photo ? (
                          <img src={member.photo} alt={member.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="text-blue-300 flex flex-col items-center">
                            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" /></svg>
                            <span className="text-[8px] text-gray-400">រូបថត</span>
                          </div>
                        )}
                      </div>

                      <div className="bg-blue-600 text-white font-bold text-[11px] py-0.5 px-2.5 rounded-lg inline-block shadow-sm mb-1.5">
                        {member.role}
                      </div>

                      <h4 className="khmer-moul text-gray-900 text-xs leading-tight mb-1">{member.name}</h4>
                      {member.originalPosition && (
                        <p className="text-[10px] text-gray-600 font-medium">{member.originalPosition}</p>
                      )}
                      {member.phone && (
                        <p className="text-[9px] text-gray-400 mt-0.5">ទូរស័ព្ទ៖ {member.phone}</p>
                      )}
                    </div>
                  ))}
                </div>

                {/* Connecting Line Down */}
                {normalMembers.length > 0 && (
                  <div className="w-0.5 h-8 bg-gray-300 my-1"></div>
                )}
              </div>
            )}

            {/* Level 3: Members (សមាជិក / លេខា / បេឡា) */}
            {normalMembers.length > 0 && (
              <div className="flex flex-col items-center">
                <div className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 mb-4 uppercase tracking-wider print:hidden no-pdf">
                  សមាជិក និងផ្នែកប្រតិបត្តិ
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 w-full">
                  {normalMembers.map(member => (
                    <div 
                      key={member.id} 
                      className="relative bg-white border border-gray-200 rounded-xl p-3 shadow-xs text-center group hover:border-emerald-400 transition-all"
                    >
                      {/* Action buttons */}
                      <div className="absolute top-1.5 right-1.5 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity print:hidden no-pdf">
                        <button onClick={() => handleEditMember(member)} className="p-1 bg-white shadow-sm border border-gray-200 rounded text-blue-600 hover:bg-blue-50" title="កែប្រែ">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                        </button>
                        <button onClick={() => handleDeleteMember(member.id)} className="p-1 bg-white shadow-sm border border-gray-200 rounded text-red-600 hover:bg-red-50" title="លុប">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>

                      <div className="w-16 h-20 mx-auto mb-2 rounded-lg border border-gray-200 overflow-hidden bg-gray-50 flex items-center justify-center">
                        {member.photo ? (
                          <img src={member.photo} alt={member.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="text-gray-300 flex flex-col items-center">
                            <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" /></svg>
                            <span className="text-[7px] text-gray-400">រូបថត</span>
                          </div>
                        )}
                      </div>

                      <div className="bg-emerald-600 text-white font-bold text-[10px] py-0.5 px-2 rounded-md inline-block shadow-xs mb-1">
                        {member.role}
                      </div>

                      <h4 className="font-bold text-gray-900 text-xs truncate mb-0.5">{member.name}</h4>
                      {member.originalPosition && (
                        <p className="text-[10px] text-gray-500 truncate">{member.originalPosition}</p>
                      )}
                      {member.phone && (
                        <p className="text-[9px] text-gray-400 truncate mt-0.5">{member.phone}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* VIEW 2: Structured Roster Table */}
        {activeTab === 'table' && (
          <div className="overflow-x-auto my-6">
            <table className="w-full text-left border-collapse border-[1.5px] border-black text-xs">
              <thead className="bg-gray-100">
                <tr className="border-b-[1.5px] border-black">
                  <th className="p-2 border-r-[1.5px] border-black text-center w-10 font-bold">ល.រ</th>
                  <th className="p-2 border-r-[1.5px] border-black text-center w-16 font-bold">រូបថត</th>
                  <th className="p-2 border-r-[1.5px] border-black font-bold min-w-[140px]">គោត្តនាម-នាម</th>
                  <th className="p-2 border-r-[1.5px] border-black text-center font-bold min-w-[130px]">តួនាទីក្នុងគណៈកម្មការ</th>
                  <th className="p-2 border-r-[1.5px] border-black font-bold min-w-[140px]">តួនាទីដើម/អង្គភាព</th>
                  <th className="p-2 border-r-[1.5px] border-black text-center w-28 font-bold">លេខទូរស័ព្ទ</th>
                  <th className="p-2 font-bold text-center w-20 print:hidden no-pdf">សកម្មភាព</th>
                </tr>
              </thead>
              <tbody>
                {members.map((member, idx) => (
                  <tr key={member.id} className="border-b border-black hover:bg-gray-50/50">
                    <td className="p-2 border-r border-black text-center font-bold">{idx + 1}</td>
                    <td className="p-1 border-r border-black text-center">
                      {member.photo ? (
                        <img src={member.photo} alt={member.name} className="w-9 h-11 object-cover rounded mx-auto border border-gray-300" />
                      ) : (
                        <div className="w-9 h-11 bg-gray-100 border border-dashed border-gray-300 rounded mx-auto flex items-center justify-center text-[8px] text-gray-400">
                          គ្មានរូប
                        </div>
                      )}
                    </td>
                    <td className="p-2 border-r border-black font-bold text-[13px]">{member.name}</td>
                    <td className="p-2 border-r border-black text-center">
                      <span className={`inline-block font-bold px-2 py-0.5 rounded text-[11px] ${
                        member.level === 'leader' ? 'bg-amber-100 text-amber-800' :
                        member.level === 'deputy' ? 'bg-blue-100 text-blue-800' :
                        'bg-emerald-100 text-emerald-800'
                      }`}>
                        {member.role}
                      </span>
                    </td>
                    <td className="p-2 border-r border-black text-[12px]">{member.originalPosition || ''}</td>
                    <td className="p-2 border-r border-black text-center text-[11px] font-mono">{member.phone || ''}</td>
                    <td className="p-2 text-center print:hidden no-pdf">
                      <div className="flex justify-center space-x-1">
                        <button onClick={() => handleEditMember(member)} className="text-blue-600 hover:text-blue-800 p-1" title="កែប្រែ">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                        </button>
                        <button onClick={() => handleDeleteMember(member.id)} className="text-red-500 hover:text-red-700 p-1" title="លុប">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Bottom Signatures */}
        <div className="mt-14 grid grid-cols-2 gap-8 text-xs sm:text-sm">
          <div className="text-center flex flex-col items-center">
            <p className="khmer-moul text-sm sm:text-base mb-1">បានឃើញ និងឯកភាព</p>
            <p className="khmer-moul text-xs sm:text-sm mb-1">ប្រធានការិយាល័យអប់រំ យុវជន និងកីឡា</p>
            <div className="h-24"></div>
          </div>
          <div className="text-right flex flex-col items-center sm:items-end">
            <p className="text-[11px] sm:text-xs">ថ្ងៃ..................ខែ.........ឆ្នាំ........................ព.ស ២៥៦...</p>
            <p className="text-[11px] sm:text-xs mb-1">......... ថ្ងៃទី......ខែ............ឆ្នាំ ២០២...</p>
            <p className="khmer-moul text-xs sm:text-sm text-center sm:text-right pr-0 sm:pr-12 mt-1">ប្រធានគណៈកម្មការ</p>
            <div className="h-24"></div>
          </div>
        </div>
      </div>

      {/* Modal: Add or Edit Member */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-lg p-6 sm:p-8 shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="khmer-moul text-lg text-gray-800">
                {editingId ? 'កែប្រែសមាសភាព' : 'បន្ថែមសមាសភាពថ្មី'}
              </h3>
              <button 
                onClick={() => { setShowAddModal(false); setEditingId(null); }}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <form onSubmit={handleAddMember} className="space-y-4">
              {/* Photo Upload */}
              <div className="flex flex-col items-center gap-2 pb-2">
                <div className="w-20 h-24 rounded-xl border-2 border-dashed border-gray-300 overflow-hidden bg-gray-50 flex items-center justify-center relative group">
                  {newMember.photo ? (
                    <img src={newMember.photo} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center p-2 text-gray-400">
                      <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      <span className="text-[9px]">ដាក់រូបថត</span>
                    </div>
                  )}
                  <input type="file" accept="image/*" onChange={(e) => handlePhotoUpload(e)} className="absolute inset-0 opacity-0 cursor-pointer" />
                </div>
                <span className="text-[11px] text-gray-400">ចុចលើរូបដើម្បីជ្រើសរើសរូបថត (ស្រេចចិត្ត)</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">គោត្តនាម និងនាម <span className="text-red-500">*</span></label>
                <input
                  required
                  value={newMember.name}
                  onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                  placeholder="ឧ. ស៊ាន សាវុធ"
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">តួនាទីក្នុងគណៈកម្មការ <span className="text-red-500">*</span></label>
                  <input
                    required
                    value={newMember.role}
                    onChange={(e) => setNewMember({ ...newMember, role: e.target.value })}
                    placeholder="ឧ. ប្រធាន / អនុប្រធាន..."
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">កម្រិតឋានានុក្រម</label>
                  <select
                    value={newMember.level}
                    onChange={(e) => setNewMember({ ...newMember, level: e.target.value as any })}
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium"
                  >
                    <option value="leader">ថ្នាក់ដឹកនាំកំពូល (ប្រធាន)</option>
                    <option value="deputy">ថ្នាក់អនុប្រធាន</option>
                    <option value="member">សមាជិក / លេខា / បេឡា</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">តួនាទីដើម / អង្គភាពជាក់ស្ដែង</label>
                <input
                  value={newMember.originalPosition}
                  onChange={(e) => setNewMember({ ...newMember, originalPosition: e.target.value })}
                  placeholder="ឧ. នាយកសាលា / មេភូមិ / គ្រូបង្រៀន..."
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">លេខទូរស័ព្ទ (ស្រេចចិត្ត)</label>
                <input
                  value={newMember.phone}
                  onChange={(e) => setNewMember({ ...newMember, phone: e.target.value })}
                  placeholder="0XX XXX XXX"
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => { setShowAddModal(false); setEditingId(null); }}
                  className="flex-1 py-3 px-4 bg-gray-100 text-gray-600 rounded-xl font-bold text-sm hover:bg-gray-200 transition-colors"
                >
                  បោះបង់
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-100 transition-all active:scale-95"
                >
                  {editingId ? 'រក្សាទុកការកែប្រែ' : 'បន្ថែមសមាសភាព'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StructureGenerator;
