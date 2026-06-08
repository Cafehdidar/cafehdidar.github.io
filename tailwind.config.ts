import type {Config} from 'tailwindcss';

export default {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        body: ['Vazirmatn', 'sans-serif'],
        headline: ['Vazirmatn', 'sans-serif'],
        code: ['monospace'],
      },
      colors: {
        background: '#1C0F0A',
        foreground: '#F5E6D3',
        card: {
          DEFAULT: '#2A1810',
          foreground: '#F5E6D3',
        },
        popover: {
          DEFAULT: '#2A1810',
          foreground: '#F5E6D3',
        },
        primary: {
          DEFAULT: '#D4A853',
          foreground: '#1C0F0A',
        },
        secondary: {
          DEFAULT: '#753622',
          foreground: '#F5E6D3',
        },
        muted: {
          DEFAULT: '#3D2B24',
          foreground: '#A89B95',
        },
        accent: {
          DEFAULT: '#D4A853',
          foreground: '#1C0F0A',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        border: '#3D2B24',
        input: '#3D2B24',
        ring: '#D4A853',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        'bounce-subtle': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'slide-up': {
          from: { transform: 'translateY(100%)' },
          to: { transform: 'translateY(0)' },
        }
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'bounce-subtle': 'bounce-subtle 0.5s ease-in-out',
        'fade-in': 'fade-in 0.3s ease-out',
        'slide-up': 'slide-up 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
} satisfies Config;
