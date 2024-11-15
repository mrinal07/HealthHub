require("dotenv").config();
const express = require("express");
const app = express();
const cookieParser = require("cookie-parser");

// CORS added for Deployement purpose
const cors = require("cors");
app.use(cors());
// CORS added for Deployement purpose

app.use(cookieParser());
app.use(express.json());

const HealthRoute = require("./routes/route");

app.use("/api/health", HealthRoute);

const port = process.env.PORT || 5000;

app.listen(port, () => {
  console.log("Server running on port on port " + port);
});
