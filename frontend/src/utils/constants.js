export const DAYS = ['M', 'T', 'W', 'Th', 'F', 'Sa', 'Su'];

export const FULL_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export const ALLERGIES_LIST = [
  { name: 'Peanuts', icon: 'bowl-rice' },
  { name: 'Dairy', icon: 'cheese' },
  { name: 'Gluten', icon: 'bread-slice' },
  { name: 'Shellfish', icon: 'shrimp' },
  { name: 'Soy', icon: 'seedling' },
  { name: 'Eggs', icon: 'egg' },
  { name: 'Fish', icon: 'fish' },
  { name: 'Tree Nuts', icon: 'tree' },
];

// Polling intervals (in milliseconds)
export const POLLING_INTERVALS = {
  SESSION_STATE: 5000,      // Poll active session state every 3 seconds
  SESSION_HISTORY: 20000,   // Poll session history every 10 seconds (when no active session)
  CELEBRATION_DISPLAY: 30000, // Show celebration popup for 10 seconds
  RESUME_AFTER_FEEDBACK: 5000, // Delay before resuming polling after user feedback
};

export const WORKFLOW_STATUS = {
  IDLE: 'IDLE',
  STARTED: 'STARTED',
  MEAL_PLANNING_STARTED: 'MEAL_PLANNING_STARTED',
  MEAL_PLANNING_COMPLETE: 'MEAL_PLANNING_COMPLETE',
  AWAITING_USER_APPROVAL: 'AWAITING_USER_APPROVAL',
  USER_APPROVAL_RECEIVED: 'USER_APPROVAL_RECEIVED',
  USER_REJECTION_RECEIVED: 'USER_REJECTION_RECEIVED',
  MEAL_CHOICE_VERIFICATION_STARTED: 'MEAL_CHOICE_VERIFICATION_STARTED',
  PLACING_ORDER: 'PLACING_ORDER',
  ORDER_EXECUTION_STARTED: 'ORDER_EXECUTION_STARTED',
  ORDER_CONFIRMED: 'ORDER_CONFIRMED',
  NO_PLANNING_NEEDED: 'NO_PLANNING_NEEDED',
  COMPLETED: 'COMPLETED',
  ERROR: 'ERROR'
};

// Workflow state transitions mapping
export const STATE_TRANSITIONS = {
  IDLE: ['MEAL_PLANNING_STARTED', 'NO_PLANNING_NEEDED'],
  MEAL_PLANNING_STARTED: ['MEAL_PLANNING_COMPLETE'],
  MEAL_PLANNING_COMPLETE: ['AWAITING_USER_APPROVAL'],
  AWAITING_USER_APPROVAL: ['USER_APPROVAL_RECEIVED', 'USER_REJECTION_RECEIVED'],
  USER_APPROVAL_RECEIVED: ['PLACING_ORDER'],
  USER_REJECTION_RECEIVED: ['MEAL_PLANNING_STARTED'],
  PLACING_ORDER: ['ORDER_CONFIRMED'],
  ORDER_CONFIRMED: ['']
};

// Get progress percentage based on workflow status
export const getWorkflowProgress = (status) => {
  const progressMap = {
    [WORKFLOW_STATUS.IDLE]: 0,
    [WORKFLOW_STATUS.STARTED]: 10,
    [WORKFLOW_STATUS.MEAL_PLANNING_STARTED]: 20,
    [WORKFLOW_STATUS.MEAL_PLANNING_COMPLETE]: 40,
    [WORKFLOW_STATUS.AWAITING_USER_APPROVAL]: 50,
    [WORKFLOW_STATUS.USER_APPROVAL_RECEIVED]: 60,
    [WORKFLOW_STATUS.USER_REJECTION_RECEIVED]: 30,
    [WORKFLOW_STATUS.PLACING_ORDER]: 75,
    [WORKFLOW_STATUS.ORDER_EXECUTION_STARTED]: 75,
    [WORKFLOW_STATUS.ORDER_CONFIRMED]: 100,
    [WORKFLOW_STATUS.NO_PLANNING_NEEDED]: 100,
    [WORKFLOW_STATUS.COMPLETED]: 100,
    [WORKFLOW_STATUS.ERROR]: 0
  };
  return progressMap[status] || 0;
};

// Get status display information
export const getStatusDisplay = (status) => {
  const displayMap = {
    [WORKFLOW_STATUS.IDLE]: {
      title: 'No Active Session',
      subtitle: 'Start a meal plan from the Meals tab',
      isActive: false
    },
    [WORKFLOW_STATUS.STARTED]: {
      title: 'Workflow Started',
      subtitle: 'Processing your request...',
      isActive: true
    },
    [WORKFLOW_STATUS.MEAL_PLANNING_STARTED]: {
      title: 'Planning Your Meal',
      subtitle: 'Finding the best options for you...',
      isActive: true
    },
    [WORKFLOW_STATUS.MEAL_PLANNING_COMPLETE]: {
      title: 'Meal Planning Complete',
      subtitle: 'Preparing options for your approval...',
      isActive: true
    },
    [WORKFLOW_STATUS.AWAITING_USER_APPROVAL]: {
      title: 'Awaiting Your Approval',
      subtitle: 'The agent needs your input to continue',
      isActive: true
    },
    [WORKFLOW_STATUS.USER_APPROVAL_RECEIVED]: {
      title: 'Processing Your Response',
      subtitle: 'The agent is continuing with your selection...',
      isActive: true
    },
    [WORKFLOW_STATUS.USER_REJECTION_RECEIVED]: {
      title: 'Replanning Meal',
      subtitle: 'Finding alternative options...',
      isActive: true
    },
    [WORKFLOW_STATUS.PLACING_ORDER]: {
      title: 'Placing Your Order',
      subtitle: 'Executing the order...',
      isActive: true
    },
    [WORKFLOW_STATUS.ORDER_EXECUTION_STARTED]: {
      title: 'Placing Your Order',
      subtitle: 'Executing the order...',
      isActive: true
    },
    [WORKFLOW_STATUS.ORDER_CONFIRMED]: {
      title: 'Order Confirmed! 🎉',
      subtitle: 'Your meal has been successfully ordered',
      isActive: false
    },
    [WORKFLOW_STATUS.NO_PLANNING_NEEDED]: {
      title: 'No Planning Needed',
      subtitle: 'No meal planning is required at this time',
      isActive: false
    },
    [WORKFLOW_STATUS.COMPLETED]: {
      title: 'Session Completed',
      subtitle: 'All done!',
      isActive: false
    },
    [WORKFLOW_STATUS.ERROR]: {
      title: 'Error Occurred',
      subtitle: 'Something went wrong',
      isActive: false
    }
  };
  
  return displayMap[status] || {
    title: 'No Active Session',
    subtitle: 'Start a meal plan from the Meals tab',
    isActive: false
  };
};
