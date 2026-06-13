# Udhaar Khata - Complete Architecture Guide

Comprehensive technical reference for Udhaar Khata MERN stack application.

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    USER BROWSER (Client)                     │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  React 18 + Tailwind CSS + React Router              │  │
│  │  • Dashboard                                          │  │
│  │  • Customer Management                                │  │
│  │  • Transaction Entry                                  │  │
│  │  • Voice Commands                                     │  │
│  │  • Payment Links                                      │  │
│  │  • Analytics                                          │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            ↕ HTTPS/REST API
┌─────────────────────────────────────────────────────────────┐
│                    EXPRESS.JS SERVER (Backend)              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Routes & Controllers                                 │  │
│  │  • authAPI.js          (Authentication)               │  │
│  │  • customerAPI.js      (Customer Management)          │  │
│  │  • transactionAPI.js   (Transaction Ledger)           │  │
│  │  • paymentAPI.js       (Razorpay Integration)         │  │
│  │  • notificationsAPI.js (SMS/WhatsApp via Twilio)      │  │
│  │  • pdfAPI.js           (Statement Generation)         │  │
│  │  • voiceAPI.js         (Voice Commands)               │  │
│  │  • analyticsAPI.js     (Dashboard Data)               │  │
│  │  • whatsappAPI.js      (WhatsApp Chatbot)             │  │
│  └───────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Middleware & Utilities                               │  │
│  │  • verifyToken.js      (JWT Authentication)           │  │
│  │  • emailService.js     (Email Delivery)               │  │
│  │  • pdfGenerator.js     (PDF Generation)               │  │
│  │  • voiceProcessor.js   (Voice Command Parsing)        │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            ↕ Database Protocol
┌─────────────────────────────────────────────────────────────┐
│                    MongoDB (Database)                        │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Collections:                                         │  │
│  │  • users (Shop owners)                                │  │
│  │  • customers (Shop customers)                         │  │
│  │  • transactions (Ledger entries)                      │  │
│  │  • payments (Payment records)                         │  │
│  │  • statements (PDF statements)                        │  │
│  │  • reminders (SMS/WhatsApp records)                   │  │
│  │  • voicecommands (Voice records)                      │  │
│  │  • familygroups (Family khata)                        │  │
│  │  • webhooklogs (Razorpay/Twilio logs)                 │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                ↕ External Service Integrations
┌─────────────────────────────────────────────────────────────┐
│            External Services & APIs                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Razorpay     │  │ Twilio       │  │ Cloudinary   │      │
│  │ (Payments)   │  │ (SMS/WA)     │  │ (Images)     │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ OpenAI       │  │ NodeMailer   │  │ Firebase     │      │
│  │ (Whisper)    │  │ (Email)      │  │ (Optional)   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

## 🔐 Authentication Flow

```
User Input (Phone + Password)
        ↓
GET /api/auth/login
        ↓
Find User in Database
        ↓
Compare Password (bcryptjs)
        ↓
Generate JWT Token & Refresh Token
        ↓
Save Refresh Token to DB
        ↓
Set Cookies + Return Tokens
        ↓
Client Stores Tokens (localStorage)
        ↓
All Future Requests include Authorization header
        ↓
verifyToken Middleware validates JWT
        ↓
req.user populated with decoded data
        ↓
Route Handler executes
```

## 💾 Database Schema Overview

### User (Shop Owner)
```javascript
{
  _id: ObjectId,
  name: String,
  phone: String (unique),
  shopName: String (unique),
  email: String,
  password: String (hashed),
  language: String (en/hi/te/ta),
  subscriptionPlan: String,
  totalCustomers: Number,
  totalOutstanding: Number,
  totalRecovered: Number,
  createdAt: Date,
  updatedAt: Date
}
```

### Customer
```javascript
{
  _id: ObjectId,
  shopId: ObjectId (ref: User),
  name: String,
  phone: String,
  address: String,
  totalBalance: Number,
  trustScore: Number (0-100),
  lastTransactionDate: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### Transaction
```javascript
{
  _id: ObjectId,
  customerId: ObjectId (ref: Customer),
  shopId: ObjectId (ref: User),
  type: String (CREDIT/DEBIT),
  amount: Number,
  description: String,
  paymentMethod: String,
  createdBy: ObjectId (ref: User),
  transactionDate: Date,
  createdAt: Date,
  updatedAt: Date
}
```

## 🔄 Data Flow Examples

### Scenario 1: User Adds Credit to Customer

```
Frontend:
1. Shop owner enters customer name + amount
2. Clicks "Add Udhaar"

API Call:
POST /api/transactions
{
  customerId: "123",
  type: "CREDIT",
  amount: 500,
  description: "Grocery purchase"
}

Backend:
1. verifyToken middleware validates JWT
2. Verify customer belongs to shop
3. Create transaction in MongoDB
4. Update customer.totalBalance += 500
5. Return updated transaction + balance

Frontend:
1. Display success message
2. Update UI with new balance
3. Refresh transaction list
```

### Scenario 2: Payment Received (Razorpay)

```
Frontend:
1. Shop owner clicks "Send Payment Link"
2. Amount auto-filled from customer balance
3. Payment link generated

Backend (paymentAPI.js):
1. Create Razorpay order
2. Save payment record with status: PENDING
3. Return payment link

Customer (via WhatsApp/SMS):
1. Receives payment link
2. Clicks link
3. Pays via Razorpay

Razorpay Webhook:
1. Triggers payment.success event
2. Sends to /api/payments/webhook

Backend:
1. Verify webhook signature
2. Update payment.status = SUCCESS
3. Update customer.totalBalance -= amount
4. Create DEBIT transaction automatically
5. Send confirmation via SMS/WhatsApp

Frontend:
1. Payment status updates to SUCCESS
2. Customer balance reflects payment
3. Transaction appears in ledger
```

### Scenario 3: Voice Command

```
Frontend:
1. User clicks mic button
2. Records audio: "Ravi 500 udhaar"
3. Sends to backend

Backend (voiceAPI.js):
1. Receive audio file
2. Send to OpenAI Whisper
3. Get transcription: "Ravi 500 udhaar"
4. Parse command:
   - Customer: "Ravi"
   - Amount: 500
   - Type: CREDIT
5. Find customer by name
6. Create transaction
7. Update balance
8. Return success + voice response

Frontend:
1. Receive response
2. Play voice confirmation: "Added 500 credit to Ravi"
3. Show result on screen
```

## 🔌 Integration Points

### Razorpay (Payments)
```
1. Backend: Create Razorpay instance
   const razorpay = new Razorpay({
     key_id: env.RAZORPAY_KEY_ID,
     key_secret: env.RAZORPAY_KEY_SECRET
   });

2. Frontend: Add Razorpay script
   <script src="https://checkout.razorpay.com/v1/checkout.js"></script>

3. Flow:
   - Generate order
   - Create payment link
   - Customer pays
   - Webhook callback
   - Update database
```

### Twilio (SMS/WhatsApp)
```
1. Backend: Create Twilio client
   const twilio = require('twilio');
   const client = twilio(accountSid, authToken);

2. Send SMS:
   client.messages.create({
     body: "Message text",
     from: "+1234567890",
     to: "+919999999999"
   });

3. Send WhatsApp:
   client.messages.create({
     body: "Message text",
     from: "whatsapp:+1234567890",
     to: "whatsapp:+919999999999"
   });
```

### OpenAI Whisper (Voice)
```
1. Backend: Create OpenAI instance
   const openai = new OpenAI({
     apiKey: env.OPENAI_API_KEY
   });

2. Transcribe:
   const transcript = await openai.audio.transcriptions.create({
     file: audioFile,
     model: "whisper-1",
     language: "hi"
   });

3. Process transcript with logic
```

### Cloudinary (Image Storage)
```
1. Backend: Configure cloudinary
   cloudinary.config({
     cloud_name: env.CLOUD_NAME,
     api_key: env.API_KEY,
     api_secret: env.API_SECRET
   });

2. Upload:
   cloudinary.uploader.upload(filePath, {
     folder: "udhaar-khata"
   });
```

## 🛡️ Security Measures

### 1. Password Security
```javascript
// Hashing on save
const salt = await bcrypt.genSalt(10);
password = await bcrypt.hash(password, salt);

// Comparison on login
const isValid = await bcrypt.compare(inputPassword, storedHash);
```

### 2. JWT Authentication
```javascript
// Token generation
const token = jwt.sign(
  { id: user._id, phone: user.phone },
  process.env.JWT_SECRET,
  { expiresIn: "2d" }
);

// Token verification
jwt.verify(token, process.env.JWT_SECRET);
```

### 3. HTTPS & CORS
```javascript
// CORS configuration
app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true
}));

// HTTPS in production
// Use helmet for security headers
app.use(helmet());
```

### 4. Input Validation
```javascript
// Validate before database operations
if (!name || !phone || !address) {
  return res.status(400).json({ message: "Required fields missing" });
}
```

## 📈 Performance Optimization

### Database Indexing
```javascript
// Create indexes for faster queries
customerSchema.index({ shopId: 1, phone: 1 });
transactionSchema.index({ shopId: 1, customerId: 1, transactionDate: -1 });
```

### API Response Pagination
```javascript
// Limit results per page
const limit = parseInt(req.query.limit) || 20;
const skip = (page - 1) * limit;

const transactions = await Transaction.find(query)
  .skip(skip)
  .limit(limit);
```

### Caching (Future)
```javascript
// Use Redis for frequently accessed data
const cache = redis.createClient();
cache.setex(`customer:${id}`, 3600, JSON.stringify(customer));
```

## 🚀 Deployment Checklist

### Environment Variables
```bash
✓ All secrets configured
✓ Database URI set correctly
✓ API keys added
✓ NODE_ENV = production
✓ Ports configured
✓ CORS URLs updated
```

### Database
```bash
✓ MongoDB Atlas cluster created
✓ Indexes created
✓ Backups configured
✓ Connection string secured
```

### Frontend Build
```bash
✓ npm run build succeeds
✓ Build folder created
✓ Environment variables set
✓ API URL points to production
```

### Backend Deployment
```bash
✓ Code pushed to GitHub
✓ CI/CD pipeline configured
✓ Tests passing
✓ Logs configured
✓ Error tracking enabled
```

## 📊 Monitoring & Logging

### Server Logs
```javascript
// Use morgan for HTTP logging
app.use(morgan('combined'));

// Application errors
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Server error" });
});
```

### Database Monitoring
- Use MongoDB Atlas monitoring
- Track query performance
- Monitor disk usage
- Set up alerts

### Error Tracking
- Use Sentry for error tracking
- Set up email alerts for critical errors
- Monitor API response times

## 🎯 Performance Metrics

Target metrics for production:
- API response time: < 200ms
- Database query time: < 100ms
- Frontend load time: < 3s
- Mobile load time: < 5s
- Availability: > 99.9%

## 🔄 Scaling Strategy

### Phase 1 (Current)
- Single server backend
- MongoDB Atlas shared cluster
- Static file serving via Cloudinary
- Email via NodeMailer

### Phase 2 (When scaling)
- Load balancing with multiple servers
- Redis caching layer
- Dedicated CDN
- Message queue (Bull for async jobs)

### Phase 3 (Enterprise)
- Microservices architecture
- Kubernetes deployment
- Advanced monitoring
- Advanced security

---

**This architecture is built for scalability and production-ready deployment. Each component can be enhanced independently!** 🚀
