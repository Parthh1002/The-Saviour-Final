"use client";
import { useState, useRef } from "react";
import { UploadCloud, Image as ImageIcon, Film, X, CheckCircle2, AlertCircle, RefreshCw } from "lucide-react";

type UploadedFile = {
  id: string;
  file: File;
  previewUrl: string;
  type: "image" | "video";
  status: "uploading" | "success" | "error" | "processing";
  results?: any[];
};

export function DataUpload() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const processFiles = (newFiles: FileList | File[]) => {
    const newUploads = Array.from(newFiles).map((file) => {
      const isVideo = file.type.startsWith("video/");
      return {
        id: Math.random().toString(36).substring(7),
        file,
        previewUrl: URL.createObjectURL(file),
        type: (isVideo ? "video" : "image") as "video" | "image",
        status: "uploading" as const,
      };
    });

    setFiles((prev) => [...prev, ...newUploads]);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
  };

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const analyzeAll = async () => {
    const pendingFiles = files.filter(f => f.status !== "success" && f.status !== "processing");
    if (pendingFiles.length === 0) return;

    for (const fileObj of pendingFiles) {
      setFiles(prev => prev.map(f => f.id === fileObj.id ? { ...f, status: "processing" } : f));
      
      const formData = new FormData();
      formData.append("file", fileObj.file);

      try {
        console.log(`DEBUG: Sending ${fileObj.file.name} to AI backend...`);
        const response = await fetch("http://127.0.0.1:8001/api/v1/detect", {
          method: "POST",
          body: formData
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log("DEBUG: AI Results:", data);
          setFiles(prev => prev.map(f => f.id === fileObj.id ? { ...f, status: "success", results: data } : f));
        } else {
          const errText = await response.text();
          console.error("DEBUG: Backend returned error:", response.status, errText);
          setFiles(prev => prev.map(f => f.id === fileObj.id ? { ...f, status: "error" } : f));
        }
      } catch (err) {
        console.error("Upload failed:", err);
        setFiles(prev => prev.map(f => f.id === fileObj.id ? { ...f, status: "error" } : f));
      }
    }
  };

  return (
    <div className="glass rounded-xl border border-border p-5 flex flex-col w-full h-full min-h-[400px]">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-lg flex items-center gap-2">
          <UploadCloud className="h-5 w-5 text-primary" />
          Evidence Upload
        </h3>
        {files.length > 0 && (
          <button 
            onClick={analyzeAll}
            className="text-xs bg-primary text-primary-foreground px-3 py-1.5 rounded-md hover:bg-primary/90 transition-all font-medium flex items-center gap-1 shadow-sm"
          >
            Run AI Analysis
          </button>
        )}
      </div>

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative flex-shrink-0 flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-300 ${
          isDragging
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/50 hover:bg-secondary/5"
        }`}
      >
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          multiple
          accept="image/*,video/*"
          onChange={handleFileSelect}
        />
        <div className="h-12 w-12 rounded-full bg-secondary/10 flex items-center justify-center mb-3">
          <UploadCloud className="h-6 w-6 text-secondary" />
        </div>
        <p className="text-sm font-medium text-foreground mb-1">
          Click or drag files to upload
        </p>
        <p className="text-xs text-muted-foreground">
          Supports JPG, PNG, MP4, AVI (Max 50MB)
        </p>
      </div>

      <div className="flex-1 mt-4 overflow-y-auto pr-2 space-y-3">
        {files.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground text-sm opacity-60 mt-8">
            No evidence uploaded yet.
          </div>
        ) : (
          files.map((file) => (
            <div
              key={file.id}
              className="flex items-center gap-3 p-3 rounded-lg border border-border bg-background animate-fade-in group"
            >
              <div className="h-10 w-10 rounded-md overflow-hidden bg-secondary/20 flex-shrink-0 relative flex items-center justify-center">
                {file.type === "image" ? (
                  <img src={file.previewUrl} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <>
                    <video src={file.previewUrl} className="w-full h-full object-cover opacity-50" />
                    <Film className="absolute h-4 w-4 text-foreground" />
                  </>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {file.file.name}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] text-muted-foreground uppercase">
                    {(file.file.size / 1024 / 1024).toFixed(2)} MB
                  </span>
                  {file.status === "processing" ? (
                    <span className="text-[10px] text-primary flex items-center gap-1">
                      <RefreshCw className="h-3 w-3 animate-spin" /> AI ANALYZING...
                    </span>
                  ) : file.status === "success" ? (
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] text-success flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" /> ANALYSIS COMPLETE
                      </span>
                      {file.results && file.results.length > 0 && (
                        <div className="flex gap-1 flex-wrap">
                          {file.results.map((r, i) => (
                            <span key={i} className="text-[8px] bg-primary/10 text-primary px-1 rounded font-bold uppercase">
                              {r.class_name} ({Math.round(r.confidence * 100)}%)
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : file.status === "error" ? (
                    <span className="text-[10px] text-danger flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" /> UPLOAD FAILED
                    </span>
                  ) : (
                    <span className="text-[10px] text-secondary flex items-center gap-1">
                      <UploadCloud className="h-3 w-3" /> READY FOR INFERENCE
                    </span>
                  )}
                </div>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile(file.id);
                }}
                className="h-8 w-8 rounded-md flex items-center justify-center text-secondary hover:text-danger hover:bg-danger/10 transition-colors"
                title="Remove evidence"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
