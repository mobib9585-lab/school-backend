import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://ammar:coaching@cluster0.plj3tnj.mongodb.net/myData';
const PORT = process.env.PORT || 3001;

// Connect to MongoDB and start server only after successful connection
async function start() {
  try {
    await mongoose.connect(MONGO_URI, {
      dbName: 'myData',
      serverSelectionTimeoutMS: 10000,
    });
    console.log('MongoDB connected');
    app.listen(PORT, () => console.log('Server running on port', PORT));
  } catch (err) {
    console.error('MongoDB connection error', err);
    process.exit(1);
  }
}

// Schemas
const StudentSchema = new mongoose.Schema({
  name: String, email: String, phone: String, address: String, date: String, course: String
}, { timestamps: true });
const Student = mongoose.model('Student', StudentSchema);

const AttendanceSchema = new mongoose.Schema({
  date: String,
  records: [{ studentId: mongoose.Schema.Types.ObjectId, status: { type: String, enum: ['present','absent','late'] } }]
}, { timestamps: true });
const Attendance = mongoose.model('Attendance', AttendanceSchema);

const FeeSchema = new mongoose.Schema({
  studentId: mongoose.Schema.Types.ObjectId,
  due: { type: Number, default: 0 },
  paid: { type: Number, default: 0 },
  history: [{ date: String, amount: Number }]
}, { timestamps: true });
const Fee = mongoose.model('Fee', FeeSchema);

const ResultSchema = new mongoose.Schema({
  name: String, course: String, marks: Number, grade: String, remarks: String
}, { timestamps: true });
const Result = mongoose.model('Result', ResultSchema);

const PaperSchema = new mongoose.Schema({
  subject: String,
  examDate: String,
  className: String,
  duration: String,
  instructions: String,
  totalMarks: Number,
  questions: [{ text: String, marks: Number }],
  fileName: String
}, { timestamps: true });
const Paper = mongoose.model('Paper', PaperSchema);

// Routes
app.get('/api/health', (req, res) => res.json({ ok: true, db: mongoose.connection.readyState }));

// Students CRUD
app.get('/api/students', async (req, res) => {
  const items = await Student.find().sort({ createdAt: -1 });
  res.json(items);
});
app.post('/api/students', async (req, res) => {
  const doc = await Student.create(req.body);
  res.json(doc);
});
app.put('/api/students/:id', async (req, res) => {
  const doc = await Student.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(doc);
});
app.delete('/api/students/:id', async (req, res) => {
  await Student.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
});

// Attendance
app.get('/api/attendance/:date', async (req, res) => {
  const rec = await Attendance.findOne({ date: req.params.date });
  res.json(rec || { date: req.params.date, records: [] });
});
app.post('/api/attendance/:date', async (req, res) => {
  const { records } = req.body; // [{studentId, status}]
  const doc = await Attendance.findOneAndUpdate(
    { date: req.params.date },
    { date: req.params.date, records },
    { upsert: true, new: true }
  );
  res.json(doc);
});

// Fees
app.get('/api/fees', async (req, res) => {
  const items = await Fee.find();
  res.json(items);
});
app.post('/api/fees/pay', async (req, res) => {
  const { studentId, amount } = req.body;
  let f = await Fee.findOne({ studentId });
  if (!f) f = await Fee.create({ studentId, due: 1000, paid: 0, history: [] });
  f.paid += Number(amount);
  f.history.push({ date: new Date().toISOString(), amount: Number(amount) });
  await f.save();
  res.json(f);
});

// Results
app.get('/api/results', async (req, res) => {
  const items = await Result.find().sort({ createdAt: -1 });
  res.json(items);
});
app.post('/api/results', async (req, res) => {
  const doc = await Result.create(req.body);
  res.json(doc);
});
app.put('/api/results/:id', async (req, res) => {
  const doc = await Result.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(doc);
});
app.delete('/api/results/:id', async (req, res) => {
  await Result.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
});

// Papers
app.get('/api/papers', async (req, res) => {
  const items = await Paper.find().sort({ createdAt: -1 });
  res.json(items);
});
app.post('/api/papers', async (req, res) => {
  const doc = await Paper.create(req.body);
  res.json(doc);
});
app.put('/api/papers/:id', async (req, res) => {
  const doc = await Paper.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(doc);
});
app.delete('/api/papers/:id', async (req, res) => {
  await Paper.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
});

// Start server
start();
