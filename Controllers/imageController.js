/* eslint-disable guard-for-in */
/* eslint-disable no-await-in-loop */
const asyncHandler = require("express-async-handler");
const { v4: uuidv4 } = require("uuid");
const {
  getStorage,
  ref,
  getDownloadURL,
  uploadBytesResumable,
} = require("firebase/storage");
const { initializeApp } = require("firebase/app");
const { uploadMixOfImages } = require("../Middlewares/uploadImageMiddleware");
const ApiError = require("../utils/apiError");
const config = require("../configs/firebase");
const LabReservationModel = require("../Models/labReservationModel");
const DoctorReservationModel = require("../Models/doctorReservationModel");
// Initialize a firebase application
initializeApp(config.firebaseConfig);

// Initialize Cloud Storage and get a reference to the service
const storage = getStorage();

exports.uploadImage = uploadMixOfImages([
  {
    name: "license",
    maxCount: 20,
  },
  {
    name: "profilePic",
    maxCount: 1,
  },
  {
    name: "report.results",
    maxCount: 20,
  },
  {
    name: "testResult",
    maxCount: 10,
  },
  {
    name: "photo", // medicine photo
    maxCount: 1,
  },
]);
exports.resizeImage = asyncHandler(async (req, res, next) => {
  const { role } = req.body;

  // Validate the role
  if (!["patient", "doctor", "lab", "pharmacy"].includes(role)) {
    return next(new ApiError("Incorrect role found", 401));
  }

  // Handle profile picture upload
  if (req.files.profilePic) {
    const profilePic = req.files.profilePic[0];

    // Validate profile picture type
    if (!profilePic.mimetype.startsWith("image/")) {
      return next(new ApiError("Profile picture must be an image", 400));
    }

    const filename = `${role}-${uuidv4()}-${Date.now()}.jpeg`;
    const storageRef = ref(storage, `uploads/${role}s/${filename}`);
    const metadata = { contentType: profilePic.mimetype };

    // Upload the profile picture
    const snapshot = await uploadBytesResumable(
      storageRef,
      profilePic.buffer,
      metadata
    );
    req.body.profilePic = await getDownloadURL(snapshot.ref);
  }

  // Handle license uploads
  if (req.files.license) {
    req.body.license = [];

    await Promise.all(
      req.files.license.map(async (img, index) => {
        // Validate license image type
        if (!img.mimetype.startsWith("image/")) {
          throw new ApiError("All license files must be images", 400);
        }

        const filename = `${role}-${uuidv4()}-${Date.now()}-${index + 1}.jpeg`;
        const storageRef = ref(storage, `uploads/${role}s/${filename}`);
        const metadata = { contentType: img.mimetype };

        // Upload the license image
        const snapshot = await uploadBytesResumable(
          storageRef,
          img.buffer,
          metadata
        );
        const downloadURL = await getDownloadURL(snapshot.ref);
        req.body.license.push(downloadURL);
      })
    );
  }
  // Handle results uploads
  if (req.files["report.results"]) {
    req.body.report = req.body.report || {};

    const existingDocument = await DoctorReservationModel.findById(
      req.params.id
    ); // Fetch the existing document
    if (!existingDocument) {
      throw new ApiError("Document not found", 404);
    }
    req.body.report.results = Array.isArray(existingDocument.report?.results)
      ? [...existingDocument.report.results]
      : [];

    const newResults = []; // Temporarily hold new results

    await Promise.all(
      req.files["report.results"].map(async (pdf, index) => {
        // Validate file type for results
        if (pdf.mimetype !== "application/pdf") {
          throw new ApiError("All results must be PDF files", 400);
        }

        // Define storage path and metadata
        const filename = `results-${uuidv4()}-${Date.now()}-${index + 1}.pdf`;
        const storageRef = ref(storage, `uploads/results/${filename}`);
        const metadata = { contentType: pdf.mimetype };

        // Upload the PDF file
        const snapshot = await uploadBytesResumable(
          storageRef,
          pdf.buffer,
          metadata
        );
        const downloadURL = await getDownloadURL(snapshot.ref);
        // Add to new results
        newResults.push(downloadURL);
      })
    );
    // Append the new results to the existing array
    req.body.report.results = [...req.body.report.results, ...newResults];
  }

  if (req.files.testResult) {
    const { testId } = req.body;
    const reservationId = req.params.id;

    // Fetch the reservation by reservationId
    const reservation = await LabReservationModel.findById(reservationId);
    if (!reservation) {
      return next(new ApiError("Reservation not found", 404));
    }

    // Locate the test within requestedTests array by testId
    const test = reservation.requestedTests.id(testId);
    if (!test) {
      return next(new ApiError("Test not found in reservation", 404));
    }

    // Process all files and collect their URLs
    const fileUrls = await Promise.all(
      req.files.testResult.map(async (pdf, index) => {
        // Ensure the uploaded file is a PDF
        if (pdf.mimetype !== "application/pdf") {
          throw new ApiError("Test result must be a PDF file", 400);
        }

        // Upload PDF to Firebase
        const filename = `testResult-${uuidv4()}-${Date.now()}-${
          index + 1
        }.pdf`;
        const storageRef = ref(storage, `uploads/testResults/${filename}`);
        const metadata = { contentType: pdf.mimetype };

        const snapshot = await uploadBytesResumable(
          storageRef,
          pdf.buffer,
          metadata
        );
        return getDownloadURL(snapshot.ref);
      })
    );

    // Append all file URLs to the testResult array
    test.testResult.push(...fileUrls);

    // Save the document once
    await reservation.save();
  }
  // handle medicine image
  if (req.files.photo) {
    const photo = req.files.photo[0];

    // Validate profile picture type
    if (!photo.mimetype.startsWith("image/")) {
      return next(new ApiError("Medicine image must be an image", 400));
    }

    const filename = `${role}-${uuidv4()}-${Date.now()}.jpeg`;
    const storageRef = ref(storage, `uploads/medicines/${filename}`);
    const metadata = { contentType: photo.mimetype };

    // Upload the profile picture
    const snapshot = await uploadBytesResumable(
      storageRef,
      photo.buffer,
      metadata
    );
    req.body.photo = await getDownloadURL(snapshot.ref);
  }

  // Proceed to the next middleware
  next();
});
