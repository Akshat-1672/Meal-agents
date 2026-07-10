/**
 * Centralized Tailwind CSS class patterns
 * Provides reusable style combinations for consistent UI
 */

// ============================================================================
// Card & Container Styles
// ============================================================================

export const CARD_STYLES = {
  // Main card container with shadow
  base: "bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-xl shadow-black/20",
  
  // Compact card variant
  compact: "bg-slate-800 border border-slate-700 rounded-xl p-5",
  
  // Hover-enabled card
  interactive: "bg-slate-800 border border-slate-700 hover:border-slate-600 rounded-xl p-5 transition-all hover:shadow-lg hover:shadow-black/20",
  
  // Inner card/section
  inner: "bg-slate-900 border border-slate-700 rounded-lg p-4",
  
  // Info box (blue variant)
  info: "bg-blue-500/10 border border-blue-500/20 rounded-xl p-4",
  
  // Warning box (yellow variant)
  warning: "bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4",
  
  // Success box (green variant)
  success: "bg-green-500/10 border border-green-500/20 rounded-xl p-4",
  
  // Error box (red variant)
  error: "bg-red-500/10 border border-red-500/20 rounded-xl p-4",
};

// ============================================================================
// Input Styles
// ============================================================================

export const INPUT_STYLES = {
  // Standard text input
  text: "w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all placeholder-slate-600",
  
  // Compact input (smaller padding)
  compact: "w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary-500 transition-all",
  
  // Textarea variant
  textarea: "w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-slate-200 focus:outline-none focus:border-primary-500 transition-all placeholder-slate-600 resize-none",
  
  // Select/dropdown
  select: "w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary-500 transition-all cursor-pointer",
  
  // Time input (without w-full to preserve native size)
  time: "bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary-500 transition-all",
  
  // Input label
  label: "block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2",
};

// ============================================================================
// Button Styles
// ============================================================================

export const BUTTON_STYLES = {
  // Primary button (gradient blue)
  primary: "w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold py-4 px-6 rounded-xl shadow-lg shadow-blue-500/25 transform transition-all active:scale-[0.98] flex items-center justify-center gap-2",
  
  // Primary compact
  primaryCompact: "bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-lg font-medium transition-colors",
  
  // Secondary button (slate)
  secondary: "bg-slate-700 hover:bg-slate-600 text-white px-4 py-3 rounded-lg transition-colors",
  
  // Danger button (red)
  danger: "bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-lg transition-colors",
  
  // Icon button
  icon: "p-2 hover:bg-white/5 rounded-lg transition-colors",
  
  // Tab button active
  tabActive: "flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all duration-200 bg-slate-700 text-white shadow-sm",
  
  // Tab button inactive
  tabInactive: "flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all duration-200 text-slate-400 hover:text-white hover:bg-slate-700/50",
};

// ============================================================================
// Section Headers
// ============================================================================

export const HEADER_STYLES = {
  // Section title with icon
  section: "text-lg font-semibold text-white mb-4 flex items-center",
  
  // Subsection title
  subsection: "text-sm font-medium text-slate-300 mb-2",
  
  // Icon wrapper for section headers
  iconWrapper: "text-primary-500 mr-3",
};

// ============================================================================
// Layout Utilities
// ============================================================================

export const LAYOUT_STYLES = {
  // Flex container with gap
  flexGap2: "flex items-center gap-2",
  flexGap3: "flex items-center gap-3",
  flexGap4: "flex items-center gap-4",
  
  // Stack (vertical flex)
  stack: "flex flex-col gap-4",
  stackTight: "flex flex-col gap-2",
  stackLoose: "flex flex-col gap-6",
  
  // Grid layouts
  grid2: "grid grid-cols-2 gap-3",
  grid3: "grid grid-cols-3 gap-3",
  grid4: "grid grid-cols-4 gap-3",
  gridResponsive: "grid grid-cols-3 sm:grid-cols-4 gap-3",
};

// ============================================================================
// Text Styles
// ============================================================================

export const TEXT_STYLES = {
  // Muted/secondary text
  muted: "text-slate-400",
  mutedSmall: "text-slate-400 text-sm",
  mutedXs: "text-slate-400 text-xs",
  
  // Primary white text
  primary: "text-white",
  primaryBold: "text-white font-semibold",
  
  // Info text colors
  info: "text-blue-400",
  warning: "text-yellow-400",
  success: "text-green-400",
  error: "text-red-400",
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Combine multiple style classes
 * @param {...string} classes - Class strings to combine
 * @returns {string} Combined class string
 */
export const combineStyles = (...classes) => {
  return classes.filter(Boolean).join(' ');
};

/**
 * Get card style with optional custom classes
 * @param {string} variant - Card variant from CARD_STYLES
 * @param {string} customClasses - Additional custom classes
 * @returns {string} Combined class string
 */
export const getCardStyle = (variant = 'base', customClasses = '') => {
  return combineStyles(CARD_STYLES[variant], customClasses);
};

/**
 * Get input style with optional custom classes
 * @param {string} variant - Input variant from INPUT_STYLES
 * @param {string} customClasses - Additional custom classes
 * @returns {string} Combined class string
 */
export const getInputStyle = (variant = 'text', customClasses = '') => {
  return combineStyles(INPUT_STYLES[variant], customClasses);
};

/**
 * Get button style with optional custom classes
 * @param {string} variant - Button variant from BUTTON_STYLES
 * @param {string} customClasses - Additional custom classes
 * @returns {string} Combined class string
 */
export const getButtonStyle = (variant = 'primary', customClasses = '') => {
  return combineStyles(BUTTON_STYLES[variant], customClasses);
};
