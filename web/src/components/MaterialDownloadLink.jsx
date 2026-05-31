import { useEffect, useState } from "react";
import { getDownloadURL, ref } from "firebase/storage";
import { storage } from "../firebase";

export default function MaterialDownloadLink({ storagePath, fileName }) {
  const [url, setUrl] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setError("");
      setUrl(null);
      try {
        const downloadUrl = await getDownloadURL(ref(storage, storagePath));
        if (!cancelled) setUrl(downloadUrl);
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Could not load download link");
        }
      }
    }
    if (storagePath) {
      load();
    }
    return () => {
      cancelled = true;
    };
  }, [storagePath]);

  if (error) {
    return <span className="material-link-error">{error}</span>;
  }

  if (!url) {
    return <span className="muted">Preparing link…</span>;
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="material-download-link"
    >
      Open / download {fileName}
    </a>
  );
}
