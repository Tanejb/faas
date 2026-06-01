export { useInbox } from "../context/InboxContext";
export { getCallableErrorMessage } from "../api/callable";
import * as notificationsApi from "../api/notifications";

export async function loadInbox() {
  const data = await notificationsApi.listMyInbox();
  return data.items || [];
}

export async function markAllRead() {
  return notificationsApi.markInboxRead({ all: true });
}
