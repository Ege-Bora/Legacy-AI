import { designTokens, DesignTokens } from '../theme/designTokens';

export const useTheme = (): DesignTokens => {
  return designTokens;
};

// Helper functions for common styling patterns
export const getSpacing = (size: keyof typeof designTokens.spacing): number => {
  return designTokens.spacing[size];
};

export const getRadius = (size: keyof typeof designTokens.radius): number => {
  return designTokens.radius[size];
};

export const getFontSize = (size: keyof typeof designTokens.fontSizes): number => {
  return designTokens.fontSizes[size];
};
