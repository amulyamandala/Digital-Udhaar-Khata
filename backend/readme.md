# 🏪 Udhaar Khata — Backend

The backend of Digital Udhaar Khata is a robust Node.js REST API built with Express and MongoDB. It handles core business logic, integrations with third-party services (Twilio, Razorpay, OpenAI), and asynchronous tasks like PDF generation.

## 🛠️ Tech Stack

- **Runtime & Framework**: Node.js, Express.js
- **Database**: MongoDB (via Mongoose ODM)
- **Authentication**: JWT (JSON Web Tokens), bcryptjs
- **File Processing**: Multer, Cloudinary (Cloud Storage)
- **Document Generation**: PDFKit
- **External Integrations**:
  - **Twilio**: For SMS and WhatsApp reminder delivery.
  - **Razorpay**: For generating payment links and handling webhooks.
  - **OpenAI**: Whisper API (Voice-to-Text parsing) and GPT models (AI Reminder text generation).

## ✨ Backend Features

- **JWT Auth & Refresh Flow**: Secure endpoints with short-lived access tokens and secure refresh token rotation.
- **Voice Transaction Parsing**: Receives `.webm` audio files from the frontend, sends them to OpenAI Whisper, and parses the response to extract transaction `amount` and `type`.
- **Dynamic PDF Statements**: Generates monthly ledger statements on the fly using `pdfkit`, uploads them to `Cloudinary`, and returns a downloadable/shareable URL.
- **Payment Link Generation**: Integrates with Razorpay API to generate standard payment links embedded directly into WhatsApp reminders.
- **Automated Messaging**: Interfaces with Twilio API to dispatch customizable SMS and WhatsApp templates.

## ⚙️ Environment Variables

Create a `.env` file in the `backend` directory:

```env
PORT=5000
DB_URL=mongodb://localhost:27017/udhaar-khata
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_secret

TWILIO_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
TWILIO_PHONE_NUMBER=+1234567890

RAZORPAY_KEY_ID=your_razorpay_key
RAZORPAY_KEY_SECRET=your_razorpay_secret

OPENAI_API_KEY=your_openai_key

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

FRONTEND_URL=https://your-frontend.vercel.app
```

---

## 🗄️ Database Models & Schema

The application uses a relational-like structure within MongoDB to link Users (Shopkeepers), Customers, and Transactions.

### 1. User Model (`User`)
Represents the shopkeeper/business owner.
- `name`, `phone` (Unique), `shopName` (Unique), `email`, `password` (Hashed)
- `language`, `subscriptionPlan`, `shopCategory`
- **Shop Stats**: `totalCustomers`, `totalOutstanding`, `totalRecovered`
- **Integrations**: `razorpayKeyId`, `twilioAccountSid`, `openAIApiKey` (Optional user-specific overrides)

### 2. Customer Model (`Customer`)
Represents the buyers who owe credit.
- `shopId` (Ref: User)
- `name`, `phone`, `address`, `trustScore` (0-100), `trustScoreReason`
- **Ledger Stats**: `totalBalance`, `totalCredit`, `totalDebit`, `lastTransactionDate`
- **Preferences**: `preferredLanguage`, `preferredContactMethod` (SMS/WHATSAPP)
- **Family Group**: `familyGroupId` (Ref: FamilyGroup)

### 3. Transaction Model (`Transaction`)
Individual credit/debit entries.
- `customerId` (Ref: Customer), `shopId` (Ref: User)
- `type` (CREDIT/DEBIT), `amount`, `description`, `paymentMethod`
- `category` (PURCHASE/PAYMENT/ADJUSTMENT)
- `voiceCommandId` (Ref: VoiceCommand) - If created via voice.
- `paymentId` (Ref: Payment) - If linked to a digital payment.

### 4. Payment Model (`Payment`)
Tracks digital Razorpay payment links.
- `customerId` (Ref: Customer), `shopId` (Ref: User)
- `amount`, `paymentLink`, `paymentStatus` (PENDING/SUCCESS/FAILED)
- `razorpayOrderId`, `razorpayPaymentId`, `transactionId`
- `reminderSentCount`, `expiresAt`

### 5. Statement Model (`Statement`)
Tracks generated PDF monthly statements.
- `customerId` (Ref: Customer), `shopId` (Ref: User)
- `month`, `year`, `pdfUrl` (Cloudinary URL)
- `totalAmountDue`, `transactionCount`

### 6. Reminder Model (`Reminder`)
Log of sent notifications.
- `customerId` (Ref: Customer), `shopId` (Ref: User)
- `type` (SMS/WHATSAPP/CALL), `messageText`, `status`
- `paymentLinkId` (Ref: Payment)

### 7. VoiceCommand Model (`VoiceCommand`)
Audit log for voice-initiated actions.
- `shopId` (Ref: User)
- `originalAudioUrl`, `transcribedText`, `parsedIntent`
- `confidenceScore`, `status` (SUCCESS/FAILED)
