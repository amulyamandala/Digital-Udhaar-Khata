# 🏪 Udhaar Khata — Frontend

The frontend of the Digital Udhaar Khata application is a modern Single Page Application (SPA) built with React and Vite. It focuses on accessibility for shopkeepers by providing a clean, mobile-first interface with multilingual support and voice capabilities.

## 🛠️ Tech Stack

- **Framework**: React 18 + Vite
- **Styling**: Bootstrap 5 + Tailwind CSS (utility classes)
- **Icons**: Lucide React & React Icons
- **Routing**: React Router DOM v6
- **State Management**: React Context API (`AuthContext`, `VoiceContext`)
- **HTTP Client**: Axios (with interceptors for JWT refresh)
- **Notifications**: React Toastify
- **Native APIs**: Web Speech API (Text-to-Speech) & MediaRecorder API (Voice to text)

## ✨ Frontend Features

1. **Voice Input Integration**: Uses the browser's `MediaRecorder` API to capture shopkeeper audio, which is sent to the backend's Whisper API for parsing transaction amounts and types.
2. **Text-to-Speech (TTS)**: Custom `tts.js` utility uses the browser's `SpeechSynthesis` API to read out balances, success messages, and warnings in Indian regional languages (en-IN, hi-IN, te-IN, ta-IN).
3. **AI Reminder Generation UI**: A modal interface that allows shopkeepers to select tone (Friendly, Strong, Overdue) and language, generating a real-time preview of the AI-crafted WhatsApp/SMS message.
4. **Payment Simulator**: A mock payment gateway UI to test the Razorpay integration flow in development environments.
5. **Secure Authentication**: JWT-based auth flow with automatic token refresh via Axios interceptors.
6. **Responsive Design**: Carefully crafted to work seamlessly on mobile devices, which is the primary device used by target shopkeepers.

## 🚀 Setup & Scripts

Make sure you have Node.js installed.

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## ⚙️ Environment Variables

Create a `.env` file in the `frontend` directory:

```env
# URL to your backend API
VITE_API_URL=http://localhost:5000/api

# Standard Razorpay Key for initiating payments
VITE_RAZORPAY_KEY_ID=your_razorpay_key
```

## 🌐 Deployment (Vercel)

This application is configured for deployment on Vercel. 
A `vercel.json` file is included in the root directory to handle React Router client-side routing and prevent 404 errors on page refresh:

```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```
