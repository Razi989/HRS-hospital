const express = require("express");
const mongoose = require("mongoose");
const path = require("path");

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Static folder (VERY IMPORTANT)
app.use(express.static(path.join(__dirname, "public")));

// ✅ MongoDB Connect (safe)
mongoose.connect(process.env.MONGO_URI)
.then(() => console.log("MongoDB Connected ✅"))
.catch(err => console.log("Mongo Error ❌", err));

// ✅ Schema
const patientSchema = new mongoose.Schema({
  name: String,
  age: Number,
  phone: String,
  problem: String,
  notes: String,
  date: String
});

const Patient = mongoose.model("Patient", patientSchema);

// ✅ Routes

// test route
app.get("/", (req, res) => {
  res.send("Hospital Server Running 🚀");
});

// get patients
app.get("/patients", async (req, res) => {
  const data = await Patient.find();
  res.json(data);
});

// add patient
app.post("/add", async (req, res) => {
  const newPatient = new Patient(req.body);
  await newPatient.save();
  res.send("Patient Added ✅");
});

// delete patient
app.delete("/delete/:id", async (req, res) => {
  await Patient.findByIdAndDelete(req.params.id);
  res.send("Deleted ✅");
});

// ✅ PORT FIX (IMPORTANT FOR RAILWAY)
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});