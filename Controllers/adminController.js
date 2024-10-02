const asyncHandler = require("express-async-handler");
const Labs = require("../Models/labModel");
const ApiError = require("../utils/apiError");
const sendEmail = require("../utils/sendEmail");
const DoctorModel = require("../Models/doctorModel");
const PharmacyModel = require("../Models/pharmacyModel");

exports.Approve = asyncHandler(async (req, res, next) => {
  // Execute both queries concurrently using Promise.all
  Promise.all([
    Labs.findByIdAndUpdate(req.body.id, { state: true }, { new: true }),
    DoctorModel.findByIdAndUpdate(req.body.id, { state: true }, { new: true }),
    PharmacyModel.findByIdAndUpdate(
      req.body.id,
      { state: true },
      { new: true }
    ),
  ])
    .then(([foundLabs, foundDoctor, foundPharmacy]) => {
      let foundUser;
      // Check if user is found in Labs
      if (foundLabs) {
        foundUser = foundLabs;
        res.status(200).json({ data: foundLabs });
      }
      // Check if user is found in DoctorModels
      else if (foundDoctor) {
        foundUser = foundDoctor; // Corrected assignment
        res.status(200).json({ data: foundDoctor });
        // Check if user is found in PharmacyModels
      } else if (foundPharmacy) {
        foundUser = foundDoctor; // Corrected assignment
        res.status(200).json({ data: foundPharmacy });
      }
      // If user is not found in either model, return 404
      else {
        return Promise.reject(
          new ApiError(`No user found for this id ${req.body.id}`, 404)
        );
      }

      const message = `Dear ${foundUser.name},

\nWe are pleased to inform you that your account has been approved. You are now a registered member of ClinicSquare. We would like to extend a warm welcome to our platform.

\nYour account details:
- Username: ${foundUser.name}
- Email: ${foundUser.email}

\nPlease feel free to log in to your account 

\nIf you have any questions or need assistance, please don't hesitate to contact our support team at <clinicsquare2025@gmail.com>.

\nThank you for joining ClinicSquare. We look forward to serving you and providing you with a seamless experience.

\nBest regards,
The ClinicSquare application Team 

`;

      return sendEmail({
        email: foundUser.email,
        subject: "Account Accepted",
        message,
      })
        .then(() => {
          // Send success response after sending email and updating user
          res.status(200).json({
            message:
              "You have accepted this user successfully. An email notification has been sent.",
          });
        })
        .catch((error) => {
          // If there's an error sending email, handle it
          return Promise.reject(new ApiError("Failed to send email", 500));
        });
    })
    .catch(next); // Catch any errors during the updates or email sending
});

exports.Decline = asyncHandler(async (req, res, next) => {
  Promise.all([
    Labs.findByIdAndDelete(req.body.id),
    DoctorModel.findByIdAndDelete(req.body.id),
    PharmacyModel.findByIdAndDelete(req.body.id),
  ])
    .then(([foundLab, foundDoctor, foundPharmacy]) => {
      let foundUser;
      if (foundLab) {
        foundUser = foundLab;
      } else if (foundDoctor) {
        foundUser = foundDoctor;
      } else if (foundPharmacy) {
        foundUser = foundPharmacy;
      } else {
        return Promise.reject(
          new ApiError(`No user found for this id ${req.body.id}`, 404)
        );
      }

      const message = `Dear ${foundUser.name},

\nI hope this message finds you well.

\nI am writing to inform you about the status of your recent account application with ClinicSquare . We regret to inform you that your application has been declined due to incomplete license information provided during the registration process.

\nAt ClinicSquare , we strive to maintain the highest standards of compliance and accuracy in our records. Unfortunately, the information provided in your license documentation did not meet our requirements for verification purposes.

\nWe understand the inconvenience this may cause and sincerely apologize for any frustration or disappointment this decision may have caused you. It is never our intention to inconvenience our applicants, but rather to ensure the integrity and security of our platform for all users.

\nWe value your interest in ClinicSquare  and encourage you to review and resubmit your application with the required documentation to complete the registration process. Should you have any questions or require further assistance, please do not hesitate to contact our support team at <clinicsquare2025@gmail.com>.

\nOnce again, we apologize for any inconvenience this may have caused and thank you for your understanding and cooperation in this matter.

\nThank you for considering ClinicSquare . We look forward to the possibility of working with you in the future.

\nSincerely,
The ClinicSquare application Team
 `;

      return sendEmail({
        email: foundUser.email,
        subject: "Account Declined",
        message,
      })
        .then(() => {
          // Send success response after sending email and deleting user
          res.status(200).json({
            message:
              "You have declined this user and deleted successfully. An email notification has been sent.",
          });
        })
        .catch((error) => {
          // If there's an error sending email, handle it
          return Promise.reject(new ApiError("Failed to send email", 500));
        });
    })
    .catch((error) => {
      // If there's an error with database operation or sending email, send error response
      next(new ApiError("Server failed", 500));
    });
});
