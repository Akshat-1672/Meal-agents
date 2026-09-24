/**
 * Swiggy Scout Graph — LangGraph parallel fan-out
 *
 * Architecture:
 *
 *   START
 *     │
 *     ▼
 *  fanOutRouter  ──────────────────────────────────────────
 *     │                   │                       │
 *     ▼                   ▼                       ▼
 * delivery_node       cook_node             dineout_node
 * (Food MCP)       (Instamart MCP)         (Dineout MCP)
 *     │                   │                       │
 *     └───────────────────┴───────────────────────┘
 *                         │
 *                         ▼
 *                     synthesizer
 *                  (merge + rank by cost)
 *                         │
 *                         ▼
 *                        END
 *
 * All three scout nodes run in parallel via LangGraph's conditional fan-out.
 * Results are merged into MealOption[] and returned to the MealPlanner.
 */

import { Annotation, StateGraph, START, END } from '@langchain/langgraph';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { MealOption } from '../agents/types';
import { createAuthenticatedMcpClient } from './mcp/client';

// ─── Graph State ──────────────────────────────────────────────────────────────

const ScoutStateAnnotation = Annotation.Root({
  // Input context
  prompt: Annotation<string>({
    reducer: (_x, y) => y,
    default: () => '',
  }),
  userPreferences: Annotation<string>({
    reducer: (_x, y) => y,
    default: () => '',
  }),
  userAllergies: Annotation<string[]>({
    reducer: (_x, y) => y,
    default: () => [],
  }),
  userLat: Annotation<number>({
    reducer: (_x, y) => y,
    default: () => 12.9716,
  }),
  userLng: Annotation<number>({
    reducer: (_x, y) => y,
    default: () => 77.5946,
  }),
  swiggyToken: Annotation<string>({
    reducer: (_x, y) => y,
    default: () => 'mock-swiggy-token-dev',
  }),

  // Collected quotes (accumulate across parallel nodes)
  quotes: Annotation<MealOption[]>({
    reducer: (x, y) => x.concat(y),
    default: () => [],
  }),

  // Errors (accumulate across parallel nodes)
  errors: Annotation<Array<{ node: string; message: string }>>({
    reducer: (x, y) => x.concat(y),
    default: () => [],
  }),
});

type ScoutState = typeof ScoutStateAnnotation.State;

// ─── Shared Helper ────────────────────────────────────────────────────────────

function foodMcpUrl() { return process.env.SWIGGY_FOOD_MCP_URL || 'http://localhost:3001/mcp/v1/food'; }
function dineoutMcpUrl() { return process.env.SWIGGY_DINEOUT_MCP_URL || 'http://localhost:3001/mcp/v1/dineout'; }
function instamartMcpUrl() { return process.env.SWIGGY_INSTAMART_MCP_URL || 'http://localhost:3001/mcp/v1/instamart'; }

async function callMcp(serverUrl: string, token: string, toolName: string, args: Record<string, any>): Promise<any> {
  console.log(`[ScoutGraph] → callMcp: ${toolName} @ ${serverUrl}`);
  let client;
  try {
    client = await createAuthenticatedMcpClient(serverUrl, token);
  } catch (connErr: any) {
    throw new Error(`MCP connect failed (${serverUrl}): ${connErr.message}`);
  }
  try {
    const res = await client.callTool({ name: toolName, arguments: args });
    const text = (res.content as any[])?.[0]?.text;
    if (!text) throw new Error(`Empty response from tool: ${toolName}`);
    console.log(`[ScoutGraph] ✓ ${toolName} succeeded`);
    return JSON.parse(text);
  } catch (toolErr: any) {
    throw new Error(`MCP tool '${toolName}' failed: ${toolErr.message}`);
  } finally {
    try { await client.close(); } catch { /* ignore */ }
  }
}

// ─── Fan-out Router ───────────────────────────────────────────────────────────
// Determines which scout nodes to activate based on the user's prompt.
// Returns all three by default (full fan-out). Can selectively disable if
// the prompt explicitly excludes a modality (e.g. "don't want to cook").

function fanOutRouter(state: ScoutState): string[] {
  const p = state.prompt.toLowerCase();

  const noCook = p.includes("don't want to cook") || p.includes("no cooking") || p.includes("not cook") || p.includes("no cook");
  const noDelivery = p.includes("no delivery") || p.includes("don't want delivery") || p.includes("no order");
  const noDineout = p.includes("stay home") || p.includes("no dineout") || p.includes("no dining") || p.includes("no restaurant") || p.includes("don't want to go out");

  const targets: string[] = [];
  if (!noDelivery) targets.push('delivery_node');
  if (!noCook) targets.push('cook_node');
  if (!noDineout) targets.push('dineout_node');

  // Default: run all three
  return targets.length > 0 ? targets : ['delivery_node', 'cook_node', 'dineout_node'];
}

// ─── Node 1: Delivery Scout (Swiggy Food MCP) ─────────────────────────────────

async function deliveryNode(state: ScoutState): Promise<Partial<ScoutState>> {
  const { prompt, userPreferences, userAllergies, swiggyToken } = state;

  try {
    // 1. Get delivery address
    const addressRes = await callMcp(foodMcpUrl(), swiggyToken, 'get_addresses', {});
    const address = addressRes?.addresses?.[0]?.address_line || 'Bangalore';

    // 2. Search restaurants
    const searchRes = await callMcp(foodMcpUrl(), swiggyToken, 'search_restaurants', {
      location: address,
      query: prompt,
    });
    const restaurants = searchRes?.restaurants || [];

    if (restaurants.length === 0) {
      return { quotes: [] };
    }

    // 3. Get menu for top restaurant, filter allergens
    const topRestaurant = restaurants[0];
    const menuRes = await callMcp(foodMcpUrl(), swiggyToken, 'search_menu', {
      restaurant_id: topRestaurant.id,
    });

    const allergenSet = new Set((userAllergies || []).map((a: string) => a.toLowerCase()));
    const safeItems = (menuRes?.menu || []).filter((item: any) =>
      !(item.dietary_tags || []).some((tag: string) =>
        [...allergenSet].some((allergen) => tag.toLowerCase().includes(allergen))
      )
    );

    if (safeItems.length === 0) {
      return { quotes: [], errors: [{ node: 'delivery_node', message: 'No allergen-safe items found' }] };
    }

    // 4. Pick best item (lowest calorie or first match)
    const bestItem = safeItems[0];
    const deliveryFee = 49;
    const total = bestItem.price + deliveryFee;

    return {
      quotes: [{
        type: 'delivery',
        title: topRestaurant.name,
        subText: `${bestItem.name} | Delivered in ${topRestaurant.delivery_time_min} mins`,
        cost: total,
        timeMinutes: topRestaurant.delivery_time_min,
        deepLinkUrl: `https://swiggy.com/food/checkout?restaurant=${topRestaurant.id}`,
        restaurant_id: topRestaurant.id,
        items: [{ id: bestItem.id, name: bestItem.name, price: bestItem.price, calories: bestItem.calories, quantity: 1 }],
      }],
    };
  } catch (err: any) {
    console.error('[delivery_node] Error:', err.message);
    return { errors: [{ node: 'delivery_node', message: err.message }] };
  }
}

// ─── Node 2: Cook Scout (Swiggy Instamart MCP) ───────────────────────────────

async function cookNode(state: ScoutState): Promise<Partial<ScoutState>> {
  const { prompt, userAllergies, swiggyToken, userLat, userLng } = state;

  try {
    // 1. Suggest recipe
    const recipeRes = await callMcp(instamartMcpUrl(), swiggyToken, 'suggest_recipe', { query: prompt });

    // 2. Check allergens in ingredients
    const allergenSet = new Set((userAllergies || []).map((a: string) => a.toLowerCase()));
    const safeIngredients = (recipeRes?.ingredients || []).filter((ing: any) =>
      ![...allergenSet].some((allergen) => ing.name.toLowerCase().includes(allergen))
    );

    // 3. Price the basket
    const basketRes = await callMcp(instamartMcpUrl(), swiggyToken, 'price_grocery_basket', {
      items: safeIngredients,
      location: { lat: userLat, lng: userLng },
    });

    return {
      quotes: [{
        type: 'cook',
        title: recipeRes.recipe_name,
        subText: `${recipeRes.prep_minutes} min prep + ${basketRes.delivery_eta_minutes} min grocery delivery`,
        cost: basketRes.total_payable,
        timeMinutes: recipeRes.prep_minutes + basketRes.delivery_eta_minutes,
        deepLinkUrl: basketRes.checkout_url,
        recipe_id: recipeRes.recipe_id,
        ingredients: safeIngredients,
      }],
    };
  } catch (err: any) {
    console.error('[cook_node2] Error:', err.message);
    return { errors: [{ node: 'cook_node', message: err.message }] };
  }
}

// ─── Node 3: Dineout Scout (Swiggy Dineout MCP) ──────────────────────────────

async function dineoutNode(state: ScoutState): Promise<Partial<ScoutState>> {
  const { prompt, swiggyToken, userLat, userLng } = state;

  try {
    // 1. Search dineout restaurants
    const searchRes = await callMcp(dineoutMcpUrl(), swiggyToken, 'search_restaurants', {
      query: prompt,
      location: { lat: userLat, lng: userLng },
    });
    const restaurants = searchRes?.restaurants || [];

    if (restaurants.length === 0) {
      return { quotes: [] };
    }

    // 2. Check availability for top restaurant
    const topRestaurant = restaurants[0];
    const availRes = await callMcp(dineoutMcpUrl(), swiggyToken, 'check_table_availability', {
      restaurant_id: topRestaurant.id,
      party_size: 2,
    });

    if (!availRes?.available) {
      // Try second option if available
      if (restaurants.length > 1) {
        const secondAvail = await callMcp(dineoutMcpUrl(), swiggyToken, 'check_table_availability', {
          restaurant_id: restaurants[1].id,
          party_size: 2,
        });
        if (!secondAvail?.available) {
          return { quotes: [], errors: [{ node: 'dineout_node', message: 'No tables available at top restaurants' }] };
        }
        return buildDineoutQuote(restaurants[1], secondAvail);
      }
      return { quotes: [] };
    }

    return buildDineoutQuote(topRestaurant, availRes);
  } catch (err: any) {
    console.error('[dineout_node] Error:', err.message);
    return { errors: [{ node: 'dineout_node', message: err.message }] };
  }
}

function buildDineoutQuote(restaurant: any, availRes: any): Partial<ScoutState> {
  return {
    quotes: [{
      type: 'dineout',
      title: restaurant.name,
      subText: `Table for 2 | ${availRes.next_slot} | ~₹${restaurant.avg_cost_for_two} for two`,
      cost: restaurant.avg_cost_for_two,
      timeMinutes: availRes.wait_minutes ?? 0,
      deepLinkUrl: availRes.reservation_url,
      dineout_restaurant_id: restaurant.id,
      next_slot: availRes.next_slot,
    }],
  };
}

// ─── Synthesizer Node ─────────────────────────────────────────────────────────
// Merges all quotes, sorts by cost ascending. Does NOT make any LLM/MCP calls.

function synthesizerNode(state: ScoutState): Partial<ScoutState> {
  // Deduplicate by title+type in case of retries
  const seen = new Set<string>();
  const unique = state.quotes.filter((q) => {
    const key = `${q.type}:${q.title}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Sort by cost ascending (cheapest first)
  unique.sort((a, b) => a.cost - b.cost);

  return { quotes: unique };
}

// ─── Compiled Graph ───────────────────────────────────────────────────────────

const scoutGraph = new StateGraph(ScoutStateAnnotation)
  .addNode('delivery_node', deliveryNode)
  .addNode('cook_node', cookNode)
  .addNode('dineout_node', dineoutNode)
  .addNode('synthesizer', synthesizerNode)
  .addConditionalEdges(START, fanOutRouter)
  .addEdge('delivery_node', 'synthesizer')
  .addEdge('cook_node', 'synthesizer')
  .addEdge('dineout_node', 'synthesizer')
  .addEdge('synthesizer', END);

export const compiledScoutGraph = scoutGraph.compile();

// ─── Public API ───────────────────────────────────────────────────────────────

export interface ScoutGraphInput {
  prompt: string;
  userPreferences: string;
  userAllergies: string[];
  userLat: number;
  userLng: number;
  swiggyToken: string;
}

/**
 * Runs the parallel Swiggy scout graph and returns the synthesized MealOption[].
 * All three scout nodes (delivery, cook, dineout) execute in parallel via LangGraph.
 */
export async function runScoutGraph(input: ScoutGraphInput): Promise<{
  quotes: MealOption[];
  errors: Array<{ node: string; message: string }>;
}> {
  console.log('[ScoutGraph] Starting parallel fan-out for:', input.prompt);
  const result = await compiledScoutGraph.invoke(input);
  console.log(`[ScoutGraph] Done. ${result.quotes.length} quotes, ${result.errors.length} errors.`);
  return { quotes: result.quotes, errors: result.errors };
}
