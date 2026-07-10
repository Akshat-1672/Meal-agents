from utils.logger import ServiceLogger

def is_valid_transition(current_state: str, new_state: str) -> bool:
    """Helper function to check the validity of state transition

    Args:
        current_state (str): _description_
        new_state (str): _description_

    Returns:
        bool: _description_
    """
    ServiceLogger.log_info(f"Checking state transition: {current_state} -> {new_state}", context="StateTransition")
    is_valid = False

    state_transitions = {
        "IDLE": ["MEAL_PLANNING_STARTED", "NO_PLANNING_NEEDED"],
        "MEAL_PLANNING_STARTED": ["MEAL_PLANNING_COMPLETE", "MEAL_PLANNING_FAILED"],
        "MEAL_PLANNING_FAILED":["MEAL_PLANNING_STARTED"],
        "MEAL_PLANNING_COMPLETE": ["AWAITING_USER_APPROVAL"],
        "AWAITING_USER_APPROVAL": ["USER_APPROVAL_RECEIVED", "USER_REJECTION_RECEIVED"],
        "USER_APPROVAL_RECEIVED": ["PLACING_ORDER"],
        "USER_REJECTION_RECEIVED": ["MEAL_PLANNING_STARTED"],
        "PLACING_ORDER": ["ORDER_CONFIRMED"],
        "ORDER_CONFIRMED": [""]
    }

    if new_state in state_transitions[current_state]:
        is_valid = True
        ServiceLogger.log_success(f"Valid state transition: {current_state} -> {new_state}", context="StateTransition")
    else:
        ServiceLogger.log_warning(f"Invalid state transition: {current_state} -> {new_state}", context="StateTransition")

    return is_valid
