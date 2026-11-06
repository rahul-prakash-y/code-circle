// Apple OLED Palette & HeroUI Theme Mapping Configuration
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
    './node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'SF Pro Text', 'system-ui', 'sans-serif'],
        heading: ['Plus Jakarta Sans', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'SF Pro Display', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'SF Mono', 'Fira Code', 'ui-monospace', 'monospace'],
      },
      colors: {
        content1: {
          DEFAULT: '#FFFFFF',
          dark: '#161617',
        },
        content2: {
          DEFAULT: '#FAFAFC',
          dark: '#1C1C1E',
        },
        content3: {
          DEFAULT: '#F5F5F7',
          dark: '#2C2C2E',
        },
        content4: {
          DEFAULT: '#E5E5EA',
          dark: '#38383A',
        },
        apple: {
          blue: {
            DEFAULT: '#0071E3',
            dark: '#2997FF',
          },
          canvas: {
            DEFAULT: '#F5F5F7',
            dark: '#000000',
          },
          surface: {
            DEFAULT: '#FFFFFF',
            dark: '#161617',
          },
          secondary: {
            DEFAULT: '#FAFAFC',
            dark: '#1C1C1E',
          },
        },
      },
    },
  },
};
