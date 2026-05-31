import { useState } from "react";
import { ref, uploadBytes } from "firebase/storage";
import { getCallableErrorMessage } from "../api/callable";
import * as materialsApi from "../api/materials";
import { useAuth } from "../context/AuthContext";
import { storage } from "../firebase";

export default function MaterialUploadForm({ eventId, onUploaded }) {
  const { user } = useAuth();
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    if (!file) {
      setError("Choose a file first.");
      return;
    }

    setUploading(true);
    setError("");
    setSuccess("");
    try {
      const { storagePath } = await materialsApi.getUploadUrl({
        eventId,
        fileName: file.name,
      });

      const storageRef = ref(storage, storagePath);
      await uploadBytes(storageRef, file, {
        customMetadata: {
          uploadedBy: user.uid,
        },
      });

      setSuccess(`Uploaded ${file.name}. Metadata will appear shortly.`);
      setFile(null);
      e.target.reset();
      if (onUploaded) onUploaded();
    } catch (err) {
      setError(getCallableErrorMessage(err));
    } finally {
      setUploading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="upload-form">
      <label>
        File
        <input
          type="file"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          required
        />
      </label>
      {error && <p className="error">{error}</p>}
      {success && <p className="success">{success}</p>}
      <button type="submit" disabled={uploading}>
        {uploading ? "Uploading…" : "Upload material"}
      </button>
    </form>
  );
}
