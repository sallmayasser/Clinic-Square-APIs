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
    name: "testResult",
    maxCount: 30,
  },
]);

exports.resizeImage = asyncHandler(async (req, res, next) => {
  if (
    req.body.role === "patient" ||
    req.body.role === "doctor" ||
    req.body.role === "lab" ||
    req.body.role === "pharmacy" 
  ) {
    if (req.files.profilePic) {
      const filename = `${req.body.role}-${uuidv4()}-${Date.now()}.jpeg`;
      const storageRef = ref(storage, `uploads/${req.body.role}s/${filename}`);
      const metadata = {
        contentType: req.files.profilePic[0].mimetype,
      };
      // Upload the file in the bucket storage
      const snapshot = await uploadBytesResumable(
        storageRef,
        req.files.profilePic[0].buffer,
        metadata
      );
      const downloadURL = await getDownloadURL(snapshot.ref);
      req.body.profilePic = downloadURL;
    }

    if (req.files.license) {
      req.body.license = [];
      await Promise.all(
        req.files.license.map(async (img, index) => {
          const filename = `${req.body.role}-${uuidv4()}-${Date.now()}-${
            index + 1
          }.jpeg`;
          const storageRef = ref(
            storage,
            `uploads/${req.body.role}s/${filename}`
          );

          const metadata = {
            contentType: img.mimetype,
          };

          // Upload the file in the bucket storage
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
    next();
  } else {
    return next(new ApiError("incorrect role found ", 401));
  }
});
