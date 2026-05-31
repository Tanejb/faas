import { useCallback, useEffect, useState } from "react";
import { getCallableErrorMessage } from "../api/callable";
import * as materialsApi from "../api/materials";
import MaterialDownloadLink from "./MaterialDownloadLink";

function formatSize(bytes) {
  if (bytes == null) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export default function MaterialsList({ eventId, refreshKey = 0 }) {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await materialsApi.listEventMaterials({ eventId });
      setMaterials(data.materials || []);
    } catch (err) {
      setError(getCallableErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  if (loading) {
    return <p className="muted">Loading materials…</p>;
  }

  if (error) {
    return (
      <>
        <p className="error">{error}</p>
        <button type="button" onClick={load}>
          Retry
        </button>
      </>
    );
  }

  if (materials.length === 0) {
    return <p className="muted">No materials uploaded yet.</p>;
  }

  return (
    <ul className="materials-list">
      {materials.map((m) => (
        <li key={m.materialId} className="material-item">
          <div>
            <span className="material-name">{m.fileName}</span>
            <span className="material-meta">
              {formatSize(m.size)} · {m.contentType || "file"}
            </span>
          </div>
          {m.storagePath && (
            <MaterialDownloadLink
              storagePath={m.storagePath}
              fileName={m.fileName}
            />
          )}
        </li>
      ))}
    </ul>
  );
}
