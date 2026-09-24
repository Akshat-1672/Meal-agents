export type WorkflowStatus =
  | 'IDLE'
  | 'NO_PLANNING_NEEDED'
  | 'MEAL_PLANNING_STARTED'
  | 'MEAL_PLANNING_COMPLETE'
  | 'MEAL_PLANNING_FAILED'
  | 'AWAITING_USER_APPROVAL'
  | 'USER_APPROVAL_RECEIVED'
  | 'USER_REJECTION_RECEIVED'
  | 'PLACING_ORDER'
  | 'ORDER_CONFIRMED'
  | '';

export const STATE_TRANSITIONS: Record<WorkflowStatus, WorkflowStatus[]> = {
  IDLE: ['MEAL_PLANNING_STARTED', 'NO_PLANNING_NEEDED'],
  NO_PLANNING_NEEDED: [],
  MEAL_PLANNING_STARTED: ['MEAL_PLANNING_COMPLETE', 'MEAL_PLANNING_FAILED'],
  MEAL_PLANNING_FAILED: ['MEAL_PLANNING_STARTED'],
  MEAL_PLANNING_COMPLETE: ['AWAITING_USER_APPROVAL'],
  AWAITING_USER_APPROVAL: ['USER_APPROVAL_RECEIVED', 'USER_REJECTION_RECEIVED'],
  USER_APPROVAL_RECEIVED: ['PLACING_ORDER'],
  USER_REJECTION_RECEIVED: ['MEAL_PLANNING_STARTED'],
  PLACING_ORDER: ['ORDER_CONFIRMED'],
  ORDER_CONFIRMED: [''],
  '': [],
};

export function isValidTransition(current: WorkflowStatus, target: WorkflowStatus): boolean {
  const allowed = STATE_TRANSITIONS[current] || [];
  const valid = allowed.includes(target);
  console.log(`[StateTransition] Check transition: ${current} -> ${target} [Valid: ${valid}]`);
  return valid;
}
