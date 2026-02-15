import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { generateRegistrationOptions } from "@simplewebauthn/server";

admin.initializeApp();
const db = admin.firestore(); // keep it

export const test = functions.https.onRequest(async (req, res) => {
  await db.collection("test").add({ message: "working" });
  res.send("OK");
});


export const generateOptions = functions.https.onRequest(async (req, res) => {
  const { userId } = req.body;

  const options = generateRegistrationOptions({
    rpName: "Biometric Attendance",
    rpID: "yourdomain.web.app",
    userID: userId,
    userName: userId,
  });

  res.json(options);
});
