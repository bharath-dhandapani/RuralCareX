require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const twilio = require('twilio');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});

const prisma = new PrismaClient();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'supersecret_ruralcarex';

app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || "*",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
}));
app.use(express.json());

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', apiLimiter);

// Initialize Twilio if keys are present
let twilioClient = null;
if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
  twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
}

// Initialize AI if key is present
let genAIPredict = null;
let genAIIntent = null;
if (process.env.GEMINI_API_KEY_PREDICT) {
  genAIPredict = new GoogleGenerativeAI(process.env.GEMINI_API_KEY_PREDICT);
}
if (process.env.GEMINI_API_KEY_INTENT) {
  genAIIntent = new GoogleGenerativeAI(process.env.GEMINI_API_KEY_INTENT);
}

// ---------------------------
// AUTHENTICATION ROUTES
// ---------------------------
app.post('/api/auth/send-otp', async (req, res) => {
  const { identifier } = req.body;
  if (!identifier) return res.status(400).json({ success: false, message: 'Identifier required' });

  // In a real-world scenario we'd generate an OTP and store it in the database with an expiration
  let otp = '1234'; 
  
  if (twilioClient && process.env.TWILIO_PHONE_NUMBER) {
    try {
      otp = Math.floor(1000 + Math.random() * 9000).toString();
      await twilioClient.messages.create({
        body: `Your RuralCareX verification code is ${otp}`,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: identifier
      });
      console.log(`Sent real OTP to ${identifier}`);
    } catch (err) {
      console.error("Twilio error:", err);
      return res.status(500).json({ success: false, message: 'Failed to send SMS OTP' });
    }
  }

  res.status(200).json({ success: true, message: 'OTP sent successfully' });
});

app.post('/api/auth/register', async (req, res) => {
  const { name, phone, password } = req.body;
  if (!phone || !password) return res.status(400).json({ success: false, message: 'Phone and password required' });

  try {
    const existingUser = await prisma.user.findUnique({ where: { phone } });
    if (existingUser) return res.status(400).json({ success: false, message: 'User already exists' });

    const user = await prisma.user.create({
      data: { name, phone, password }
    });

    const token = jwt.sign({ id: user.id, phone: user.phone, role: 'patient' }, JWT_SECRET, { expiresIn: '7d' });
    res.status(200).json({ success: true, token, user });
  } catch (err) {
    console.error("Register Error:", err);
    res.status(500).json({ success: false, message: 'Failed to register account' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { identifier, password } = req.body;
  
  if (!identifier || !password) {
    return res.status(400).json({ success: false, message: 'Missing credentials' });
  }

  // Find user
  const user = await prisma.user.findUnique({ where: { phone: identifier } });
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  // Simple password check
  if (user.password && user.password !== password) {
    return res.status(401).json({ success: false, message: 'Invalid password' });
  }

  const token = jwt.sign({ id: user.id, phone: user.phone, role: 'patient' }, JWT_SECRET, { expiresIn: '7d' });
  res.status(200).json({ success: true, token, user });
});

app.post('/api/auth/doctor-register', async (req, res) => {
  const { name, specialty, phone, email, password } = req.body;
  if (!password || (!phone && !email)) return res.status(400).json({ success: false, message: 'Missing credentials' });

  try {
    const existingDoctor = await prisma.doctor.findFirst({
      where: { OR: [{ phone }, { email }] }
    });
    if (existingDoctor) return res.status(400).json({ success: false, message: 'Doctor with this phone or email already exists' });

    const doctor = await prisma.doctor.create({
      data: { name, specialty, phone, email, password, rating: 5.0, available: false }
    });

    const token = jwt.sign({ id: doctor.id, role: 'doctor' }, JWT_SECRET, { expiresIn: '7d' });
    res.status(200).json({ success: true, token, doctor });
  } catch (err) {
    console.error("Doctor Register Error:", err);
    res.status(500).json({ success: false, message: 'Failed to register doctor' });
  }
});

app.post('/api/auth/doctor-login', async (req, res) => {
  const { identifier, password } = req.body;
  
  // Try to find doctor by phone or email
  const doctor = await prisma.doctor.findFirst({
    where: {
      OR: [
        { phone: identifier },
        { email: identifier }
      ]
    }
  });

  if (!doctor) {
    return res.status(401).json({ success: false, message: 'Doctor not found' });
  }

  // Simple password check for demo purposes
  if (doctor.password && doctor.password !== password) {
    return res.status(401).json({ success: false, message: 'Invalid credentials' });
  }

  const token = jwt.sign({ id: doctor.id, role: 'doctor' }, JWT_SECRET, { expiresIn: '7d' });
  res.status(200).json({ success: true, token, doctor });
});

app.post('/api/auth/pharmacy-register', async (req, res) => {
  const { name, phone, email, password, address } = req.body;
  if (!password || (!phone && !email)) return res.status(400).json({ success: false, message: 'Missing credentials' });

  try {
    const existingPharmacy = await prisma.pharmacy.findFirst({
      where: { OR: [{ phone }, { email }] }
    });
    if (existingPharmacy) return res.status(400).json({ success: false, message: 'Pharmacy with this phone or email already exists' });

    const pharmacy = await prisma.pharmacy.create({
      data: { name, phone, email, password, address }
    });

    const token = jwt.sign({ id: pharmacy.id, role: 'pharmacy' }, JWT_SECRET, { expiresIn: '7d' });
    res.status(200).json({ success: true, token, pharmacy });
  } catch (err) {
    console.error("Pharmacy Register Error:", err);
    res.status(500).json({ success: false, message: 'Failed to register pharmacy' });
  }
});

app.post('/api/auth/pharmacy-login', async (req, res) => {
  const { identifier, password } = req.body;
  
  const pharmacy = await prisma.pharmacy.findFirst({
    where: {
      OR: [
        { phone: identifier },
        { email: identifier }
      ]
    }
  });

  if (!pharmacy) {
    return res.status(401).json({ success: false, message: 'Pharmacy not found' });
  }

  if (pharmacy.password !== password) {
    return res.status(401).json({ success: false, message: 'Invalid credentials' });
  }

  const token = jwt.sign({ id: pharmacy.id, role: 'pharmacy' }, JWT_SECRET, { expiresIn: '7d' });
  res.status(200).json({ success: true, token, pharmacy });
});

// ---------------------------
// AI PREDICTION ROUTE
// ---------------------------
app.post('/api/ai/predict', async (req, res) => {
  const { symptoms, language } = req.body;

  let medsListStr = 'Paracetamol, Ibuprofen, Antacid';
  try {
    const meds = await prisma.medicine.findMany({ where: { stock: { gt: 0 } }, select: { name: true } });
    if (meds.length > 0) {
      medsListStr = [...new Set(meds.map(m => m.name.trim()))].join(', ');
    }
  } catch (err) {
    console.error("Error fetching meds for AI:", err);
  }

  if (genAIPredict) {
    try {
      const model = genAIPredict.getGenerativeModel({ model: "gemini-2.5-flash" });
      const prompt = `You are a medical AI triage assistant. The patient reports these symptoms: ${symptoms.join(', ')}. 
      Respond ONLY with a valid JSON object matching this structure: 
      { "urgency": "High" | "Medium" | "Low", "predictions": [{ "condition": "string", "probability": number (0-100), "recommendation": "string" }], "suggestedMedicine": "string", "explanation": "string", "thingsToAvoid": ["string"], "summary": "string" }.
      Ensure the probabilities make sense and sort by highest probability. Give top 2 conditions. 
      For suggestedMedicine, YOU MUST choose exactly ONE medicine from this list of available local inventory: [${medsListStr}]. If none are perfectly suitable, pick the closest symptom relief match from the list.
      For explanation, provide a full, detailed explanation of what the problem likely is and why it is happening.
      For thingsToAvoid, provide an array of 2-3 short strings detailing what the patient should avoid doing or eating while experiencing this problem.
      For summary, provide a very brief, friendly 1-2 sentence spoken summary of the diagnosis and recommendation to be read aloud to the user.`;
      
      const result = await model.generateContent(prompt);
      let text = result.response.text();
      // Robust JSON extraction
      const firstBrace = text.indexOf('{');
      const lastBrace = text.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1) {
        text = text.substring(firstBrace, lastBrace + 1);
      }
      
      const aiResponse = JSON.parse(text);
      return res.status(200).json({ success: true, ...aiResponse });
    } catch (error) {
      console.error("AI Error:", error);
      // Fallback to mock if API fails
    }
  }

  // Fallback Mock Prediction (if no API Key or error)
  setTimeout(() => {
    res.status(200).json({
      success: true,
      urgency: 'High',
      predictions: [
        { condition: 'Viral Infection (Mock)', probability: 85, recommendation: 'Rest and take fever reducers.' },
        { condition: 'Dehydration (Mock)', probability: 40, recommendation: 'Drink plenty of fluids containing electrolytes.' }
      ],
      suggestedMedicine: medsListStr.split(', ')[0] || 'Paracetamol',
      explanation: 'Based on your symptoms, you are likely experiencing a common viral infection that is causing your body temperature to rise.',
      thingsToAvoid: ['Avoid strenuous exercise', 'Avoid cold foods and drinks', 'Avoid crowded places'],
      summary: 'You may have a viral infection. Please rest and take fever reducers.'
    });
  }, 1500);
});

app.post('/api/ai/intent', async (req, res) => {
  const { text, language } = req.body;
  if (!text) return res.status(400).json({ success: false, message: 'Text is required' });

  if (genAIIntent) {
    try {
      const model = genAIIntent.getGenerativeModel({ model: "gemini-2.5-flash" });
      const prompt = `You are a friendly, conversational healthcare voice assistant named RuralCareX Assistant. The user said: "${text}".
      Determine their intent from one of the following: 'check_symptoms', 'book_doctor', 'general_query', 'unknown'.
      - If they describe a health issue or feeling unwell (e.g., "I have a headache"), the intent is 'check_symptoms', and you should extract the health issue into the 'symptoms' field.
      - If they ask for a doctor or appointment, the intent is 'book_doctor'.
      - If they ask a general question (e.g., medical advice, how to use the app, general health query, or conversational chat), the intent is 'general_query'.
      
      Crucially, generate a natural, spoken response in English.
      - For 'check_symptoms', acknowledge their request and tell them you are opening the symptom checker.
      - For 'book_doctor', tell them you are opening the doctors list.
      - For 'general_query', DIRECTLY ANSWER THEIR QUESTION in a concise, conversational, and helpful manner in English.
      - For 'unknown', politely apologize and ask them to repeat.
      
      Respond ONLY with a valid JSON object: { "intent": "check_symptoms" | "book_doctor" | "general_query" | "unknown", "symptoms": "extracted symptoms or null", "spokenResponse": "your natural response or answer" }`;
      
      const result = await model.generateContent(prompt);
      let jsonText = result.response.text();
      const firstBrace = jsonText.indexOf('{');
      const lastBrace = jsonText.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1) {
        jsonText = jsonText.substring(firstBrace, lastBrace + 1);
      }
      let aiResponse;
      try {
        aiResponse = JSON.parse(jsonText);
      } catch (parseError) {
        // Fallback for when Gemini refuses to return JSON and just replies with conversational text
        aiResponse = {
           intent: 'general_query',
           symptoms: null,
           spokenResponse: result.response.text().trim() || "I am unable to process that request."
        };
      }
      return res.status(200).json({ success: true, data: aiResponse });
    } catch (error) {
      console.error("AI Intent Error:", error);
      // Fallback if Gemini crashes (e.g. rate limit)
      return res.status(200).json({ 
        success: true, 
        data: { intent: 'check_symptoms', symptoms: text, spokenResponse: null } 
      });
    }
  } else {
      // Fallback if AI is not configured
      return res.status(200).json({ 
        success: true, 
        data: { intent: 'check_symptoms', symptoms: text, spokenResponse: null } 
      });
  }
});

// ---------------------------
// DATA ROUTES
// ---------------------------
app.get('/api/doctors', async (req, res) => {
  let doctors = await prisma.doctor.findMany();
  if (doctors.length === 0) {
    // Seed some mock doctors if DB is empty
    await prisma.doctor.createMany({
      data: [
        { name: "Dr. Sharma", specialty: "General Physician", rating: 4.8, available: true, phone: "9876543210", email: "drsharma@test.com", password: "password123" },
        { name: "Dr. Kaur", specialty: "Pediatrician", rating: 4.9, available: false, phone: "9876543211", email: "drkaur@test.com", password: "password123" },
        { name: "Dr. Singh", specialty: "Cardiologist", rating: 4.7, available: true, phone: "9876543212", email: "drsingh@test.com", password: "password123" }
      ]
    });
    doctors = await prisma.doctor.findMany();
  }
  res.status(200).json({ success: true, data: doctors });
});

// Patient books appointment
app.post('/api/appointments', async (req, res) => {
  const { userId, doctorId, date } = req.body;
  try {
    const appointment = await prisma.appointment.create({
      data: { userId, doctorId, date: new Date(date) }
    });
    res.status(200).json({ success: true, appointment });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Update appointment status (Confirm/Cancel/Complete)
app.put('/api/appointments/:id/status', async (req, res) => {
  const id = parseInt(req.params.id);
  const { status, notes } = req.body;
  try {
    const appointment = await prisma.appointment.update({
      where: { id },
      data: { status }
    });

    if (status === 'completed') {
      const doctor = await prisma.doctor.findUnique({ where: { id: appointment.doctorId } });
      await prisma.record.create({
        data: {
          userId: appointment.userId,
          type: 'General Consultation',
          doctor: doctor ? doctor.name : 'Unknown Doctor',
          appointmentId: id,
          notes: notes || null,
        }
      });
    }

    res.status(200).json({ success: true, appointment });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update status' });
  }
});

// Get user appointments
app.get('/api/appointments/user/:userId', async (req, res) => {
  const userId = parseInt(req.params.userId);
  const appointments = await prisma.appointment.findMany({
    where: { userId }
  });
  // Fetch doctors for these appointments
  const doctorIds = appointments.map(a => a.doctorId);
  const doctors = await prisma.doctor.findMany({ where: { id: { in: doctorIds } } });
  
  const mappedAppointments = appointments.map(a => ({
    ...a,
    doctor: doctors.find(d => d.id === a.doctorId)
  }));
  res.status(200).json({ success: true, appointments: mappedAppointments });
});

// Get doctor appointments
app.get('/api/doctor/appointments/:doctorId', async (req, res) => {
  const doctorId = parseInt(req.params.doctorId);
  const appointments = await prisma.appointment.findMany({
    where: { doctorId }
  });
  
  // Fetch user info for those appointments manually
  const userIds = appointments.map(a => a.userId);
  const users = await prisma.user.findMany({ where: { id: { in: userIds } } });
  
  const mappedAppointments = appointments.map(a => ({
    ...a,
    user: users.find(u => u.id === a.userId)
  }));

  res.status(200).json({ success: true, appointments: mappedAppointments });
});



// Get doctor profile
app.get('/api/doctor/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ success: false, message: 'Invalid ID' });
    const doctor = await prisma.doctor.findUnique({ where: { id } });
    if (doctor) {
      res.status(200).json({ success: true, doctor });
    } else {
      res.status(404).json({ success: false, message: 'Doctor not found' });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Toggle availability
app.put('/api/doctor/:id/availability', async (req, res) => {
  console.log('PUT /api/doctor/:id/availability CALLED! Params:', req.params, 'Body:', req.body);
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      console.log('Invalid ID detected. req.params.id was:', req.params.id);
      return res.status(400).json({ success: false, message: 'Invalid ID' });
    }
    
    const { available } = req.body;
    const doctor = await prisma.doctor.update({
      where: { id },
      data: { available }
    });
    res.status(200).json({ success: true, doctor });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Doctor fetches patient history by Patient ID
app.get('/api/doctor/patient/:patientId', async (req, res) => {
  const patientId = parseInt(req.params.patientId);
  const patient = await prisma.user.findUnique({ where: { id: patientId } });
  if (!patient) return res.status(404).json({ success: false, message: 'Patient not found' });
  
  const records = await prisma.record.findMany({ where: { userId: patientId } });
  const appointments = await prisma.appointment.findMany({ where: { userId: patientId } });
  const medications = await prisma.medicationRecord.findMany({ where: { userId: patientId } });
  const prescriptions = await prisma.prescription.findMany({ where: { userId: patientId }, orderBy: { date: 'desc' } });
  
  res.status(200).json({ success: true, patient, records, appointments, medications, prescriptions });
});

// Doctor prescribes medicine
app.post('/api/doctor/prescribe', async (req, res) => {
  const { userId, doctorId, medicineName, morning, afternoon, night, days, appointmentId } = req.body;
  try {
    const prescription = await prisma.prescription.create({
      data: {
        userId: parseInt(userId),
        doctorId: parseInt(doctorId),
        medicineName,
        morning: parseInt(morning) || 0,
        afternoon: parseInt(afternoon) || 0,
        night: parseInt(night) || 0,
        days: parseInt(days) || 1,
        appointmentId: appointmentId ? parseInt(appointmentId) : null,
      }
    });
    res.status(200).json({ success: true, prescription });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Get patient notifications
app.get('/api/patient/:id/notifications', async (req, res) => {
  const id = parseInt(req.params.id);
  const notifications = await prisma.notification.findMany({
    where: { userId: id },
    orderBy: { createdAt: 'desc' }
  });
  res.status(200).json({ success: true, notifications });
});

// Mark notifications as read
app.put('/api/patient/:id/notifications/read', async (req, res) => {
  const id = parseInt(req.params.id);
  await prisma.notification.updateMany({
    where: { userId: id, isRead: false },
    data: { isRead: true }
  });
  res.status(200).json({ success: true });
});

// ---------------------------
// PHARMACY & INVENTORY ROUTES
// ---------------------------
async function checkOutofStockPrescriptions(medicineName, pharmacyName) {
  try {
    const outOfStockPrescriptions = await prisma.prescription.findMany({
      where: { status: 'out_of_stock', medicineName }
    });
    
    for (const p of outOfStockPrescriptions) {
      await prisma.prescription.update({
        where: { id: p.id },
        data: { status: 'pending' }
      });
      
      await prisma.notification.create({
        data: {
          userId: p.userId,
          message: `Good news! Your prescription for ${medicineName} is now in stock at ${pharmacyName || 'the pharmacy'}.`
        }
      });
    }
  } catch(err) {
    console.error("Error checking out of stock:", err);
  }
}
app.get('/api/pharmacy/:id/inventory', async (req, res) => {
  const pharmacyId = parseInt(req.params.id);
  if (isNaN(pharmacyId)) {
    return res.status(400).json({ success: false, message: 'Invalid Pharmacy ID. Please ensure you are logged in.' });
  }
  const inventory = await prisma.medicine.findMany({ where: { pharmacyId } });
  res.status(200).json({ success: true, inventory });
});

app.post('/api/pharmacy/:id/inventory', async (req, res) => {
  const pharmacyId = parseInt(req.params.id);
  if (isNaN(pharmacyId)) return res.status(400).json({ success: false, message: 'Invalid Pharmacy ID' });
  const { name, stock } = req.body;
  const parsedStock = parseInt(stock);

  // Fetch existing medicines for case-insensitive check
  const existingMeds = await prisma.medicine.findMany({ where: { pharmacyId } });
  const existingMedicine = existingMeds.find(m => m.name.toLowerCase() === name.toLowerCase());

  let medicine;
  if (existingMedicine) {
    // Update existing stock
    medicine = await prisma.medicine.update({
      where: { id: existingMedicine.id },
      data: {
        stock: existingMedicine.stock + parsedStock,
        previousStock: existingMedicine.stock
      }
    });
  } else {
    // Create new with Title Case
    const titleCaseName = name.trim().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
    medicine = await prisma.medicine.create({
      data: { name: titleCaseName, stock: parsedStock, pharmacyId }
    });
  }
  
  const pharmacy = await prisma.pharmacy.findUnique({ where: { id: pharmacyId } });
  await checkOutofStockPrescriptions(medicine.name, pharmacy?.name);
  
  res.status(200).json({ success: true, medicine });
});

app.put('/api/pharmacy/inventory/:itemId', async (req, res) => {
  const id = parseInt(req.params.itemId);
  const { stock } = req.body;
  const oldMedicine = await prisma.medicine.findUnique({ where: { id } });
  const medicine = await prisma.medicine.update({
    where: { id },
    data: { stock: parseInt(stock), previousStock: oldMedicine?.stock || 0 }
  });
  
  const pharmacy = await prisma.pharmacy.findUnique({ where: { id: medicine.pharmacyId } });
  await checkOutofStockPrescriptions(medicine.name, pharmacy?.name);
  
  res.status(200).json({ success: true, medicine });
});

app.delete('/api/pharmacy/inventory/:itemId', async (req, res) => {
  const id = parseInt(req.params.itemId);
  await prisma.medicine.delete({ where: { id } });
  res.status(200).json({ success: true });
});

app.post('/api/pharmacy/dispense', async (req, res) => {
  const { userId, medicineName, morning, afternoon, night, days, purchasedAt, pharmacyId } = req.body;
  
  if (pharmacyId && !isNaN(parseInt(pharmacyId))) {
    const allMedicines = await prisma.medicine.findMany({
      where: { pharmacyId: parseInt(pharmacyId) }
    });
    const medicine = allMedicines.find(m => m.name.toLowerCase() === medicineName.toLowerCase());
    
    const totalPills = (parseInt(morning) || 0) + (parseInt(afternoon) || 0) + (parseInt(night) || 0);
    const requiredPills = totalPills * (parseInt(days) || 1);
    
    if (!medicine || medicine.stock < requiredPills) {
      // Create out_of_stock prescription to notify patient later
      await prisma.prescription.create({
        data: {
          userId: parseInt(userId),
          doctorId: 0, // 0 signifies pharmacy-initiated
          medicineName,
          morning: parseInt(morning) || 0,
          afternoon: parseInt(afternoon) || 0,
          night: parseInt(night) || 0,
          days: parseInt(days) || 1,
          status: 'out_of_stock'
        }
      });
      return res.status(400).json({ success: false, message: 'Not enough stock! Added to Active Prescriptions as OUT OF STOCK. Patient will be notified when restocked.' });
    }
    
    await prisma.medicine.update({
      where: { id: medicine.id },
      data: { stock: medicine.stock - requiredPills, previousStock: medicine.stock, totalSold: { increment: requiredPills } }
    });
  }

  const record = await prisma.medicationRecord.create({
    data: {
      userId: parseInt(userId),
      medicineName,
      morning: parseInt(morning) || 0,
      afternoon: parseInt(afternoon) || 0,
      night: parseInt(night) || 0,
      days: parseInt(days) || 1,
      instructions: `Morning: ${morning || 0}, Afternoon: ${afternoon || 0}, Night: ${night || 0} for ${days || 1} days`,
      purchasedAt,
      status: "bought"
    }
  });
  res.status(200).json({ success: true, record });
});

app.post('/api/pharmacy/dispense-prescription', async (req, res) => {
  const { prescriptionId, pharmacyId, pharmacyName } = req.body;
  
  if (!pharmacyId || isNaN(parseInt(pharmacyId))) {
    return res.status(400).json({ success: false, message: 'Pharmacy session expired or invalid. Please log in again.' });
  }

  try {
    const prescription = await prisma.prescription.findUnique({ where: { id: parseInt(prescriptionId) }});
    if (!prescription) return res.status(404).json({ success: false, message: 'Prescription not found' });
    
    // Check stock
    const allMedicines = await prisma.medicine.findMany({
      where: { pharmacyId: parseInt(pharmacyId) }
    });
    const medicine = allMedicines.find(m => m.name.toLowerCase() === prescription.medicineName.toLowerCase());
    
    if (!medicine) return res.status(400).json({ success: false, message: 'Medicine not found in inventory' });
    
    const totalPills = (prescription.morning + prescription.afternoon + prescription.night) * prescription.days;
    
    if (medicine.stock < totalPills) {
      await prisma.prescription.update({
        where: { id: prescription.id },
        data: { status: 'out_of_stock' }
      });
      return res.status(400).json({ success: false, message: 'Not enough stock! Marked as OUT OF STOCK.' });
    }
    
    // Decrement stock
    await prisma.medicine.update({
      where: { id: medicine.id },
      data: { stock: medicine.stock - totalPills, previousStock: medicine.stock, totalSold: { increment: totalPills } }
    });
    
    // Update prescription status
    await prisma.prescription.update({
      where: { id: prescription.id },
      data: { status: 'dispensed' }
    });
    
    // Record the medication
    await prisma.medicationRecord.create({
      data: {
        userId: prescription.userId,
        medicineName: prescription.medicineName,
        morning: prescription.morning,
        afternoon: prescription.afternoon,
        night: prescription.night,
        days: prescription.days,
        instructions: `Morning: ${prescription.morning}, Afternoon: ${prescription.afternoon}, Night: ${prescription.night} for ${prescription.days} days`,
        purchasedAt: pharmacyName,
        status: "bought"
      }
    });
    
    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/medicines/search', async (req, res) => {
  const query = req.query.q || '';
  if (!query) {
    const medicines = await prisma.medicine.findMany({
      where: { stock: { gt: 0 } },
      include: { pharmacy: { select: { name: true, address: true, phone: true } } },
      orderBy: { stock: 'desc' },
      take: 20
    });
    return res.status(200).json({ success: true, results: medicines });
  }

  const medicines = await prisma.medicine.findMany({
    where: {
      name: {
        contains: query,
        mode: 'insensitive'
      },
      stock: {
        gt: 0
      }
    },
    include: {
      pharmacy: {
        select: { name: true, address: true, phone: true }
      }
    },
    orderBy: { stock: 'desc' }
  });
  res.status(200).json({ success: true, results: medicines });
});

// ---------------------------
// PROFILE ROUTES
// ---------------------------
app.get('/api/profile/:role/:id', async (req, res) => {
  try {
    const { role, id } = req.params;
    let profile = null;
    if (role === 'patient') {
      profile = await prisma.user.findUnique({ where: { id: parseInt(id) } });
    } else if (role === 'doctor') {
      profile = await prisma.doctor.findUnique({ where: { id: parseInt(id) } });
    } else if (role === 'pharmacy') {
      profile = await prisma.pharmacy.findUnique({ where: { id: parseInt(id) } });
    }
    
    if (!profile) return res.status(404).json({ success: false, message: 'Profile not found' });
    
    // Remove password from response
    const { password, ...safeProfile } = profile;
    res.status(200).json({ success: true, profile: safeProfile });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.put('/api/profile/:role/:id', async (req, res) => {
  try {
    const { role, id } = req.params;
    const data = req.body;
    let updatedProfile = null;
    
    if (role === 'patient') {
      if (data.age) data.age = parseInt(data.age);
      updatedProfile = await prisma.user.update({
        where: { id: parseInt(id) },
        data
      });
    } else if (role === 'doctor') {
      updatedProfile = await prisma.doctor.update({
        where: { id: parseInt(id) },
        data
      });
    } else if (role === 'pharmacy') {
      updatedProfile = await prisma.pharmacy.update({
        where: { id: parseInt(id) },
        data
      });
    }
    
    res.status(200).json({ success: true, profile: updatedProfile });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ---------------------------
// WEBRTC SIGNALING (SOCKET.IO)
// ---------------------------
io.on('connection', (socket) => {
  console.log('User connected to WebRTC socket:', socket.id);

  socket.on('join-room', (roomId) => {
    socket.join(roomId);
    socket.to(roomId).emit('user-connected', socket.id);
  });

  socket.on('offer', (data) => {
    socket.to(data.roomId).emit('offer', data);
  });

  socket.on('answer', (data) => {
    socket.to(data.roomId).emit('answer', data);
  });

  socket.on('ice-candidate', (data) => {
    socket.to(data.roomId).emit('ice-candidate', data);
  });

  socket.on('chat-message', (data) => {
    socket.to(data.roomId).emit('chat-message', data);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Real Backend Server running on http://localhost:${PORT}`);
});
