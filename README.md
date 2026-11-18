# ជំនួយការប្រជុំ (Khmer Meeting Assistant) 🇰🇭

កម្មវិធីគ្រប់គ្រងវត្តមានប្រជុំ និងបង្កើតកំណត់ហេតុអង្គប្រជុំដោយស្វ័យប្រវត្តិជាមួយ AI ជាភាសាខ្មែរ។

🌐 **តំណភ្ជាប់ប្រើប្រាស់កម្មវិធីផ្ទាល់ (Live Website):**  
👉 **[https://romperb9-byte.github.io/Meeting-Assistant/](https://romperb9-byte.github.io/Meeting-Assistant/)**

---

## មុខងារចម្បងៗ (Key Features)

- 👥 **គ្រប់គ្រងក្រុមប្រជុំ (Meeting Groups):** បង្កើតក្រុមប្រជុំតាមផ្នែក ឬកម្រង និងមានលេខកូដសម្ងាត់ការពារ។
- 📝 **ស្រង់វត្តមាន (Attendance Tracking):** ចុះវត្តមានអ្នកចូលរួមប្រជុំ និងរក្សាទុកនៅលើ Firebase Cloud Database។
- 📄 **ទាញយកជាឯកសារ Word & Print:** អាចបោះពុម្ព ឬទាញយកបញ្ជីវត្តមានជាទម្រង់ Microsoft Word (`.doc`) តាមទម្រង់រដ្ឋបាលខ្មែរ។
- 🤖 **បង្កើតកំណត់ហេតុដោយ AI (AI Meeting Minutes):** បង្កើតកំណត់ហេតុអង្គប្រជុំជាផ្លូវការដោយស្វ័យប្រវត្តិដោយប្រើប្រាស់ Gemini AI។
- 📲 **ចែករំលែកងាយស្រួល:** មានភ្ជាប់ QR Code និង Link សម្រាប់ឱ្យអ្នកចូលរួមស្កែនចុះវត្តមានផ្ទាល់ពីទូរស័ព្ទ។

---

## របៀបដំណើរការនៅលើកុំព្យូទ័រ (Run Locally)

ប្រសិនបើអ្នកចង់បើកដំណើរការនៅលើម៉ាស៊ីនផ្ទាល់ខ្លួន៖

1. **ទាញយកកញ្ចប់កម្មវិធី (Install Dependencies):**
   ```bash
   npm install
   ```

2. **កំណត់ API Key (Optional សម្រាប់ AI):**
   - បង្កើតឯកសារ `.env` (ឬចម្លងពី `.env.example`)
   - ដាក់ `GEMINI_API_KEY=YOUR_API_KEY`

3. **បើកដំណើរការកម្មវិធី (Start Local Server):**
   ```bash
   npm run dev
   ```
   បន្ទាប់មកបើក Browser ទៅកាន់ `http://localhost:3000`
