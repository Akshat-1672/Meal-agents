import { GoogleGenAI, FunctionDeclaration } from '@google/genai';

// ─── Meal Option ──────────────────────────────────────────────────────────────

export type MealOptionType = 'delivery' | 'cook' | 'dineout';

export interface MealOption {
  type: MealOptionType;
  title: string;           // Restaurant name or recipe name
  subText: string;         // Summary details for display
  cost: number;            // Total cost in INR
  timeMinutes: number;     // ETA / prep time in minutes
  deepLinkUrl: string;     // Checkout / reservation URL

  // Delivery-specific fields
  restaurant_id?: string;
  items?: Array<{ id: string; name: string; price: number; calories?: number; quantity?: number }>;

  // Cook-specific fields
  recipe_id?: string;
  ingredients?: Array<{ name: string; quantity: string; unit_price: number }>;

  // Dineout-specific fields
  dineout_restaurant_id?: string;
  next_slot?: string;
}

// ─── Session State ────────────────────────────────────────────────────────────

export interface SessionState {
  workflow_status: string;
  planning_meal_type: string;
  planning_options: MealOption[];
  planning_modalities: MealOptionType[];     // Which modalities were scouted

  // User profile
  user_id: string;
  user_name: string;
  user_days: string;
  user_meals: string;
  user_dietary_preferences: string;
  user_allergies: string[];
  user_special_instructions: string;

  // Swiggy auth token (Bearer token for MCP server)
  swiggy_token: string;

  // User coordinates for location-based tools
  user_lat: number;
  user_lng: number;

  mock_day: string;

  // Verification (human-in-the-loop)
  verification_user_feedback: string;
  verification_user_response?: string;
  verification_user_choice: number[];
  verification_message: string;
  verification_choices: any[];

  // Ordering
  ordering_order_status_id: string;
  ordering_order_status_restaurant_id: string;
  ordering_order_status_status: string;
  ordering_order_status_order: Record<string, any>;
  ordering_confirmation_message: string;
  ordering_confirmation_bill_restaurant_name: string;
  ordering_confirmation_bill_items: any[];
  ordering_confirmation_bill_total_amount: string;
  ordering_confirmation?: any;

  [key: string]: any;
}

// ─── Agent Types ──────────────────────────────────────────────────────────────

export interface AgentContext {
  state: SessionState;
  ai: GoogleGenAI;
  logEvent: (event: any) => void;
}

export type ToolDefinition = {
  declaration: FunctionDeclaration;
  execute: (args: any, context: AgentContext) => Promise<any> | any;
};

export interface LlmAgent {
  name: string;
  description: string;
  instruction: (state: SessionState) => string;
  tools?: ToolDefinition[];
  subAgents?: LlmAgent[];
  beforeCall?: (context: AgentContext) => void;
  afterCall?: (context: AgentContext) => void;
}
