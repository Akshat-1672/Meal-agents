import { WORKFLOW_STATUS } from './constants';

/**
 * Centralized session data accessors
 * Provides safe, consistent access to nested session state properties
 * All accessors handle null/undefined gracefully with appropriate defaults
 */

// ============================================================================
// Workflow Status Accessors
// ============================================================================

/**
 * Get the workflow status from a session
 * @param {Object} session - The session object
 * @returns {string|null} The workflow status or null
 */
export const getWorkflowStatus = (session) => 
  session?.state?.workflow_status || null;

// ============================================================================
// Planning Accessors
// ============================================================================

/**
 * Get the meal type from session planning data
 * @param {Object} session - The session object
 * @returns {string} The meal type or 'Unknown Meal'
 */
export const getMealType = (session) => 
  session?.state?.planning?.meal_type || 'Unknown Meal';

/**
 * Get the meal choice verification message
 * @param {Object} session - The session object
 * @returns {string|null} The verification message or null
 */
export const getMealChoiceVerificationMessage = (session) => 
  session?.state?.verification?.message || null;

/**
 * Get the array of meal choices
 * @param {Object} session - The session object
 * @returns {Array} The meal choices array (empty array if none)
 */
export const getMealChoices = (session) => 
  session?.state?.verification?.choices || [];

// ============================================================================
// User Choice Accessors
// ============================================================================

/**
 * Get the user's meal choice(s)
 * @param {Object} session - The session object
 * @returns {Array} The user choice array (empty array if none)
 */
export const getUserChoice = (session) => 
  session?.state?.verification?.user_choice || [];

/**
 * Check if the user has made a choice
 * @param {Object} session - The session object
 * @returns {boolean} True if user has made a choice
 */
export const hasUserChoice = (session) => {
  const choices = getUserChoice(session);
  return Array.isArray(choices) && choices.length > 0;
};

// ============================================================================
// Order Accessors
// ============================================================================

/**
 * Get the complete order confirmation data (the bill object with orders, message, and grand_total)
 * @param {Object} session - The session object
 * @returns {Object|null} The bill object with orders array, message, and grand_total, or null
 */
export const getOrderConfirmationData = (session) => 
  session?.state?.ordering?.confirmation?.bill || null;

/**
 * Get just the order confirmation message text
 * @param {Object} session - The session object
 * @returns {string|null} The order confirmation message string or null
 */
export const getOrderConfirmationMessage = (session) => 
  session?.state?.ordering?.confirmation?.bill?.message || null;

/**
 * Get the order bill details
 * @param {Object} session - The session object
 * @returns {Object|null} The bill object with orders array, message, and grand_total, or null
 */
export const getOrderBill = (session) => 
  session?.state?.ordering?.confirmation?.bill || null;

/**
 * Get the orders array from the bill
 * @param {Object} session - The session object
 * @returns {Array} The orders array (empty array if none)
 */
export const getOrdersFromBill = (session) => 
  session?.state?.ordering?.confirmation?.bill?.orders || [];

/**
 * Get the grand total from the bill
 * @param {Object} session - The session object
 * @returns {number|null} The grand total or null
 */
export const getGrandTotal = (session) => 
  session?.state?.ordering?.confirmation?.bill?.grand_total || null;

/**
 * Get the order status array
 * @param {Object} session - The session object
 * @returns {Array} The order status array (empty array if none)
 */
export const getOrderStatus = (session) => 
  session?.state?.ordering?.order_status || [];

// ============================================================================
// Combined Checks and Utilities
// ============================================================================

/**
 * Check if session has a verification message
 * @param {Object} session - The session object
 * @returns {boolean} True if verification message exists
 */
export const hasVerificationMessage = (session) => 
  Boolean(getMealChoiceVerificationMessage(session));

/**
 * Check if the chat icon should be shown for this session
 * @param {Object} session - The session object
 * @returns {boolean} True if chat icon should be shown
 */
export const shouldShowChatIcon = (session) => 
  getWorkflowStatus(session) === WORKFLOW_STATUS.AWAITING_USER_APPROVAL && 
  hasVerificationMessage(session);

/**
 * Get session creation time as a formatted string
 * @param {Object} session - The session object
 * @returns {string} Formatted date/time string
 */
export const getFormattedCreateTime = (session) => {
  if (!session?.create_time) return 'Unknown';
  return new Date(session.create_time).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};
