"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import { useCallback, useEffect } from "react";
import {
  FiBold,
  FiItalic,
  FiList,
  FiLink,
  FiMinus,
} from "react-icons/fi";

interface RichTextFieldProps {
  label: string;
  value: string;
  onChange: (html: string) => void;
  error?: string;
  helper?: string;
  required?: boolean;
}

interface ToolbarButtonProps {
  onClick: () => void;
  isActive?: boolean;
  title: string;
  children: React.ReactNode;
}

function ToolbarButton({ onClick, isActive, title, children }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`p-1.5 rounded transition-colors ${
        isActive
          ? "bg-teal text-white"
          : "text-gray-600 hover:bg-gray-100 hover:text-gray-800"
      }`}
    >
      {children}
    </button>
  );
}

function ToolbarDivider() {
  return <div className="w-px h-5 bg-gray-200 mx-1" />;
}

export function RichTextField({
  label,
  value,
  onChange,
  error,
  helper,
  required,
}: RichTextFieldProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        defaultProtocol: "https",
      }),
    ],
    content: value || "",
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: "tiptap-content focus:outline-none min-h-[120px] px-3 py-2 text-sm",
      },
    },
  });

  // Sync external value changes (form reset, loading edit data)
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value || "", { emitUpdate: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const setLink = useCallback(() => {
    if (!editor) return;
    const previousUrl = editor.getAttributes("link").href;
    const url = window.prompt("Enter URL:", previousUrl || "https://");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }, [editor]);

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>

      <div
        className={`border rounded-lg overflow-hidden transition-colors ${
          error
            ? "border-red-300"
            : "border-gray-300 focus-within:ring-2 focus-within:ring-teal focus-within:border-transparent"
        }`}
      >
        {editor && (
          <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-gray-200 bg-gray-50 flex-wrap">
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleBold().run()}
              isActive={editor.isActive("bold")}
              title="Bold"
            >
              <FiBold className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleItalic().run()}
              isActive={editor.isActive("italic")}
              title="Italic"
            >
              <FiItalic className="w-4 h-4" />
            </ToolbarButton>

            <ToolbarDivider />

            <ToolbarButton
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
              isActive={editor.isActive("heading", { level: 2 })}
              title="Heading 2"
            >
              <span className="text-xs font-bold">H2</span>
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
              isActive={editor.isActive("heading", { level: 3 })}
              title="Heading 3"
            >
              <span className="text-xs font-bold">H3</span>
            </ToolbarButton>

            <ToolbarDivider />

            <ToolbarButton
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              isActive={editor.isActive("bulletList")}
              title="Bullet List"
            >
              <FiList className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              isActive={editor.isActive("orderedList")}
              title="Ordered List"
            >
              <span className="text-xs font-bold">1.</span>
            </ToolbarButton>

            <ToolbarDivider />

            <ToolbarButton
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
              isActive={editor.isActive("blockquote")}
              title="Blockquote"
            >
              <span className="text-sm font-serif leading-none">&ldquo;</span>
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().setHorizontalRule().run()}
              title="Horizontal Rule"
            >
              <FiMinus className="w-4 h-4" />
            </ToolbarButton>

            <ToolbarDivider />

            <ToolbarButton
              onClick={setLink}
              isActive={editor.isActive("link")}
              title="Insert Link"
            >
              <FiLink className="w-4 h-4" />
            </ToolbarButton>
          </div>
        )}

        <EditorContent editor={editor} />
      </div>

      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      {helper && !error && <p className="mt-1 text-xs text-gray-500">{helper}</p>}
    </div>
  );
}
