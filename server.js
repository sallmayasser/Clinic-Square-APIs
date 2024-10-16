const path = require("path");
const express = require("express");
const dotenv = require("dotenv");
const morgan = require("morgan");
const cors = require("cors");

const ApiError = require("./utils/apiError");
const globalError = require("./Middlewares/errorMiddleware");
const dbConnection = require("./configs/Database");

dotenv.config({ path: "config.env" });

//routes
const doctorRoute = require("./Routes/doctorRoute");
const questionRoute = require("./Routes/questionRoute");
const patientRoute = require("./Routes/patientRoute");
const labRoute = require("./Routes/labRoute");
const adminRoute = require("./Routes/adminRoute");
const doctorReservationRoute = require("./Routes/doctorReservationRoute");
const authRoute = require("./Routes/authRoute");
const testRoute = require("./Routes/testRoute");
// connect with db
dbConnection();

///express app
const app = express();

/////middleware
app.use(cors());

app.use(express.json());
app.use(express.static(path.join(__dirname, "uploads")));

if (process.env.Node_ENV === "development") {
  app.use(morgan("dev"));
  console.log(`node:${process.env.Node_ENV}`);
}

////Mount Routes
app.options("*", cors());

app.use("/api/v1/doctor", doctorRoute);
app.use("/api/v1/questions", questionRoute);
app.use("/api/v1/patient", patientRoute);
app.use("/api/v1/lab", labRoute);
app.use("/api/v1/admin", adminRoute);
app.use("/api/v1/doctor-Reservation", doctorReservationRoute);
app.use("/api/v1/auth", authRoute);
app.use("/api/v1/tests", testRoute);
app.all("*", (req, res, next) => {
  next(new ApiError(`can't find this route:${req.originalUrl}`, 400));
});

// global error handling middelware for express
app.use(globalError);

//handle rejections outside express
process.on("unhandleRejection", (err) => {
  console.error(`unhandleRejection Errors:${err.name}|${err.message}`);
  server.close(() => {
    console.log("shuting  down....");
    process.exit(1);
  });
});

const { PORT } = process.env;
const server = app.listen(PORT, () => {
  console.log(`App is running on port ${PORT}`);
});
