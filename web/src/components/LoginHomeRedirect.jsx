import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/** After login or user switch, land on /events instead of the previous tab. */
export default function LoginHomeRedirect() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const lastUid = useRef(null);

  useEffect(() => {
    if (!user) {
      lastUid.current = null;
      return;
    }
    if (lastUid.current !== user.uid) {
      lastUid.current = user.uid;
      navigate("/events", { replace: true });
    }
  }, [user, navigate]);

  return null;
}
