import { initializeApp } from "firebase/app";
import { connectAuthEmulator, getAuth } from "firebase/auth";
import { connectFirestoreEmulator, getFirestore } from "firebase/firestore";
import { connectFunctionsEmulator, getFunctions } from "firebase/functions";
import { connectStorageEmulator, getStorage } from "firebase/storage";

const projectId =
  import.meta.env.VITE_FIREBASE_PROJECT_ID || "faas-b43b4";
const useEmulators = import.meta.env.VITE_USE_EMULATORS === "true";
const functionsRegion =
  import.meta.env.VITE_FUNCTIONS_REGION || "us-central1";

const firebaseConfig = {
  apiKey: "demo-api-key",
  authDomain: "localhost",
  projectId,
  storageBucket: `${projectId}.appspot.com`,
  messagingSenderId: "000000000000",
  appId: "demo-app-id",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const functions = getFunctions(app, functionsRegion);
export const storage = getStorage(app);

export const functionsBaseUrl = useEmulators
  ? `http://127.0.0.1:5001/${projectId}/${functionsRegion}`
  : `https://${functionsRegion}-${projectId}.cloudfunctions.net`;

if (useEmulators) {
  connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
  connectFirestoreEmulator(db, "127.0.0.1", 8080);
  connectFunctionsEmulator(functions, "127.0.0.1", 5001);
  connectStorageEmulator(storage, "127.0.0.1", 9199);
}

export { projectId, useEmulators, functionsRegion };
