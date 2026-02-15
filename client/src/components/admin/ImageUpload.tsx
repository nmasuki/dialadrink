"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { FiUpload, FiX, FiLoader } from "react-icons/fi";
import axios from "axios";

interface CloudinaryImage {
  public_id: string;
  version: number;
  signature: string;
  width: number;
  height: number;
  format: string;
  resource_type: string;
  url: string;
  secure_url: string;
}

interface ImageUploadProps {
  value?: CloudinaryImage | null;
  onChange: (image: CloudinaryImage | null) => void;
  folder?: string;
  label?: string;
}

export default function ImageUpload({ value, onChange, folder = "products", label = "Image" }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", folder);

      const res = await axios.post("/api/admin/upload", formData);
      if (res.data.response === "success") {
        onChange(res.data.data);
      }
    } catch (error) {
      console.error("Upload failed:", error);
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async () => {
    if (value?.public_id) {
      try {
        await axios.delete("/api/admin/upload", { data: { publicId: value.public_id } });
      } catch (error) {
        console.error("Delete failed:", error);
      }
    }
    onChange(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) handleUpload(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleUpload(file);
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>

      {value?.secure_url ? (
        <div className="relative inline-block">
          <Image
            src={value.secure_url}
            alt="Uploaded"
            width={160}
            height={160}
            className="w-40 h-40 object-cover rounded-lg border"
          />
          <button
            type="button"
            onClick={handleRemove}
            className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
          >
            <FiX className="w-3 h-3" />
          </button>
        </div>
      ) : (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            dragActive ? "border-teal bg-teal/5" : "border-gray-300 hover:border-gray-400"
          }`}
        >
          {uploading ? (
            <FiLoader className="w-8 h-8 text-gray-400 mx-auto animate-spin" />
          ) : (
            <>
              <FiUpload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500">Click or drag image to upload</p>
              <p className="text-xs text-gray-400 mt-1">Max 5MB</p>
            </>
          )}
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      )}
    </div>
  );
}
