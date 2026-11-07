const { hairlineWidth } = require('nativewind/theme');

/** Colores como tripletes "R G B" en variables: así funcionan los modificadores de opacidad (bg-primary/10). */
const c = (v) => `rgb(var(--${v}) / <alpha-value>)`;

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        border: c('border'),
        input: c('input'),
        ring: c('ring'),
        background: c('background'),
        foreground: c('foreground'),
        primary: { DEFAULT: c('primary'), foreground: c('primary-foreground') },
        secondary: { DEFAULT: c('secondary'), foreground: c('secondary-foreground') },
        destructive: { DEFAULT: c('destructive'), foreground: c('destructive-foreground') },
        muted: { DEFAULT: c('muted'), foreground: c('muted-foreground') },
        accent: { DEFAULT: c('accent'), foreground: c('accent-foreground') },
        popover: { DEFAULT: c('popover'), foreground: c('popover-foreground') },
        card: { DEFAULT: c('card'), foreground: c('card-foreground') },
        'brand-accent': { DEFAULT: c('brand-accent'), foreground: c('brand-accent-foreground') },
        success: c('success'),
        warning: c('warning'),
        danger: c('danger'),
        info: c('info'),
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      borderWidth: { hairline: hairlineWidth() },
      fontFamily: {
        body: ['Geist_400Regular'],
        'body-medium': ['Geist_500Medium'],
        'body-semibold': ['Geist_600SemiBold'],
        mono: ['GeistMono_500Medium'],
        plataforma: ['BricolageGrotesque_700Bold'],
      },
    },
  },
  future: { hoverOnlyWhenSupported: true },
  plugins: [require('tailwindcss-animate')],
};
