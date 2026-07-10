# from typing import Optional
from typing import Any, Optional
from google.adk.agents import LlmAgent
from google.adk.tools.function_tool import FunctionTool
from google.adk.tools.agent_tool import AgentTool
from google.adk.tools.tool_context import ToolContext

from src.auto_nom_agent.tools.common_tools import get_current_day_of_week
from src.schema.restaurant import Restaurants
from src.schema.meals import MealOptions
from src.utils.restaurant_utils import (
    get_restaurant_list,
    get_restaurant_detail,
    get_cuisines,
    get_restaurants_by_cuisine,
    get_tags,
    get_restaurants_by_tags,
    get_menu_items,
    get_dietary_tags,
    get_menu_items_by_dietary_tags
)
from src.auto_nom_agent.configs import retry_options, model,gemini_pro
from google.adk.models.google_llm import Gemini
from google.adk.agents.callback_context import CallbackContext

from src.utils.state import is_valid_transition


def get_restaurant_list_tool(tool_context: ToolContext) -> dict[str, Restaurants]:
    """
    [EXPENSIVE] Retrieves a FULL list of all restaurants.

    ⚠️ WARNING: This returns a very large dataset. 
    Only use this as a last resort if specific filters (cuisine, tags) yield no results.
    Prefer `get_restaurants_by_cuisine` or `get_restaurants_by_tags` for efficiency.

    Returns:
        Restaurants: List of all available restaurants.
    """
    restaurant_list = get_restaurant_list()
    return {
        "restaurant_list": restaurant_list
    }


def get_available_cuisines_list(tool_context: ToolContext) -> dict[str, Any]:
    """
    [DISCOVERY] Gets the list of unique cuisines available in the area.

    Use this FIRST to understand what categories are available before searching.

    Returns:
        dict[str, Any]: List of cuisine strings (e.g., ["Italian", "Vegan", "Thai"]).
    """
    cuisines = get_cuisines()
    return {
        "cuisines": cuisines
    }


def get_restaurant_detail_tool(tool_context: ToolContext, restaurant_id: str) -> dict[str, Any]:
    """
    Gets detailed metadata for a specific restaurant ID.

    Use this after you have selected a candidate to verify details like rating or address.

    Args:
        restaurant_id (str): The unique ID (e.g., "r_101").
    """
    restaurant = get_restaurant_detail(restaurant_id)
    return {
        "restaurant": restaurant
    }


def get_restaurants_by_cuisine_tool(tool_context: ToolContext, cuisine: str) -> dict[str, Any]:
    """
    [EFFICIENT] Finds restaurants matching a specific cuisine.

    This is the preferred method for finding candidates when the user has a general preference.

    Args:
        cuisine (str): The cuisine type (e.g., "Italian"). Case-insensitive.
    """
    result = get_restaurants_by_cuisine(cuisine)
    return result


def get_tags_tool(tool_context: ToolContext) -> dict[str, Any]:
    """
    [DISCOVERY] Gets the list of available descriptive tags (e.g., 'Late Night', 'Cozy').
    """
    tags = get_tags()
    return {
        "tags": tags
    }


def get_restaurants_by_tags_tool(tool_context: ToolContext, tags: list[str]) -> dict[str, Any]:
    """
    [EFFICIENT] Finds restaurants that match ALL provided tags.

    Args:
        tags (list[str]): List of tags. Example: ["Vegan", "Outdoor Seating"]
    """
    result = get_restaurants_by_tags(tags)
    return result


def get_menu_items_tool(tool_context: ToolContext, restaurant_id: Optional[str] = None) -> dict[str, Any]:
    """
    Retrieves the full menu. 

    If `restaurant_id` is provided, returns menu for that specific place.
    If None, returns menus for ALL restaurants (Warning: Large output).
    """
    result = get_menu_items(restaurant_id)
    return result


def get_dietary_tags_tool(tool_context: ToolContext) -> dict[str, Any]:
    """
    [DISCOVERY] Gets available dietary restrictions tags (e.g., 'Gluten-Free', 'Nut-Free').
    """
    dietary_tags = get_dietary_tags()
    return {
        "dietary_tags": dietary_tags
    }


def get_menu_items_by_dietary_tags_tool(tool_context: ToolContext, tags: list[str]) -> dict[str, Any]:
    """
    [SEARCH] Finds specific menu items across ALL restaurants that match dietary needs.

    Use this to find specific DISHES for users with strict allergies or diets.

    Args:
        tags (list[str]): Dietary tags. Example: ["Gluten-Free", "Vegan"]
    """
    result = get_menu_items_by_dietary_tags(tags)
    return result


restaurant_scout_agent = LlmAgent(
    model=Gemini(model=gemini_pro, retry_options=retry_options),
    name="restaurant_scout_agent",
    description="Specialized researcher agent that queries external tools to find and at least 3 optimal restaurant options based on specific user criteria.",
    instruction="""
    You are an expert Restaurant Scout Agent. 
    Your goal is to research, filter, and select at least 3 distinct meal options that best match the user's specific needs.
    REMEMBER Keep the options as diverse as possible

    **CONTEXT:**
    You are processing a request to plan {planning_meal_type} for {user_name}. You must strictly adhere to their preferences, allergies and special instructions absolutely. 
    User preferences are below.
    IMPORTANT Please confirm you can see these preferences

    ** User Preferences **

    - **User Meal Schedule**
        - ** Days **: {{user_days}}
        - ** Meals ** {{user_meals}}
    
    - **Dietary Preferences:** 
    {user_dietary_preferences}
    
    - **Allergies :** 
    {user_allergies}
    
    - **Special Instructions: ** 
    {user_special_instructions}
    
    
    - **History:** {planning_options} (Do not repeat recent suggestions if possible)
    - **Recent Feedback:** {verification_user_feedback} (Use this to adjust your search strategy)

    **AVAILABLE TOOLS & USE CASES:**
    You have access to the following tools. Use them strategically to narrow down options efficiently.

    1. **`get_available_cuisines_list`**:
       - *Use Case:* Call this FIRST to see what categories (Italian, Thai, Vegan, etc.) exist in the area.
    
    2. **`get_tags_tool`** / **`get_dietary_tags_tool`**:
       - *Use Case:* Use these to discover specific descriptive tags (e.g., "Late Night", "Gluten-Free") to refine your search.

    3. **`get_restaurants_by_cuisine_tool(cuisine)`**:
       - *Use Case:* The primary search tool. Use this if the user's preferences or feedback imply a specific cuisine (e.g., "I want something spicy" -> search "Indian" or "Thai").

    4. **`get_restaurants_by_tags_tool(tags)`**:
       - *Use Case:* Use this for lifestyle constraints (e.g., ["Vegan", "Outdoor Seating"]).

    5. **`get_menu_items_by_dietary_tags_tool(tags)`**:
       - *Use Case:* Use this for strict dietary needs (e.g., ["Gluten-Free", "Nut-Free"]) to find safe dishes directly.

    6. **`get_menu_items_tool(restaurant_id)`**:
       - *Use Case:* Call this for a *specific* restaurant candidate to validate they have a meal that fits the user's budget and calorie goals.

    7. **`get_restaurant_detail_tool(restaurant_id)`**:
       - *Use Case:* Final verification of a restaurant's rating or details before adding it to your final list.

    8. **`get_restaurant_list_tool`**:
       - *Use Case:* [EXPENSIVE] Use only as a last resort if targeted searches fail. Returns a large, unfiltered list.

    **EXECUTION ALGORITHM:**
    Follow these steps in order. Do not skip steps.

    1. **Broad Search:** - Start by identifying relevant cuisines or tags based on user preferences.
       - Use the targeted search tools (Cuisine/Tags) to get a candidate list.

    2. **Filter & Verify:**
       - From your candidate list, select potential restaurants.
       - Use `get_menu_items_tool` to ensure the restaurant serves a meal that strictly matches **Allergies** and **Dietary Preferences**.
       - *Constraint:* Do not suggest a restaurant if you cannot find at least one compliant meal item.

    3. **Selection:**
       - Select at least 3 distinct options. 
       - Aim for variety (e.g., one salad, one warm meal, one "fun" option) unless the user requested something specific.

    4. **Final Output:**
       - You must return the result as a strictly formatted JSON object. 
       - Do not include conversational filler before or after the JSON.

    **OUTPUT SCHEMA:**
    ```json
    {
        "options": [
            {
                "id": "String (Restaurant ID)",
                "name": "String (Restaurant Name)",
                "description": "String (Short marketing summary of why this was chosen)",
                "order": [
                    {
                        "id": "String (Menu Item ID)",
                        "name": "String (Name of the specific dish)",
                        "price": Number (Float),
                        "calories": Number (Integer)
                    }
                ]
            }
        ]
    }
    ```    
    **CRITICAL RULES:**
    - ALWAYS delegate back to the parent `auto_nom_agent` agent after finishing your task.

    """,
    # output_schema=MealOptions,
    tools=[
        FunctionTool(get_restaurant_list_tool), FunctionTool(
            get_available_cuisines_list),
        FunctionTool(get_restaurant_detail_tool), FunctionTool(
            get_restaurants_by_cuisine_tool),
        FunctionTool(get_tags_tool), FunctionTool(
            get_restaurants_by_tags_tool),
        FunctionTool(get_menu_items_tool), FunctionTool(get_dietary_tags_tool),
        FunctionTool(get_menu_items_by_dietary_tags_tool),
        FunctionTool(get_current_day_of_week)
    ],
)


def update_meal_options(options: MealOptions, tool_context: ToolContext) -> dict[str, str]:
    """Saves the selected meal options for the user

    Args:
        options (MealOptions): dictionary representing list of meal options

    Returns:
        dict[str,str]: response dictionary with update operation status and message
    """
    tool_context.state["planning_options"] = options.model_dump()

    return {
        "status": "success",
        "message": "meal options are saved successfully"
    }


def on_before_meal_planner_agent_call(callback_context: CallbackContext) -> None:
    current_state = callback_context.state["workflow_status"]
    new_state = "MEAL_PLANNING_STARTED"

    if is_valid_transition(current_state, new_state):
        callback_context.state["workflow_status"] = new_state

    return None


def on_after_meal_planner_agent_call(callback_context: CallbackContext) -> None:
    current_state = callback_context.state["workflow_status"]
    new_state = "MEAL_PLANNING_COMPLETE"

    # verify if we have meal options
    meal_options = getattr(callback_context.state, "planning_options", [])
    # options = meal_options.get("options", [])

    if meal_options and len(meal_options) == 0:
        new_state = "MEAL_PLANNING_FAILED"

    if is_valid_transition(current_state, new_state):
        callback_context.state["workflow_status"] = new_state

    return None


meal_planner = LlmAgent(
    model=Gemini(model=model, retry_options=retry_options),
    name="MealPlanner",
    description="Scans various restaurant options and generates choice of at least 3 options",
    instruction="""
    You are a creative and diligent meal planner. 
    Your role is to plan a perfect next meal for the user.
    To do that you have access to following agent and tools
    * `restaurant_scout_agent` tool that will research and return at least 3 restaurants based on user preferences and feedback.        

    ** Your Duties **
    * Step 0: Welcome the user and inform them that you are finding restaurants for them in an exciting manner. 
    * Step 1: Use the `restaurant_scout_agent` tool to get the list of restaurants for the user.
    * Step 2: IMPORTANT after getting the list of restaurants use the `update_meal_options` tool to save the options for the user. DO NOT SKIP THIS STEP
    * Step 3: After updating the state, your task is done. Delegate back to parent `auto_nom_agent` agent.
    
    ** User Preferences **
    - **User Meal Schedule**
        - ** Days **: {{user_days}}
        - ** Meals ** {{user_meals}}
        
    - **Dietary Preferences:** 
    {user_dietary_preferences}
    
    - **Allergies :** 
    {user_allergies}
    
    - **Special Instructions: ** 
    {user_special_instructions}

    
    
    ** Current Workflow Status **
    {workflow_status}
    
    ** User Feedback **
    Previously Shared Options:
    {planning_options}
    
    Feedback on previous options:
    {verification_user_feedback}
    
    """,
    tools=[AgentTool(restaurant_scout_agent), FunctionTool(
        update_meal_options)],
    before_agent_callback=on_before_meal_planner_agent_call,
    after_agent_callback=on_after_meal_planner_agent_call
)
