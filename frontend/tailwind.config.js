export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        'nx-bg':      '#0D0D1A',
        'nx-surface': '#12122A',
        'nx-border':  '#1e1e3a',
        'nx-violet':  '#7C3AED',
        'nx-blue':    '#3B82F6',
        'nx-cyan':    '#06B6D4',
        'nx-danger':  '#F43F5E',
        'nx-muted':   '#94A3B8',
      },
      fontFamily: {
        grotesk: ['Space Grotesk', 'system-ui', 'sans-serif'],
        mono:    ['JetBrains Mono', 'monospace'],
      },
      backgroundImage: {
        nexus:     'linear-gradient(90deg, #7C3AED, #3B82F6, #06B6D4)',
        'nexus-d': 'linear-gradient(135deg, #7C3AED, #06B6D4)',
      },
    },
  },
  plugins: [],
}
