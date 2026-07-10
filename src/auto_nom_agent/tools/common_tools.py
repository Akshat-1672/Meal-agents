from datetime import datetime
from google.adk.tools.tool_context import ToolContext

from src.utils.state import is_valid_transition


def update_workflow_status(status: str, tool_context: ToolContext) -> dict[str, str]:
    """Updates the workflow status value

    Args:
        status (str): String value for the new workflow status

    Returns:
        dict[str, str]: Returns dictionary with message and status of workflow status update. 
    """
    current_status = tool_context.state["workflow_status"]

    if is_valid_transition(current_state=current_status, new_state=status):
        tool_context.state["workflow_status"] = status
        return {
            "status": "success",
            "message": f"workflow status updated from {current_status} to {status}"
        }

    return {
        "status": "failure",
        "message": f"workflow status cannot updated from {current_status} to {status}"
    }

def get_current_day_of_week(tool_context: ToolContext):
    """
    Returns the current day of the week as a string (e.g., "Monday", "Tuesday").
    """
    mock_day = tool_context.state["mock_day"]
    
    if mock_day:
        return mock_day
    
    current_datetime = datetime.now()
    return current_datetime.strftime("%A")
