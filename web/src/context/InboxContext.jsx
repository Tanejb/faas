import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import * as notificationsApi from "../api/notifications";
import { useAuth } from "./AuthContext";

const InboxContext = createContext(null);

export function InboxProvider({ children }) {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  const refreshInbox = useCallback(async () => {
    if (!user) {
      setUnreadCount(0);
      return;
    }
    try {
      const data = await notificationsApi.listMyInbox();
      setUnreadCount(data.unreadCount || 0);
    } catch {
      /* ignore poll errors */
    }
  }, [user]);

  useEffect(() => {
    refreshInbox();
    if (!user) return undefined;
    const id = setInterval(refreshInbox, 12000);
    return () => clearInterval(id);
  }, [user, refreshInbox]);

  const value = useMemo(
    () => ({ unreadCount, refreshInbox }),
    [unreadCount, refreshInbox]
  );

  return (
    <InboxContext.Provider value={value}>{children}</InboxContext.Provider>
  );
}

export function useInbox() {
  const ctx = useContext(InboxContext);
  if (!ctx) {
    throw new Error("useInbox must be used within InboxProvider");
  }
  return ctx;
}
