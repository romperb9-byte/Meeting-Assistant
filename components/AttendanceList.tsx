
import React from 'react';
import { AttendanceRecord } from '../types';

interface Props {
  records: AttendanceRecord[];
  onDelete: (id: string) => void;
  onClear: () => void;
}

const AttendanceList: React.FC<Props> = ({ records, onDelete, onClear }) => {
  const handlePrint = () => {
    window.print();
  };

  const handleDownloadWord = () => {
    const femaleCount = records.filter(r => r.gender.includes('ស្រី') || r.gender.toLowerCase() === 'f' || r.gender.toLowerCase() === 'female').length;
    
    // ឈ្មោះ១ប្រើតែ១ជួរដេកប៉ុណ្ណោះ៖ បើមានទិន្នន័យ គឺទាញយកតែទិន្នន័យដែលមានពិតប្រាកដ (១នាក់ = ១ជួរដេក មិនលើស មិនបែកបន្ទាត់)
    const exportList = records.length > 0 ? records : Array.from({ length: 10 });

    const header = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>បញ្ជីវត្តមាន</title>
        <!--[if gte mso 9]>
        <xml>
          <w:WordDocument>
            <w:View>Print</w:View>
            <w:Zoom>100</w:Zoom>
            <w:DoNotOptimizeForBrowser/>
          </w:WordDocument>
        </xml>
        <![endif]-->
        <style>
          @page Section1 {
            size: 841.95pt 595.35pt; /* A4 Landscape (297mm x 210mm) */
            mso-page-orientation: landscape;
            margin: 36.0pt 36.0pt 36.0pt 36.0pt; /* 0.5 in */
            mso-header-margin: 36.0pt;
            mso-footer-margin: 36.0pt;
          }
          div.Section1 {
            page: Section1;
          }
          body {
            font-family: 'Kantumruy Pro', 'Khmer OS Battambang', 'Segoe UI', Tahoma, sans-serif;
            line-height: 1.3;
            font-size: 10pt;
          }
          .khmer-moul {
            font-family: 'Moul', 'Khmer OS Muol Light', serif;
            font-weight: bold;
          }
          .text-center { text-align: center; }
          .underline { text-decoration: underline; }
          table.attendance-table {
            border-collapse: collapse;
            width: 100%;
            margin-top: 15px;
            border: 0.5pt solid black;
            mso-table-lspace: 0pt;
            mso-table-rspace: 0pt;
          }
          table.attendance-table th {
            border: 0.5pt solid black;
            padding: 6px 4px;
            background-color: #f2f2f2;
            font-weight: bold;
            font-size: 9.5pt;
            text-align: center;
            white-space: nowrap;
          }
          table.attendance-table td {
            border: 0.5pt solid black;
            padding: 5px 6px;
            font-size: 10pt;
            vertical-align: middle;
            white-space: nowrap; /* ធានាថាឈ្មោះ ១ ប្រើតែ ១ ជួរដេកប៉ុណ្ណោះ មិនធ្លាក់បន្ទាត់ */
            mso-line-height-rule: exactly;
          }
          table.attendance-table tr {
            mso-yfti-midrow: yes;
            page-break-inside: avoid;
            height: 25pt;
          }
          .footer-table {
            width: 100%;
            margin-top: 30px;
            border: none;
          }
          .footer-table td {
            border: none;
            padding: 0;
            white-space: normal;
          }
        </style>
      </head>
      <body>
        <div class="Section1">
          <div class="text-center" style="margin-bottom: 10px;">
            <p class="khmer-moul" style="font-size: 13pt; margin: 0;">ព្រះរាជាណាចក្រកម្ពុជា</p>
            <p class="khmer-moul" style="font-size: 13pt; margin: 0;">ជាតិ សាសនា ព្រះមហាក្សត្រ</p>
            <p style="margin: 0; font-size: 14pt;">~ ~ ~ ~ ~ ❀ ~ ~ ~ ~ ~</p>
          </div>

          <div style="font-weight: bold; font-size: 10pt; line-height: 1.6; margin-bottom: 20px;">
            <p class="khmer-moul" style="margin: 0;">ការិយាល័យអប់រំ យុវជន និងកីឡាស្រុក ......</p>
            <p class="khmer-moul" style="margin: 0;">កម្រង៖ .......</p>
            <p class="khmer-moul" style="margin: 0;">សាលាបឋមសិក្សា ........</p>
          </div>

          <div class="text-center" style="margin-top: 15px; margin-bottom: 15px;">
            <p class="khmer-moul underline" style="font-size: 14pt;">បញ្ជីស្រង់វត្តមាន</p>
          </div>

          <table class="attendance-table">
            <thead>
              <tr>
                <th style="width: 35px; white-space: nowrap;">ល.រ</th>
                <th style="width: 170px; white-space: nowrap;">គោត្តនាម-នាម</th>
                <th style="width: 50px; white-space: nowrap;">ភេទ</th>
                <th style="width: 140px; white-space: nowrap;">តួនាទី</th>
                <th style="width: 160px; white-space: nowrap;">អង្គភាព</th>
                <th style="width: 110px; white-space: nowrap;">លេខទូរស័ព្ទ</th>
                <th style="width: 110px; white-space: nowrap;">ហត្ថលេខា</th>
                <th style="width: 80px; white-space: nowrap;">ផ្សេងៗ</th>
              </tr>
            </thead>
            <tbody>
              ${exportList.map((item, index) => {
                const r = records.length > 0 ? (item as AttendanceRecord) : undefined;
                return `
                  <tr>
                    <td class="text-center" style="white-space: nowrap;">${index + 1}</td>
                    <td style="white-space: nowrap; font-weight: bold;">${r?.name || ''}</td>
                    <td class="text-center" style="white-space: nowrap;">${r?.gender || ''}</td>
                    <td style="white-space: nowrap;">${r?.position || ''}</td>
                    <td style="white-space: nowrap;">${r?.organization || ''}</td>
                    <td class="text-center" style="white-space: nowrap;">${r?.phone || ''}</td>
                    <td style="white-space: nowrap;"></td>
                    <td style="white-space: nowrap;">${r?.remarks || ''}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>

          <div style="margin-top: 15px;">
            <p style="font-size: 10pt;">បញ្ឈប់បញ្ជីត្រឹមចំនួន <b>${records.length}</b> នាក់ ស្រី <b>${femaleCount}</b> នាក់</p>
          </div>

          <table class="footer-table">
            <tr>
              <td style="text-align: center; width: 50%;">
                <p><b>បានឃើញនិងឯកភាព</b></p>
                <p><b>នាយកសាលា</b></p>
                <br/><br/><br/>
              </td>
              <td style="text-align: right; width: 50%;">
                <p style="font-size: 9pt; margin: 0;">ថ្ងៃ..................ខែ.........ឆ្នាំ........................ព.ស ២៥៦...</p>
                <p style="font-size: 9pt; margin: 0;">......... ថ្ងៃទី......ខែ............ឆ្នាំ ២០២...</p>
                <p style="text-align: center; margin-right: 40px;"><b>លេខាធិការ</b></p>
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
    link.download = `បញ្ជីវត្តមាន_${new Date().toLocaleDateString('km-KH').replace(/\//g, '-')}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const femaleCount = records.filter(r => r.gender.includes('ស្រី') || r.gender.toLowerCase() === 'f' || r.gender.toLowerCase() === 'female').length;

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden print:shadow-none print:border-none print:p-0">
      <div className="p-6 md:p-10 print:p-0">
        <div className="flex justify-between items-center mb-12 print:hidden">
          <div>
              <h2 className="khmer-moul text-blue-900 text-xl">
                បញ្ជីវត្តមានសរុប
              </h2>
              <p className="text-gray-400 text-sm">ចំនួនអ្នកចូលរួម៖ {records.length} នាក់</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {records.length > 0 && (
              <>
                <button 
                  onClick={handleDownloadWord}
                  className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-bold shadow-lg transition-all active:scale-95"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>ទាញយកជា Word (.doc)</span>
                </button>
                <button 
                  onClick={handlePrint}
                  className="flex items-center space-x-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  <span>បោះពុម្ព</span>
                </button>
                <button 
                  onClick={onClear}
                  className="text-red-500 hover:text-red-700 text-sm font-medium transition-colors px-4"
                >
                  លុបទាំងអស់
                </button>
              </>
            )}
          </div>
        </div>

        <div className="print-container font-serif text-black">
          {/* Header section with Motto on very top center */}
          <div className="text-center space-y-1 mb-8">
            <h3 className="khmer-moul text-lg tracking-widest">ព្រះរាជាណាចក្រកម្ពុជា</h3>
            <h3 className="khmer-moul text-lg tracking-widest">ជាតិ សាសនា ព្រះមហាក្សត្រ</h3>
            <div className="flex justify-center py-1">
              <span className="text-lg font-serif">~ ~ ~ ~ ~ ❀ ~ ~ ~ ~ ~</span>
            </div>
          </div>

          <div className="text-left font-bold text-[12px] space-y-1 mb-12 w-full max-w-[400px]">
             <p className="khmer-moul text-gray-800 leading-tight">ការិយាល័យអប់រំ យុវជន និងកីឡាស្រុក ......</p>
             <p className="khmer-moul text-gray-800 leading-tight">កម្រង៖ .......</p>
             <p className="khmer-moul text-gray-800 leading-tight">សាលាបឋមសិក្សា ........</p>
          </div>

          <div className="text-center w-full mb-8">
            <h2 className="khmer-moul text-xl underline underline-offset-8 inline-block">បញ្ជីស្រង់វត្តមាន</h2>
          </div>

          <div className="overflow-x-auto print:overflow-visible">
            <table className="w-full text-left border-collapse border-[1.5px] border-black text-xs">
              <thead className="bg-gray-50 print:bg-transparent">
                <tr className="border-b-[1.5px] border-black">
                  <th className="p-2 border-r-[1.5px] border-black text-center w-8 font-bold whitespace-nowrap">ល.រ</th>
                  <th className="p-2 border-r-[1.5px] border-black text-center font-bold whitespace-nowrap min-w-[140px]">គោត្តនាម-នាម</th>
                  <th className="p-2 border-r-[1.5px] border-black text-center w-12 font-bold whitespace-nowrap">ភេទ</th>
                  <th className="p-2 border-r-[1.5px] border-black font-bold text-center whitespace-nowrap min-w-[120px]">តួនាទី</th>
                  <th className="p-2 border-r-[1.5px] border-black font-bold text-center whitespace-nowrap min-w-[140px]">អង្គភាព</th>
                  <th className="p-2 border-r-[1.5px] border-black font-bold text-center w-28 whitespace-nowrap">លេខទូរស័ព្ទ</th>
                  <th className="p-2 border-r-[1.5px] border-black font-bold text-center w-28 whitespace-nowrap">ហត្ថលេខា</th>
                  <th className="p-2 font-bold text-center w-20 whitespace-nowrap">ផ្សេងៗ</th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: Math.max(records.length, 15) }).map((_, index) => {
                  const record = records[index];
                  return (
                    <tr key={record?.id || index} className="border-b border-black h-9 relative group hover:bg-gray-50/50">
                      <td className="p-1 border-r border-black text-center font-medium whitespace-nowrap">{index + 1}</td>
                      <td className="p-1 border-r border-black font-medium whitespace-nowrap">{record?.name || ''}</td>
                      <td className="p-1 border-r border-black text-center whitespace-nowrap">{record?.gender || ''}</td>
                      <td className="p-1 border-r border-black px-2 text-[11px] whitespace-nowrap">{record?.position || ''}</td>
                      <td className="p-1 border-r border-black px-2 text-[11px] whitespace-nowrap">{record?.organization || ''}</td>
                      <td className="p-1 border-r border-black px-2 text-[11px] text-center whitespace-nowrap">{record?.phone || ''}</td>
                      <td className="p-1 border-r border-black whitespace-nowrap"></td>
                      <td className="p-1 relative px-2 whitespace-nowrap">
                        {record?.remarks || ''}
                        {record && (
                          <button 
                            onClick={() => onDelete(record.id)}
                            className="absolute right-1 top-1/2 -translate-y-1/2 text-red-500 opacity-0 group-hover:opacity-100 hover:text-red-700 p-1 transition-opacity print:hidden"
                            title="លុប"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-4 space-y-4 px-2">
            <p className="text-sm">បញ្ឈប់បញ្ជីត្រឹមចំនួន <span className="underline decoration-dotted inline-block min-w-[40px] text-center font-bold">{records.length}</span> នាក់ ស្រី <span className="underline decoration-dotted inline-block min-w-[40px] text-center font-bold">{femaleCount}</span> នាក់</p>
            
            <div className="grid grid-cols-2 gap-8 text-sm">
                <div className="space-y-1 mt-6">
                    <p className="text-center font-bold">បានឃើញនិងឯកភាព</p>
                    <p className="text-center font-bold">នាយកសាលា</p>
                    <div className="h-24"></div>
                </div>
                <div className="space-y-1 text-right">
                    <p>ថ្ងៃ..................ខែ.........ឆ្នាំ........................ព.ស ២៥៦...</p>
                    <p>......... ថ្ងៃទី......ខែ............ឆ្នាំ ២០២...</p>
                    <p className="text-center pr-12 font-bold">លេខាធិការ</p>
                    <div className="h-24"></div>
                </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttendanceList;
