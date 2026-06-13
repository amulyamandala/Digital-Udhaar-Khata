// ============================================
// UDHAAR KHATA DESIGN SYSTEM
// Revolut-inspired Design System Converted to JavaScript
// ============================================

// ============================================
// COLORS
// ============================================
export const COLORS = {
  // Primary Brand Colors
  primary: "#494fdf",
  primaryBright: "#4f55f1",
  primaryDeep: "#3a40c4",
  onPrimary: "#ffffff",

  // Text Colors
  ink: "#191c1f",
  body: "#1f2226",
  charcoal: "#3a3d40",
  mute: "#505a63",
  ash: "#5c5e60",
  stone: "#8d969e",
  faint: "#c9c9cd",
  onDark: "#ffffff",
  onDarkMute: "rgba(255,255,255,0.72)",

  // Canvas Colors
  canvasLight: "#ffffff",
  canvasDark: "#000000",
  surfaceSoft: "#f4f4f4",
  surfaceCard: "#ffffff",
  surfaceDeep: "#0a0a0a",
  surfaceElevated: "#16181a",

  // Border & Divider Colors
  hairlineLight: "#e2e2e7",
  hairlineDark: "rgba(255,255,255,0.12)",
  hairlineStrong: "#191c1f",
  dividerSoft: "rgba(255,255,255,0.06)",

  // Accent Colors
  accentTeal: "#00a87e",
  accentBlueLink: "#376cd5",
  accentLightBlue: "#007bc2",
  accentLightGreen: "#428619",
  accentGreenText: "#006400",
  accentYellow: "#b09000",
  accentWarning: "#ec7e00",
  accentPink: "#e61e49",
  accentDanger: "#e23b4a",
  accentDeepRed: "#8b0000",
  accentBrown: "#936d62",
  link: "#376cd5",
};

// ============================================
// TYPOGRAPHY
// ============================================
export const TYPOGRAPHY = {
  // Display Styles
  displayXxl: {
    fontFamily: "'Aeonik Pro', 'Inter Display', sans-serif",
    fontSize: "136px",
    fontWeight: 500,
    lineHeight: 1.0,
    letterSpacing: "-2.72px",
  },
  displayXl: {
    fontFamily: "'Aeonik Pro', 'Inter Display', sans-serif",
    fontSize: "80px",
    fontWeight: 500,
    lineHeight: 1.0,
    letterSpacing: "-0.8px",
  },
  displayLg: {
    fontFamily: "'Aeonik Pro', 'Inter Display', sans-serif",
    fontSize: "48px",
    fontWeight: 500,
    lineHeight: 1.21,
    letterSpacing: "-0.48px",
  },
  displayMd: {
    fontFamily: "'Aeonik Pro', 'Inter Display', sans-serif",
    fontSize: "40px",
    fontWeight: 500,
    lineHeight: 1.2,
    letterSpacing: "-0.4px",
  },

  // Heading Styles
  headingLg: {
    fontFamily: "'Aeonik Pro', 'Inter Display', sans-serif",
    fontSize: "32px",
    fontWeight: 500,
    lineHeight: 1.19,
    letterSpacing: "-0.32px",
  },
  headingMd: {
    fontFamily: "'Aeonik Pro', 'Inter Display', sans-serif",
    fontSize: "24px",
    fontWeight: 500,
    lineHeight: 1.33,
    letterSpacing: "0px",
  },
  headingSm: {
    fontFamily: "'Aeonik Pro', 'Inter Display', sans-serif",
    fontSize: "20px",
    fontWeight: 500,
    lineHeight: 1.4,
    letterSpacing: "0px",
  },

  // Body Styles
  bodyLg: {
    fontFamily: "'Inter', sans-serif",
    fontSize: "18px",
    fontWeight: 400,
    lineHeight: 1.56,
    letterSpacing: "-0.09px",
  },
  bodyMd: {
    fontFamily: "'Inter', sans-serif",
    fontSize: "16px",
    fontWeight: 400,
    lineHeight: 1.5,
    letterSpacing: "0.24px",
  },
  bodyMdBold: {
    fontFamily: "'Inter', sans-serif",
    fontSize: "16px",
    fontWeight: 600,
    lineHeight: 1.5,
    letterSpacing: "0.16px",
  },
  bodySm: {
    fontFamily: "'Inter', sans-serif",
    fontSize: "14px",
    fontWeight: 400,
    lineHeight: 1.43,
    letterSpacing: "0px",
  },

  // Button Styles
  buttonLg: {
    fontFamily: "'Aeonik Pro', 'Inter Display', sans-serif",
    fontSize: "20px",
    fontWeight: 500,
    lineHeight: 1.4,
    letterSpacing: "0px",
  },
  buttonMd: {
    fontFamily: "'Inter', sans-serif",
    fontSize: "16px",
    fontWeight: 600,
    lineHeight: 1.5,
    letterSpacing: "0.24px",
  },
  buttonSm: {
    fontFamily: "'Inter', sans-serif",
    fontSize: "14px",
    fontWeight: 600,
    lineHeight: 1.43,
    letterSpacing: "0px",
  },

  // Special Styles
  caption: {
    fontFamily: "'Inter', sans-serif",
    fontSize: "13px",
    fontWeight: 400,
    lineHeight: 1.4,
    letterSpacing: "0px",
  },
  linkEmph: {
    fontFamily: "'Inter', sans-serif",
    fontSize: "16px",
    fontWeight: 700,
    lineHeight: 1.5,
    letterSpacing: "0.24px",
  },
};

// ============================================
// ROUNDED (Border Radius)
// ============================================
export const ROUNDED = {
  none: "0px",
  sm: "8px",
  md: "12px",
  lg: "20px",
  xl: "28px",
  full: "9999px",
};

// ============================================
// SPACING
// ============================================
export const SPACING = {
  xxs: "4px",
  xs: "6px",
  sm: "8px",
  md: "14px",
  lg: "16px",
  xl: "24px",
  xxl: "32px",
  xxxl: "48px",
  block: "80px",
  section: "88px",
  band: "120px",
};

// ============================================
// COMPONENTS - Style Objects
// ============================================
export const COMPONENTS = {
  // Buttons
  buttonPrimary: {
    backgroundColor: COLORS.canvasLight,
    color: COLORS.canvasDark,
    ...TYPOGRAPHY.buttonMd,
    borderRadius: ROUNDED.full,
    padding: "14px 28px",
    height: "48px",
    border: "none",
    cursor: "pointer",
    transition: "all 250ms ease-in-out",
  },
  buttonPrimaryPressed: {
    backgroundColor: COLORS.faint,
    color: COLORS.canvasDark,
    ...TYPOGRAPHY.buttonMd,
    borderRadius: ROUNDED.full,
    padding: "14px 28px",
    height: "48px",
    border: "none",
    cursor: "pointer",
  },
  buttonDark: {
    backgroundColor: COLORS.canvasDark,
    color: COLORS.onDark,
    ...TYPOGRAPHY.buttonMd,
    borderRadius: ROUNDED.full,
    padding: "14px 28px",
    height: "48px",
    border: "none",
    cursor: "pointer",
    transition: "all 250ms ease-in-out",
  },
  buttonSoft: {
    backgroundColor: COLORS.surfaceSoft,
    color: COLORS.ink,
    ...TYPOGRAPHY.buttonMd,
    borderRadius: ROUNDED.full,
    padding: "14px 28px",
    height: "48px",
    border: "none",
    cursor: "pointer",
    transition: "all 250ms ease-in-out",
  },
  buttonOutlineLight: {
    backgroundColor: COLORS.canvasLight,
    color: COLORS.ink,
    ...TYPOGRAPHY.buttonMd,
    borderRadius: ROUNDED.full,
    padding: "13px 27px",
    height: "48px",
    border: `1px solid ${COLORS.hairlineStrong}`,
    cursor: "pointer",
    transition: "all 250ms ease-in-out",
  },
  buttonOutlineDark: {
    backgroundColor: COLORS.canvasDark,
    color: COLORS.onDark,
    ...TYPOGRAPHY.buttonMd,
    borderRadius: ROUNDED.full,
    padding: "13px 27px",
    height: "48px",
    border: `1px solid ${COLORS.onDark}`,
    cursor: "pointer",
    transition: "all 250ms ease-in-out",
  },
  buttonPillSm: {
    backgroundColor: COLORS.surfaceSoft,
    color: COLORS.ink,
    ...TYPOGRAPHY.buttonSm,
    borderRadius: ROUNDED.full,
    padding: "8px 16px",
    height: "36px",
    border: "none",
    cursor: "pointer",
  },

  // Cards
  heroBandDark: {
    backgroundColor: COLORS.canvasDark,
    color: COLORS.onDark,
    ...TYPOGRAPHY.displayXxl,
    borderRadius: ROUNDED.none,
    padding: `${SPACING.section} 24px`,
  },
  heroBandPhoto: {
    backgroundColor: COLORS.canvasDark,
    color: COLORS.onDark,
    ...TYPOGRAPHY.displayXl,
    borderRadius: ROUNDED.none,
    padding: "0px",
  },
  featureCardLight: {
    backgroundColor: COLORS.surfaceCard,
    color: COLORS.ink,
    ...TYPOGRAPHY.bodyMd,
    borderRadius: ROUNDED.lg,
    padding: SPACING.xxl,
    border: `1px solid ${COLORS.hairlineLight}`,
  },
  featureCardDark: {
    backgroundColor: COLORS.surfaceElevated,
    color: COLORS.onDark,
    ...TYPOGRAPHY.bodyMd,
    borderRadius: ROUNDED.lg,
    padding: SPACING.xxl,
  },
  planCard: {
    backgroundColor: COLORS.surfaceElevated,
    color: COLORS.onDark,
    ...TYPOGRAPHY.bodyMd,
    borderRadius: ROUNDED.lg,
    padding: SPACING.xxl,
  },
  planCardFeatured: {
    backgroundColor: COLORS.primary,
    color: COLORS.onPrimary,
    ...TYPOGRAPHY.bodyMd,
    borderRadius: ROUNDED.lg,
    padding: SPACING.xxl,
  },
  productMockup: {
    backgroundColor: COLORS.canvasDark,
    color: COLORS.onDark,
    borderRadius: ROUNDED.xl,
    padding: SPACING.xxxl,
  },
  downloadTile: {
    backgroundColor: COLORS.surfaceSoft,
    color: COLORS.ink,
    ...TYPOGRAPHY.bodySm,
    borderRadius: ROUNDED.md,
    padding: "12px 20px",
    height: "56px",
  },

  // Forms
  textInput: {
    backgroundColor: COLORS.canvasLight,
    color: COLORS.ink,
    ...TYPOGRAPHY.bodyMd,
    borderRadius: ROUNDED.md,
    padding: "14px 16px",
    height: "56px",
    border: `1px solid ${COLORS.hairlineLight}`,
    transition: "all 250ms ease-in-out",
  },

  // Navigation
  navBar: {
    backgroundColor: COLORS.canvasDark,
    color: COLORS.onDark,
    ...TYPOGRAPHY.buttonMd,
    borderRadius: ROUNDED.none,
    height: "64px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 24px",
  },
  subNavPill: {
    backgroundColor: COLORS.surfaceElevated,
    color: COLORS.onDark,
    ...TYPOGRAPHY.buttonSm,
    borderRadius: ROUNDED.full,
    padding: "8px 16px",
  },

  // Badges
  badgeTag: {
    backgroundColor: COLORS.surfaceSoft,
    color: COLORS.ink,
    ...TYPOGRAPHY.caption,
    borderRadius: ROUNDED.full,
    padding: "4px 12px",
    display: "inline-flex",
    alignItems: "center",
  },
  badgeFeature: {
    backgroundColor: COLORS.primary,
    color: COLORS.onPrimary,
    ...TYPOGRAPHY.caption,
    borderRadius: ROUNDED.full,
    padding: "4px 12px",
    display: "inline-flex",
    alignItems: "center",
  },

  // Footer
  footer: {
    backgroundColor: COLORS.canvasDark,
    color: COLORS.onDarkMute,
    ...TYPOGRAPHY.bodySm,
    borderRadius: ROUNDED.none,
    padding: "80px 24px",
  },
};

// ============================================
// BREAKPOINTS
// ============================================
export const BREAKPOINTS = {
  mobile: "425px",
  mobileLarge: "767px",
  tablet: "1023px",
  tabletLarge: "1279px",
  desktop: "1439px",
  desktopXl: "1440px",
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Combine multiple class names conditionally
 */
export const classNames = (...classes) => {
  return classes.filter(Boolean).join(" ");
};

/**
 * Merge style objects
 */
export const mergeStyles = (...styleObjects) => {
  return Object.assign({}, ...styleObjects);
};

/**
 * Add opacity to a hex color
 */
export const withOpacity = (hexColor, opacity) => {
  const int = parseInt(hexColor.replace("#", ""), 16);
  const r = (int >> 16) & 255;
  const g = (int >> 8) & 255;
  const b = int & 255;
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

/**
 * Get responsive value based on breakpoint
 */
export const getResponsiveValue = (mobile, tablet, desktop) => {
  if (typeof window === "undefined") return mobile;
  const width = window.innerWidth;
  if (width > parseInt(BREAKPOINTS.desktopXl)) return desktop;
  if (width > parseInt(BREAKPOINTS.tablet)) return tablet;
  return mobile;
};

/**
 * Create a Tailwind className from component styles
 */
export const componentToTailwind = (componentName) => {
  const componentMap = {
    buttonPrimary: "px-7 py-3 bg-white text-black rounded-full font-semibold hover:bg-gray-100 transition",
    buttonDark: "px-7 py-3 bg-black text-white rounded-full font-semibold hover:bg-gray-900 transition",
    buttonSoft: "px-7 py-3 bg-gray-200 text-gray-900 rounded-full font-semibold hover:bg-gray-300 transition",
    featureCardLight: "bg-white rounded-2xl p-8 border border-gray-200",
    featureCardDark: "bg-gray-950 rounded-2xl p-8",
    planCard: "bg-gray-950 rounded-2xl p-8",
    planCardFeatured: "bg-blue-600 rounded-2xl p-8 text-white",
    textInput: "w-full px-4 py-3 bg-white text-gray-900 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500",
  };
  return componentMap[componentName] || "";
};

// ============================================
// MEDIA QUERY HELPERS
// ============================================
export const mediaQuery = {
  mobile: `@media (max-width: ${BREAKPOINTS.mobile})`,
  mobileLarge: `@media (max-width: ${BREAKPOINTS.mobileLarge})`,
  tablet: `@media (max-width: ${BREAKPOINTS.tablet})`,
  tabletLarge: `@media (max-width: ${BREAKPOINTS.tabletLarge})`,
  desktop: `@media (min-width: ${BREAKPOINTS.desktop})`,
  desktopXl: `@media (min-width: ${BREAKPOINTS.desktopXl})`,
};

// ============================================
// EXPORT DEFAULT
// ============================================
export default {
  COLORS,
  TYPOGRAPHY,
  ROUNDED,
  SPACING,
  COMPONENTS,
  BREAKPOINTS,
  classNames,
  mergeStyles,
  withOpacity,
  getResponsiveValue,
  componentToTailwind,
  mediaQuery,
};