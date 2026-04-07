const express = require("express");
const path = require("path");

const app = express();

// static files
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.send("App chal raha 🚀");
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log("Server start ho gaya");
});