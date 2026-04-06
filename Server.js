const express = require("express");
const app = express();

// TEST ROUTE
app.get("/", (req, res) => {
  res.send("Server chal raha hai 🚀");
});

// PORT (IMPORTANT)
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server started on " + PORT);
});