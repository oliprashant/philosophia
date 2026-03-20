'use client';
export const dynamic = 'force-dynamic';
// src/app/admin/editor/page.tsx
// Rich-text post editor using TipTap. Supports create + edit modes.
// Handles image uploads, taxonomy selection, publish toggle.

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Highlight from '@tiptap/extension-highlight';
import Underline from '@tiptap/extension-underline';
import { Bold, Italic, UnderlineIcon, Strikethrough, Code, Heading2, Heading3, List, ListOrdered, Quote, Image as ImageIcon, Link as LinkIcon, Save, Eye, EyeOff, Loader2, Upload } from 'lucide-react';
import toast from 'react-hot-toast';

const GENRES = ['ESSAY','DIALOGUE','POEM','APHORISM','LETTER','REVIEW','INTERVIEW'];

// ── Toolbar button ────────────────────────────────────────────────────────────
function TBtn({ onClick, active, disabled, children, title }: {
  onClick: () => void; active?: boolean; disabled?: boolean;
  children: React.ReactNode; title?: string;
}) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} title={title}
      className={`p-1.5 rounded text-sm transition-colors ${active ? 'bg-[var(--accent)] text-white' : 'text-[var(--text-muted)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]'} disabled:opacity-30`}>
      {children}
    </button>
  );
}

export default function EditorPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('id');

  const [title, setTitle] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [coverAlt, setCoverAlt] = useState('');
  const [genre, setGenre] = useState('ESSAY');
  const [categoryId, setCategoryId] = useState('');
  const [humourId, setHumourId] = useState('');
  const [published, setPublished] = useState(false);
  const [featured, setFeatured] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [humours, setHumours] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: 'Begin writing your essay…' }),
      Image.configure({ HTMLAttributes: { class: 'mx-auto rounded max-w-full' } }),
      Link.configure({ openOnClick: false }),
      Highlight,
      Underline,
    ],
    editorProps: { attributes: { class: 'ProseMirror outline-none min-h-[500px]' } },
  });

  // Load categories and humours
  useEffect(() => {
    Promise.all([
      fetch('/api/categories').then(r => r.json()),
      fetch('/api/humours').then(r => r.json()),
    ]).then(([cats, hums]) => {
      setCategories(cats.categories ?? []);
      setHumours(hums.humours ?? []);
    }).catch(() => {});
  }, []);

  // Load existing post if editing
  useEffect(() => {
    if (!editId || !editor) return;
    fetch(`/api/posts/${editId}`).then(r => r.json()).then(post => {
      setTitle(post.title ?? '');
      setExcerpt(post.excerpt ?? '');
      setCoverImage(post.coverImage ?? '');
      setCoverAlt(post.coverAlt ?? '');
      setGenre(post.genre ?? 'ESSAY');
      setCategoryId(post.category?.id ?? '');
      setHumourId(post.humour?.id ?? '');
      setPublished(post.published ?? false);
      setFeatured(post.featured ?? false);
      editor.commands.setContent(post.content ?? '');
    });
  }, [editId, editor]);

  // Cover image upload
  const uploadCover = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    fd.append('type', 'cover');
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setCoverImage(data.url);
      toast.success('Cover image uploaded');
    } catch { toast.error('Upload failed'); }
    finally { setUploading(false); }
  };

  // Inline image insert into editor
  const insertImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editor) return;
    const fd = new FormData();
    fd.append('file', file);
    fd.append('type', 'inline');
    const res = await fetch('/api/upload', { method: 'POST', body: fd });
    if (res.ok) {
      const data = await res.json();
      editor.chain().focus().setImage({ src: data.url, alt: '' }).run();
    }
  };

  const save = async (publishNow?: boolean) => {
    if (!title.trim()) { toast.error('Title is required'); return; }
    if (!editor?.getText().trim()) { toast.error('Content is required'); return; }
    setSaving(true);
    const body = {
      title, excerpt, content: editor.getHTML(),
      coverImage: coverImage || undefined,
      coverAlt: coverAlt || undefined,
      genre, categoryId: categoryId || undefined,
      humourId: humourId || undefined,
      published: publishNow ?? published,
      featured,
    };
    try {
      const res = await fetch(editId ? `/api/posts/${editId}` : '/api/posts', {
        method: editId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      const post = await res.json();
      toast.success(editId ? 'Post updated!' : 'Post created!');
      if (!editId) router.push(`/admin/editor?id=${post.id}`);
    } catch (err: any) { toast.error(err.message || 'Save failed'); }
    finally { setSaving(false); }
  };

  const SELECT_CLS = "w-full px-3 py-2 text-sm font-sans bg-[var(--bg-secondary)] border border-[var(--border)] focus:outline-none focus:border-[var(--accent)] transition-colors";

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="section-title">{editId ? 'Edit Post' : 'New Post'}</h1>
        <div className="flex items-center gap-3">
          {editId && published && (
            <a href={`/blog/${editId}`} target="_blank"
              className="flex items-center gap-1.5 text-sm font-sans text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors">
              <Eye size={15} /> Preview
            </a>
          )}
          <button onClick={() => save()} disabled={saving}
            className="flex items-center gap-2 px-5 py-2 text-sm font-sans font-medium bg-[var(--bg-secondary)] border border-[var(--border)] hover:border-[var(--accent)] transition-colors disabled:opacity-50">
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            Save Draft
          </button>
          {!published && (
            <button onClick={() => save(true)} disabled={saving}
              className="flex items-center gap-2 px-5 py-2 text-sm font-sans font-medium bg-[var(--text-primary)] text-[var(--bg-primary)] hover:bg-[var(--accent)] transition-colors disabled:opacity-50">
              Publish
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main editing area */}
        <div className="lg:col-span-2 space-y-4">
          <input
            type="text" value={title} onChange={e => setTitle(e.target.value)}
            placeholder="Post title…"
            className="w-full px-4 py-3 text-2xl font-bold bg-transparent border-b-2 border-[var(--border)] focus:outline-none focus:border-[var(--accent)] transition-colors"
            style={{ fontFamily: 'var(--font-cormorant)' }}
          />
          <textarea
            value={excerpt} onChange={e => setExcerpt(e.target.value)}
            placeholder="Short excerpt (shown in cards and SEO)…"
            rows={2}
            className="w-full px-4 py-3 text-sm font-sans bg-[var(--bg-secondary)] border border-[var(--border)] focus:outline-none focus:border-[var(--accent)] resize-none transition-colors"
          />

          {/* TipTap editor */}
          <div className="border border-[var(--border)] focus-within:border-[var(--accent)] transition-colors">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-0.5 p-2 border-b border-[var(--border)] bg-[var(--bg-secondary)]">
              <TBtn onClick={() => editor?.chain().focus().toggleBold().run()} active={editor?.isActive('bold')} title="Bold"><Bold size={14} /></TBtn>
              <TBtn onClick={() => editor?.chain().focus().toggleItalic().run()} active={editor?.isActive('italic')} title="Italic"><Italic size={14} /></TBtn>
              <TBtn onClick={() => editor?.chain().focus().toggleUnderline().run()} active={editor?.isActive('underline')} title="Underline"><UnderlineIcon size={14} /></TBtn>
              <TBtn onClick={() => editor?.chain().focus().toggleStrike().run()} active={editor?.isActive('strike')} title="Strikethrough"><Strikethrough size={14} /></TBtn>
              <div className="w-px h-5 bg-[var(--border)] mx-1" />
              <TBtn onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()} active={editor?.isActive('heading', { level: 2 })} title="Heading 2"><Heading2 size={14} /></TBtn>
              <TBtn onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()} active={editor?.isActive('heading', { level: 3 })} title="Heading 3"><Heading3 size={14} /></TBtn>
              <div className="w-px h-5 bg-[var(--border)] mx-1" />
              <TBtn onClick={() => editor?.chain().focus().toggleBulletList().run()} active={editor?.isActive('bulletList')} title="Bullet list"><List size={14} /></TBtn>
              <TBtn onClick={() => editor?.chain().focus().toggleOrderedList().run()} active={editor?.isActive('orderedList')} title="Numbered list"><ListOrdered size={14} /></TBtn>
              <TBtn onClick={() => editor?.chain().focus().toggleBlockquote().run()} active={editor?.isActive('blockquote')} title="Blockquote"><Quote size={14} /></TBtn>
              <TBtn onClick={() => editor?.chain().focus().toggleCode().run()} active={editor?.isActive('code')} title="Code"><Code size={14} /></TBtn>
              <div className="w-px h-5 bg-[var(--border)] mx-1" />
              {/* Inline image upload */}
              <label className="p-1.5 rounded text-[var(--text-muted)] hover:bg-[var(--bg-tertiary)] cursor-pointer" title="Insert image">
                <ImageIcon size={14} />
                <input type="file" accept="image/*" className="hidden" onChange={insertImage} />
              </label>
            </div>
            <EditorContent editor={editor} />
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          {/* Status */}
          <div className="border border-[var(--border)] p-4">
            <h3 className="text-xs font-sans font-semibold uppercase tracking-widest text-[var(--text-faint)] mb-3">Status</h3>
            <label className="flex items-center gap-3 cursor-pointer mb-3">
              <input type="checkbox" checked={published} onChange={e => setPublished(e.target.checked)} className="w-4 h-4 accent-[var(--accent)]" />
              <span className="text-sm font-sans">Published</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={featured} onChange={e => setFeatured(e.target.checked)} className="w-4 h-4 accent-[var(--accent)]" />
              <span className="text-sm font-sans">Featured (Homepage)</span>
            </label>
          </div>

          {/* Cover image */}
          <div className="border border-[var(--border)] p-4">
            <h3 className="text-xs font-sans font-semibold uppercase tracking-widest text-[var(--text-faint)] mb-3">Cover Image</h3>
            {coverImage && (
              <div className="mb-3 relative aspect-video rounded overflow-hidden bg-[var(--bg-tertiary)]">
                <img src={coverImage} alt={coverAlt || 'Cover'} className="w-full h-full object-cover" />
              </div>
            )}
            <label className="flex items-center gap-2 px-3 py-2 text-sm font-sans border border-[var(--border)] hover:border-[var(--accent)] cursor-pointer transition-colors text-[var(--text-muted)] hover:text-[var(--accent)]">
              {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
              {coverImage ? 'Replace image' : 'Upload cover'}
              <input type="file" accept="image/*" className="hidden" onChange={uploadCover} disabled={uploading} />
            </label>
            {coverImage && (
              <input type="text" value={coverAlt} onChange={e => setCoverAlt(e.target.value)}
                placeholder="Alt text for accessibility…" className={`${SELECT_CLS} mt-2`} />
            )}
          </div>

          {/* Taxonomy */}
          <div className="border border-[var(--border)] p-4 space-y-3">
            <h3 className="text-xs font-sans font-semibold uppercase tracking-widest text-[var(--text-faint)]">Taxonomy</h3>
            <div>
              <label className="block text-xs font-sans text-[var(--text-faint)] mb-1">Form (Genre)</label>
              <select value={genre} onChange={e => setGenre(e.target.value)} className={SELECT_CLS}>
                {GENRES.map(g => <option key={g} value={g}>{g.charAt(0) + g.slice(1).toLowerCase()}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-sans text-[var(--text-faint)] mb-1">Category</label>
              <select value={categoryId} onChange={e => setCategoryId(e.target.value)} className={SELECT_CLS}>
                <option value="">None</option>
                {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-sans text-[var(--text-faint)] mb-1">Humour</label>
              <select value={humourId} onChange={e => setHumourId(e.target.value)} className={SELECT_CLS}>
                <option value="">None</option>
                {humours.map((h: any) => <option key={h.id} value={h.id}>{h.name}</option>)}
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
