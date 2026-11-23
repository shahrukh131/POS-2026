const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const morgan = require("morgan");

const healthRoutes = require("./modules/health").routes;
const apiRoutes = require("./routes");
const notFound = require("./shared/middleware/notFound");
const errorHandler = require("./shared/middleware/errorHandler");

const app = express();

app.use(helmet());
// CORS_ORIGIN: comma-separated allow-list (e.g. the Docker web UI). Unset = allow any origin.
const corsOrigin = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",").map((o) => o.trim())
  : true;
app.use(cors({ origin: corsOrigin }));
app.use(morgan(process.env.NODE_ENV === "development" ? "dev" : "combined"));
app.use(express.json());

app.use("/health", healthRoutes);
app.use("/api", apiRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
