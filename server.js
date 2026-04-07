const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const cors = require("cors");

const app = express();

// 1. Middlewares (Ye zaroori hain varna login block ho jayega)
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// 2. MongoDB Connection
// Railway par process.env.MONGO_URI use hoga
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/hospitalDB";

mongoose.connect(MONGO_URI)
  .then(() => console.log("MongoDB Connected! ✅"))
  .catch((err) => console.log("DB Connection Error: ❌", err));

// 3. User Schema (Database mein table banane ke liye)
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true } // Real apps mein yahan Bcrypt use hota hai
});

const User = mongoose.model("User", userSchema);

// 4. Register Route
app.post("/register", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ message: "Username aur Password dono chahiye!" });
    }
    const newUser = new User({ username, password });
    await newUser.save();
    res.status(201).json({ message: "Registered! Now login" });
  } catch (error) {
    res.status(400).json({ message: "User pehle se hai ya koi error hai!" });
  }
});

// 5. Login Route
app.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username, password });

    if (user) {
      res.status(200).json({ message: "Login Successful", user });
    } else {
      res.status(401).json({ message: "Galat Username ya Password!" });
    }
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
});

// Default Route
app.get("/", (req, res) => {
  res.send("Hospital Backend is Running! 🚀");
});

// 6. Port Setting
const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server started on port ${PORT} 🚀`);
});