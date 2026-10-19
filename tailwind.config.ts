import type { Config } from 'tailwindcss'

/**
 * Token desain "Arena Holografis" — PRD §9 & §10.
 * Semua warna dirujuk lewat CSS variable (src/styles/tokens.css) supaya
 * Tema Papan Tulis dan mode kontras tinggi bisa menimpa tanpa mengubah komponen.
 */
const config: Config = {
  content: ['./src/**/*.{ts,tsx}', './content/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          void: 'var(--bg-void)',
          surface: 'var(--bg-surface)',
          raised: 'var(--bg-raised)',
          glass: 'var(--bg-glass)',
        },
        line: { court: 'var(--line-court)', hairline: 'var(--line-hairline)' },
        text: {
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          inverse: 'var(--text-inverse)',
        },
        team: { offense: 'var(--team-offense)', defense: 'var(--team-defense)' },
        ball: 'var(--ball)',
        action: {
          screen: 'var(--action-screen)',
          cut: 'var(--action-cut)',
          pass: 'var(--action-pass)',
        },
        state: { success: 'var(--state-success)', error: 'var(--state-error)', warn: 'var(--state-warn)' },
        focus: { selected: 'var(--focus-selected)' },
      },
      fontFamily: {
        display: ['var(--font-display)', 'system-ui', 'sans-serif'],
        sans: ['var(--font-body)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
      },
      // PRD §9: skala 12/14/16/20/24/32/48/64 px
      fontSize: {
        xs: ['0.75rem', { lineHeight: '1rem' }],
        sm: ['0.875rem', { lineHeight: '1.25rem' }],
        base: ['1rem', { lineHeight: '1.5rem' }],
        lg: ['1.25rem', { lineHeight: '1.75rem' }],
        xl: ['1.5rem', { lineHeight: '2rem' }],
        '2xl': ['2rem', { lineHeight: '2.375rem' }],
        '3xl': ['3rem', { lineHeight: '3.25rem' }],
        '4xl': ['4rem', { lineHeight: '4.25rem' }],
      },
      // PRD §10: token durasi & easing
      transitionDuration: {
        instant: '100ms',
        fast: '160ms',
        base: '240ms',
        slow: '400ms',
        scene: '650ms',
        camera: '900ms',
        cinematic: '1400ms',
      },
      transitionTimingFunction: {
        emphasis: 'cubic-bezier(0.16, 1, 0.3, 1)',
        scene: 'cubic-bezier(0.65, 0, 0.35, 1)',
      },
      backdropBlur: { glass: '20px' },
      boxShadow: {
        glow: '0 0 8px var(--glow-color, var(--line-court))',
        'glow-lg': '0 0 24px var(--glow-color, var(--line-court))',
        glass: '0 8px 32px rgba(0, 0, 0, 0.45)',
      },
      screens: { xs: '360px', tablet: '768px', desktop: '1280px', wide: '1920px' },
      keyframes: {
        'pulse-halo': {
          '0%, 100%': { opacity: '0.35', transform: 'scale(1)' },
          '50%': { opacity: '0.9', transform: 'scale(1.12)' },
        },
        scanline: { '0%': { transform: 'translateY(-100%)' }, '100%': { transform: 'translateY(300%)' } },
        'rise-in': {
          from: { opacity: '0', transform: 'translateY(8px) scale(0.96)', filter: 'blur(4px)' },
          to: { opacity: '1', transform: 'translateY(0) scale(1)', filter: 'blur(0)' },
        },
        'slide-label': { from: { opacity: '0', transform: 'translateX(-16px)' }, to: { opacity: '1', transform: 'translateX(0)' } },
        'shake-x': {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-6px)' },
          '75%': { transform: 'translateX(6px)' },
        },
        'count-flash': { '0%': { transform: 'scale(1)' }, '40%': { transform: 'scale(1.25)' }, '100%': { transform: 'scale(1)' } },
      },
      animation: {
        // PRD §9: halo pemain terpilih berdenyut 1,6 detik
        'pulse-halo': 'pulse-halo 1600ms ease-in-out infinite',
        scanline: 'scanline 1800ms linear infinite',
        'rise-in': 'rise-in 240ms cubic-bezier(0.16, 1, 0.3, 1) both',
        'slide-label': 'slide-label 300ms cubic-bezier(0.16, 1, 0.3, 1) both',
        'shake-x': 'shake-x 300ms ease-in-out 2',
        'count-flash': 'count-flash 600ms cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
  plugins: [],
}

export default config
