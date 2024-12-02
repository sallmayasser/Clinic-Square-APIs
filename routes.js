const express = require("express");
const dotenv = require("dotenv");

dotenv.config({ path: "config.env" });
// Import route files
const doctorRoute = require("./Routes/doctorRoute");
const questionRoute = require("./Routes/questionRoute");
const patientRoute = require("./Routes/patientRoute");
const labRoute = require("./Routes/labRoute");
const pharmacyRoute = require("./Routes/pharmacyRoute ");
const adminRoute = require("./Routes/adminRoute");
const doctorReservationRoute = require("./Routes/doctorReservationRoute");
const labReservationRoute = require("./Routes/labReservationRoute");
const authRoute = require("./Routes/authRoute");
const testRoute = require("./Routes/testRoute");
const medicineRoute = require("./Routes/medicineRoute");
const reviewRoute = require("./Routes/reviewRoute");
const cartRoute = require("./Routes/cartRoute");
const orderRoute = require("./Routes/orderRoute");
const onlinePaymentorderRoute = require("./Routes/onlinePaymentRoute");

const mountRoutes = (app) => {
  app.use("/api/v1/doctor", doctorRoute);
  app.use("/api/v1/questions", questionRoute);
  app.use("/api/v1/patient", patientRoute);
  app.use("/api/v1/lab", labRoute);
  app.use("/api/v1/pharmacy", pharmacyRoute);
  app.use("/api/v1/admin", adminRoute);
  app.use("/api/v1/doctor-Reservation", doctorReservationRoute);
  app.use("/api/v1/lab-Reservation", labReservationRoute);
  app.use("/api/v1/auth", authRoute);
  app.use("/api/v1/tests", testRoute);
  app.use("/api/v1/medicines", medicineRoute);
  app.use("/api/v1/reviews", reviewRoute);
  app.use("/api/v1/carts", cartRoute);
  app.use("/api/v1/orders", orderRoute);
  app.use("/api/v1/onlinePayment", onlinePaymentorderRoute);
};

module.exports = mountRoutes;
