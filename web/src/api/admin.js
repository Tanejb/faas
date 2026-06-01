import { createCallable } from "./callable";

export const setUserRole = createCallable("setUserRole");
export const listReports = createCallable("listReports");
export const getAutomationSettings = createCallable("getAutomationSettings");
export const updateAutomationSettings = createCallable("updateAutomationSettings");
export const runAutomationJob = createCallable("runAutomationJob");
