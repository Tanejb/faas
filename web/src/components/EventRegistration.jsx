import { useCallback, useEffect, useState } from "react";
import { getCallableErrorMessage } from "../api/callable";
import * as registrationsApi from "../api/registrations";
import { useProfile } from "../context/ProfileContext";
import { canRegisterForEvents } from "../utils/roles";

export default function EventRegistration({ eventId, onRegistrationChange }) {
  const { role } = useProfile();
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadStatus = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await registrationsApi.getMyRegistration({ eventId });
      setStatus(data.status);
    } catch (err) {
      setError(getCallableErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    if (canRegisterForEvents(role)) {
      loadStatus();
    } else {
      setLoading(false);
    }
  }, [role, loadStatus]);

  async function handleRegister() {
    setActionLoading(true);
    setError("");
    setMessage("");
    try {
      const data = await registrationsApi.registerForEvent({ eventId });
      setStatus(data.status);
      setMessage("You are registered. Check your inbox for confirmation.");
      if (onRegistrationChange) {
        onRegistrationChange({
          registeredCount: data.registeredCount,
          spotsLeft: data.spotsLeft,
        });
      }
    } catch (err) {
      setError(getCallableErrorMessage(err));
    } finally {
      setActionLoading(false);
    }
  }

  async function handleCancel() {
    setActionLoading(true);
    setError("");
    setMessage("");
    try {
      const data = await registrationsApi.cancelRegistration({ eventId });
      setStatus(data.status);
      setMessage("Registration cancelled.");
      if (onRegistrationChange) {
        onRegistrationChange({
          registeredCount: data.registeredCount,
          spotsLeft: data.spotsLeft,
        });
      }
    } catch (err) {
      setError(getCallableErrorMessage(err));
    } finally {
      setActionLoading(false);
    }
  }

  if (!canRegisterForEvents(role)) {
    return null;
  }

  return (
    <section className="card">
      <h3>Registration</h3>
      {loading && <p className="muted">Loading…</p>}
      {!loading && (
        <>
          <p className="muted">
            Status:{" "}
            <strong>
              {status === "registered"
                ? "Registered"
                : status === "cancelled"
                  ? "Cancelled"
                  : "Not registered"}
            </strong>
          </p>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            {status !== "registered" && (
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleRegister}
                disabled={actionLoading}
              >
                {actionLoading ? "Working…" : "Register"}
              </button>
            )}
            {status === "registered" && (
              <button
                type="button"
                className="btn btn-danger-ghost"
                onClick={handleCancel}
                disabled={actionLoading}
              >
                {actionLoading ? "Working…" : "Cancel registration"}
              </button>
            )}
          </div>
          {error && <p className="error">{error}</p>}
          {message && <p className="success">{message}</p>}
        </>
      )}
    </section>
  );
}
