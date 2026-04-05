const express = require("express");
const mongoose = require("mongoose");
const path = require("path");

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static folder
app.use(express.static("public"));

// MongoDB connect
mongoose.connect(process.env.MONGO_URI)
.then(() => console.log("MongoDB Connected"))
.catch(err => console.log(err));

// Schema
const PatientSchema = new mongoose.Schema({
  name: String,
  age: Number,
  phone: String,
  problem: String,
  notes: String,
  date: String
});

const Patient = mongoose.model("Patient", PatientSchema);

// Routes

// Home
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Add patient
app.post("/add-patient", async (req, res) => {
  const patient = new Patient(req.body);
  await patient.save();
  res.redirect("/");
});

// Get patients
app.get("/patients", async (req, res) => {
  const data = await Patient.find();
  res.json(data);
});

// Delete patient
app.get("/delete/:id", async (req, res) => {
  await Patient.findByIdAndDelete(req.params.id);
  res.redirect("/");
});

// PORT (IMPORTANT)
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server started on " + PORT);
});