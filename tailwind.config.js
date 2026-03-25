/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  darkMode: 'class',
  theme: {
    extend: {
      // ── Custom brand fonts ──────────────────────────────────────────────────
      fontFamily: {
        // Display / Headings: Cormorant Garamond – aristocratic, literary
        display: ['var(--font-cormorant)', 'Georgia', 'serif'],
        // Body text: Lora – warm, highly readable serif
        body: ['var(--font-lora)', 'Georgia', 'serif'],
        // UI elements / captions: DM Sans – modern clarity
        sans: ['var(--font-dm-sans)', 'system-ui', 'sans-serif'],
        // Monospace: JetBrains Mono for code blocks
        mono: ['var(--font-jetbrains)', 'monospace'],
      },

      // ── Color Palette ────────────────────────────────────────────────────────
      colors: {
        // Parchment base
        parchment: {
          50: '#FDFAF5',
          100: '#F9F3E8',
          200: '#F2E8D0',
          300: '#E8D5B0',
          400: '#D4B896',
        },
        // Ink
        ink: {
          DEFAULT: '#1A1208',
          light: '#2D2215',
          muted: '#5C4F3A',
          faint: '#8C7B65',
        },
        // Brand accent – deep burgundy
        burgundy: {
          DEFAULT: '#6B1E3C',
          light: '#8B2E52',
          dark: '#4A1128',
          glow: '#9B2E52',
        },
        // Gold accent
        gold: {
          DEFAULT: '#C9A84C',
          light: '#E0BE74',
          dark: '#A07830',
        },
        // Humour taxonomy colors
        humour: {
          melancholic: '#2C3E50',
          sanguine: '#C0392B',
          choleric: '#E67E22',
          phlegmatic: '#27AE60',
        },
      },

      // ── Typography scale ─────────────────────────────────────────────────────
      fontSize: {
        'reading': ['1.125rem', { lineHeight: '1.9', letterSpacing: '0.01em' }],
        'reading-lg': ['1.25rem', { lineHeight: '2', letterSpacing: '0.01em' }],
      },

      // ── Spacing ───────────────────────────────────────────────────────────────
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
        '26': '6.5rem',
        '30': '7.5rem',
        '34': '8.5rem',
      },

      // ── Animation ─────────────────────────────────────────────────────────────
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'slide-down': 'slideDown 0.4s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'ink-spread': 'inkSpread 0.6s ease-out forwards',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp: { '0%': { opacity: '0', transform: 'translateY(16px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        slideDown: { '0%': { opacity: '0', transform: 'translateY(-16px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        float: { '0%, 100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-8px)' } },
        inkSpread: { '0%': { clipPath: 'circle(0% at 50% 50%)' }, '100%': { clipPath: 'circle(150% at 50% 50%)' } },
      },

      // ── Box Shadows ───────────────────────────────────────────────────────────
      boxShadow: {
        'editorial': '0 2px 0 0 #1A1208',
        'editorial-lg': '4px 4px 0 0 #1A1208',
        'glow-burgundy': '0 0 40px rgba(107, 30, 60, 0.3)',
        'card': '0 1px 3px rgba(26, 18, 8, 0.08), 0 4px 12px rgba(26, 18, 8, 0.05)',
        'card-hover': '0 4px 16px rgba(26, 18, 8, 0.12), 0 8px 32px rgba(26, 18, 8, 0.08)',
      },

      // ── Prose ─────────────────────────────────────────────────────────────────
      typography: ({ theme }) => ({
        philosophia: {
          css: {
            '--tw-prose-body': theme('colors.ink.DEFAULT'),
            '--tw-prose-headings': theme('colors.ink.DEFAULT'),
            '--tw-prose-links': theme('colors.burgundy.DEFAULT'),
            '--tw-prose-bold': theme('colors.ink.DEFAULT'),
            '--tw-prose-counters': theme('colors.ink.muted'),
            '--tw-prose-bullets': theme('colors.gold.DEFAULT'),
            '--tw-prose-hr': theme('colors.parchment[300]'),
            '--tw-prose-quotes': theme('colors.ink.muted'),
            '--tw-prose-quote-borders': theme('colors.burgundy.DEFAULT'),
            '--tw-prose-code': theme('colors.burgundy.DEFAULT'),
            '--tw-prose-pre-bg': theme('colors.ink.DEFAULT'),

            // Dark-mode prose tokens used by `prose-invert`
            '--tw-prose-invert-body': theme('colors.parchment[200]'),
            '--tw-prose-invert-headings': theme('colors.parchment[100]'),
            '--tw-prose-invert-links': theme('colors.gold.light'),
            '--tw-prose-invert-bold': theme('colors.parchment[100]'),
            '--tw-prose-invert-counters': theme('colors.parchment[300]'),
            '--tw-prose-invert-bullets': theme('colors.gold.DEFAULT'),
            '--tw-prose-invert-hr': theme('colors.ink.light'),
            '--tw-prose-invert-quotes': theme('colors.parchment[200]'),
            '--tw-prose-invert-quote-borders': theme('colors.burgundy.light'),
            '--tw-prose-invert-code': theme('colors.gold.light'),
            '--tw-prose-invert-pre-bg': theme('colors.ink.light'),

            maxWidth: '68ch',
            fontSize: '1.0625rem',
            lineHeight: '1.85',
            'h1, h2, h3, h4': { fontFamily: theme('fontFamily.display').join(', ') },
            'h2': { fontSize: '1.75rem', fontWeight: '700', marginTop: '2em' },
            'h3': { fontSize: '1.375rem', fontWeight: '600' },
            'p': { marginBottom: '1.5em' },
            'blockquote': { fontStyle: 'italic', borderLeftWidth: '3px', paddingLeft: '1.5em', fontFamily: theme('fontFamily.display').join(', '), fontSize: '1.125em' },
            'a': { textDecorationThickness: '1px', textUnderlineOffset: '3px', '&:hover': { color: theme('colors.burgundy.light') } },
          },
        },
      }),
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
};
