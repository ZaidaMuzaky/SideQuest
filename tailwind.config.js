/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./app/**/*.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        background: 'rgb(var(--color-background) / <alpha-value>)',
        surface: 'rgb(var(--color-surface) / <alpha-value>)',
        'surface-elevated':
          'rgb(var(--color-surface-elevated) / <alpha-value>)',
        'text-primary': 'rgb(var(--color-text-primary) / <alpha-value>)',
        'text-secondary':
          'rgb(var(--color-text-secondary) / <alpha-value>)',
        border: 'rgb(var(--color-border) / <alpha-value>)',
        primary: 'rgb(var(--color-primary) / <alpha-value>)',
        'primary-pressed':
          'rgb(var(--color-primary-pressed) / <alpha-value>)',
        accent: 'rgb(var(--color-accent) / <alpha-value>)',
        success: 'rgb(var(--color-success) / <alpha-value>)',
        warning: 'rgb(var(--color-warning) / <alpha-value>)',
        danger: 'rgb(var(--color-danger) / <alpha-value>)',
        'danger-pressed':
          'rgb(var(--color-danger-pressed) / <alpha-value>)',
        focus: 'rgb(var(--color-focus) / <alpha-value>)',
        disabled: 'rgb(var(--color-disabled) / <alpha-value>)',
        'disabled-text':
          'rgb(var(--color-disabled-text) / <alpha-value>)',
      },
      spacing: {
        1: 4,
        2: 8,
        3: 12,
        4: 16,
        5: 20,
        6: 24,
        8: 32,
        10: 40,
        12: 48,
      },
      borderRadius: {
        sm: 8,
        md: 12,
        lg: 16,
        xl: 20,
      },
    },
  },
  plugins: [],
};
