# from typing import Optional
from typing import Any
import uuid
from google.adk.agents import LlmAgent
from google.adk.tools.function_tool import FunctionTool
from google.adk.tools.tool_context import ToolContext


from src.auto_nom_agent.configs import retry_options, model
from google.adk.models.google_llm import Gemini

from src.schema.restaurant import FoodOrder, OrderStatus
from rich.table import Table

from rich.console import Console
from google.adk.agents.callback_context import CallbackContext

from src.utils.state import is_valid_transition

console = Console()


def print_food_order(food_order: FoodOrder):
    table = Table(title=f"Food Order : {food_order.id}")
    table.add_column("Menu Item ID")
    table.add_column("Quantity")
    table.add_column("Customizations")
    for order_items in food_order.order:
        table.add_row(order_items.id, str(order_items.quantity),
                      ",".join(order_items.customizations))


def place_food_order(food_order: FoodOrder, tool_context: ToolContext) -> dict[str, Any]:
    """Places the food order with the restaurant and returns the order status

    Args:
        food_order (FoodOrder): dict describing the order for the restaurant

    Returns:
        dict[str,Any]: dict describing the operation status, message and order_status dict
    """
    # print food order for now.
    print_food_order(food_order=food_order)
    # create dummy Order status
    order_status = OrderStatus(
        id=str(uuid.uuid4()),
        restaurant_id=food_order.id,
        status="ORDER_PLACED",
        order=food_order.model_dump()
    )

    # get current list of orders
    current_order_statuses = getattr(tool_context.state, "ordering_order_status", [])

    # update list of orders
    current_order_statuses.append(order_status.model_dump())

    # update the state
    tool_context.state["ordering_order_status"] = current_order_statuses

    return {
        "status": "success",
        "message": "Order placed successfully",
        "order_status": order_status
    }


# def update_order_state(order_status: OrderStatus, tool_context: ToolContext) -> dict[str, str]:
#     """Updates order state list with latest order status

#     Args:
#         order_status (OrderStatus): dict describing the current order status

#     Returns:
#         dict[str,str]: dict with message and status for the update action
#     """

#     # get current list of orders
#     current_order_state = getattr(tool_context.state, "ordering", {})
#     current_order_statuses = getattr(current_order_state, "order_status", [])

#     # update list of orders
#     current_order_statuses.append(order_status.model_dump())

#     # update the state
#     tool_context.state["ordering"]["order_status"] = current_order_statuses

#     # return update status
#     return {
#         "status": "success",
#         "message": f"order state updated with order id : {order_status.id}"
#     }


def update_order_confirmation_message(order_confirmation_message: dict[str, Any], tool_context: ToolContext) -> dict[str, str]:
    """Updates order state list with latest order status

    Args:
        order_status (OrderStatus): dict describing the current order status

    Returns:
        dict[str,str]: dict with message and status for the update action
    """

    # update the state
    tool_context.state["ordering_confirmation"] = order_confirmation_message

    # return update status
    return {
        "status": "success",
        "message": f"state updated with order confirmation message"
    }


def on_before_meal_order_executor_agent_call(callback_context: CallbackContext) -> None:
    current_state = callback_context.state["workflow_status"]
    new_state = "PLACING_ORDER"

    if is_valid_transition(current_state, new_state):
        callback_context.state["workflow_status"] = new_state

    return None


def on_after_meal_order_executor_agent_call(callback_context: CallbackContext) -> None:
    current_state = callback_context.state["workflow_status"]
    new_state = "ORDER_CONFIRMED"

    if is_valid_transition(current_state, new_state):
        callback_context.state["workflow_status"] = new_state

    return None


meal_order_executor = LlmAgent(
    model=Gemini(model=model, retry_options=retry_options),
    name="MealOrderExecutor",
    description="Specialized agent that executes the final food order based on user selection and preferences.",
    instruction="""
 You are a diligent and detail-oriented ordering agent. Your goal is to execute food orders based on user selection. 
    You must handle cases where the user selects items from multiple different restaurants by placing separate orders for each, but summarizing them into ONE final confirmation.

    **INPUT CONTEXT:**
    - **User Preferences:** {user_dietary_preferences}
    - **Allergies (CRITICAL):** {user_allergies}
    - **Available Options:** {planning_options} 
    - **User Selection:** {verification_user_choice} (List of indices, e.g., [1] or [1, 3])

    **EXECUTION ALGORITHM:**

    1. **Analyze & Group:**
       - Map the `{verification_user_choice}` indices back to the specific items in `{planning_options}`.
       - Group these items by `restaurant_name`.
       - *Validation:* Ensure no item conflicts with `{user_allergies}`.

    2. **Execute Orders (The Loop):**
       - Iterate through EACH restaurant group:
         - Construct the order payload for that specific restaurant.
         - Call `place_food_order` for that restaurant.
         - *Internal Memory:* Keep track of the cost and details for this successful order.
          ** FOOD ORDER SCHEMA for `place_food_order` tool **
            {
                "id": "String restaurant id from where to order the food"
                "order": [
                    "id": "menu item id to order",
                    "quantity": "integer for the quantity to order",
                    "customizations":["string list of customizations for the order"]
                ]
            }

    3. **Generate Unified Confirmation (The Receipt):**
       - **CRITICAL:** Do NOT call this tool inside the loop. Call it only ONCE after ALL orders are placed.
       - Calculate the **Grand Total** (Sum of all orders).
       - Construct the final `bill` object containing the list of all orders.
       - Use `update_order_confirmation_message` to save the final summary.

    **CONFIRMATION SCHEMA (for `update_order_confirmation_message`):**
    The `bill` argument must be a JSON object matching this structure to support multi-restaurant orders:
    {
        "message" "String - A friendly message generated by you informing users that their order has been placed"
        "orders": [
            {
                "restaurant_name": "String",
                "order_id": "String (from place_food_order response)",
                "items": [
                    {
                        "name": "String",
                        "quantity": Number,
                        "price": Number,
                        "customizations": "String (comma separated)"
                    }
                ],
                "sub_total": Number
            }
        ],
        "grand_total": Number (Sum of all subtotals)
    }

    **CRITICAL RULES:**
    - If the user selected items from 2 different restaurants, you must call `place_food_order` TWICE, but `update_order_confirmation_message` ONLY ONCE.
    - Double-check the price. Ensure `sub_total` and `grand_total` are accurate.
    - ALWAYS delegate back to the parent `auto_nom_agent` agent after successfully saving the confirmation.
    """,
    tools=[FunctionTool(
        place_food_order), FunctionTool(update_order_confirmation_message)],
    before_agent_callback=on_before_meal_order_executor_agent_call,
    after_agent_callback=on_after_meal_order_executor_agent_call

)
