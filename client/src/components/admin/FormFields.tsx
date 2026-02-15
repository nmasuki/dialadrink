"use client";

import { UseFormRegisterReturn } from "react-hook-form";

interface BaseFieldProps {
  label: string;
  error?: string;
  helper?: string;
  required?: boolean;
}

interface TextFieldProps extends BaseFieldProps {
  type?: "text" | "email" | "url" | "password";
  placeholder?: string;
  registration: UseFormRegisterReturn;
}

export function TextField({
  label,
  error,
  helper,
  required,
  type = "text",
  placeholder,
  registration,
}: TextFieldProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        placeholder={placeholder}
        {...registration}
        className={`w-full px-3 py-2 border rounded-lg text-sm outline-none transition-colors ${
          error ? "border-red-300 focus:ring-red-500" : "border-gray-300 focus:ring-teal"
        } focus:ring-2 focus:border-transparent`}
      />
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      {helper && !error && <p className="mt-1 text-xs text-gray-500">{helper}</p>}
    </div>
  );
}

interface NumberFieldProps extends BaseFieldProps {
  placeholder?: string;
  registration: UseFormRegisterReturn;
  min?: number;
  max?: number;
  step?: number;
}

export function NumberField({
  label,
  error,
  helper,
  required,
  placeholder,
  registration,
  min,
  max,
  step,
}: NumberFieldProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type="number"
        placeholder={placeholder}
        min={min}
        max={max}
        step={step}
        {...registration}
        className={`w-full px-3 py-2 border rounded-lg text-sm outline-none transition-colors ${
          error ? "border-red-300 focus:ring-red-500" : "border-gray-300 focus:ring-teal"
        } focus:ring-2 focus:border-transparent`}
      />
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      {helper && !error && <p className="mt-1 text-xs text-gray-500">{helper}</p>}
    </div>
  );
}

interface TextAreaFieldProps extends BaseFieldProps {
  placeholder?: string;
  registration: UseFormRegisterReturn;
  rows?: number;
}

export function TextAreaField({
  label,
  error,
  helper,
  required,
  placeholder,
  registration,
  rows = 4,
}: TextAreaFieldProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <textarea
        placeholder={placeholder}
        rows={rows}
        {...registration}
        className={`w-full px-3 py-2 border rounded-lg text-sm outline-none transition-colors ${
          error ? "border-red-300 focus:ring-red-500" : "border-gray-300 focus:ring-teal"
        } focus:ring-2 focus:border-transparent`}
      />
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      {helper && !error && <p className="mt-1 text-xs text-gray-500">{helper}</p>}
    </div>
  );
}

interface SelectFieldProps extends BaseFieldProps {
  options: { value: string; label: string }[];
  registration: UseFormRegisterReturn;
  placeholder?: string;
}

export function SelectField({
  label,
  error,
  helper,
  required,
  options,
  registration,
  placeholder,
}: SelectFieldProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <select
        {...registration}
        className={`w-full px-3 py-2 border rounded-lg text-sm outline-none transition-colors ${
          error ? "border-red-300 focus:ring-red-500" : "border-gray-300 focus:ring-teal"
        } focus:ring-2 focus:border-transparent`}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      {helper && !error && <p className="mt-1 text-xs text-gray-500">{helper}</p>}
    </div>
  );
}

interface CheckboxFieldProps extends BaseFieldProps {
  registration: UseFormRegisterReturn;
}

export function CheckboxField({ label, error, helper, registration }: CheckboxFieldProps) {
  return (
    <div>
      <label className="flex items-center gap-3 cursor-pointer">
        <div className="relative">
          <input type="checkbox" {...registration} className="sr-only peer" />
          <div className="w-10 h-6 bg-gray-200 rounded-full peer-checked:bg-teal transition-colors" />
          <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow peer-checked:translate-x-4 transition-transform" />
        </div>
        <span className="text-sm font-medium text-gray-700">{label}</span>
      </label>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      {helper && !error && <p className="mt-1 text-xs text-gray-500">{helper}</p>}
    </div>
  );
}

interface TagsFieldProps extends BaseFieldProps {
  value: string[];
  onChange: (tags: string[]) => void;
}

export function TagsField({ label, error, helper, required, value, onChange }: TagsFieldProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const input = e.currentTarget;
      const tag = input.value.trim();
      if (tag && !value.includes(tag)) {
        onChange([...value, tag]);
      }
      input.value = "";
    }
  };

  const removeTag = (tag: string) => {
    onChange(value.filter((t) => t !== tag));
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="flex flex-wrap gap-2 mb-2">
        {value.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full"
          >
            {tag}
            <button type="button" onClick={() => removeTag(tag)} className="text-gray-400 hover:text-red-500">
              &times;
            </button>
          </span>
        ))}
      </div>
      <input
        type="text"
        placeholder="Type and press Enter"
        onKeyDown={handleKeyDown}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-teal focus:border-transparent"
      />
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      {helper && !error && <p className="mt-1 text-xs text-gray-500">{helper}</p>}
    </div>
  );
}
