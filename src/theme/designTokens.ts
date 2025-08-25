export const designTokens = {
  colors: {
    bg: "#0B1020",         // deep navy
    background: "#0B1020",  // alias for bg
    card: "#12172A",
    surface: "#171D33",
    primary: "#6E9BFF",    // electric blue
    primaryAlt: "#9CC3FF",
    accent: "#C7F284",     // lime accent (sparingly)
    text: "#E9EEF9",
    textDim: "#A7B0C7",
    border: "rgba(255,255,255,0.08)",
    danger: "#FF6B6B",
    success: "#4ADE80",
    warning: "#FBBF24",
    white: "#FFFFFF",
    black: "#000000",
  },
  radius: { 
    sm: 10, 
    md: 16, 
    lg: 24, 
    xl: 28 
  },
  spacing: { 
    xs: 6, 
    sm: 10, 
    md: 16, 
    lg: 20, 
    xl: 28, 
    xxl: 36 
  },
  shadow: "shadow-lg shadow-black/40",
  fontSizes: { 
    xs: 12, 
    sm: 14, 
    md: 16, 
    lg: 18, 
    xl: 22, 
    h2: 26, 
    h1: 32 
  },
  fontWeights: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
  opacity: {
    disabled: 0.5,
    pressed: 0.8,
    overlay: 0.9,
  }
};

export type DesignTokens = typeof designTokens;
