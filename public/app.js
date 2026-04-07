require('dotenv').config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");

const app = express();

// 1. Middlewares
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// 2. MongoDB Connection (Laptop par .env se uthayega)
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
    console.log("Error: MONGO_URI nahi mila! Check your .env file. ❌");
}

mongoose.connect(MONGO_URI)
  .then(() => console.log("MongoDB Connected! ✅"))
  .catch((err) => console.log("DB Connection Error: ❌", err));

// 3. Login Route
app.post("/login", async (req, res) => {
    try {
        const { username, password } = req.body;
        // Abhi ke liye simple response
        res.status(200).json({ message: "Login Successful" });
    } catch (error) {
        res.status(500).json({ message: "Server Error" });
    }
});

// 4. Default Route
app.get("/", (req, res) => {
    res.send("Hospital Backend is Running! 🚀");
});

// 5. Port Setting
const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server started on port ${PORT} 🚀`);
});