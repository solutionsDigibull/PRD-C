// Color Utilities for PRD Generator

/**
 * Convert hex color to RGB
 * @param {string} hex - Hex color string (e.g., '#FD9B00')
 * @returns {number[]} RGB values [r, g, b]
 */
export const hexToRgb = (hex) => {
  // Remove # if present
  hex = hex.replace('#', '');

  // Handle shorthand hex (e.g., #FFF)
  if (hex.length === 3) {
    hex = hex.split('').map(c => c + c).join('');
  }

  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);

  return [r, g, b];
};

/**
 * Convert RGB to hex
 * @param {number} r - Red (0-255)
 * @param {number} g - Green (0-255)
 * @param {number} b - Blue (0-255)
 * @returns {string} Hex color string
 */
export const rgbToHex = (r, g, b) => {
  return '#' + [r, g, b].map(x => {
    const hex = x.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('').toUpperCase();
};

/**
 * Calculate relative luminance of a color
 * @param {number[]} rgb - RGB values
 * @returns {number} Luminance value (0-1)
 */
export const getLuminance = (rgb) => {
  const [r, g, b] = rgb.map(val => {
    val = val / 255;
    return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

/**
 * Calculate contrast ratio between two colors
 * @param {string} color1 - Hex color 1
 * @param {string} color2 - Hex color 2
 * @returns {number} Contrast ratio
 */
export const getContrastRatio = (color1, color2) => {
  const lum1 = getLuminance(hexToRgb(color1));
  const lum2 = getLuminance(hexToRgb(color2));
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  return (lighter + 0.05) / (darker + 0.05);
};

/**
 * Check WCAG contrast compliance
 * @param {string} color1 - Foreground color (hex)
 * @param {string} color2 - Background color (hex)
 * @returns {{ratio: number, aa: boolean, aaa: boolean, aaLarge: boolean, aaaLarge: boolean, result: string}}
 */
export const checkWCAGContrast = (color1, color2) => {
  const ratio = getContrastRatio(color1, color2);

  return {
    ratio: Math.round(ratio * 100) / 100,
    aa: ratio >= 4.5,           // AA for normal text
    aaa: ratio >= 7,            // AAA for normal text
    aaLarge: ratio >= 3,        // AA for large text
    aaaLarge: ratio >= 4.5,     // AAA for large text
    result: ratio >= 4.5 ? 'PASS' : 'FAIL'
  };
};

/**
 * Simple pass/fail contrast check
 * @param {string} color1 - Hex color 1
 * @param {string} color2 - Hex color 2
 * @returns {string} 'PASS' or 'FAIL'
 */
export const calculateContrast = (color1, color2) => {
  try {
    const ratio = getContrastRatio(color1, color2);
    return ratio >= 4.5 ? 'PASS' : 'FAIL';
  } catch (e) {
    return 'FAIL';
  }
};

/**
 * Generate lighter shade of a color
 * @param {string} hex - Hex color
 * @param {number} percent - Percentage to lighten (0-100)
 * @returns {string} Lightened hex color
 */
export const lightenColor = (hex, percent) => {
  const [r, g, b] = hexToRgb(hex);
  const amount = Math.round(255 * (percent / 100));

  return rgbToHex(
    Math.min(255, r + amount),
    Math.min(255, g + amount),
    Math.min(255, b + amount)
  );
};

/**
 * Generate darker shade of a color
 * @param {string} hex - Hex color
 * @param {number} percent - Percentage to darken (0-100)
 * @returns {string} Darkened hex color
 */
export const darkenColor = (hex, percent) => {
  const [r, g, b] = hexToRgb(hex);
  const amount = Math.round(255 * (percent / 100));

  return rgbToHex(
    Math.max(0, r - amount),
    Math.max(0, g - amount),
    Math.max(0, b - amount)
  );
};

/**
 * Generate a color palette from a base color
 * @param {string} baseColor - Base hex color
 * @returns {object} Color palette with shades
 */
export const generatePalette = (baseColor) => {
  return {
    50: lightenColor(baseColor, 45),
    100: lightenColor(baseColor, 40),
    200: lightenColor(baseColor, 30),
    300: lightenColor(baseColor, 20),
    400: lightenColor(baseColor, 10),
    500: baseColor,
    600: darkenColor(baseColor, 10),
    700: darkenColor(baseColor, 20),
    800: darkenColor(baseColor, 30),
    900: darkenColor(baseColor, 40)
  };
};

/**
 * Check if a color is light or dark
 * @param {string} hex - Hex color
 * @returns {boolean} True if light, false if dark
 */
export const isLightColor = (hex) => {
  const lum = getLuminance(hexToRgb(hex));
  return lum > 0.179;
};

/**
 * Get appropriate text color for a background
 * @param {string} bgColor - Background hex color
 * @returns {string} '#000000' or '#FFFFFF'
 */
export const getTextColorForBg = (bgColor) => {
  return isLightColor(bgColor) ? '#000000' : '#FFFFFF';
};

/**
 * Validate hex color format
 * @param {string} hex - Color string to validate
 * @returns {boolean}
 */
export const isValidHex = (hex) => {
  return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(hex);
};
