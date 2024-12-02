const path = require("path");
const express = require("express");
const dotenv = require("dotenv");
const morgan = require("morgan");
const cors = require("cors");
const compression = require("compression");

const ApiError = require("./utils/apiError");
const globalError = require("./Middlewares/errorMiddleware");
const dbConnection = require("./configs/Database");
const mountRoutes = require("./routes"); // Import the route mounting function
const { webhookCheckout } = require("./Controllers/onlinePaymentController");

// Load environment variables
dotenv.config({ path: "config.env" });

// Connect to the database
dbConnection();

// Initialize express app
const app = express();

// Middleware
app.use(cors());
app.use(compression());
//checkout webhook
app.post(
  "/webhook-checkout",
  express.raw({ type: "application/json" }),
  webhookCheckout
);
app.use(express.json());
app.use(express.static(path.join(__dirname, "uploads")));

if (process.env.Node_ENV === "development") {
  app.use(morgan("dev"));
  console.log(`node:${process.env.Node_ENV}`);
}

// Mount Routes using the function
mountRoutes(app);

// Handle 404 errors
app.all("*", (req, res, next) => {
  next(new ApiError(`can't find this route: ${req.originalUrl}`, 400));
});

// Global error handling middleware for express
app.use(globalError);

// Handle rejections outside express
process.on("unhandledRejection", (err) => {
  console.error(`unhandledRejection Errors: ${err.name}|${err.message}`);
  server.close(() => {
    console.log("shutting down....");
    process.exit(1);
  });
});

const { PORT } = process.env;
const server = app.listen(PORT, () => {
  console.log(`App is running on port ${PORT}`);
});
