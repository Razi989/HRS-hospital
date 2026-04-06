const express = require("express");
const app = express();

// TEST ROUTE
app.get("/", (req, res) => {
  res.send("Server chal raha hai 🚀");
});

// SAFE PORT
const PORT = process.env.PORT || 3000;

// START SERVER
app.listen(PORT, "0.0.0.0", () => {
  console.log("Server started on " + PORT);
});