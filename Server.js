require("dotenv").config();
const path = require("path");
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(express.static(path.join(__dirname, "public")));

// MongoDB connection
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/hospitalDB";
mongoose.connect(MONGO_URI)
  .then(() => console.log("MongoDB connected 🚀"))
  .catch((err) => {
    console.error("MongoDB connect error:", err.message);
    process.exit(1);
  });

const JWT_SECRET = process.env.JWT_SECRET || "change_this_secret";

// User schema
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
});
const User = mongoose.model("User", userSchema);

// ✅ Patient schema (UPDATED)
const patientSchema = new mongoose.Schema({
  name: { type: String, required: true },
  age: { type: Number, required: true },
  phone: { type: String, required: true },
  problem: { type: String, required: true },
  notes: { type: String },
  date: { type: Date, default: Date.now },

  doctorType: { type: String, enum: ["Physician", "Gynecologist"] },
  patientType: { type: String, enum: ["OPD", "IPD", "Emergency"] },
  fees: { type: Number }
});

const Patient = mongoose.model("Patient", patientSchema);

// Billing schema
const billingSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: "Patient", required: true },
  amount: { type: Number, required: true },
  description: { type: String },
  createdAt: { type: Date, default: Date.now },
});
const Billing = mongoose.model("Billing", billingSchema);

// Pharmacy schema
const pharmacySchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: "Patient", required: true },
  medicine: { type: String, required: true },
  dose: { type: String, required: true },
  instructions: { type: String },
  createdAt: { type: Date, default: Date.now },
});
const Pharmacy = mongoose.model("Pharmacy", pharmacySchema);

// Routes for pages
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/patient-form", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "patient-form.html"));
});

app.get("/billing-form", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "billing-form.html"));
});

app.get("/pharmacy-form", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "pharmacy-form.html"));
});

app.get("/dashboard", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "dashboard.html"));
});

// Auth middleware
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const token = authHeader.split(" ")[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }
};

// Auth routes
app.post("/auth/register", async (req, res) => {
  const { username, password } = req.body;
  const passwordHash = await bcrypt.hash(password, 10);
  const user = new User({ username, passwordHash });
  await user.save();
  res.json({ message: "User registered" });
});

app.post("/auth/login", async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return res.status(401).json({ error: "Invalid" });

  const token = jwt.sign({ id: user._id }, JWT_SECRET);
  res.json({ token });
});

// ✅ CREATE PATIENT (FIXED)
app.post("/patients", authMiddleware, async (req, res) => {
  try {
    const {
      name, age, phone, problem,
      date, notes,
      doctorType, patientType, fees
    } = req.body;

    const patient = new Patient({
      name,
      age,
      phone,
      problem,
      date,
      notes,
      doctorType,
      patientType,
      fees
    });

    await patient.save();
    res.json({ message: "Patient added", patient });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// GET PATIENTS
app.get("/patients", authMiddleware, async (req, res) => {
  const patients = await Patient.find().sort({ date: -1 });
  res.json(patients);
});

// UPDATE
app.put("/patients/:id", authMiddleware, async (req, res) => {
  const patient = await Patient.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(patient);
});

// DELETE
app.delete("/patients/:id", authMiddleware, async (req, res) => {
  await Patient.findByIdAndDelete(req.params.id);
  res.json({ message: "Deleted" });
});

// Billing
app.post("/billing", authMiddleware, async (req, res) => {
  const bill = new Billing(req.body);
  await bill.save();
  res.json(bill);
});

app.get("/billing", authMiddleware, async (req, res) => {
  const bills = await Billing.find().populate("patientId", "name").sort({ createdAt: -1 });
  res.json(bills);
});

// Pharmacy
app.post("/pharmacy", authMiddleware, async (req, res) => {
  const item = new Pharmacy(req.body);
  await item.save();
  res.json(item);
});

app.get("/pharmacy", authMiddleware, async (req, res) => {
  const items = await Pharmacy.find().populate("patientId", "name").sort({ createdAt: -1 });
  res.json(items);
});

const PORT = 3000;
app.listen(PORT, () => console.log("Server running 🚀"));