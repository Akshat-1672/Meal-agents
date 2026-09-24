import { Type } from '@google/genai';
import { LlmAgent, ToolDefinition, SessionState, AgentContext } from './types';
import { isValidTransition } from '../utils/state';
import { runScoutGraph } from '../lib/scout-graph';
import {
  // Food (Delivery) MCP tools — used by MealOrderExecutor
  mcpUpdateFoodCartTool,
  mcpPlaceFoodOrderTool,
  // Dineout MCP tools — used by MealOrderExecutor
  mcpMakeReservationTool,
  // Instamart (Cook) MCP tools — used by MealOrderExecutor
  mcpCheckoutGroceryTool,
} from '../services/mcp-tools';

// =============================================================================
// SHARED TOOL: Update Meal Options
// =============================================================================

export const updateMealOptionsTool: ToolDefinition = {
  declaration: {
    name: 'update_meal_options',
    description: 'Saves the collected list of candidate meal options into persistent session state. Must be called with all options after all scouts complete.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        options: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              type: { type: Type.STRING, description: 'Modality: delivery, cook, or dineout' },
              title: { type: Type.STRING, description: 'Restaurant name or recipe name' },
              subText: { type: Type.STRING, description: 'Short display summary' },
              cost: { type: Type.NUMBER, description: 'Total cost in INR' },
              timeMinutes: { type: Type.NUMBER, description: 'ETA or prep time in minutes' },
              deepLinkUrl: { type: Type.STRING, description: 'Checkout or reservation URL' },
              restaurant_id: { type: Type.STRING },
              items: { type: Type.ARRAY, items: { type: Type.OBJECT } },
              recipe_id: { type: Type.STRING },
              ingredients: { type: Type.ARRAY, items: { type: Type.OBJECT } },
              dineout_restaurant_id: { type: Type.STRING },
              next_slot: { type: Type.STRING },
            },
            required: ['type', 'title', 'subText', 'cost', 'timeMinutes', 'deepLinkUrl'],
          },
        },
      },
      required: ['options'],
    },
  },
  execute: async (args: any, context: AgentContext) => {
    context.state.planning_options = args.options;
    return { status: 'success', message: `Saved ${args.options.length} meal options.` };
  },
};

// =============================================================================
// GRAPH TOOL: Run parallel scout graph (replaces 3 sequential sub-agents)
// =============================================================================

/**
 * Tool that triggers the LangGraph parallel fan-out:
 *   START → fanOutRouter → [delivery_node ║ cook_node ║ dineout_node] → synthesizer → END
 *
 * All three Swiggy MCP scouts execute simultaneously. Results are merged
 * and sorted by cost before being saved to session state.
 */
export const runScoutGraphTool: ToolDefinition = {
  declaration: {
    name: 'run_scout_graph',
    description: 'Launches the parallel Swiggy scout graph. Runs delivery, cook, and dineout scouts simultaneously via LangGraph fan-out and returns synthesized MealOptions sorted by cost. Call this once to collect all options.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        prompt: { type: Type.STRING, description: 'Natural language meal search query (e.g. "High-protein lunch under ₹500")' },
      },
      required: ['prompt'],
    },
  },
  execute: async (args: any, context: AgentContext) => {
    const { state, logEvent } = context;
    logEvent({ type: 'TextResponse', text: '🔀 *Launching parallel scout graph: [Delivery ║ Cook ║ Dineout]...*', isFinalResponse: false });

    const { quotes, errors } = await runScoutGraph({
      prompt: args.prompt,
      userPreferences: state.user_dietary_preferences,
      userAllergies: state.user_allergies || [],
      userLat: state.user_lat || 12.9716,
      userLng: state.user_lng || 77.5946,
      swiggyToken: state.swiggy_token || 'mock-swiggy-token-dev',
    });

    // Save results directly into session state
    state.planning_options = quotes;
    state.planning_modalities = [...new Set(quotes.map((q) => q.type))] as any;

    if (errors.length > 0) {
      logEvent({ type: 'TextResponse', text: `⚠️ *${errors.length} scout node(s) had errors: ${errors.map((e) => e.node).join(', ')}*`, isFinalResponse: false });
    }

    return {
      status: 'success',
      total_options: quotes.length,
      modalities_found: [...new Set(quotes.map((q) => q.type))],
      options_summary: quotes.map((q, i) => `${i + 1}. [${q.type.toUpperCase()}] ${q.title} — ₹${q.cost} (~${q.timeMinutes} min)`),
      errors: errors.length > 0 ? errors : undefined,
    };
  },
};

// =============================================================================
// SUBAGENT: MEAL PLANNER (Uses parallel scout graph)
// =============================================================================

export const mealPlanner: LlmAgent = {
  name: 'MealPlanner',
  description: 'Runs the parallel LangGraph scout graph to collect delivery, cook, and dineout options simultaneously, then summarizes results.',
  instruction: (state: SessionState) => `
    You are the Meal Planner coordinator for AutoNom.
    Your job is to launch the parallel Swiggy scout graph and collect meal options from all three channels at once.

    **USER:** ${state.user_name}
    **MEAL TYPE:** ${state.planning_meal_type}
    **DIETARY PREFERENCES:** ${state.user_dietary_preferences}
    **ALLERGIES:** ${state.user_allergies?.join(', ') || 'None'}
    **SPECIAL INSTRUCTIONS:** ${state.user_special_instructions}
    **PREVIOUS FEEDBACK:** ${state.verification_user_feedback || 'None'}

    **YOUR MANDATORY FLOW:**

    Step 1: Inform the user you are launching parallel searches across Swiggy Food, Instamart, and Dineout simultaneously.

    Step 2: Call run_scout_graph ONCE with a search prompt based on the user's preferences and meal type.
            Example prompt: "${state.user_dietary_preferences} ${state.planning_meal_type} for ${state.user_name}"
            If there is previous feedback, incorporate it: "${state.verification_user_feedback || ''}"

    Step 3: The graph will automatically run all 3 scouts in parallel and return the merged options.
            DO NOT call run_scout_graph more than once.

    Step 4: Briefly summarize what was found (how many options per modality), then hand off.
  `,
  tools: [runScoutGraphTool],
  subAgents: [], // No LLM sub-agents — the graph handles parallel scouting
  beforeCall: (context: AgentContext) => {
    const cur = context.state.workflow_status;
    if (isValidTransition(cur as any, 'MEAL_PLANNING_STARTED')) {
      context.state.workflow_status = 'MEAL_PLANNING_STARTED';
    }
  },
  afterCall: (context: AgentContext) => {
    const cur = context.state.workflow_status;
    const opts = context.state.planning_options || [];
    const nextState = opts.length > 0 ? 'MEAL_PLANNING_COMPLETE' : 'MEAL_PLANNING_FAILED';
    if (isValidTransition(cur as any, nextState)) {
      context.state.workflow_status = nextState;
    }
  },
};

// =============================================================================
// SUBAGENT: MEAL CHOICE VERIFIER
// =============================================================================

export const updateUserChoiceTool: ToolDefinition = {
  declaration: {
    name: 'update_user_choice',
    description: 'Saves the option indexes selected by the user.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        choice: {
          type: Type.ARRAY,
          items: { type: Type.INTEGER },
          description: 'List of 1-based index numbers representing approved options (e.g. [1])',
        },
      },
      required: ['choice'],
    },
  },
  execute: async (args: any, context: AgentContext) => {
    context.state.verification_user_choice = args.choice;
    context.state.workflow_status = 'USER_APPROVAL_RECEIVED';
    return { status: 'success', message: 'User choice saved.' };
  },
};

export const updateUserFeedbackTool: ToolDefinition = {
  declaration: {
    name: 'update_user_feedback',
    description: 'Saves user rejection feedback when they reject all planned options.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        feedback: { type: Type.STRING, description: 'Critique or feedback text from the user' },
      },
      required: ['feedback'],
    },
  },
  execute: async (args: any, context: AgentContext) => {
    context.state.verification_user_feedback = args.feedback;
    context.state.workflow_status = 'USER_REJECTION_RECEIVED';
    return { status: 'success', message: 'User feedback saved.' };
  },
};

export const updateMealChoiceVerificationMessageTool: ToolDefinition = {
  declaration: {
    name: 'update_meal_choice_verification_message',
    description: 'Saves the structured verification choices and intro message for the user approval step.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        message: { type: Type.STRING, description: 'Friendly introduction text (do not list choices inline here)' },
        choices: {
          type: Type.ARRAY,
          description: 'Formatted options for user review — one per planning option',
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              modality: { type: Type.STRING, description: 'delivery, cook, or dineout' },
              title: { type: Type.STRING },
              sub_text: { type: Type.STRING },
              cost: { type: Type.NUMBER },
              time_minutes: { type: Type.NUMBER },
              deep_link_url: { type: Type.STRING },
              ingredients: {
                type: Type.ARRAY,
                description: 'For cook modality, list of grocery ingredients needed',
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    required: { type: Type.BOOLEAN, description: 'True if ingredient is essential, false if optional/pantry staple' }
                  },
                  required: ['name', 'required']
                }
              },
            },
            required: ['id', 'modality', 'title', 'sub_text', 'cost', 'time_minutes', 'deep_link_url'],
          },
        },
      },
      required: ['message', 'choices'],
    },
  },
  execute: async (args: any, context: AgentContext) => {
    context.state.verification_message = args.message;
    context.state.verification_choices = args.choices;
    context.state.workflow_status = 'AWAITING_USER_APPROVAL';
    return { status: 'success', message: 'Verification details saved.' };
  },
};

export const mealChoiceVerifier: LlmAgent = {
  name: 'MealChoiceVerifier',
  description: 'Presents meal options across all three modalities (delivery/cook/dineout) and records user choice or rejection.',
  instruction: (state: SessionState) => `
    You are a helpful assistant that presents meal options and collects the user's choice.

    **ALL AVAILABLE OPTIONS (across all modalities):**
    ${JSON.stringify(state.planning_options, null, 2)}

    **YOUR FLOW:**
    1. If workflow_status is MEAL_PLANNING_COMPLETE and choices have not been saved yet:
       - Format all options into a friendly presentation distinguishing each modality:
         🚴 DELIVERY (ordered from Swiggy Food)
         🍳 COOK (groceries from Instamart, cook at home)
         🍽 DINEOUT (table reservation via Swiggy Dineout)
       - Call update_meal_choice_verification_message with message + choices array.
       - Do NOT just print options in markdown. Use the tool.

    2. If the user has replied:
       - If they pick options (e.g. "I'll go with option 1", "Option 2 and 3") → call update_user_choice with index list.
       - If they reject or want changes (e.g. "Too expensive", "I don't want to cook") → call update_user_feedback.
  `,
  tools: [updateUserChoiceTool, updateUserFeedbackTool, updateMealChoiceVerificationMessageTool],
};

// =============================================================================
// SUBAGENT: MEAL ORDER EXECUTOR
// =============================================================================

export const updateOrderConfirmationMessageTool: ToolDefinition = {
  declaration: {
    name: 'update_order_confirmation_message',
    description: 'Saves the final unified order confirmation/receipt state.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        bill: {
          type: Type.OBJECT,
          properties: {
            message: { type: Type.STRING },
            orders: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  modality: { type: Type.STRING },
                  restaurant_name: { type: Type.STRING },
                  order_id: { type: Type.STRING },
                  time_slot: { type: Type.STRING, description: 'Time slot for dineout (e.g. 8:00 PM)' },
                  party_size: { type: Type.INTEGER, description: 'Number of people for dineout' },
                  recipe_name: { type: Type.STRING, description: 'Recipe name for cook orders' },
                  items: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        name: { type: Type.STRING },
                        quantity: { type: Type.INTEGER },
                        price: { type: Type.NUMBER },
                        customizations: { type: Type.STRING },
                      },
                    },
                  },
                  sub_total: { type: Type.NUMBER },
                },
              },
            },
            grand_total: { type: Type.NUMBER },
          },
          required: ['message', 'orders', 'grand_total'],
        },
      },
      required: ['bill'],
    },
  },
  execute: async (args: any, context: AgentContext) => {
    context.state.ordering_confirmation = args.bill;
    return { status: 'success', message: 'Order confirmation saved.' };
  },
};

export const mealOrderExecutor: LlmAgent = {
  name: 'MealOrderExecutor',
  description: 'Executes the final order/reservation/checkout based on user-selected options and the option modality.',
  instruction: (state: SessionState) => `
    You are the AutoNom Order Executor. Your goal is to complete the checkout for the user's selected meal options.

    **CONTEXT:**
    - User: ${state.user_name}
    - Dietary Preferences: ${state.user_dietary_preferences}
    - Allergies: ${state.user_allergies?.join(', ') || 'None'}
    - All Available Options: ${JSON.stringify(state.planning_options)}
    - User Selection (1-based index): ${JSON.stringify(state.verification_user_choice)}
    - User Request/Modifications: ${state.verification_user_response || 'None'}
    - User Coordinates: lat=${state.user_lat || 12.9716}, lng=${state.user_lng || 77.5946}

    **YOUR FLOW:**
    1. Map each selection index to the corresponding option in planning_options (index is 1-based).
    2. For each selected option, execute the correct checkout flow based on the option's "type":
       
       - type = "delivery":
         a. Call update_food_cart with the option's restaurant_id and items.
         b. Call place_food_order to complete the order.
         c. Record the returned order receipt.

       - type = "cook":
         a. Review the "User Request/Modifications". If the user explicitly stated they already have certain ingredients, REMOVE those ingredients from the option's ingredients list.
         b. Call checkout_grocery with the filtered ingredients and user coordinates.
         c. Record the returned grocery order confirmation.

       - type = "dineout":
         a. Call make_reservation with the option's dineout_restaurant_id, party_size=2, time_slot from next_slot, user_name="${state.user_name}".
         b. Record the returned booking confirmation.

    3. Generate a unified receipt/summary of all completed actions.
    4. Call update_order_confirmation_message with the final bill.
  `,
  tools: [
    // Food delivery checkout
    mcpUpdateFoodCartTool,
    mcpPlaceFoodOrderTool,
    // Cook / Instamart checkout
    mcpCheckoutGroceryTool,
    // Dineout reservation
    mcpMakeReservationTool,
    // Save confirmation
    updateOrderConfirmationMessageTool,
  ],
  beforeCall: (context: AgentContext) => {
    const cur = context.state.workflow_status;
    if (isValidTransition(cur as any, 'PLACING_ORDER')) {
      context.state.workflow_status = 'PLACING_ORDER';
    }
  },
  afterCall: (context: AgentContext) => {
    const cur = context.state.workflow_status;
    if (isValidTransition(cur as any, 'ORDER_CONFIRMED')) {
      context.state.workflow_status = 'ORDER_CONFIRMED';
    }
  },
};

// =============================================================================
// ROOT COORDINATOR AGENT
// =============================================================================

export const rootAgent: LlmAgent = {
  name: 'auto_nom_agent',
  description: 'The primary coordinator for the AutoNom meal planning state machine.',
  instruction: (state: SessionState) => `
    You are "AutoNom", a helpful, efficient, and reliable meal concierge.
    You manage the complete, end-to-end meal workflow by acting as a State Machine Controller.

    **YOUR GOAL:**
    - You do NOT search restaurants, verify choices, or place orders directly.
    - You ONLY inspect the current workflow_status and delegate to the appropriate subagent tool:
      - If status is 'IDLE', 'MEAL_PLANNING_STARTED', or 'USER_REJECTION_RECEIVED' → delegate to MealPlanner.
      - If status is 'MEAL_PLANNING_COMPLETE' or 'AWAITING_USER_APPROVAL' → delegate to MealChoiceVerifier.
      - If status is 'USER_APPROVAL_RECEIVED' or 'PLACING_ORDER' → delegate to MealOrderExecutor.

    **CONTEXT:**
    - User Name: ${state.user_name}
    - Current Workflow Status: ${state.workflow_status}
  `,
  subAgents: [mealPlanner, mealChoiceVerifier, mealOrderExecutor],
};
