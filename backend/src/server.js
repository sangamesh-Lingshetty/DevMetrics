"use strict";

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
require("dotenv").config();
const getAllrepo = require("./routes/github");

const app = express();
const PORT = process.env.PORT || 5000;


const corsOptions = {
  origin: [
    'http://localhost:3000',  // React dev server
    'http://localhost:3001',  // Alternative port
    'http://127.0.0.1:3000'
  ],
  credentials: true,
  optionsSuccessStatus: 200
};
// middleware
app.use(helmet());
app.use(cors(corsOptions));
app.use(morgan("combined")); //track the api call
app.use(express.json());

//  routes
app.get("/api/health", (req, res) => {
  res.json({
    message: "DevInsights API is running!.",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
    endpoints: [
      "GET /api/github/repos/:username",
      "GET /api/github/repos/:owner/:repo/commits",
    ],
  });
});

app.use("/api/github", getAllrepo);

// Error handling middleware very important
app.use((err, req, res, next) => {
  console.log(err.stack);
  res.status(500).json({ error: "something went wrong!" });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 DevInsights API ready for GitHub analytics!`);
});
