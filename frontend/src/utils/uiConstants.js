/**
 * UI Constants - Magic numbers and reusable strings
 * Centralizes hardcoded values for better maintainability
 */

// ============================================================================
// Icon Sizes
// ============================================================================

export const ICON_SIZES = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
};

// ============================================================================
// Form Configuration
// ============================================================================

export const FORM_CONFIG = {
  textareaRows: {
    small: 2,
    medium: 3,
    large: 5,
  },
  maxLengths: {
    name: 50,
    preference: 100,
    instruction: 500,
    message: 1000,
  },
};

// ============================================================================
// Modal & Dialog Sizes
// ============================================================================

export const MODAL_SIZES = {
  small: 'max-w-md',
  medium: 'max-w-2xl',
  large: 'max-w-4xl',
  full: 'max-w-7xl',
};

export const MODAL_HEIGHTS = {
  compact: 'max-h-[60vh]',
  standard: 'max-h-[80vh]',
  tall: 'max-h-[90vh]',
};

// ============================================================================
// Toast Configuration
// ============================================================================

export const TOAST_CONFIG = {
  minWidth: 'min-w-[320px]',
  maxWidth: 'max-w-md',
  duration: {
    short: 2000,
    medium: 4000,
    long: 6000,
  },
};

// ============================================================================
// Placeholder Text
// ============================================================================

export const PLACEHOLDERS = {
  name: 'Enter your first name',
  preference: 'e.g., I love spicy food',
  mealName: 'e.g., Post-Patrol Meal',
  instructions: 'Anything else we should know? e.g., Gate code is 1234...',
  userResponse: 'Type your response here...',
  email: 'your.email@example.com',
  phone: '(555) 123-4567',
};

// ============================================================================
// Info Messages
// ============================================================================

export const INFO_MESSAGES = {
  noUser: 'Please select or create a user profile first.',
  noMeals: 'No meal routines configured yet. Please add meal slots in your profile.',
  mealInstructions: 'These are the meal routines configured in your profile. Click "Plan Now" to manually trigger the agent for a specific meal.',
  noActivity: 'No activity yet. Navigate to the "My Meals" tab and click "Plan Now" on any meal to start the autonomous agent workflow.',
  noSessions: 'No previous sessions found.',
};

// ============================================================================
// Button Labels
// ============================================================================

export const BUTTON_LABELS = {
  save: 'Save Profile',
  saving: 'Saving...',
  cancel: 'Cancel',
  delete: 'Delete',
  edit: 'Edit',
  add: 'Add',
  remove: 'Remove',
  submit: 'Submit',
  submitting: 'Submitting...',
  planNow: 'Plan Now',
  planning: 'Planning...',
  retry: 'Retry',
  close: 'Close',
  confirm: 'Confirm',
  viewDetails: 'View Details',
};

// ============================================================================
// Validation Messages
// ============================================================================

export const VALIDATION_MESSAGES = {
  nameRequired: 'Please enter a name',
  mealRequired: 'Please add at least one meal slot',
  selectionRequired: 'Please make a selection',
  invalidEmail: 'Please enter a valid email address',
  invalidPhone: 'Please enter a valid phone number',
};

// ============================================================================
// Success Messages
// ============================================================================

export const SUCCESS_MESSAGES = {
  profileSaved: 'Profile saved successfully!',
  orderPlaced: 'Order placed successfully!',
  preferencesUpdated: 'Preferences updated successfully!',
};

// ============================================================================
// Error Messages
// ============================================================================

export const ERROR_MESSAGES = {
  profileSaveFailed: 'Failed to save profile. Please try again.',
  planningFailed: 'Failed to start meal planning. Please try again.',
  loadingFailed: 'Failed to load data. Please try again.',
  networkError: 'Network error. Please check your connection.',
  genericError: 'Something went wrong. Please try again.',
};

// ============================================================================
// Animation Durations (ms)
// ============================================================================

export const ANIMATION_DURATION = {
  fast: 150,
  normal: 300,
  slow: 500,
  verySlow: 1000,
};

// ============================================================================
// Z-Index Layers
// ============================================================================

export const Z_INDEX = {
  base: 0,
  dropdown: 10,
  sticky: 20,
  modal: 50,
  toast: 100,
  tooltip: 200,
};

// ============================================================================
// Breakpoints (for reference, Tailwind handles actual responsive design)
// ============================================================================

export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
};
