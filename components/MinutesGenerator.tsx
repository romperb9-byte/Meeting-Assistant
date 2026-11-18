import React, { useState, useRef } from 'react';
import { AttendanceRecord, MinutesData } from '../types';
import { GoogleGenAI } from "@google/genai";
import { exportElementToPdf } from '../services/pdfExport';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || process.env.GEMINI_API_KEY });

interface Props {
  records: AttendanceRecord[];
}

const toKhmerNum = (num: number | string) => {
  const khmerNums = ['០', '១', '២', '៣', '៤', '៥', '៦', '៧', '៨', '៩'];
  return num.toString().replace(/\d/g, (d) => khmerNums[parseInt(d)]);
};

const MinutesGenerator: React.FC<Props> = ({ records }) => {
  const [loading, setLoading] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [result, setResult] = useState('');
  const minutesPaperRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState<MinutesData>({
    date: new Date().toISOString().split('T')[0],
    lunarDate: '',
    office: 'ការិយាល័យអប់រំ យុវជន និងកីឡាស្រុក ......',
    cluster: 'កម្រង៖ .......',
    school: 'សាលាបឋមសិក្សា ........',
    location: '.........',
    topic: 'បច្ចេកទេសបង្រៀននិងរៀន',
    agenda: '១.ជម្រាបពីគោលបំណងនៃអង្គប្រជុំ, ២.មតិស្វាគមន៍និងបើកអង្គប្រជុំ, ៣.ជម្រាបពីសមាសភាពនៃអ្នកចូលរួម, ៤.បទបង្ហាញពីបច្ចេកទេសក្នុងការបង្រៀន, ៥.មតិបូកសរុបនិងសំយោគឡើងវិញ, ៦.ណែនាំអំពីការគោរពពេលវេលាចេញចូល',
    chairperson: 'ស៊ាន សាវុធ',
    chairpersonPosition: 'នាយករង',
    secretary: 'ប៊ន សំរុង',
    secretaryPosition: 'គ្រូបង្រៀន',
    recommendations: '',
    results: '',
    startTime: '07:30',
    endTime: '11:00'
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const formatResult = (text: string) => {
    if (!text) return null;
    let formatted = text;
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<span class="font-bold">$1</span>');
    formatted = formatted.replace(/^([I|V|X]+\..*)$/gm, '<div class="khmer-moul mt-6 mb-2 text-lg text-left">$1</div>');
    formatted = formatted.replace(/^- (.*)$/gm, '<div class="pl-4 mb-1 text-left"><span>- $1</span></div>');
    
    return (
      <div 
        style={{ 
          fontFamily: "'Khmer OS Battambang', 'Kantumruy Pro', sans-serif", 
          lineHeight: '1.6', 
          textAlign: 'left' 
        }}
        className="text-[17px] text-gray-900" 
        dangerouslySetInnerHTML={{ __html: formatted.replace(/\n/g, '<br/>') }} 
      />
    );
  };

  const handleGenerate = async () => {
    if (!formData.topic) { alert("សូមបញ្ចូលកម្មវត្ថុ!"); return; }
    setLoading(true);
    try {
      const femaleCount = records.filter(r => r.gender.includes('ស្រី') || r.gender.toLowerCase() === 'f' || r.gender.toLowerCase() === 'female').length;
      
      const prompt = `
        Write a formal Khmer "Meeting Minutes" content.
        
        CRITICAL: Use ONLY spelled-out Khmer words for ${formData.date} and ${formData.startTime}.
        The text MUST start with: "នៅថ្ងៃ[Spelled out Date] វេលាម៉ោង[Spelled out Start Time]...".
        
        Follow this structure exactly as specified by the user:
        1. Opening Narrative: Start with "នៅថ្ងៃ... វេលាម៉ោង... សាលាបឋមសិក្សា ${formData.school} បានរៀបចំប្រជុំបច្ចេកទេសស្តីពី ${formData.topic} ក្រោមការដឹកនាំដោយលោក ${formData.chairperson} ជា${formData.chairpersonPosition}នៃ${formData.school}។"
        
        2. I. សមាសភាពចូលរួម៖
           - "មានសមាជិកសរុបចំនួន ${records.length} រូប ស្រី ${femaleCount} រូប (បញ្ជីវត្តមានជូនភ្ជាប់)។"
           
        3. II. របៀបវារៈ៖
           - List points from "${formData.agenda}" as separate numbered lines.
           
        4. III. ដំណើរការប្រព្រឹត្តទៅនៃអង្គប្រជុំ៖
           - Write a detailed formal narrative describing how ${formData.secretary} (${formData.secretaryPosition}) facilitated the meeting, how ${formData.chairperson} gave speeches, technical presentations on ${formData.topic}, and discussions.
           
        5. Closing: "អង្គប្រជុំត្រូវបានបញ្ចប់នៅវេលាម៉ោង[Spelled out End Time] នាថ្ងៃដដែល ក្រោមបរិយាកាសរីករាយ និងស្និទ្ធស្នាលបំផុត។"

        Formatting: Single spacing equivalent, Left Aligned, Formal Khmer words. NO TITLE.
      `;

      const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
      setResult(response.text || '');
    } catch (error) {
      console.error(error);
      alert("មានបញ្ហាក្នុងការបង្កើតកំណត់ហេតុ");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!minutesPaperRef.current) return;
    setIsExportingPdf(true);
    try {
      const cleanTopic = (formData.topic || 'កំណត់ហេតុ').replace(/[/\\?%*:|"<>]/g, '_').substring(0, 20);
      const dateStr = new Date(formData.date).toLocaleDateString('km-KH').replace(/\//g, '-');
      await exportElementToPdf({
        element: minutesPaperRef.current,
        filename: `កំណត់ហេតុ_${cleanTopic}_${dateStr}.pdf`,
        orientation: 'portrait',
        marginMm: 12,
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
    const formattedContent = result
      .replace(/^([I|V|X]+\..*)$/gm, '<p style="font-family: \'Moul\', serif; margin-top: 15px; font-size: 12pt;"><b>$1</b></p>')
      .replace(/\n/g, '<br/>');

    const html = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <style>
          @page { margin: 1in; }
          body { font-family: 'Khmer OS Battambang', serif; line-height: 1.2; text-align: left; }
          .khmer-moul { font-family: 'Moul', serif; font-weight: bold; }
          .text-center { text-align: center; }
          .underline { text-decoration: underline; }
        </style>
      </head>
      <body>
        <div style="text-align: center; margin-bottom: 5px;">
          <p class="khmer-moul" style="font-size: 14pt; margin: 0;">ព្រះរាជាណាចក្រកម្ពុជា</p>
          <p class="khmer-moul" style="font-size: 14pt; margin: 0;">ជាតិ សាសនា ព្រះមហាក្សត្រ</p>
          <p style="margin: 0; font-size: 14pt;">~ ~ ~ ~ ~ ❀ ~ ~ ~ ~ ~</p>
        </div>

        <div style="font-weight: bold; font-size: 10pt; line-height: 1.2; margin-bottom: 15px;">
          <p style="margin: 0;" class="khmer-moul">${formData.office}</p>
          <p style="margin: 0;" class="khmer-moul">${formData.cluster}</p>
          <p style="margin: 0;" class="khmer-moul">${formData.school}</p>
        </div>

        <div class="text-center" style="margin-top: 10px; margin-bottom: 20px;">
          <p class="khmer-moul underline" style="font-size: 14pt;">ការប្រជុំស្តីពី ${formData.topic || '...'}</p>
        </div>

        <div style="font-size: 11pt;">${formattedContent}</div>

        <table style="margin-top: 60px; width: 100%; border: none;">
          <tr>
            <td style="text-align: center; width: 50%; vertical-align: top;">
              <p class="khmer-moul" style="margin-bottom: 5px; font-size: 11pt;">បានឃើញ និងឯកភាព</p>
              <p class="khmer-moul" style="font-size: 11pt;">ប្រធានអង្គប្រជុំ</p>
              <p style="font-size: 10pt;">${formData.chairpersonPosition}</p>
              <br/><br/><br/><br/>
              <p class="khmer-moul" style="font-size: 11pt;">${formData.chairperson}</p>
            </td>
            <td style="text-align: center; width: 50%; vertical-align: top;">
              <p style="font-size: 10pt; margin-bottom: 5px;">${formData.location} ថ្ងៃទី ${toKhmerNum(new Date(formData.date).getDate())} ខែ ${['មករា', 'កុម្ភៈ', 'មីនា', 'មេសា', 'ឧសភា', 'មិថុនា', 'កក្កដា', 'សីហា', 'កញ្ញា', 'តុលា', 'វិច្ឆិកា', 'ធ្នូ'][new Date(formData.date).getMonth()]} ឆ្នាំ ${toKhmerNum(new Date(formData.date).getFullYear())}</p>
              <p class="khmer-moul" style="margin-bottom: 5px; font-size: 11pt;">អ្នកធ្វើកំណត់ហេតុ</p>
              <p style="font-size: 10pt;">${formData.secretaryPosition}</p>
              <br/><br/><br/><br/>
              <p class="khmer-moul" style="font-size: 11pt;">${formData.secretary}</p>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;
    const blob = new Blob(['\ufeff', html], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `កំណត់ហេតុ_${formData.topic.substring(0, 15)}.doc`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-4xl mx-auto pb-48 px-4">
      <div className="bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-gray-100 mb-12 print:hidden">
        <div className="bg-red-600 p-8 text-center">
           <h2 className="khmer-moul text-white text-2xl">ជំនួយការរៀបចំកំណត់ហេតុ</h2>
           <p className="text-red-100 text-sm mt-2">បំពេញព័ត៌មានរដ្ឋបាល និងបង្កើតខ្លឹមសារដោយ AI</p>
        </div>
        <div className="p-8 md:p-12 space-y-10">
          
          {/* Section 1: Basic Info */}
          <div className="space-y-4">
            <h3 className="khmer-moul text-sm text-red-500 border-b pb-2">១. ព័ត៌មានកិច្ចប្រជុំ</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex flex-col gap-2">
                <label className="khmer-moul text-gray-500 text-[10px]">កាលបរិច្ឆេទ</label>
                <input name="date" type="date" value={formData.date} onChange={handleChange} className="p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-red-500 font-bold"/>
              </div>
              <div className="flex flex-col gap-2">
                <label className="khmer-moul text-gray-500 text-[10px]">ម៉ោងចាប់ផ្តើម</label>
                <input name="startTime" type="time" value={formData.startTime} onChange={handleChange} className="p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none"/>
              </div>
              <div className="flex flex-col gap-2">
                <label className="khmer-moul text-gray-500 text-[10px]">ម៉ោងបញ្ចប់</label>
                <input name="endTime" type="time" value={formData.endTime} onChange={handleChange} className="p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none"/>
              </div>
            </div>
          </div>

          {/* Section 2: Organization Info */}
          <div className="space-y-4">
            <h3 className="khmer-moul text-sm text-red-500 border-b pb-2">២. អង្គភាព (សម្រាប់បំពេញក្បាលលិខិត)</h3>
            <div className="space-y-4">
              <div className="flex flex-col gap-2">
                <label className="khmer-moul text-gray-500 text-[10px]">ឈ្មោះការិយាល័យ</label>
                <input name="office" value={formData.office} onChange={handleChange} className="p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none text-sm"/>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="khmer-moul text-gray-500 text-[10px]">ឈ្មោះកម្រង</label>
                  <input name="cluster" value={formData.cluster} onChange={handleChange} className="p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none text-sm"/>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="khmer-moul text-gray-500 text-[10px]">ឈ្មោះសាលា</label>
                  <input name="school" value={formData.school} onChange={handleChange} className="p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none text-sm"/>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Personnel & Topic */}
          <div className="space-y-4">
            <h3 className="khmer-moul text-sm text-red-500 border-b pb-2">៣. សមាសភាព និងកម្មវត្ថុ</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex flex-col gap-2">
                  <label className="khmer-moul text-gray-500 text-[10px]">កម្មវត្ថុ (Topic)</label>
                  <input name="topic" value={formData.topic} onChange={handleChange} className="p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none font-medium"/>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="khmer-moul text-gray-500 text-[10px]">ទីតាំង</label>
                  <input name="location" value={formData.location} onChange={handleChange} className="p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none"/>
                </div>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="flex flex-col gap-2">
                        <label className="khmer-moul text-gray-500 text-[10px]">ប្រធានអង្គប្រជុំ (Chairperson)</label>
                        <input name="chairperson" value={formData.chairperson} onChange={handleChange} className="p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none" placeholder="ឈ្មោះ"/>
                    </div>
                    <div className="flex flex-col gap-2">
                        <label className="khmer-moul text-gray-500 text-[10px]">តួនាទី</label>
                        <input name="chairpersonPosition" value={formData.chairpersonPosition} onChange={handleChange} className="p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none" placeholder="តួនាទី"/>
                    </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="flex flex-col gap-2">
                        <label className="khmer-moul text-gray-500 text-[10px]">អ្នកធ្វើកំណត់ហេតុ (Secretary)</label>
                        <input name="secretary" value={formData.secretary} onChange={handleChange} className="p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none" placeholder="ឈ្មោះ"/>
                    </div>
                    <div className="flex flex-col gap-2">
                        <label className="khmer-moul text-gray-500 text-[10px]">តួនាទី</label>
                        <input name="secretaryPosition" value={formData.secretaryPosition} onChange={handleChange} className="p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none" placeholder="តួនាទី"/>
                    </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="khmer-moul text-gray-500 text-[10px]">របៀបវារៈ</label>
            <textarea name="agenda" value={formData.agenda} onChange={handleChange} rows={3} className="p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none text-sm"/>
          </div>

          <button onClick={handleGenerate} disabled={loading} className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-6 px-10 rounded-3xl shadow-2xl flex items-center justify-center space-x-3 transition-all active:scale-95 disabled:bg-gray-300">
            {loading ? <div className="animate-spin rounded-full h-7 w-7 border-4 border-white border-t-transparent" /> : <span className="text-xl">បង្កើតខ្លឹមសារកំណត់ហេតុ (Auto Content)</span>}
          </button>
        </div>
      </div>

      {result && (
        <div className="space-y-6">
          {/* Action Toolbar on Top of Preview */}
          <div className="flex flex-wrap items-center justify-end gap-3 print:hidden">
            <button 
              onClick={handleDownloadPdf}
              disabled={isExportingPdf}
              className="flex items-center space-x-2 bg-rose-600 hover:bg-rose-700 disabled:bg-rose-400 text-white px-5 py-3 rounded-xl text-sm font-bold shadow-md shadow-rose-200 transition-all active:scale-95"
              title="ទាញយកជាឯកសារ PDF A4 Portrait ស្អាតស្ដង់ដារ"
            >
              {isExportingPdf ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 9h1m0 4h6m-6 4h6" />
                </svg>
              )}
              <span>{isExportingPdf ? "កំពុងបង្កើត PDF..." : "ទាញយកជា PDF (.pdf)"}</span>
            </button>

            <button 
              onClick={handleDownloadWord} 
              className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl text-sm font-bold shadow-md shadow-blue-200 transition-all active:scale-95"
              title="ទាញយកជាឯកសារ Microsoft Word"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1M16 10l-4 4m0 0l-4-4m4 4V4" /></svg>
              <span>ទាញយកជា Word (.doc)</span>
            </button>

            <button 
              onClick={handlePrint}
              className="flex items-center space-x-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-3 rounded-xl text-sm font-bold transition-all shadow-sm active:scale-95"
              title="បោះពុម្ពឯកសារ"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              <span>បោះពុម្ព</span>
            </button>
          </div>

          {/* Printable & Exportable Document Area */}
          <div ref={minutesPaperRef} className="print-container bg-white shadow-2xl rounded-2xl p-8 md:p-16 border border-gray-100 relative print:shadow-none print:border-none print:p-0">
            
            <div className="text-center space-y-1 mb-8">
              <h3 className="khmer-moul text-lg tracking-widest">ព្រះរាជាណាចក្រកម្ពុជា</h3>
              <h3 className="khmer-moul text-lg tracking-widest">ជាតិ សាសនា ព្រះមហាក្សត្រ</h3>
              <div className="flex justify-center py-1">
                <span className="text-lg font-serif">~ ~ ~ ~ ~ ❀ ~ ~ ~ ~ ~</span>
              </div>
            </div>

            <div className="text-left font-bold text-[14px] space-y-1 mb-10 max-w-[500px]">
              <p className="khmer-moul text-gray-800 leading-tight">{formData.office}</p>
              <p className="khmer-moul text-gray-800 leading-tight">{formData.cluster}</p>
              <p className="khmer-moul text-gray-800 leading-tight">{formData.school}</p>
            </div>

            <div className="text-center mb-8">
              <div className="inline-block relative">
                 <h3 className="khmer-moul text-lg px-6 underline underline-offset-[8px] decoration-1 italic">ការប្រជុំស្តីពី {formData.topic || '...'}</h3>
              </div>
            </div>

            <div className="mt-8">{formatResult(result)}</div>

            <div className="mt-20 grid grid-cols-2 gap-10">
              <div className="text-center flex flex-col items-center">
                 <p className="khmer-moul text-base mb-2">បានឃើញ និងឯកភាព</p>
                 <p className="khmer-moul text-base mb-1">ប្រធានអង្គប្រជុំ</p>
                 <p className="text-[13px] text-gray-600 italic mb-8">{formData.chairpersonPosition}</p>
                 <div className="h-20"></div>
                 <p className="khmer-moul text-base">{formData.chairperson}</p>
              </div>
              <div className="text-center flex flex-col items-center">
                 <p className="text-[14px] mb-2">{formData.location} ថ្ងៃទី {toKhmerNum(new Date(formData.date).getDate())} ខែ {['មករា', 'កុម្ភៈ', 'មីនា', 'មេសា', 'ឧសភា', 'មិថុនា', 'កក្កដា', 'សីហា', 'កញ្ញា', 'តុលា', 'វិច្ឆិកា', 'ធ្នូ'][new Date(formData.date).getMonth()]} ឆ្នាំ {toKhmerNum(new Date(formData.date).getFullYear())}</p>
                 <p className="khmer-moul text-base mb-1">អ្នកធ្វើកំណត់ហេតុ</p>
                 <p className="text-[13px] text-gray-600 italic mb-8">{formData.secretaryPosition}</p>
                 <div className="h-20"></div>
                 <p className="khmer-moul text-base">{formData.secretary}</p>
              </div>
            </div>
            
            {/* Bottom Actions */}
            <div className="print:hidden mt-16 border-t border-gray-100 pt-8 flex flex-wrap justify-center gap-4">
              <button 
                onClick={handleDownloadPdf}
                disabled={isExportingPdf}
                className="bg-rose-600 hover:bg-rose-700 disabled:bg-rose-400 text-white font-bold py-3.5 px-8 rounded-xl shadow-lg shadow-rose-200 flex items-center space-x-2 transition-all active:scale-95 text-base"
              >
                {isExportingPdf ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 9h1m0 4h6m-6 4h6" />
                  </svg>
                )}
                <span>{isExportingPdf ? "កំពុងបង្កើត PDF..." : "ទាញយកជា PDF (.pdf)"}</span>
              </button>

              <button 
                onClick={handleDownloadWord} 
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 px-8 rounded-xl shadow-lg shadow-blue-200 flex items-center space-x-2 transition-all active:scale-95 text-base"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1M16 10l-4 4m0 0l-4-4m4 4V4" /></svg>
                <span>ទាញយកជា Word (.doc)</span>
              </button>

              <button 
                onClick={handlePrint} 
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3.5 px-6 rounded-xl shadow-sm flex items-center space-x-2 transition-all active:scale-95 text-base"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                <span>បោះពុម្ព</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MinutesGenerator;
