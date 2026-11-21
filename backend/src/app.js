const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const morgan = require("morgan");

const healthRoutes = require("./routes/health.routes");
const apiRoutes = require("./routes");
const notFound = require("./middlewares/notFound");
const errorHandler = require("./middlewares/errorHandler");

const app = express();

app.use(helmet());
app.use(cors());
app.use(morgan(process.env.NODE_ENV === "development" ? "dev" : "combined"));
app.use(express.json());

app.use("/health", healthRoutes);
app.use("/api", apiRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
