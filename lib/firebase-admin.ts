import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

const adminApp =
  getApps().length === 0
    ? initializeApp({
        credential: cert(
          JSON.parse(process.env.FIREBASE_ADMIN_SDK as string)
        ),
      })
    : getApps()[0];

export const adminAuth = getAuth(adminApp);