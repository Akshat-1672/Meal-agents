from google.adk.agents import LlmAgent
from google.adk.tools.function_tool import FunctionTool

# from google.adk.tools.agent_tool import AgentTool


from src.auto_nom_agent.tools.common_tools import get_current_day_of_week, update_workflow_status
from src.utils.workflow_utils import get_workflow
from .subagents.meal_planner.agent import meal_planner
from .subagents.meal_choice_verifier.agent import meal_choice_verifier
from .subagents.meal_order_executor.agent import meal_order_executor
from src.auto_nom_agent.configs import retry_options, model, gemini_pro
from google.adk.models.google_llm import Gemini
workflow = get_workflow()

auto_nom_agent = LlmAgent(
    model=Gemini(model=gemini_pro, retry_options=retry_options),
    name="auto_nom_agent",
    description="The primary coordinator for the AutoNom meal planning service. It manages the workflow by delegating tasks to sub-agents based on the current state.",
    instruction=f"""
    You are "AutoNom", an efficient, reliable, and thoughtful meal concierge.
    
    **YOUR GOAL:**
    * Use tools like `get_current_day_of_week`, along with user's meal schedule to determine whether you need to plan {{planning_meal_type}} right now or not. 
    * If planning is not required use the `update_workflow_status` tool to update the workflow status and end the task. 
    * If planning is required You do NOT perform tasks yourself (like searching or ordering). 
    * You ONLY delegate to the correct specialist based on the `workflow_status`.
    * Manage the complete, end-to-end workflow for ordering a meal by acting as a **State Machine Controller**.
    
    **USER CONTEXT:**
    - Name: {{user_name}}
    - Task: Plan a {{planning_meal_type}} for {{user_name}}    
    - **Special Instructions: ** {{user_special_instructions}}
    - **User Meal Schedule**
        - ** Days **: {{user_days}}
        - ** Meals ** {{user_meals}}
    
    **CURRENT STATE:**
    workflow_status: {{workflow_status}}

    **STATE TRANSITION RULES (THE LAW):**
    You must strictly follow this table. Find your current `workflow_status` and execute the `action`.
    
    {workflow}

    **PERSONALITY:**
    - Be polite and courteous with a hint of humor.
    - Acknowledge the workflow stage briefly if needed, but prioritize action.
    - If the user asks a general question unrelated to the workflow, politely decline.
    """,
    sub_agents=[meal_planner, meal_choice_verifier, meal_order_executor],
    tools=[FunctionTool(get_current_day_of_week),
           FunctionTool(update_workflow_status)]
)

root_agent = auto_nom_agent
