/**
 * Design Tokens - Typography
 * 统一的字体设计令牌，确保文字体系一致性
 */

// 字体族
export const fontFamily = {
  sans: [
    'Inter',
    '-apple-system',
    'BlinkMacSystemFont', 
    '"Segoe UI"',
    'Roboto',
    '"Helvetica Neue"',
    'Arial',
    '"Noto Sans"',
    'sans-serif',
    '"Apple Color Emoji"',
    '"Segoe UI Emoji"',
    '"Segoe UI Symbol"',
    '"Noto Color Emoji"'
  ].join(', '),
  
  mono: [
    '"Fira Code"',
    'ui-monospace',
    'SFMono-Regular',
    '"SF Mono"',
    'Consolas',
    '"Liberation Mono"',
    'Menlo',
    'monospace'
  ].join(', '),
  
  // 中文字体
  zh: [
    '"PingFang SC"',
    '"Microsoft YaHei"',
    '"Helvetica Neue"',
    'Helvetica',
    'Arial',
    'sans-serif'
  ].join(', '),
};

// 字号系统
export const fontSize = {
  xs: '0.75rem',     // 12px
  sm: '0.875rem',    // 14px  
  base: '1rem',      // 16px
  lg: '1.125rem',    // 18px
  xl: '1.25rem',     // 20px
  '2xl': '1.5rem',   // 24px
  '3xl': '1.875rem', // 30px
  '4xl': '2.25rem',  // 36px
  '5xl': '3rem',     // 48px
  '6xl': '3.75rem',  // 60px
  '7xl': '4.5rem',   // 72px
  '8xl': '6rem',     // 96px
  '9xl': '8rem',     // 128px
};

// 行高系统
export const lineHeight = {
  none: '1',
  tight: '1.25',
  snug: '1.375',
  normal: '1.5',
  relaxed: '1.625',
  loose: '2',
  3: '.75rem',
  4: '1rem',
  5: '1.25rem',
  6: '1.5rem',
  7: '1.75rem',
  8: '2rem',
  9: '2.25rem',
  10: '2.5rem',
};

// 字重系统
export const fontWeight = {
  thin: '100',
  extralight: '200',
  light: '300',
  normal: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  extrabold: '800',
  black: '900',
};

// 字间距
export const letterSpacing = {
  tighter: '-0.05em',
  tight: '-0.025em',
  normal: '0em',
  wide: '0.025em',
  wider: '0.05em',
  widest: '0.1em',
};

// 语义化字体样式
export const typography = {
  // 标题系统
  heading: {
    h1: {
      fontSize: fontSize['4xl'],
      lineHeight: lineHeight.tight,
      fontWeight: fontWeight.bold,
      letterSpacing: letterSpacing.tight,
    },
    h2: {
      fontSize: fontSize['3xl'],
      lineHeight: lineHeight.tight,
      fontWeight: fontWeight.semibold,
      letterSpacing: letterSpacing.tight,
    },
    h3: {
      fontSize: fontSize['2xl'],
      lineHeight: lineHeight.snug,
      fontWeight: fontWeight.semibold,
      letterSpacing: letterSpacing.normal,
    },
    h4: {
      fontSize: fontSize.xl,
      lineHeight: lineHeight.snug,
      fontWeight: fontWeight.medium,
      letterSpacing: letterSpacing.normal,
    },
    h5: {
      fontSize: fontSize.lg,
      lineHeight: lineHeight.normal,
      fontWeight: fontWeight.medium,
      letterSpacing: letterSpacing.normal,
    },
    h6: {
      fontSize: fontSize.base,
      lineHeight: lineHeight.normal,
      fontWeight: fontWeight.medium,
      letterSpacing: letterSpacing.normal,
    },
  },

  // 正文系统
  body: {
    large: {
      fontSize: fontSize.lg,
      lineHeight: lineHeight.relaxed,
      fontWeight: fontWeight.normal,
      letterSpacing: letterSpacing.normal,
    },
    base: {
      fontSize: fontSize.base,
      lineHeight: lineHeight.normal,
      fontWeight: fontWeight.normal,
      letterSpacing: letterSpacing.normal,
    },
    small: {
      fontSize: fontSize.sm,
      lineHeight: lineHeight.normal,
      fontWeight: fontWeight.normal,
      letterSpacing: letterSpacing.normal,
    },
    xs: {
      fontSize: fontSize.xs,
      lineHeight: lineHeight.normal,
      fontWeight: fontWeight.normal,
      letterSpacing: letterSpacing.wide,
    },
  },

  // 特殊文本
  special: {
    // 按钮文字
    button: {
      fontSize: fontSize.sm,
      lineHeight: lineHeight.none,
      fontWeight: fontWeight.medium,
      letterSpacing: letterSpacing.wide,
    },
    
    // 标签文字
    label: {
      fontSize: fontSize.xs,
      lineHeight: lineHeight.none,
      fontWeight: fontWeight.medium,
      letterSpacing: letterSpacing.wider,
      textTransform: 'uppercase' as const,
    },
    
    // 代码文字
    code: {
      fontSize: fontSize.sm,
      lineHeight: lineHeight.normal,
      fontWeight: fontWeight.normal,
      fontFamily: fontFamily.mono,
      letterSpacing: letterSpacing.normal,
    },
    
    // 链接文字
    link: {
      fontSize: fontSize.base,
      lineHeight: lineHeight.normal,
      fontWeight: fontWeight.medium,
      letterSpacing: letterSpacing.normal,
      textDecoration: 'none',
      '&:hover': {
        textDecoration: 'underline',
      },
    },
  },
};

// CSS 自定义属性导出
export const typographyCssVariables = {
  '--font-family-sans': fontFamily.sans,
  '--font-family-mono': fontFamily.mono,
  '--font-family-zh': fontFamily.zh,
  '--font-size-base': fontSize.base,
  '--font-size-sm': fontSize.sm,
  '--font-size-lg': fontSize.lg,
  '--line-height-normal': lineHeight.normal,
  '--line-height-relaxed': lineHeight.relaxed,
  '--font-weight-normal': fontWeight.normal,
  '--font-weight-medium': fontWeight.medium,
  '--font-weight-semibold': fontWeight.semibold,
  '--font-weight-bold': fontWeight.bold,
} as const;

export default typography;