import { Type } from '@google/genai';
import { ToolDefinition, AgentContext } from '../agents/types';
import { createAuthenticatedMcpClient } from '../lib/mcp/client';

// ─── URL Helpers ──────────────────────────────────────────────────────────────

function foodMcpUrl(): string {
  return process.env.SWIGGY_FOOD_MCP_URL || 'http://localhost:3001/mcp/v1/food';
}
function dineoutMcpUrl(): string {
  return process.env.SWIGGY_DINEOUT_MCP_URL || 'http://localhost:3001/mcp/v1/dineout';
}
function instamartMcpUrl(): string {
  return process.env.SWIGGY_INSTAMART_MCP_URL || 'http://localhost:3001/mcp/v1/instamart';
}

/** Helper: call an MCP tool, auto-connect and auto-close the client */
async function callMcpTool(serverUrl: string, token: string, toolName: string, args: Record<string, any>): Promise<any> {
  const client = await createAuthenticatedMcpClient(serverUrl, token);
  try {
    const res = await client.callTool({ name: toolName, arguments: args });
    const text = (res.content as any[])?.[0]?.text;
    if (!text) throw new Error(`Empty response from MCP tool ${toolName}`);
    return JSON.parse(text);
  } finally {
    try { await client.close(); } catch { /* ignore */ }
  }
}

// =============================================================================
// FOOD DELIVERY MCP TOOLS
// =============================================================================

export const mcpGetAddressesTool: ToolDefinition = {
  declaration: {
    name: 'get_addresses',
    description: 'Retrieves the list of saved delivery addresses for the user via Swiggy Food MCP.',
    parameters: { type: Type.OBJECT, properties: {} },
  },
  execute: async (_args: any, context: AgentContext) => {
    const token = context.state.swiggy_token;
    return await callMcpTool(foodMcpUrl(), token, 'get_addresses', {});
  },
};

export const mcpSearchRestaurantsTool: ToolDefinition = {
  declaration: {
    name: 'search_restaurants',
    description: 'Searches for food delivery restaurants near a location via Swiggy Food MCP.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        location: { type: Type.STRING, description: 'Delivery location name or address' },
        cuisine: { type: Type.STRING, description: 'Optional cuisine filter (e.g. Italian, Asian, Indian)' },
        query: { type: Type.STRING, description: 'Optional text search query for restaurant name or dish' },
      },
      required: ['location'],
    },
  },
  execute: async (args: any, context: AgentContext) => {
    const token = context.state.swiggy_token;
    return await callMcpTool(foodMcpUrl(), token, 'search_restaurants', {
      location: args.location,
      cuisine: args.cuisine,
      query: args.query,
    });
  },
};

export const mcpSearchMenuTool: ToolDefinition = {
  declaration: {
    name: 'search_menu',
    description: 'Retrieves the full menu items for a specific restaurant ID via Swiggy Food MCP.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        restaurant_id: { type: Type.STRING, description: 'The unique restaurant ID (e.g. r_001)' },
      },
      required: ['restaurant_id'],
    },
  },
  execute: async (args: any, context: AgentContext) => {
    const token = context.state.swiggy_token;
    return await callMcpTool(foodMcpUrl(), token, 'search_menu', { restaurant_id: args.restaurant_id });
  },
};

export const mcpUpdateFoodCartTool: ToolDefinition = {
  declaration: {
    name: 'update_food_cart',
    description: 'Stages a Swiggy food cart with items from a restaurant via Swiggy Food MCP.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        restaurant_id: { type: Type.STRING, description: 'Restaurant ID' },
        items: {
          type: Type.ARRAY,
          description: 'Items to add to cart',
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING, description: 'Menu item ID' },
              quantity: { type: Type.INTEGER, description: 'Quantity' },
              customizations: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'Optional customizations' },
            },
            required: ['id', 'quantity'],
          },
        },
      },
      required: ['restaurant_id', 'items'],
    },
  },
  execute: async (args: any, context: AgentContext) => {
    const token = context.state.swiggy_token;
    return await callMcpTool(foodMcpUrl(), token, 'update_food_cart', {
      restaurant_id: args.restaurant_id,
      items: args.items,
    });
  },
};

export const mcpPlaceFoodOrderTool: ToolDefinition = {
  declaration: {
    name: 'place_food_order',
    description: 'Places the food delivery order for the items currently in the Swiggy cart via Swiggy Food MCP.',
    parameters: { type: Type.OBJECT, properties: {} },
  },
  execute: async (_args: any, context: AgentContext) => {
    const token = context.state.swiggy_token;
    return await callMcpTool(foodMcpUrl(), token, 'place_food_order', {});
  },
};

// =============================================================================
// DINEOUT MCP TOOLS
// =============================================================================

export const mcpDineoutSearchRestaurantsTool: ToolDefinition = {
  declaration: {
    name: 'dineout_search_restaurants',
    description: 'Searches for dine-in restaurants near the user\'s location via Swiggy Dineout MCP.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        query: { type: Type.STRING, description: 'Cuisine type or dining style (e.g. Italian, Seafood, Rooftop, Fine Dining)' },
        location: {
          type: Type.OBJECT,
          description: 'User GPS coordinates',
          properties: {
            lat: { type: Type.NUMBER },
            lng: { type: Type.NUMBER },
          },
        },
        budget_for_two: { type: Type.NUMBER, description: 'Maximum budget for two people in INR' },
      },
    },
  },
  execute: async (args: any, context: AgentContext) => {
    const token = context.state.swiggy_token;
    return await callMcpTool(dineoutMcpUrl(), token, 'search_restaurants', {
      query: args.query,
      location: args.location,
      budget_for_two: args.budget_for_two,
    });
  },
};

export const mcpCheckTableAvailabilityTool: ToolDefinition = {
  declaration: {
    name: 'check_table_availability',
    description: 'Checks table availability and next booking slot at a specific dineout restaurant via Swiggy Dineout MCP.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        restaurant_id: { type: Type.STRING, description: 'The dineout restaurant ID (e.g. do_001)' },
        party_size: { type: Type.INTEGER, description: 'Number of people for the reservation' },
      },
      required: ['restaurant_id', 'party_size'],
    },
  },
  execute: async (args: any, context: AgentContext) => {
    const token = context.state.swiggy_token;
    return await callMcpTool(dineoutMcpUrl(), token, 'check_table_availability', {
      restaurant_id: args.restaurant_id,
      party_size: args.party_size || 2,
    });
  },
};

export const mcpMakeReservationTool: ToolDefinition = {
  declaration: {
    name: 'make_reservation',
    description: 'Books a table at a dineout restaurant via Swiggy Dineout MCP.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        restaurant_id: { type: Type.STRING, description: 'The dineout restaurant ID' },
        party_size: { type: Type.INTEGER, description: 'Number of people' },
        time_slot: { type: Type.STRING, description: 'Requested time slot (e.g. "7:30 PM")' },
        user_name: { type: Type.STRING, description: 'Name for the reservation' },
      },
      required: ['restaurant_id', 'user_name'],
    },
  },
  execute: async (args: any, context: AgentContext) => {
    const token = context.state.swiggy_token;
    return await callMcpTool(dineoutMcpUrl(), token, 'make_reservation', {
      restaurant_id: args.restaurant_id,
      party_size: args.party_size || 2,
      time_slot: args.time_slot,
      user_name: args.user_name,
    });
  },
};

// =============================================================================
// INSTAMART (COOK) MCP TOOLS
// =============================================================================

export const mcpSuggestRecipeTool: ToolDefinition = {
  declaration: {
    name: 'suggest_recipe',
    description: 'Suggests a recipe based on a meal prompt via Swiggy Instamart MCP. Returns recipe name, prep time, and ingredient list.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        query: { type: Type.STRING, description: 'Natural language meal query (e.g. "healthy pasta", "spicy Asian", "warm soup")' },
      },
      required: ['query'],
    },
  },
  execute: async (args: any, context: AgentContext) => {
    const token = context.state.swiggy_token;
    return await callMcpTool(instamartMcpUrl(), token, 'suggest_recipe', { query: args.query });
  },
};

export const mcpPriceGroceryBasketTool: ToolDefinition = {
  declaration: {
    name: 'price_grocery_basket',
    description: 'Calculates total Instamart grocery basket price and delivery ETA for a list of ingredients via Swiggy Instamart MCP.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        items: {
          type: Type.ARRAY,
          description: 'List of ingredients',
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              quantity: { type: Type.STRING },
              unit_price: { type: Type.NUMBER, description: 'Estimated unit price in INR' },
            },
            required: ['name', 'quantity', 'unit_price'],
          },
        },
        location: {
          type: Type.OBJECT,
          description: 'User GPS coordinates for delivery ETA',
          properties: {
            lat: { type: Type.NUMBER },
            lng: { type: Type.NUMBER },
          },
          required: ['lat', 'lng'],
        },
      },
      required: ['items', 'location'],
    },
  },
  execute: async (args: any, context: AgentContext) => {
    const token = context.state.swiggy_token;
    return await callMcpTool(instamartMcpUrl(), token, 'price_grocery_basket', {
      items: args.items,
      location: args.location,
    });
  },
};

export const mcpCheckoutGroceryTool: ToolDefinition = {
  declaration: {
    name: 'checkout_grocery',
    description: 'Creates a Swiggy Instamart grocery order for the specified ingredients via Instamart MCP.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        items: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              quantity: { type: Type.STRING },
              unit_price: { type: Type.NUMBER },
            },
            required: ['name', 'quantity', 'unit_price'],
          },
        },
        location: {
          type: Type.OBJECT,
          properties: { lat: { type: Type.NUMBER }, lng: { type: Type.NUMBER } },
          required: ['lat', 'lng'],
        },
        recipe_name: { type: Type.STRING, description: 'Recipe name for the grocery order label' },
      },
      required: ['items', 'location'],
    },
  },
  execute: async (args: any, context: AgentContext) => {
    const token = context.state.swiggy_token;
    return await callMcpTool(instamartMcpUrl(), token, 'checkout_grocery', {
      items: args.items,
      location: args.location,
      recipe_name: args.recipe_name,
    });
  },
};
