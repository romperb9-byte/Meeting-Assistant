import React, { useState, useRef } from 'react';
import { AttendanceRecord, ReportData } from '../types';
import { GoogleGenAI } from "@google/genai";
import { exportElementToPdf } from '../services/pdfExport';

interface Props {
  records: AttendanceRecord[];
}

const toKhmerNum = (num: number | string) => {
  const khmerNums = ['០', '១', '២', '៣', '៤', '៥', '៦', '៧', '៨', '៩'];
  return num.toString().replace(/\d/g, (d) => khmerNums[parseInt(d)]);
};

const ReportGenerator: React.FC<Props> = ({ records }) => {
  const [loading, setLoading] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [result, setResult] = useState('');
  const reportPaperRef = useRef<HTMLDivElement>(null);

  // Shared API Key from localStorage
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

  // Form State
  const [formData, setFormData] = useState<ReportData>({
    district: 'ស្រុកព្រះនេត្រព្រះ',
    province: 'បន្ទាយមានជ័យ',
    office: 'ការិយាល័យអប់រំ យុវជន និងកីឡា',
    cluster: 'កម្រងសាលារៀន ភ្នំលៀប',
    school: 'សាលាបឋមសិក្សា ភ្នំលៀប',
    title: 'ការអនុវត្តវិធីសាស្ត្របង្រៀនថ្មី និងការប្រើប្រាស់សម្ភារឧបទេស',
    targetGroup: 'លោកគ្រូ អ្នកគ្រូថ្នាក់ទី១ ដល់ថ្នាក់ទី៣',
    referenceLetter: 'លិខិតឧទ្ទេសនាមលេខ ១២៨ អយក.ចុះថ្ងៃទី១០ ខែវិច្ឆិកា ឆ្នាំ២០២៦ របស់ការិយាល័យអប់រំ យុវជន និងកីឡា',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    location: 'សាលាបឋមសិក្សា ភ្នំលៀប',
    coordinator: 'តំណាងការិយាល័យអប់រំ យុវជន និងកីឡាស្រុក',
    trainer: 'នាយកសាលា និងគ្រូបង្គោលកម្រង',
    reporter: 'ស៊ាន សាវុធ',
    reporterPosition: 'នាយករងសាលាបឋមសិក្សា',
    approver: 'គឹម ហេង',
    approverPosition: 'ប្រធានការិយាល័យអប់រំ យុវជន និងកីឡា',
    overviewNotes: 'វគ្គបណ្ដុះបណ្ដាលប្រព្រឹត្តទៅរយៈពេល ២ថ្ងៃ ដោយផ្ដោតលើការអនុវត្តជាក់ស្ដែង ការបង្រៀនបង្ហាញ និងការឆ្លុះបញ្ចាំង។',
    challenges: 'អាកាសធាតុក្ដៅ និងកង្វះឧបករណ៍បញ្ចាំងស្លាយមួយចំនួន។',
    solutions: 'បានចាត់ចែងបែងចែកសម្ភារៈឧបទេសបន្ថែម និងរៀបចំកន្លែងប្រជុំឱ្យមានខ្យល់អាកាសល្អ។',
    suggestions: 'ស្នើសុំការគាំទ្រសម្ភារឧបទេសបច្ចេកវិទ្យាបន្ថែម និងពង្រីកវគ្គបណ្ដុះបណ្ដាលដល់កម្រិតថ្នាក់ផ្សេងទៀត។',
    photos: []
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

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = (Array.from(e.target.files) as File[]).slice(0, 4); // Up to 4 photos
      const readers = filesArray.map((file) => {
        return new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
      });

      Promise.all(readers).then((base64Images) => {
        setFormData((prev) => ({
          ...prev,
          photos: [...prev.photos, ...base64Images].slice(0, 4)
        }));
      });
    }
  };

  const handleRemovePhoto = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index)
    }));
  };

  const formatResult = (text: string) => {
    if (!text) return null;
    let formatted = text;
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<span class="font-bold text-gray-900">$1</span>');
    formatted = formatted.replace(/^([I|V|X]+\..*)$/gm, '<div class="khmer-moul mt-6 mb-2 text-base text-left text-gray-900 font-bold">$1</div>');
    formatted = formatted.replace(/^([១|២|៣|៤|៥|៦|៧|៨|៩]+\..*)$/gm, '<div class="pl-2 mt-3 mb-1 text-left font-bold text-gray-900">$1</div>');
    formatted = formatted.replace(/^([ក-ណ]\..*)$/gm, '<div class="pl-4 mb-1 text-left font-semibold text-gray-800">$1</div>');
    formatted = formatted.replace(/^- (.*)$/gm, '<div class="pl-6 mb-1 text-left text-gray-800"><span>- $1</span></div>');
    
    return (
      <div 
        style={{ 
          fontFamily: "'Khmer OS Battambang', 'Kantumruy Pro', sans-serif", 
          lineHeight: '1.7', 
          textAlign: 'left' 
        }}
        className="text-[15px] sm:text-[16px] text-gray-900 space-y-1" 
        dangerouslySetInnerHTML={{ __html: formatted.replace(/\n\n+/g, '<br/><br/>').replace(/\n/g, '<br/>') }} 
      />
    );
  };

  const handleGenerate = async () => {
    if (!formData.title) { 
      alert("សូមបញ្ចូលឈ្មោះវគ្គបណ្ដុះបណ្ដាល / កម្មវិធី!"); 
      return; 
    }

    const currentKey = apiKey.trim() || process.env.API_KEY || process.env.GEMINI_API_KEY || '';
    if (!currentKey) {
      setShowApiKeySettings(true);
      alert("សូមបញ្ចូល Gemini API Key របស់អ្នកជាមុនសិន ដើម្បីឱ្យ AI អាចបង្កើតរបាយការណ៍បាន!");
      return;
    }

    setLoading(true);
    try {
      const femaleCount = records.filter(r => r.gender.includes('ស្រី') || r.gender.toLowerCase() === 'f' || r.gender.toLowerCase() === 'female').length;
      
      const prompt = `
        សូមសរសេររបាយការណ៍ជាផ្លូវការ និងមានស្ដង់ដាររដ្ឋបាលខ្មែរខ្ពស់បំផុត (Formal Khmer Administrative Report) ដោយអនុវត្តតាមគំរូ និងលំដាប់លំដោយដូចខាងក្រោម (ចំណាំ៖ មិនបាច់ដាក់ផ្នែកក្បាលទំព័រ និងចុងទំព័រទេ ព្រោះប្រព័ន្ធបានរៀបចំរួចហើយ សូមសរសេរតែផ្នែកខ្លឹមសារ I ដល់ VI)៖

        ព័ត៌មានលម្អិត៖
        - ចំណងជើងវគ្គ៖ ${formData.title}
        - ក្រុមគោលដៅ៖ ${formData.targetGroup}
        - អង្គភាព៖ ${formData.office} នៃរដ្ឋបាល${formData.district} ក្នុងខេត្ត${formData.province}
        - ទីតាំង៖ ${formData.location} នៅ ${formData.school} កម្រង ${formData.cluster}
        - កាលបរិច្ឆេទ៖ ចាប់ពីថ្ងៃទី ${formData.startDate} ដល់ថ្ងៃទី ${formData.endDate}
        - លិខិតយោង៖ ${formData.referenceLetter}
        - អ្នកសម្របសម្រួល៖ ${formData.coordinator}
        - គ្រូឧទ្ទេស៖ ${formData.trainer}
        - សមាសភាពសិក្ខាកាម៖ សរុប ${records.length} នាក់ (ស្រី ${femaleCount} នាក់)
        - ខ្លឹមសារសង្ខេបបន្ថែម៖ ${formData.overviewNotes}
        - បញ្ហាប្រឈម៖ ${formData.challenges}
        - ដំណោះស្រាយ៖ ${formData.solutions}
        - សំណូមពរ៖ ${formData.suggestions}

        រចនាសម្ព័ន្ធខ្លឹមសារត្រូវសរសេរតាមទម្រង់ខាងក្រោមឱ្យបានពេញលេញ និងក្បោះក្បាយ៖

        I. គោលបំណង
        - សេចក្ដីផ្ដើមសង្ខេបអំពីការរៀបចំវគ្គបណ្ដុះបណ្ដាល (អ្នករៀបចំ រយៈពេល ទីតាំង និងក្រុមគោលដៅ)។
        - បញ្ជីលទ្ធផលរំពឹងទុក (នៅចុងបញ្ចប់នៃវគ្គសិក្ខាសាលា សិក្ខាកាមនឹងអាច៖ ...)។
        - គោលដៅរួមចុងក្រោយនៃវគ្គបណ្ដុះបណ្ដាល។

        II. សមាសភាពចូលរួម
        - ក. អ្នកសម្របសម្រួល៖ (${formData.coordinator})
        - ខ. គ្រូឧទ្ទេស៖ (${formData.trainer})
        - គ. អ្នកចូលរួម (សិក្ខាកាម)៖ (នាយកសាលា, គ្រូបង្រៀន និងអ្នកពាក់ព័ន្ធ សរុបចំនួន ${records.length} នាក់ ស្រី ${femaleCount} នាក់)
        - សរុបរួមទាំងអស់៖ វត្តមានសរុប ${records.length} នាក់ (ស្រី ${femaleCount} នាក់) អវត្តមាន ០ នាក់។

        III. ដំណើរការវគ្គបណ្ដុះបណ្ដាល (រៀបរាប់តាមលំដាប់ថ្ងៃ)
        - ថ្ងៃទី១ (កាលបរិច្ឆេទ)៖ ពិធីបើក ខ្លឹមសារមេរៀន និងសកម្មភាពសំខាន់ៗប្រចាំថ្ងៃ។
        - ថ្ងៃទី២ (កាលបរិច្ឆេទ)៖ ខ្លឹមសារមេរៀន និងសកម្មភាពបង្រៀនបង្ហាញ/ពិភាក្សា។
        - ថ្ងៃបញ្ចប់ (កាលបរិច្ឆេទ)៖ ការហ្វឹកហាត់ក្រុមតូច ជំហានបន្ទាប់ ផែនការសកម្មភាពបន្ត និងពិធីបិទវគ្គ។

        IV. លទ្ធផលសម្រេចបាន
        ១. ចំណុចខ្លាំង
        - ក. ការរៀបចំវគ្គ៖ (កិច្ចសហការ ទីតាំង សម្ភារៈឧបទេស ការបែងចែកភារកិច្ច)
        - ខ. គ្រូឧទ្ទេស៖ (ការគ្រប់គ្រងពេលវេលា ការត្រៀមប្លង់មេរៀន វិធីសាស្ត្រសម្របសម្រួល និងការឆ្លើយតបសំណួរ)
        - គ. សិក្ខាកាម៖ (វិន័យ ការគោរពពេលវេលា ការចូលរួមសកម្ម និងកម្រិតនៃការយល់ដឹង)
        ២. បញ្ហាប្រឈម
        - ${formData.challenges}
        ៣. ដំណោះស្រាយ
        - ${formData.solutions}

        V. សំណូមពរ
        - ${formData.suggestions}

        VI. សេចក្ដីសន្និដ្ឋាន
        - ការវាយតម្លៃជារួមលើជោគជ័យនៃវគ្គបណ្ដុះបណ្ដាល និងការផ្សារភ្ជាប់ទៅនឹងគោលដៅអប់រំ។

        ចំណាំសំខាន់៖
        - ប្រើពាក្យពេចន៍រដ្ឋបាលខ្មែរផ្លូវការ និងវេយ្យាករណ៍ត្រឹមត្រូវខ្ពស់។
        - មិនបាច់ដាក់ក្បាលទំព័រ ឬហត្ថលេខាទេ ព្រោះប្រព័ន្ធបោះពុម្ពបានរៀបចំជូនរួចរាល់ហើយ។
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
        alert("មានបញ្ហាក្នុងការបង្កើតរបាយការណ៍៖ " + (errMsg || "សូមពិនិត្យមើលការតភ្ជាប់អ៊ីនធឺណិត និង API Key"));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!reportPaperRef.current) return;
    setIsExportingPdf(true);
    try {
      const cleanTitle = (formData.title || 'របាយការណ៍').replace(/[/\\?%*:|"<>]/g, '_').substring(0, 20);
      const dateStr = new Date(formData.startDate).toLocaleDateString('km-KH').replace(/\//g, '-');
      await exportElementToPdf({
        element: reportPaperRef.current,
        filename: `របាយការណ៍_${cleanTitle}_${dateStr}.pdf`,
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
      .replace(/^([១|២|៣|៤|៥|៦|៧|៨|៩]+\..*)$/gm, '<p style="font-weight: bold; margin-top: 10px; font-size: 11pt;">$1</p>')
      .replace(/\n/g, '<br/>');

    const photosHtml = formData.photos.length > 0 ? `
      <div style="margin-top: 25px; page-break-inside: avoid;">
        <p style="font-family: 'Moul', serif; font-size: 12pt; margin-bottom: 10px;"><b>ឧបសម្ព័ន្ធ៖ កម្រងរូបភាពសកម្មភាព</b></p>
        <table style="width: 100%; border: none;">
          <tr>
            ${formData.photos.map((src, idx) => `
              <td style="width: 50%; padding: 5px; text-align: center;">
                <img src="${src}" style="width: 90%; max-height: 200px; border-radius: 6px;" />
                <p style="font-size: 9pt; margin-top: 4px;">រូបភាពទី ${idx + 1}៖ សកម្មភាពក្នុងវគ្គ</p>
              </td>
              ${idx % 2 === 1 ? '</tr><tr>' : ''}
            `).join('')}
          </tr>
        </table>
      </div>
    ` : '';

    const html = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <style>
          @page { margin: 1in; }
          body { font-family: 'Khmer OS Battambang', serif; line-height: 1.3; text-align: left; }
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

        <div style="font-weight: bold; font-size: 10pt; line-height: 1.3; margin-bottom: 15px;">
          <p style="margin: 0;" class="khmer-moul">រដ្ឋបាល${formData.district}</p>
          <p style="margin: 0;" class="khmer-moul">${formData.office}</p>
          <p style="margin: 0;" class="khmer-moul">${formData.cluster}</p>
        </div>

        <div class="text-center" style="margin-top: 15px; margin-bottom: 20px;">
          <p class="khmer-moul underline" style="font-size: 14pt; margin-bottom: 4px;">របាយការណ៍</p>
          <p class="khmer-moul" style="font-size: 12pt; margin: 0;">ស្ដីពី</p>
          <p class="khmer-moul" style="font-size: 12pt; margin: 0;">${formData.title} ជូនដល់ ${formData.targetGroup}</p>
          <p class="khmer-moul" style="font-size: 11pt; margin: 0;">តាមមណ្ឌលប្រមូលផ្ដុំកម្រងសាលារៀន នៃរដ្ឋបាល${formData.district} ក្នុងខេត្ត${formData.province}</p>
        </div>

        <div style="font-size: 10pt; margin-bottom: 15px; line-height: 1.5;">
          <p style="margin: 0;"><b>យោង៖</b> ${formData.referenceLetter}</p>
          <p style="margin: 0;"><b>កាលបរិច្ឆេទ៖</b> ចាប់ពីថ្ងៃទី ${formData.startDate} ដល់ថ្ងៃទី ${formData.endDate}</p>
          <p style="margin: 0;"><b>ទីកន្លែង៖</b> ${formData.location} នៅ ${formData.school} ${formData.cluster}</p>
        </div>

        <div style="font-size: 11pt;">${formattedContent}</div>

        ${photosHtml}

        <table style="margin-top: 50px; width: 100%; border: none;">
          <tr>
            <td style="text-align: center; width: 50%; vertical-align: top;">
              <p class="khmer-moul" style="margin-bottom: 4px; font-size: 11pt;">បានឃើញ និងឯកភាព</p>
              <p class="khmer-moul" style="font-size: 11pt;">${formData.approverPosition}</p>
              <br/><br/><br/><br/>
              <p class="khmer-moul" style="font-size: 11pt;">${formData.approver}</p>
            </td>
            <td style="text-align: center; width: 50%; vertical-align: top;">
              <p style="font-size: 9pt; margin-bottom: 3px;">ថ្ងៃ..................ខែ.........ឆ្នាំ........................ព.ស ២៥៦...</p>
              <p style="font-size: 10pt; margin-bottom: 4px;">${formData.province} ថ្ងៃទី ${toKhmerNum(new Date(formData.endDate).getDate())} ខែ ${['មករា', 'កុម្ភៈ', 'មីនា', 'មេសា', 'ឧសភា', 'មិថុនា', 'កក្កដា', 'សីហា', 'កញ្ញា', 'តុលា', 'វិច្ឆិកា', 'ធ្នូ'][new Date(formData.endDate).getMonth()]} ឆ្នាំ ${toKhmerNum(new Date(formData.endDate).getFullYear())}</p>
              <p class="khmer-moul" style="margin-bottom: 4px; font-size: 11pt;">អ្នកធ្វើរបាយការណ៍</p>
              <p style="font-size: 10pt;">${formData.reporterPosition}</p>
              <br/><br/><br/><br/>
              <p class="khmer-moul" style="font-size: 11pt;">${formData.reporter}</p>
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
    link.download = `របាយការណ៍_${formData.title.substring(0, 15)}.doc`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-4xl mx-auto pb-48 px-4">
      {/* Header and Form */}
      <div className="bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-gray-100 mb-12 print:hidden">
        <div className="bg-emerald-600 p-8 text-center">
           <h2 className="khmer-moul text-white text-2xl">ជំនួយការរៀបចំរបាយការណ៍</h2>
           <p className="text-emerald-100 text-sm mt-2">បង្កើតរបាយការណ៍វគ្គបណ្ដុះបណ្ដាល/កម្មវិធី តាមទម្រង់រដ្ឋបាលស្ដង់ដារ</p>
        </div>

        <div className="p-6 md:p-10 space-y-8">
          
          {/* API Key Configuration Section */}
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/70 rounded-2xl p-4 sm:p-5 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-md shadow-emerald-200 shrink-0">
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
                    ប្រើប្រាស់ API Key ដើម្បីឱ្យ AI បង្កើតរបាយការណ៍បានត្រឹមត្រូវ
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowApiKeySettings(!showApiKeySettings)}
                className="text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-white border border-emerald-200 hover:bg-emerald-50 px-3.5 py-2 rounded-xl transition-all shadow-sm shrink-0 flex items-center justify-center space-x-1"
              >
                <span>{showApiKeySettings ? 'បិទការកំណត់' : 'កំណត់ / ប្តូរ API Key'}</span>
                <svg className={`w-4 h-4 transform transition-transform ${showApiKeySettings ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>

            {/* Expandable Key Input Box */}
            {showApiKeySettings && (
              <div className="mt-4 pt-4 border-t border-emerald-200/60 animate-in fade-in duration-200">
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <input
                      type={showApiKey ? 'text' : 'password'}
                      value={apiKey}
                      onChange={(e) => handleSaveApiKey(e.target.value)}
                      placeholder="បិទភ្ជាប់ Gemini API Key នៅទីនេះ (AIzaSy...)"
                      className="w-full pl-4 pr-10 py-2.5 bg-white border border-gray-300 rounded-xl text-xs sm:text-sm font-mono outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
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
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm px-5 py-2.5 rounded-xl shadow-sm transition-all active:scale-95 shrink-0 flex items-center justify-center space-x-1"
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
                    className="text-emerald-700 hover:text-emerald-800 font-bold underline flex items-center gap-1"
                  >
                    <span>យក API Key ឥតគិតថ្លៃពី Google AI Studio</span>
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Section 1: Header & Organization Info */}
          <div className="space-y-4">
            <h3 className="khmer-moul text-sm text-emerald-600 border-b pb-2">១. ព័ត៌មានក្បាលទំព័រ និងអង្គភាព</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="khmer-moul text-gray-500 text-[10px]">រដ្ឋបាលក្រុង/ស្រុក</label>
                <input name="district" value={formData.district} onChange={handleChange} className="p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none text-sm font-medium"/>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="khmer-moul text-gray-500 text-[10px]">ខេត្ត/រាជធានី</label>
                <input name="province" value={formData.province} onChange={handleChange} className="p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none text-sm font-medium"/>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="khmer-moul text-gray-500 text-[10px]">ការិយាល័យ</label>
                <input name="office" value={formData.office} onChange={handleChange} className="p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none text-sm"/>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="khmer-moul text-gray-500 text-[10px]">ឈ្មោះកម្រង</label>
                <input name="cluster" value={formData.cluster} onChange={handleChange} className="p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none text-sm"/>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="khmer-moul text-gray-500 text-[10px]">ឈ្មោះសាលា</label>
                <input name="school" value={formData.school} onChange={handleChange} className="p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none text-sm"/>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="khmer-moul text-gray-500 text-[10px]">ទីតាំងជាក់ស្ដែង</label>
                <input name="location" value={formData.location} onChange={handleChange} className="p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none text-sm"/>
              </div>
            </div>
          </div>

          {/* Section 2: Report Title & Reference */}
          <div className="space-y-4">
            <h3 className="khmer-moul text-sm text-emerald-600 border-b pb-2">២. ចំណងជើងរបាយការណ៍ និងព័ត៌មានយោង</h3>
            <div className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="khmer-moul text-gray-500 text-[10px]">ឈ្មោះវគ្គបណ្ដុះបណ្ដាល / កម្មវិធី <span className="text-red-500">*</span></label>
                <input name="title" value={formData.title} onChange={handleChange} className="p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none text-sm font-semibold" placeholder="ឧ. ការអនុវត្តវិធីសាស្ត្របង្រៀនថ្មី..."/>
              </div>
              
              <div className="flex flex-col gap-1.5">
                <label className="khmer-moul text-gray-500 text-[10px]">ជូនដល់ (ក្រុមគោលដៅ) <span className="text-red-500">*</span></label>
                <input name="targetGroup" value={formData.targetGroup} onChange={handleChange} className="p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none text-sm" placeholder="ឧ. លោកគ្រូ អ្នកគ្រូថ្នាក់ទី១ ដល់ថ្នាក់ទី៣..."/>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="khmer-moul text-gray-500 text-[10px]">យោង (លិខិតឧទ្ទេសនាម)</label>
                <input name="referenceLetter" value={formData.referenceLetter} onChange={handleChange} className="p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none text-sm" placeholder="ឧ. លិខិតឧទ្ទេសនាមលេខ... ចុះថ្ងៃទី..."/>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="khmer-moul text-gray-500 text-[10px]">កាលបរិច្ឆេទចាប់ផ្ដើម</label>
                  <input name="startDate" type="date" value={formData.startDate} onChange={handleChange} className="p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none text-sm font-bold"/>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="khmer-moul text-gray-500 text-[10px]">កាលបរិច្ឆេទបញ្ចប់</label>
                  <input name="endDate" type="date" value={formData.endDate} onChange={handleChange} className="p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none text-sm font-bold"/>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Personnel & Stakeholders */}
          <div className="space-y-4">
            <h3 className="khmer-moul text-sm text-emerald-600 border-b pb-2">៣. សមាសភាព និងបុគ្គលិកទទួលខុសត្រូវ</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="khmer-moul text-gray-500 text-[10px]">អ្នកសម្របសម្រួល (Coordinators)</label>
                <input name="coordinator" value={formData.coordinator} onChange={handleChange} className="p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none text-sm"/>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="khmer-moul text-gray-500 text-[10px]">គ្រូឧទ្ទេស (Trainers / Facilitators)</label>
                <input name="trainer" value={formData.trainer} onChange={handleChange} className="p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none text-sm"/>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1.5">
                  <label className="khmer-moul text-gray-500 text-[10px]">អ្នកធ្វើរបាយការណ៍</label>
                  <input name="reporter" value={formData.reporter} onChange={handleChange} className="p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none text-sm"/>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="khmer-moul text-gray-500 text-[10px]">តួនាទី</label>
                  <input name="reporterPosition" value={formData.reporterPosition} onChange={handleChange} className="p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none text-sm"/>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1.5">
                  <label className="khmer-moul text-gray-500 text-[10px]">ប្រធានអនុម័ត (បានឃើញនិងឯកភាព)</label>
                  <input name="approver" value={formData.approver} onChange={handleChange} className="p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none text-sm"/>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="khmer-moul text-gray-500 text-[10px]">តួនាទីប្រធាន</label>
                  <input name="approverPosition" value={formData.approverPosition} onChange={handleChange} className="p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none text-sm"/>
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Content notes, challenges, solutions */}
          <div className="space-y-4">
            <h3 className="khmer-moul text-sm text-emerald-600 border-b pb-2">៤. ខ្លឹមសារលម្អិត បញ្ហាប្រឈម និងសំណូមពរ</h3>
            <div className="space-y-3">
              <div className="flex flex-col gap-1">
                <label className="khmer-moul text-gray-500 text-[10px]">ខ្លឹមសារសង្ខេបបន្ថែម / ដំណើរការវគ្គ</label>
                <textarea name="overviewNotes" value={formData.overviewNotes} onChange={handleChange} rows={2} className="p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none text-sm"/>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="khmer-moul text-gray-500 text-[10px]">បញ្ហាប្រឈម (Challenges)</label>
                  <textarea name="challenges" value={formData.challenges} onChange={handleChange} rows={2} className="p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none text-sm"/>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="khmer-moul text-gray-500 text-[10px]">ដំណោះស្រាយ (Solutions)</label>
                  <textarea name="solutions" value={formData.solutions} onChange={handleChange} rows={2} className="p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none text-sm"/>
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <label className="khmer-moul text-gray-500 text-[10px]">សំណូមពរ (Suggestions)</label>
                <textarea name="suggestions" value={formData.suggestions} onChange={handleChange} rows={2} className="p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none text-sm"/>
              </div>
            </div>
          </div>

          {/* Section 5: Photos Attachment (ឧបសម្ព័ន្ធ) */}
          <div className="space-y-3">
            <h3 className="khmer-moul text-sm text-emerald-600 border-b pb-2">៥. ឧបសម្ព័ន្ធ៖ កម្រងរូបភាពសកម្មភាព (រហូតដល់ ៤ រូប)</h3>
            <div className="flex items-center gap-3">
              <label className="cursor-pointer bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 font-bold px-4 py-2.5 rounded-xl text-xs sm:text-sm flex items-center space-x-2 transition-all">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                <span>ជ្រើសរើសរូបភាពសកម្មភាព</span>
                <input type="file" accept="image/*" multiple onChange={handlePhotoUpload} className="hidden" />
              </label>
              <span className="text-xs text-gray-400">បានបញ្ចូល៖ {formData.photos.length}/៤ រូប</span>
            </div>

            {formData.photos.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                {formData.photos.map((photo, index) => (
                  <div key={index} className="relative group border border-gray-200 rounded-xl overflow-hidden bg-gray-50 h-28">
                    <img src={photo} alt={`សកម្មភាព ${index + 1}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => handleRemovePhoto(index)}
                      className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 opacity-80 hover:opacity-100 transition-opacity"
                      title="លុបរូបភាពនេះ"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                    <div className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[10px] text-center py-0.5 truncate px-1">
                      រូបទី {index + 1}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button 
            onClick={handleGenerate} 
            disabled={loading} 
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-5 px-10 rounded-2xl shadow-xl shadow-emerald-200 flex items-center justify-center space-x-3 transition-all active:scale-95 disabled:bg-gray-300"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-6 w-6 border-3 border-white border-t-transparent" />
                <span className="text-lg">AI កំពុងរៀបចំ និងបង្កើតរបាយការណ៍...</span>
              </>
            ) : (
              <>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span className="text-lg">បង្កើតរបាយការណ៍ស្ដង់ដារដោយ AI (Auto Generate Report)</span>
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
          <div ref={reportPaperRef} className="print-container bg-white shadow-2xl rounded-2xl p-8 md:p-16 border border-gray-100 relative print:shadow-none print:border-none print:p-0">
            
            {/* Header: National Motto */}
            <div className="text-center space-y-1 mb-8">
              <h3 className="khmer-moul text-lg tracking-widest">ព្រះរាជាណាចក្រកម្ពុជា</h3>
              <h3 className="khmer-moul text-lg tracking-widest">ជាតិ សាសនា ព្រះមហាក្សត្រ</h3>
              <div className="flex justify-center py-1">
                <span className="text-lg font-serif">~ ~ ~ ~ ~ ❀ ~ ~ ~ ~ ~</span>
              </div>
            </div>

            {/* Header: Organization */}
            <div className="text-left font-bold text-[13px] sm:text-[14px] space-y-1 mb-8 max-w-[500px]">
              <p className="khmer-moul text-gray-800 leading-tight">រដ្ឋបាល{formData.district}</p>
              <p className="khmer-moul text-gray-800 leading-tight">{formData.office}</p>
              <p className="khmer-moul text-gray-800 leading-tight">{formData.cluster}</p>
            </div>

            {/* Header: Title */}
            <div className="text-center mb-8 space-y-1">
              <h2 className="khmer-moul text-xl underline underline-offset-[8px] decoration-1 inline-block">របាយការណ៍</h2>
              <p className="khmer-moul text-base text-gray-800 pt-1">ស្ដីពី</p>
              <p className="khmer-moul text-base text-gray-900 leading-relaxed px-4">
                {formData.title} ជូនដល់ {formData.targetGroup}
              </p>
              <p className="khmer-moul text-sm text-gray-700 leading-relaxed">
                តាមមណ្ឌលប្រមូលផ្ដុំកម្រងសាលារៀន នៃរដ្ឋបាល{formData.district} ក្នុងខេត្ត{formData.province}
              </p>
            </div>

            {/* Reference & Location */}
            <div className="text-left text-[13px] sm:text-[14px] space-y-1 mb-10 bg-gray-50/50 p-4 rounded-xl border border-gray-100">
              <p><span className="font-bold">យោង៖</span> {formData.referenceLetter}</p>
              <p><span className="font-bold">កាលបរិច្ឆេទ៖</span> ចាប់ពីថ្ងៃទី {formData.startDate} ដល់ថ្ងៃទី {formData.endDate}</p>
              <p><span className="font-bold">ទីកន្លែង៖</span> {formData.location} នៅ {formData.school} {formData.cluster} {formData.district} ខេត្ត{formData.province}</p>
            </div>

            {/* Body Generated Content */}
            <div className="mt-8">{formatResult(result)}</div>

            {/* Photo Appendix (ឧបសម្ព័ន្ធ) */}
            {formData.photos.length > 0 && (
              <div className="mt-14 pt-8 border-t border-gray-200">
                <h4 className="khmer-moul text-base text-gray-900 mb-6 text-center underline underline-offset-4">
                  ឧបសម្ព័ន្ធ៖ កម្រងរូបភាពសកម្មភាព
                </h4>
                <div className="grid grid-cols-2 gap-6">
                  {formData.photos.map((src, idx) => (
                    <div key={idx} className="flex flex-col items-center">
                      <img 
                        src={src} 
                        alt={`សកម្មភាព ${idx + 1}`} 
                        className="w-full h-48 sm:h-56 object-cover rounded-xl shadow-sm border border-gray-200" 
                      />
                      <p className="text-xs text-gray-600 mt-2 text-center font-medium">
                        រូបភាពទី {idx + 1}៖ សកម្មភាពក្នុងវគ្គបណ្ដុះបណ្ដាល
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Signatures */}
            <div className="mt-20 grid grid-cols-2 gap-10">
              <div className="text-center flex flex-col items-center">
                 <p className="khmer-moul text-base mb-2">បានឃើញ និងឯកភាព</p>
                 <p className="khmer-moul text-base mb-1">{formData.approverPosition}</p>
                 <div className="h-24"></div>
                 <p className="khmer-moul text-base">{formData.approver}</p>
              </div>
              <div className="text-center flex flex-col items-center">
                 <p className="text-[12px] sm:text-[13px] mb-1">ថ្ងៃ..................ខែ.........ឆ្នាំ........................ព.ស ២៥៦...</p>
                 <p className="text-[14px] mb-2">{formData.province} ថ្ងៃទី {toKhmerNum(new Date(formData.endDate).getDate())} ខែ {['មករា', 'កុម្ភៈ', 'មីនា', 'មេសា', 'ឧសភា', 'មិថុនា', 'កក្កដា', 'សីហា', 'កញ្ញា', 'តុលា', 'វិច្ឆិកា', 'ធ្នូ'][new Date(formData.endDate).getMonth()]} ឆ្នាំ {toKhmerNum(new Date(formData.endDate).getFullYear())}</p>
                 <p className="khmer-moul text-base mb-1">អ្នកធ្វើរបាយការណ៍</p>
                 <p className="text-[13px] text-gray-600 italic mb-6">{formData.reporterPosition}</p>
                 <div className="h-20"></div>
                 <p className="khmer-moul text-base">{formData.reporter}</p>
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

export default ReportGenerator;
