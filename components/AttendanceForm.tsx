
import React, { useState } from 'react';
import { saveRecordToFirebase } from '../services/firebase';

interface Props {
  groupId: string;
  onAddSuccess: () => void;
}

const AttendanceForm: React.FC<Props> = ({ groupId, onAddSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    gender: '',
    position: '',
    organization: '',
    phone: '',
    remarks: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
        alert("សូមបញ្ចូលឈ្មោះ!");
        return;
    }

    setLoading(true);
    try {
      const newRecord = {
        ...formData,
        groupId,
        timestamp: Date.now()
      };

      await saveRecordToFirebase(newRecord);
      
      setFormData({
        name: '',
        gender: '',
        position: '',
        organization: '',
        phone: '',
        remarks: ''
      });
      alert("ចុះឈ្មោះបានជោគជ័យ!");
      onAddSuccess();
    } catch (error) {
      console.error("Firebase Error:", error);
      alert("មានបញ្ហាក្នុងការរក្សាទុកទៅកាន់ Firebase");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="bg-white rounded-[2.5rem] shadow-xl border border-gray-100 overflow-hidden">
      <div className="p-8">
        <h2 className="khmer-moul text-red-600 text-center text-xl sm:text-2xl mb-2">
          សម្រង់វត្តមានប្រជុំ
        </h2>
        <p className="text-center text-gray-400 text-sm mb-12 italic">
            បច្ចុប្បន្នភាពលើ Cloud Sync រួចជាស្រេច
        </p>

        <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block font-bold text-gray-700">គោត្តនាម និងនាម <span className="text-red-500">*</span></label>
              <input
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                placeholder="ឈ្មោះពេញ"
                className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-400 focus:bg-white outline-none transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="block font-bold text-gray-700">ភេទ</label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-400 focus:bg-white outline-none transition-all"
              >
                <option value="">ជ្រើសរើស</option>
                <option value="ប្រុស">ប្រុស (M)</option>
                <option value="ស្រី">ស្រី (F)</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="block font-bold text-gray-700">តួនាទី</label>
              <input
                name="position"
                value={formData.position}
                onChange={handleChange}
                placeholder="ឧ. ប្រធាននាយកដ្ឋាន"
                className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-400 focus:bg-white outline-none transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="block font-bold text-gray-700">អង្គភាព</label>
              <input
                name="organization"
                value={formData.organization}
                onChange={handleChange}
                placeholder="ឧ. ក្រសួងកសិកម្ម"
                className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-400 focus:bg-white outline-none transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="block font-bold text-gray-700">លេខទូរស័ព្ទ</label>
              <input
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="0XX XXX XXX"
                className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-400 focus:bg-white outline-none transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="block font-bold text-gray-700">ផ្សេងៗ</label>
              <input
                name="remarks"
                value={formData.remarks}
                onChange={handleChange}
                placeholder="ចំណាំ..."
                className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-400 focus:bg-white outline-none transition-all"
              />
            </div>
          </div>

          <div className="flex justify-center pt-8">
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-bold py-4 px-16 rounded-2xl shadow-lg transition-all active:scale-95 flex items-center justify-center space-x-2"
            >
              {loading && <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
              <span>{loading ? "កំពុងរក្សាទុក..." : "រក្សាទុកវត្តមាន"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AttendanceForm;
