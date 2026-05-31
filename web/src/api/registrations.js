import { createCallable } from "./callable";

export const registerForEvent = createCallable("registerForEvent");
export const cancelRegistration = createCallable("cancelRegistration");
export const getMyRegistration = createCallable("getMyRegistration");
