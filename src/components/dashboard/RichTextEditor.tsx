"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Placeholder } from "@tiptap/extensions";
import { useState } from "react";

/** Simple rich text: paragraphs, bold, italic, headings, lists, links. Writes HTML into a hidden input. */
export function RichTextEditor({ name, initialHtml, placeholder, label }: { name: string; initialHtml: string; placeholder?: string; label: string }) {
  const [html, setHtml] = useState(initialHtml);
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        code: false,
        codeBlock: false,
        link: { openOnClick: false, autolink: true, protocols: ["mailto", "tel"] },
      }),
      Placeholder.configure({ placeholder: placeholder ?? "" }),
    ],
    content: initialHtml,
    editorProps: {
      attributes: {
        class: "rich-text min-h-[260px] max-w-none px-4 py-3 focus:outline-none",
        "aria-label": label,
        role: "textbox",
        "aria-multiline": "true",
      },
    },
    onUpdate: ({ editor }) => setHtml(editor.getHTML()),
  });

  const btn = (active: boolean) =>
    `min-h-9 min-w-9 px-2 text-[14px] font-semibold ${active ? "bg-ink text-white" : "hover:bg-wash"}`;

  return (
    <div className="border-[1.5px] border-ink focus-within:ring-2 focus-within:ring-gold">
      <div className="flex flex-wrap gap-1 border-b border-line bg-paper p-1.5" role="toolbar" aria-label="Formatting">
        <button type="button" className={btn(!!editor?.isActive("bold"))} onClick={() => editor?.chain().focus().toggleBold().run()} aria-label="Bold">B</button>
        <button type="button" className={`${btn(!!editor?.isActive("italic"))} italic`} onClick={() => editor?.chain().focus().toggleItalic().run()} aria-label="Italic">I</button>
        <button type="button" className={btn(!!editor?.isActive("heading", { level: 2 }))} onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()} aria-label="Heading">H</button>
        <button type="button" className={btn(!!editor?.isActive("bulletList"))} onClick={() => editor?.chain().focus().toggleBulletList().run()} aria-label="Bulleted list">• List</button>
        <button type="button" className={btn(!!editor?.isActive("orderedList"))} onClick={() => editor?.chain().focus().toggleOrderedList().run()} aria-label="Numbered list">1. List</button>
        <button
          type="button"
          className={btn(!!editor?.isActive("link"))}
          aria-label="Link"
          onClick={() => {
            if (!editor) return;
            if (editor.isActive("link")) return void editor.chain().focus().unsetLink().run();
            const href = window.prompt("Link address (https://…)");
            if (href) editor.chain().focus().extendMarkRange("link").setLink({ href }).run();
          }}
        >
          Link
        </button>
      </div>
      <EditorContent editor={editor} />
      <input type="hidden" name={name} value={html} />
    </div>
  );
}
