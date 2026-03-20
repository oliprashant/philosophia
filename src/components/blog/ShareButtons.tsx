'use client';
// src/components/blog/ShareButtons.tsx
import { useState } from 'react';
import { Share2, Twitter, Facebook, Linkedin, Link2, Check } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ShareButtons({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = useState(false);
  const encoded = { url: encodeURIComponent(url), title: encodeURIComponent(title) };

  const links = [
    { icon: Twitter,  label: 'Twitter',  href: `https://twitter.com/intent/tweet?text=${encoded.title}&url=${encoded.url}` },
    { icon: Facebook, label: 'Facebook', href: `https://www.facebook.com/sharer/sharer.php?u=${encoded.url}` },
    { icon: Linkedin, label: 'LinkedIn', href: `https://www.linkedin.com/shareArticle?mini=true&url=${encoded.url}&title=${encoded.title}` },
  ];

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success('Link copied!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Could not copy link');
    }
  };

  return (
    <div className="flex items-center gap-2" aria-label="Share buttons">
      <span className="text-xs font-sans text-[var(--text-faint)] mr-1 flex items-center gap-1">
        <Share2 size={12} /> Share
      </span>
      {links.map(({ icon: Icon, label, href }) => (
        <a
          key={label}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Share on ${label}`}
          className="w-8 h-8 flex items-center justify-center border border-[var(--border)] text-[var(--text-faint)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors"
        >
          <Icon size={13} />
        </a>
      ))}
      <button
        onClick={copyLink}
        aria-label="Copy link"
        className="w-8 h-8 flex items-center justify-center border border-[var(--border)] text-[var(--text-faint)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors"
      >
        {copied ? <Check size={13} className="text-green-500" /> : <Link2 size={13} />}
      </button>
    </div>
  );
}
