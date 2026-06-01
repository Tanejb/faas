import { createCallable } from "./callable";

export const enqueueNotification = createCallable("enqueueNotification");
export const listMyInbox = createCallable("listMyInbox");
export const markInboxRead = createCallable("markInboxRead");
