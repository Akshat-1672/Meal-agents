import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { Request, Response } from 'express';
import { z } from 'zod';
import { findBestRecipe, calculateBasketPrice } from '../data/swiggy-mock-data';

// ─── Instamart MCP Server ─────────────────────────────────────────────────────

export function createInstamartMcpServer() {
  const server = new McpServer({
    name: 'swiggy-instamart-mock',
    version: '1.0.0',
  });

  // Tool 1: suggest_recipe
  server.tool(
    'suggest_recipe',
    'Suggests a recipe based on a meal prompt. Returns recipe name, prep time, and ingredient list.',
    { query: z.string().describe('Natural language meal query (e.g. "healthy pasta", "quick protein meal")') },
    async ({ query }) => {
      const recipe = findBestRecipe(query);
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            recipe_id: recipe.id, recipe_name: recipe.recipe_name,
            prep_minutes: recipe.prep_minutes, servings: recipe.servings,
            difficulty: recipe.difficulty, ingredients: recipe.ingredients,
            instructions_url: recipe.instructions_url,
          }),
        }],
      };
    }
  );

  // Tool 2: price_grocery_basket
  server.tool(
    'price_grocery_basket',
    'Calculates total Instamart grocery basket price and delivery ETA for a list of ingredients.',
    {
      items: z.array(z.object({
        name: z.string(),
        quantity: z.string(),
        unit_price: z.number().describe('Estimated unit price in INR'),
      })).describe('List of ingredients to price'),
      location: z.object({ lat: z.number(), lng: z.number() }).describe('User GPS coordinates'),
    },
    async ({ items, location }) => {
      const result = calculateBasketPrice(items as any, location);
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            items_count: items.length,
            items_subtotal: items.reduce((sum, i) => sum + i.unit_price, 0),
            delivery_fee: 29, platform_fee: 10,
            total_payable: result.total_payable,
            delivery_eta_minutes: result.delivery_eta_minutes,
            checkout_url: result.checkout_url,
          }),
        }],
      };
    }
  );

  // Tool 3: checkout_grocery
  server.tool(
    'checkout_grocery',
    'Creates a grocery order for the specified ingredients and returns an order confirmation.',
    {
      items: z.array(z.object({ name: z.string(), quantity: z.string(), unit_price: z.number() })),
      location: z.object({ lat: z.number(), lng: z.number() }),
      recipe_name: z.string().optional().describe('Recipe name for the order label'),
    },
    async ({ items, location, recipe_name }) => {
      const pricing = calculateBasketPrice(items as any, location);
      const orderId = `INST_${Date.now()}`;
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            order_id: orderId, status: 'CONFIRMED',
            recipe_name: recipe_name || 'Custom grocery order',
            items_count: items.length, total_payable: pricing.total_payable,
            delivery_eta_minutes: pricing.delivery_eta_minutes,
            checkout_url: pricing.checkout_url,
            message: `Grocery order confirmed! ${items.length} items for ₹${pricing.total_payable} arrive in ~${pricing.delivery_eta_minutes} mins.${recipe_name ? ` Happy cooking: ${recipe_name}!` : ''}`,
          }),
        }],
      };
    }
  );

  return server;
}

// ─── StreamableHTTP Handler ───────────────────────────────────────────────────

export function createInstamartHttpHandler() {
  return {
    handle: async (req: Request, res: Response) => {
      const server = createInstamartMcpServer();
      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: undefined,
      });
      await server.connect(transport);
      await transport.handleRequest(req, res, req.body);
      await server.close();
    },
  };
}
