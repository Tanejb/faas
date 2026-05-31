import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { getCallableErrorMessage } from "../api/callable";
import * as profileApi from "../api/profile";
import { useAuth } from "./AuthContext";

const ProfileContext = createContext(null);

export function ProfileProvider({ children }) {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadProfile = useCallback(async () => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const data = await profileApi.getMyProfile();
      setProfile(data);
    } catch (err) {
      setError(getCallableErrorMessage(err));
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  async function saveProfile({ displayName, faculty }) {
    setError("");
    const data = await profileApi.updateMyProfile({ displayName, faculty });
    setProfile(data);
    return data;
  }

  const value = useMemo(
    () => ({
      profile,
      loading,
      error,
      loadProfile,
      saveProfile,
      role: profile?.role || null,
    }),
    [profile, loading, error, loadProfile]
  );

  return (
    <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
  );
}

export function useProfile() {
  const ctx = useContext(ProfileContext);
  if (!ctx) {
    throw new Error("useProfile must be used within ProfileProvider");
  }
  return ctx;
}
