import React, { useState, useRef, useEffect } from 'react';
import { AttendanceRecord, MinutesData } from '../types';
import { GoogleGenAI } from "@google/genai";
import { exportElementToPdf } from '../services/pdfExport';

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

  // API Key management: loads from localStorage or fallback to environment variables
  const [apiKey, setApiKey] = useState<string>(() => {
    return (
      localStorage.getItem('user_gemini_api_key') ||
      process.env.API_KEY ||
      process.env.GEMINI_API_KEY ||
      ''
    );
  });
  const [showApiKey, setShowApiKey] = useState(false);
  const [showApiKeySettings, setShowApiKeySettings] = useState(false);
  const [keySaved, setKeySaved] = useState(false);

  const [formData, setFormData] = useState<MinutesData>({
    date: new Date().toISOString().split('T')[0],
    lunarDate: '',
    office: 'ការិយាល័យអប់រំ យុវជន និងកីឡាស្រុក ......',
    cluster: 'កម្រង៖ .......',
    school: 'សាលាបឋមសិក្សា ........',
    location: 'សាលប្រជុំសាលាបឋមសិក្សា',
    topic: 'បច្ចេកទេសបង្រៀននិងរៀន',
    agenda: '១. ជម្រាបពីគោលបំណងនៃអង្គប្រជុំ, ២. មតិស្វាគមន៍និងបើកអង្គប្រជុំ, ៣. ជម្រាបពីសមាសភាពនៃអ្នកចូលរួម, ៤. បទបង្ហាញពីបច្ចេកទេសក្នុងការបង្រៀន, ៥. មតិបូកសរុបនិងសំយោគឡើងវិញ, ៦. ណែនាំអំពីការគោរពពេលវេលាចេញចូល',
    chairperson: 'ស៊ាន សាវុធ',
    chairpersonPosition: 'នាយករង',
    secretary: 'ប៊ន សំរុង',
    secretaryPosition: 'គ្រូបង្រៀន',
    recommendations: '',
    results: '',
    startTime: '07:30',
    endTime: '11:00'
  });

  const handleSaveApiKey = (keyToSave: string) => {
    const trimmed = keyToSave.trim();
    setApiKey(trimmed);
    if (trimmed) {
      localStorage.setItem('user_gemini_api_key', trimmed);
    } else {
      localStorage.removeItem('user_gemini_api_key');
    }
    setKeySaved(true);
    setTimeout(() => setKeySaved(false), 2000);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const formatResult = (text: string) => {
    if (!text) return null;
    let formatted = text;
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<span class="font-bold text-gray-900">$1</span>');
    formatted = formatted.replace(/^([I|V|X]+\..*)$/gm, '<div class="khmer-moul mt-6 mb-2 text-base text-left text-gray-900 font-bold">$1</div>');
    formatted = formatted.replace(/^- (.*)$/gm, '<div class="pl-4 mb-1.5 text-left"><span>- $1</span></div>');
    
    return (
      <div 
        style={{ 
          fontFamily: "'Khmer OS Battambang', 'Kantumruy Pro', sans-serif", 
          lineHeight: '1.7', 
          textAlign: 'left' 
        }}
        className="text-[16px] text-gray-900 space-y-1" 
        dangerouslySetInnerHTML={{ __html: formatted.replace(/\n\n+/g, '<br/><br/>').replace(/\n/g, '<br/>') }} 
      />
    );
  };

  const handleGenerate = async () => {
    if (!formData.topic) { 
      alert("សូមបញ្ចូលកម្មវត្ថុ (Topic) នៃកិច្ចប្រជុំ!"); 
      return; 
    }

    const currentKey = apiKey.trim() || process.env.API_KEY || process.env.GEMINI_API_KEY || '';
    if (!currentKey) {
      setShowApiKeySettings(true);
      alert("សូមបញ្ចូល Gemini API Key របស់អ្នកជាមុនសិន ដើម្បីឱ្យ AI អាចបង្កើតកំណត់ហេតុបាន!");
      return;
    }

    setLoading(true);
    try {
      const femaleCount = records.filter(r => r.gender.includes('ស្រី') || r.gender.toLowerCase() === 'f' || r.gender.toLowerCase() === 'female').length;
      
      const prompt = `
        សូមសរសេរកំណត់ហេតុអង្គប្រជុំជាភាសាខ្មែរផ្លូវការ និងមានស្ដង់ដាររដ្ឋបាលត្រឹមត្រូវខ្ពស់បំផុត (Formal Khmer Administrative Meeting Minutes)។
        
        ព័ត៌មានកិច្ចប្រជុំ៖
        - កាលបរិច្ឆេទ៖ ${formData.date}
        - ម៉ោងចាប់ផ្ដើម៖ ${formData.startTime}
        - ម៉ោងបញ្ចប់៖ ${formData.endTime}
        - ទីកន្លែង៖ ${formData.location} នៅ ${formData.school}
        - កម្មវត្ថុ៖ ${formData.topic}
        - ប្រធានអង្គប្រជុំ៖ លោក ${formData.chairperson} (${formData.chairpersonPosition})
        - អ្នកធ្វើកំណត់ហេតុ៖ លោក ${formData.secretary} (${formData.secretaryPosition})
        - សមាសភាពចូលរួម៖ សរុប ${records.length} នាក់ (ស្រី ${femaleCount} នាក់)
        - របៀបវារៈ៖ ${formData.agenda}

        រចនាសម្ព័ន្ធកំណត់ហេតុត្រូវអនុវត្តតាមលំដាប់លំដោយដូចខាងក្រោម (កុំដាក់ចំណងជើងធំ ព្រោះក្បាលលិខិតមានរួចហើយ)៖
        
        ១. កថាខណ្ឌបើក (Opening Paragraph)៖
        សរសេររៀបរាប់កាលបរិច្ឆេទ និងម៉ោងជាពាក្យខ្មែរពេញលេញ (ឧទាហរណ៍៖ "នៅថ្ងៃ... វេលាម៉ោង... នា... សាលាបឋមសិក្សា ${formData.school} បានរៀបចំកិច្ចប្រជុំបច្ចេកទេសស្តីពី ${formData.topic} ក្រោមអធិបតីភាពដ៏ខ្ពង់ខ្ពស់របស់លោក ${formData.chairperson} ជា${formData.chairpersonPosition} និងសម្របសម្រួលដោយលោក ${formData.secretary} ជា${formData.secretaryPosition}។")

        ២. I. សមាសភាពចូលរួម៖
        - សមាជិកចូលរួមសរុបមានចំនួន ${records.length} នាក់ (ស្រី ${femaleCount} នាក់) ដែលមានបញ្ជីវត្តមាន និងហត្ថលេខាជូនភ្ជាប់មកជាមួយ។

        ៣. II. របៀបវារៈនៃអង្គប្រជុំ៖
        - បំប្លែងចំណុចនៃរបៀបវារៈ (${formData.agenda}) ជារបៀបវារៈរដ្ឋបាលច្បាស់លាស់។

        ៤. III. ដំណើរការប្រព្រឹត្តទៅនៃអង្គប្រជុំ៖
        - រៀបរាប់លម្អិតពីដំណើរការកិច្ចប្រជុំ ដោយបែងចែកជាចំណុចៗស្របតាមរបៀបវារៈ៖
          + មតិស្វាគមន៍ និងការបើកអង្គប្រជុំដោយប្រធានអង្គប្រជុំ
          + ការធ្វើបទបង្ហាញ និងពិភាក្សាយ៉ាងផុសផុលលើប្រធានបទបច្ចេកទេស
          + មតិយោបល់ និងសំណូមពររបស់សមាជិកអង្គប្រជុំ
          + ការបូកសរុប ណែនាំ និងសំយោគខ្លឹមសាររបស់ប្រធានអង្គប្រជុំ

        ៥. IV. ការសម្រេច និងទិសដៅអនុវត្តបន្ត៖
        - សង្ខេបលទ្ធផលរួមនៃការសម្រេចក្នុងអង្គប្រជុំ និងការបែងចែកភារកិច្ច។

        ៦. V. ការបញ្ចប់អង្គប្រជុំ៖
        - "អង្គប្រជុំត្រូវបានបញ្ចប់នៅវេលាម៉ោង... នាថ្ងៃដដែល ក្រោមបរិយាកាសរីករាយ ស្និទ្ធស្នាល និងប្រកបដោយស្មារតីទទួលខុសត្រូវខ្ពស់។"

        ចំណាំសំខាន់៖
        - ប្រើពាក្យពេចន៍រដ្ឋបាលខ្មែរផ្លូវការ ត្រឹមត្រូវតាមវេយ្យាករណ៍ខ្មែរ
        - ប្រើលេខរ៉ូម៉ាំង I. II. III. IV. V. សម្រាប់ចំណងជើងផ្នែកនីមួយៗ
      `;

      const aiClient = new GoogleGenAI({ apiKey: currentKey });
      const response = await aiClient.models.generateContent({ 
        model: 'gemini-3.8-flash', 
        contents: prompt 
      });

      setResult(response.text || '');
    } catch (error: any) {
      console.error("Gemini Error:", error);
      const errMsg = error?.message || '';
      if (errMsg.includes('API_KEY_INVALID') || errMsg.includes('403') || errMsg.includes('400')) {
        setShowApiKeySettings(true);
        alert("Gemini API Key មិនត្រឹមត្រូវ ឬអស់សុពលភាពទេ! សូមពិនិត្យ ឬប្តូរ API Key ថ្មី។");
      } else if (errMsg.includes('RESOURCE_EXHAUSTED') || errMsg.includes('429')) {
        alert("API Key នេះបានដល់កម្រិតកំណត់ (Quota Exceeded) ហើយ! សូមរង់ចាំបន្តិច ឬប្រើប្រាស់ API Key ផ្សេង។");
      } else {
        alert("មានបញ្ហាក្នុងការបង្កើតកំណត់ហេតុ៖ " + (errMsg || "សូមពិនិត្យមើលការតភ្ជាប់អ៊ីនធឺណិត និង API Key"));
      }
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
           <p className="text-red-100 text-sm mt-2">បំពេញព័ត៌មានរដ្ឋបាល និងបង្កើតខ្លឹមសារស្ដង់ដារដោយ AI</p>
        </div>

        <div className="p-6 md:p-10 space-y-8">
          
          {/* API Key Configuration Section */}
          <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200/70 rounded-2xl p-4 sm:p-5 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-red-600 text-white flex items-center justify-center font-bold shadow-md shadow-red-200 shrink-0">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-bold text-gray-800 text-sm sm:text-base flex items-center gap-2">
                    <span>Gemini API Key សម្រាប់ AI</span>
                    {apiKey ? (
                      <span className="text-[11px] font-semibold bg-green-100 text-green-700 px-2 py-0.5 rounded-full border border-green-200">
                        ✓ បានភ្ជាប់រួចរាល់
                      </span>
                    ) : (
                      <span className="text-[11px] font-semibold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full border border-amber-200">
                        ! មិនទាន់មាន Key
                      </span>
                    )}
                  </h4>
                  <p className="text-xs text-gray-500 mt-0.5">
                    បញ្ចូល API Key ដើម្បីឱ្យ AI បង្កើតកំណត់ហេតុបានដោយរលូន និងត្រឹមត្រូវ
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowApiKeySettings(!showApiKeySettings)}
                className="text-xs font-bold text-red-600 hover:text-red-700 bg-white border border-red-200 hover:bg-red-50 px-3.5 py-2 rounded-xl transition-all shadow-sm shrink-0 flex items-center justify-center space-x-1"
              >
                <span>{showApiKeySettings ? 'បិទការកំណត់' : 'កំណត់ / ប្តូរ API Key'}</span>
                <svg className={`w-4 h-4 transform transition-transform ${showApiKeySettings ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>

            {/* Expandable Key Input Box */}
            {showApiKeySettings && (
              <div className="mt-4 pt-4 border-t border-red-200/60 animate-in fade-in duration-200">
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <input
                      type={showApiKey ? 'text' : 'password'}
                      value={apiKey}
                      onChange={(e) => handleSaveApiKey(e.target.value)}
                      placeholder="បិទភ្ជាប់ Gemini API Key នៅទីនេះ (AIzaSy...)"
                      className="w-full pl-4 pr-10 py-2.5 bg-white border border-gray-300 rounded-xl text-xs sm:text-sm font-mono outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                      title={showApiKey ? 'លាក់' : 'បង្ហាញ'}
                    >
                      {showApiKey ? (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" /></svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                      )}
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleSaveApiKey(apiKey)}
                    className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs sm:text-sm px-5 py-2.5 rounded-xl shadow-sm transition-all active:scale-95 shrink-0 flex items-center justify-center space-x-1"
                  >
                    {keySaved ? (
                      <>
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                        <span>បានរក្សាទុក!</span>
                      </>
                    ) : (
                      <span>រក្សាទុក Key</span>
                    )}
                  </button>
                </div>

                <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 text-[11px] text-gray-500">
                  <span>* Key នឹងត្រូវរក្សាទុកដោយសុវត្ថិភាពក្នុងឧបករណ៍របស់អ្នក</span>
                  <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-red-600 hover:text-red-700 font-bold underline flex items-center gap-1"
                  >
                    <span>យក API Key ឥតគិតថ្លៃពី Google AI Studio</span>
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                  </a>
                </div>
              </div>
            )}
          </div>
          
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
                  <label className="khmer-moul text-gray-500 text-[10px]">កម្មវត្ថុ (Topic) <span className="text-red-500">*</span></label>
                  <input name="topic" value={formData.topic} onChange={handleChange} className="p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none font-medium" placeholder="ឧ. បច្ចេកទេសបង្រៀននិងរៀន"/>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="khmer-moul text-gray-500 text-[10px]">ទីតាំងប្រជុំ</label>
                  <input name="location" value={formData.location} onChange={handleChange} className="p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none" placeholder="ឧ. សាលប្រជុំសាលាបឋមសិក្សា..."/>
                </div>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="flex flex-col gap-2">
                        <label className="khmer-moul text-gray-500 text-[10px]">ប្រធានអង្គប្រជុំ (Chairperson)</label>
                        <input name="chairperson" value={formData.chairperson} onChange={handleChange} className="p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none" placeholder="ឈ្មោះប្រធាន"/>
                    </div>
                    <div className="flex flex-col gap-2">
                        <label className="khmer-moul text-gray-500 text-[10px]">តួនាទី</label>
                        <input name="chairpersonPosition" value={formData.chairpersonPosition} onChange={handleChange} className="p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none" placeholder="តួនាទី"/>
                    </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="flex flex-col gap-2">
                        <label className="khmer-moul text-gray-500 text-[10px]">អ្នកធ្វើកំណត់ហេតុ (Secretary)</label>
                        <input name="secretary" value={formData.secretary} onChange={handleChange} className="p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none" placeholder="ឈ្មោះលេខាធិការ"/>
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
            <label className="khmer-moul text-gray-500 text-[10px]">របៀបវារៈនៃអង្គប្រជុំ</label>
            <textarea name="agenda" value={formData.agenda} onChange={handleChange} rows={3} className="p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none text-sm leading-relaxed" placeholder="១. ជម្រាបពីគោលបំណង... ២. បទបង្ហាញ..."/>
          </div>

          <button 
            onClick={handleGenerate} 
            disabled={loading} 
            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-5 px-10 rounded-2xl shadow-xl shadow-red-200 flex items-center justify-center space-x-3 transition-all active:scale-95 disabled:bg-gray-300"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-6 w-6 border-3 border-white border-t-transparent" />
                <span className="text-lg">AI កំពុងរៀបចំ និងបង្កើតខ្លឹមសារកំណត់ហេតុ...</span>
              </>
            ) : (
              <>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span className="text-lg">បង្កើតខ្លឹមសារកំណត់ហេតុដោយ AI (Auto Generate)</span>
              </>
            )}
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
