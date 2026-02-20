"use client";

import { useState, useCallback, useRef } from "react";
import { api } from "@/lib/api";
import { Track } from "@/lib/types";
import { Upload, CheckCircle2, XCircle, Music } from "lucide-react";

interface UploadResult {
  filename: string;
  status: "pending" | "uploading" | "success" | "error";
  track?: Track;
  error?: string;
}

export default function UploadPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [results, setResults] = useState<UploadResult[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback((newFiles: FileList | File[]) => {
    const mp3Files = Array.from(newFiles).filter(
      (f) => f.type === "audio/mpeg" || f.name.toLowerCase().endsWith(".mp3"),
    );
    setFiles((prev) => [...prev, ...mp3Files]);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      addFiles(e.dataTransfer.files);
    },
    [addFiles],
  );

  const handleUpload = async () => {
    if (files.length === 0) return;
    setUploading(true);

    const uploadResults: UploadResult[] = files.map((f) => ({
      filename: f.name,
      status: "pending",
    }));
    setResults(uploadResults);

    for (let i = 0; i < files.length; i++) {
      uploadResults[i].status = "uploading";
      setResults([...uploadResults]);

      try {
        const track = await api.uploadFile<Track>(files[i]);
        uploadResults[i].status = "success";
        uploadResults[i].track = track;
      } catch (err: unknown) {
        uploadResults[i].status = "error";
        uploadResults[i].error = err instanceof Error ? err.message : "Upload failed";
      }
      setResults([...uploadResults]);
    }

    setUploading(false);
    setFiles([]);
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Upload Music</h1>

      {/* Drop zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
          dragOver
            ? "border-primary bg-primary/5"
            : "border-border hover:border-muted-foreground"
        }`}
      >
        <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-foreground font-medium">
          Drop MP3 files here or click to browse
        </p>
        <p className="text-muted-foreground text-sm mt-1">
          Supports batch upload up to 20 files
        </p>
        <input
          ref={inputRef}
          type="file"
          accept=".mp3,audio/mpeg"
          multiple
          className="hidden"
          onChange={(e) => e.target.files && addFiles(e.target.files)}
        />
      </div>

      {/* Selected files */}
      {files.length > 0 && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium">
              {files.length} file{files.length > 1 ? "s" : ""} selected
            </h2>
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {uploading ? "Uploading..." : "Upload All"}
            </button>
          </div>

          <div className="space-y-2">
            {files.map((file, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-3 bg-card rounded-md"
              >
                <div className="flex items-center gap-3">
                  <Music className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm truncate">{file.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {(file.size / 1024 / 1024).toFixed(1)} MB
                  </span>
                </div>
                <button
                  onClick={() => removeFile(i)}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <XCircle className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload results */}
      {results.length > 0 && (
        <div className="mt-6">
          <h2 className="text-sm font-medium mb-3">Upload Results</h2>
          <div className="space-y-2">
            {results.map((result, i) => (
              <div
                key={i}
                className="flex items-center gap-3 p-3 bg-card rounded-md"
              >
                {result.status === "success" ? (
                  <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                ) : result.status === "error" ? (
                  <XCircle className="w-4 h-4 text-destructive shrink-0" />
                ) : result.status === "uploading" ? (
                  <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin shrink-0" />
                ) : (
                  <div className="w-4 h-4 rounded-full border border-border shrink-0" />
                )}
                <span className="text-sm truncate flex-1">
                  {result.filename}
                </span>
                {result.track && (
                  <span className="text-xs text-muted-foreground">
                    {result.track.title} — {result.track.artist.name}
                  </span>
                )}
                {result.error && (
                  <span className="text-xs text-destructive">
                    {result.error}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
