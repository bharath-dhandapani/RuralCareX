# RuralCareX 🩺

RuralCareX is a comprehensive telemedicine and healthcare management platform designed to bridge the gap between patients in rural areas and healthcare professionals. The platform provides a seamless digital healthcare ecosystem connecting Patients, Doctors, and Pharmacies.

## 🔗 Live Demo Links

- **Patient Portal:** [https://rural-care-x-rust.vercel.app/login](https://rural-care-x-rust.vercel.app/login)
- **Doctor Portal:** [https://rural-care-x-rust.vercel.app/doctor-login](https://rural-care-x-rust.vercel.app/doctor-login)
- **Pharmacy Portal:** [https://rural-care-x-rust.vercel.app/pharmacy-login](https://rural-care-x-rust.vercel.app/pharmacy-login)

## ✨ Key Features

- **Role-Based Access Control:** Distinct interfaces and functionalities for Patients, Doctors, and Pharmacies.
- **AI Symptom Checker:** An intelligent triage system powered by Google Gemini AI that analyzes symptoms and provides immediate medical recommendations.
- **Doctor Consultations:** Book appointments and join video consultations directly from the dashboard.
- **Electronic Medical Records (EMR):** Secure storage and easy access to patient health history and past consultation notes.
- **Pharmacy & Inventory Management:** Real-time stock tracking for pharmacies and automated stock alerts. Pharmacies can directly dispense prescribed medications.
- **Modern Responsive UI:** Built with a clean, dynamic, and mobile-first approach.

## 🛠️ Technology Stack

- **Frontend:** React, TypeScript, Vite
- **Backend:** Node.js, Express.js
- **Database ORM:** Prisma
- **Database:** PostgreSQL (Hosted on Supabase)
- **AI Integration:** Google Gemini API

## 🚀 Local Development Setup

To run this project locally, you will need Node.js and an active PostgreSQL database (like Supabase).

### 1. Clone the repository
```bash
git clone https://github.com/YOUR-USERNAME/RuralCareX.git
cd RuralCareX
```

### 2. Backend Setup
```bash
cd backend
npm install
```
- Create a `.env` file inside the `backend` folder and configure the following variables:
  - `PORT=5000`
  - `DATABASE_URL` (Your Supabase connection string)
  - `DIRECT_URL` (Your Supabase direct connection string for Prisma)
  - `JWT_SECRET` (A strong random string)
  - `GEMINI_API_KEY_PREDICT` & `GEMINI_API_KEY_INTENT`
  - `FRONTEND_URL=http://localhost:3000`

- Run database migrations:
```bash
npx prisma db push
```

- Start the development server:
```bash
npm start
```

### 3. Frontend Setup
Open a new terminal window:
```bash
cd frontend
npm install
npm run dev
```

The application will now be running at `http://localhost:3000`.

## 📄 License
This project is licensed under the MIT License.
