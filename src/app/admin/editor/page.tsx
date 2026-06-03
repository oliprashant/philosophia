'use client';

export const dynamic = 'force-dynamic';

import { Suspense, useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Highlight from '@tiptap/extension-highlight';
import Underline from '@tiptap/extension-underline';
import { Node, mergeAttributes } from '@tiptap/core';
import { NodeSelection } from '@tiptap/pm/state';
import {
  Bold, Italic, UnderlineIcon, Strikethrough, Code,
  Heading2, Heading3, List, ListOrdered, Quote,
  Image as ImageIcon, Save, Eye, Loader2, Upload,
  AlignLeft, AlignCenter, AlignRight, X, ExternalLink
} from 'lucide-react';
import toast from 'react-hot-toast';
import PostPreviewArticle from '@/components/blog/PostPreviewArticle';

const GENRES = ['ESSAY', 'DIALOGUE', 'POEM', 'APHORISM', 'LETTER', 'REVIEW', 'INTERVIEW'];

const DEFAULT_IMAGE_STYLE = 'width: 100%; max-width: 100%; height: auto;';

const ALIGNMENT_CLASSES = {
  left: 'float-left mr-4 rounded',
  center: 'mx-auto block rounded',
  right: 'float-right ml-4 rounded',
} as const;

const ClearBoth = Node.create({
  name: 'clearBoth',
  group: 'block',
  atom: true,
  selectable: false,
  draggable: false,

  parseHTML() {
    return [{ tag: 'div[data-clear="both"]' }];
  },

  renderHTML() {
    return ['div', { 'data-clear': 'both', class: 'tiptap-clear', style: 'clear: both;' }];
  },
});

const TiptapImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      class: {
        default: ALIGNMENT_CLASSES.center,
      },
      style: {
        default: DEFAULT_IMAGE_STYLE,
      },
    };
  },

  renderHTML({ HTMLAttributes }) {
    return ['img', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes)];
  },
});

function extractImageWidth(style?: string | null): number {
  if (!style) return 100;
  const match = style.match(/width:\s*(\d+)%/i);
  if (!match) return 100;
  const width = Number(match[1]);
  if ([25, 50, 75, 100].includes(width)) return width;
  return 100;
}

function buildImageStyle(widthPercent: number): string {
  return `width: ${widthPercent}%; max-width: 100%; height: auto;`;
}

// Toolbar button component
function TBtn({ onClick, active, disabled, children, title }: {
  onClick: () => void; active?: boolean; disabled?: boolean;
  children: React.ReactNode; title?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`p-1.5 rounded text-sm transition-colors ${
        active
          ? 'bg-[var(--accent)] text-white'
          : 'text-[var(--text-muted)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]'
      } disabled:opacity-30`}
    >
      {children}
    </button>
  );
}

// The actual editor component that uses useSearchParams
function EditorWithSearchParams() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('id');

  // State
  const [title, setTitle] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [slug, setSlug] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [coverAlt, setCoverAlt] = useState('');
  const [genre, setGenre] = useState('ESSAY');
  const [status, setStatus] = useState<'DRAFT' | 'PUBLISHED' | 'ARCHIVED'>('DRAFT');
  const [categoryId, setCategoryId] = useState('');
  const [humourId, setHumourId] = useState('');
  const [published, setPublished] = useState(false);
  const [featured, setFeatured] = useState(false);
  const [updatedAt, setUpdatedAt] = useState('');
  const [categories, setCategories] = useState<any[]>([]);
  const [humours, setHumours] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [selectedImagePos, setSelectedImagePos] = useState<number | null>(null);
  const [imageWidth, setImageWidth] = useState<number>(100);
  const [imageOverlay, setImageOverlay] = useState<{ top: number; left: number } | null>(null);
  const editorWrapRef = useRef<HTMLDivElement>(null);
  const draftKey = `philosophia-admin-editor:${editId || 'new'}`;

  // TipTap editor
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: 'Begin writing your essay…' }),
      TiptapImage.configure({ HTMLAttributes: { class: ALIGNMENT_CLASSES.center, style: DEFAULT_IMAGE_STYLE } }),
      ClearBoth,
      Link.configure({ openOnClick: false }),
      Highlight,
      Underline,
    ],
    editorProps: { attributes: { class: 'ProseMirror outline-none min-h-[500px]' } },
  });

  // Fetch categories and humours
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
    fetch(`/api/admin/posts/${editId}`)
      .then(r => r.json())
      .then(post => {
        setTitle(post.title ?? '');
        setExcerpt(post.excerpt ?? '');
        setSlug(post.slug ?? '');
        setCoverImage(post.coverImage ?? '');
        setCoverAlt(post.coverAlt ?? '');
        setGenre(post.genre ?? 'ESSAY');
        setStatus(post.status ?? (post.published ? 'PUBLISHED' : 'DRAFT'));
        setCategoryId(post.category?.id ?? '');
        setHumourId(post.humour?.id ?? '');
        setPublished(post.published ?? false);
        setFeatured(post.featured ?? false);
        setUpdatedAt(post.updatedAt ?? '');
        editor.commands.setContent(post.content ?? '');
      });
  }, [editId, editor]);

  useEffect(() => {
    if (editId) return;

    try {
      const saved = localStorage.getItem(draftKey);
      if (!saved) return;
      const draft = JSON.parse(saved) as {
        title?: string;
        excerpt?: string;
        slug?: string;
        coverImage?: string;
        coverAlt?: string;
        genre?: string;
        status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
        categoryId?: string;
        humourId?: string;
        published?: boolean;
        featured?: boolean;
        content?: string;
      };

      setTitle(draft.title || '');
      setExcerpt(draft.excerpt || '');
      setSlug(draft.slug || '');
      setCoverImage(draft.coverImage || '');
      setCoverAlt(draft.coverAlt || '');
      setGenre((draft.genre as typeof genre) || 'ESSAY');
      setStatus(draft.status || 'DRAFT');
      setCategoryId(draft.categoryId || '');
      setHumourId(draft.humourId || '');
      setPublished(Boolean(draft.published));
      setFeatured(Boolean(draft.featured));
      if (draft.content) editor?.commands.setContent(draft.content);
    } catch {
      // Ignore malformed draft payloads.
    }
  }, [draftKey, editId, editor]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      if (editId) return;

      localStorage.setItem(
        draftKey,
        JSON.stringify({
          title,
          excerpt,
          slug,
          coverImage,
          coverAlt,
          genre,
          status,
          categoryId,
          humourId,
          published,
          featured,
          content: editor?.getHTML() || '',
        })
      );
    }, 30000);

    return () => window.clearInterval(timer);
  }, [draftKey, editId, title, excerpt, slug, coverImage, coverAlt, genre, status, categoryId, humourId, published, featured, editor]);

  // Upload cover image directly to Cloudinary (unsigned)
  const uploadCover = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'cover');

      const res = await fetch('/api/upload/image', { method: 'POST', body: formData });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error?.message || 'Upload failed');
      }
      const data = await res.json();
      setCoverImage(data.url);
      toast.success('Cover image uploaded');
    } catch (err: any) {
      toast.error(err?.message || 'Upload failed');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  // Insert inline image into editor (unsigned Cloudinary upload)
  const insertImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editor) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'inline');

      const res = await fetch('/api/upload/image', { method: 'POST', body: formData });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error?.message || 'Upload failed');
      }
      const data = await res.json();

      // Insert into editor with secure_url from Cloudinary
      editor
        .chain()
        .focus()
        .setImage({
          src: data.url,
          alt: '',
          class: ALIGNMENT_CLASSES.center,
          style: DEFAULT_IMAGE_STYLE,
        })
        .insertContent('<p></p>')
        .focus('end')
        .run();

      toast.success('Image inserted');
    } catch (err: any) {
      toast.error(err?.message || 'Upload failed');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const ensureClearAfterImage = (imagePos: number) => {
    if (!editor) return;
    const imageNode = editor.state.doc.nodeAt(imagePos);
    if (!imageNode) return;
    const insertPos = imagePos + imageNode.nodeSize;
    const nextNode = editor.state.doc.nodeAt(insertPos);
    if (nextNode?.type.name === 'clearBoth') return;
    editor.chain().insertContentAt(insertPos, { type: 'clearBoth' }).run();
  };

  const applyImageAlignment = (align: keyof typeof ALIGNMENT_CLASSES) => {
    if (!editor || selectedImagePos === null) return;
    editor.chain().focus().setNodeSelection(selectedImagePos).updateAttributes('image', {
      class: ALIGNMENT_CLASSES[align],
    }).run();
    if (align === 'left' || align === 'right') {
      ensureClearAfterImage(selectedImagePos);
    }
  };

  const applyImageWidth = (nextWidth: number) => {
    if (!editor || selectedImagePos === null) return;
    setImageWidth(nextWidth);
    editor.chain().focus().setNodeSelection(selectedImagePos).updateAttributes('image', {
      style: buildImageStyle(nextWidth),
    }).run();
  };

  const deleteSelectedImage = () => {
    if (!editor || selectedImagePos === null) return;
    editor.chain().focus().setNodeSelection(selectedImagePos).deleteSelection().run();
  };

  const readJsonResponse = async (response: Response) => {
    const text = await response.text();
    if (!text) return null;

    try {
      return JSON.parse(text) as any;
    } catch {
      return { error: text };
    }
  };

  const previewPost = {
    title,
    excerpt: excerpt || null,
    content: editor?.getHTML() || '',
    coverImage: coverImage || null,
    coverAlt: coverAlt || null,
    featured,
    publishedAt: status === 'PUBLISHED' ? (updatedAt || new Date().toISOString()) : null,
    createdAt: updatedAt || new Date().toISOString(),
    author: {
      name: 'Admin',
      image: null,
    },
    readingTime: Math.max(1, Math.round((editor?.getText().trim() || '').split(/\s+/).filter(Boolean).length / 200)) || 1,
  };

  useEffect(() => {
    if (!editor) return;

    const updateImageSelectionState = () => {
      const { selection } = editor.state;
      if (selection instanceof NodeSelection && selection.node.type.name === 'image') {
        const attrs = selection.node.attrs as { style?: string };
        const container = editorWrapRef.current;
        if (!container) return;
        const coords = editor.view.coordsAtPos(selection.from);
        const bounds = container.getBoundingClientRect();
        setSelectedImagePos(selection.from);
        setImageWidth(extractImageWidth(attrs.style));
        setImageOverlay({
          top: coords.top - bounds.top + container.scrollTop + 6,
          left: coords.right - bounds.left + container.scrollLeft - 150,
        });
        return;
      }

      setSelectedImagePos(null);
      setImageOverlay(null);
    };

    updateImageSelectionState();
    editor.on('selectionUpdate', updateImageSelectionState);
    editor.on('transaction', updateImageSelectionState);

    return () => {
      editor.off('selectionUpdate', updateImageSelectionState);
      editor.off('transaction', updateImageSelectionState);
    };
  }, [editor]);

  // Save post (draft or publish)
  const save = async (publishNow?: boolean) => {
    if (!title.trim()) {
      toast.error('Title is required');
      return;
    }
    if (!editor?.getText().trim()) {
      toast.error('Content is required');
      return;
    }
    setSaving(true);
    const nextStatus = publishNow ? 'PUBLISHED' : status;
    const body = {
      title,
      excerpt,
      slug,
      content: editor.getHTML(),
      coverImage: coverImage || undefined,
      coverAlt: coverAlt || undefined,
      genre,
      status: nextStatus,
      categoryId: categoryId || 'None',
      humourId: humourId || undefined,
      published: nextStatus === 'PUBLISHED',
      featured,
    };
    try {
      const endpoint = editId && publishNow ? `/api/posts/${editId}/publish` : editId ? '/api/admin/posts/' + editId : '/api/admin/posts';
      const method = editId && publishNow ? 'PATCH' : editId ? 'PUT' : 'POST';
      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await readJsonResponse(res);
      if (!res.ok) {
        throw new Error(data?.error || 'Save failed');
      }
      const post = data;
      toast.success(editId ? 'Post updated!' : 'Post created!');
      localStorage.removeItem(draftKey);
      if (nextStatus === 'PUBLISHED') {
        const nextSlug = post?.slug || slug || title.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
        if (nextSlug) {
          router.push(`/blog/${nextSlug}`);
          return;
        }
      }

      if (!editId) router.push(`/admin/editor?id=${post.id}`);
    } catch (err: any) {
      toast.error(err?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const SELECT_CLS = "w-full px-3 py-2 text-sm font-sans bg-[var(--bg-secondary)] border border-[var(--border)] focus:outline-none focus:border-[var(--accent)] transition-colors";

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="section-title">{editId ? 'Edit Post' : 'New Post'}</h1>
        <div className="flex items-center gap-3">
          {editId && updatedAt && status === 'PUBLISHED' && (
            <span className="text-xs font-sans text-[var(--text-faint)]">
              Last updated on {new Date(updatedAt).toLocaleDateString()}
            </span>
          )}
          <button
            type="button"
            onClick={() => setPreviewOpen(true)}
            className="flex items-center gap-2 px-5 py-2 text-sm font-sans font-medium bg-[var(--bg-secondary)] border border-[var(--border)] hover:border-[var(--accent)] transition-colors"
          >
            <Eye size={14} /> Preview
          </button>
          <button
            onClick={() => save()}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2 text-sm font-sans font-medium bg-[var(--bg-secondary)] border border-[var(--border)] hover:border-[var(--accent)] transition-colors disabled:opacity-50"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            Save Draft
          </button>
          {status !== 'PUBLISHED' && (
            <button
              onClick={() => save(true)}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2 text-sm font-sans font-medium bg-[var(--text-primary)] text-[var(--bg-primary)] hover:bg-[var(--accent)] transition-colors disabled:opacity-50"
            >
              Publish
            </button>
          )}
        </div>
      </div>

      {previewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 py-8">
          <div className="relative w-full max-w-6xl max-h-[92vh] overflow-hidden rounded border border-[var(--border)] bg-[var(--bg-primary)] shadow-2xl">
            <div className="flex items-center justify-between border-b border-[var(--border)] bg-[var(--bg-secondary)] px-4 py-3">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-[var(--text-faint)]">Live Preview</p>
                <p className="text-sm text-[var(--text-muted)]">Unsaved changes only</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPreviewOpen(false)}
                  className="inline-flex items-center gap-2 rounded-sm border border-[var(--border)] px-3 py-2 text-sm text-[var(--text-primary)] transition-colors hover:border-[var(--accent)]"
                >
                  <X size={14} /> Close
                </button>
                {slug ? (
                  <button
                    type="button"
                    onClick={() => window.open(`/blog/${slug}`, '_blank', 'noopener,noreferrer')}
                    className="inline-flex items-center gap-2 rounded-sm bg-[var(--text-primary)] px-3 py-2 text-sm text-[var(--bg-primary)] transition-colors hover:bg-[var(--accent)]"
                  >
                    <ExternalLink size={14} /> Open live
                  </button>
                ) : null}
              </div>
            </div>

            <div className="max-h-[calc(92vh-57px)] overflow-y-auto">
              <PostPreviewArticle post={previewPost} />
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main editing area */}
        <div className="lg:col-span-2 space-y-4">
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Post title…"
            className="w-full px-4 py-3 text-2xl font-bold bg-transparent border-b-2 border-[var(--border)] focus:outline-none focus:border-[var(--accent)] transition-colors"
            style={{ fontFamily: 'var(--font-cormorant)' }}
          />
          <input
            type="text"
            value={slug}
            onChange={e => setSlug(e.target.value)}
            placeholder="post-slug"
            className="w-full px-4 py-2 text-sm font-sans bg-[var(--bg-secondary)] border border-[var(--border)] focus:outline-none focus:border-[var(--accent)] transition-colors"
          />
          <textarea
            value={excerpt}
            onChange={e => setExcerpt(e.target.value)}
            placeholder="Short excerpt (shown in cards and SEO)…"
            rows={2}
            className="w-full px-4 py-3 text-sm font-sans bg-[var(--bg-secondary)] border border-[var(--border)] focus:outline-none focus:border-[var(--accent)] resize-none transition-colors"
          />

          {/* TipTap editor */}
          <div
            ref={editorWrapRef}
            className="border border-[var(--border)] focus-within:border-[var(--accent)] transition-colors relative"
          >
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
              <TBtn
                onClick={() => applyImageAlignment('left')}
                active={!!editor?.isActive('image', { class: ALIGNMENT_CLASSES.left })}
                disabled={selectedImagePos === null}
                title="Align image left"
              >
                <AlignLeft size={14} />
              </TBtn>
              <TBtn
                onClick={() => applyImageAlignment('center')}
                active={!!editor?.isActive('image', { class: ALIGNMENT_CLASSES.center })}
                disabled={selectedImagePos === null}
                title="Align image center"
              >
                <AlignCenter size={14} />
              </TBtn>
              <TBtn
                onClick={() => applyImageAlignment('right')}
                active={!!editor?.isActive('image', { class: ALIGNMENT_CLASSES.right })}
                disabled={selectedImagePos === null}
                title="Align image right"
              >
                <AlignRight size={14} />
              </TBtn>
              <div className="w-px h-5 bg-[var(--border)] mx-1" />
              <label className="p-1.5 rounded text-[var(--text-muted)] hover:bg-[var(--bg-tertiary)] cursor-pointer" title="Insert image">
                <ImageIcon size={14} />
                <input type="file" accept="image/*" className="hidden" onChange={insertImage} />
              </label>
            </div>
            <EditorContent editor={editor} />

            {imageOverlay && selectedImagePos !== null && (
              <div
                className="absolute z-20 flex items-center gap-2 px-2 py-1.5 bg-[var(--bg-primary)] border border-[var(--border)] shadow-sm"
                style={{ top: imageOverlay.top, left: imageOverlay.left }}
              >
                <label className="text-[10px] font-sans uppercase tracking-wider text-[var(--text-faint)]">Width</label>
                <select
                  value={imageWidth}
                  onChange={e => applyImageWidth(Number(e.target.value))}
                  className="text-xs font-sans bg-[var(--bg-secondary)] border border-[var(--border)] px-1.5 py-1"
                >
                  <option value={25}>25%</option>
                  <option value={50}>50%</option>
                  <option value={75}>75%</option>
                  <option value={100}>100%</option>
                </select>
                <button
                  type="button"
                  onClick={deleteSelectedImage}
                  className="w-6 h-6 flex items-center justify-center bg-red-600 text-white hover:bg-red-700 transition-colors"
                  title="Delete image"
                  aria-label="Delete image"
                >
                  <X size={12} />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          {/* Status */}
          <div className="border border-[var(--border)] p-4">
            <h3 className="text-xs font-sans font-semibold uppercase tracking-widest text-[var(--text-faint)] mb-3">Status</h3>
            <div className="mb-3 space-y-1.5">
              <label className="block text-xs font-sans text-[var(--text-faint)]">Post status</label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as 'DRAFT' | 'PUBLISHED' | 'ARCHIVED')}
                className={SELECT_CLS}
              >
                <option value="DRAFT">Draft</option>
                <option value="PUBLISHED">Published</option>
                <option value="ARCHIVED">Archived</option>
              </select>
            </div>
            <label className="flex items-center gap-3 cursor-pointer mb-3">
              <input
                type="checkbox"
                checked={published}
                onChange={e => setPublished(e.target.checked)}
                className="w-4 h-4 accent-[var(--accent)]"
              />
              <span className="text-sm font-sans">Published</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={featured}
                onChange={e => setFeatured(e.target.checked)}
                className="w-4 h-4 accent-[var(--accent)]"
              />
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
              <input
                type="text"
                value={coverAlt}
                onChange={e => setCoverAlt(e.target.value)}
                placeholder="Alt text for accessibility…"
                className={`${SELECT_CLS} mt-2`}
              />
            )}
          </div>

          {/* Taxonomy */}
          <div className="border border-[var(--border)] p-4 space-y-3">
            <h3 className="text-xs font-sans font-semibold uppercase tracking-widest text-[var(--text-faint)]">Taxonomy</h3>
            <div>
              <label className="block text-xs font-sans text-[var(--text-faint)] mb-1">Form (Genre)</label>
              <select value={genre} onChange={e => setGenre(e.target.value)} className={SELECT_CLS}>
                {GENRES.map(g => (
                  <option key={g} value={g}>{g.charAt(0) + g.slice(1).toLowerCase()}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-sans text-[var(--text-faint)] mb-1">Category</label>
              <select value={categoryId} onChange={e => setCategoryId(e.target.value)} className={SELECT_CLS}>
                <option value="">None</option>
                {categories.map((c: any) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-sans text-[var(--text-faint)] mb-1">Humour</label>
              <select value={humourId} onChange={e => setHumourId(e.target.value)} className={SELECT_CLS}>
                <option value="">None</option>
                {humours.map((h: any) => (
                  <option key={h.id} value={h.id}>{h.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Main page component with Suspense boundary
export default function EditorPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center">Loading editor...</div>}>
      <EditorWithSearchParams />
    </Suspense>
  );
}