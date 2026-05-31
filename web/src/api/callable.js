import { httpsCallable } from "firebase/functions";
import { functions } from "../firebase";

export function getCallableErrorMessage(err) {
  if (err?.code === "functions/unauthenticated") {
    return "You must be signed in.";
  }
  if (err?.code === "functions/permission-denied") {
    return err.message || "Permission denied.";
  }
  if (err?.code === "functions/already-exists") {
    return err.message || "Already registered.";
  }
  if (err?.code === "functions/resource-exhausted") {
    return err.message || "Event is full.";
  }
  if (err?.message) {
    return err.message;
  }
  return "Request failed.";
}

export function createCallable(name) {
  const fn = httpsCallable(functions, name);
  return async (data = {}) => {
    const result = await fn(data);
    return result.data;
  };
}
