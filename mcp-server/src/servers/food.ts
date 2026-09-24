import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { Request, Response } from 'express';
import { z } from 'zod';
import {
  MOCK_ADDRESSES,
  MOCK_RESTAURANTS,
  getCart,
  setCart,
  placeOrder,
} from '../data/swiggy-mock-data';

// ─── Food MCP Server ──────────────────────────────────────────────────────────
// Uses StreamableHTTP transport: a single POST endpoint handles all MCP messages
// (initialize, tools/list, tools/call). No SSE stream lifecycle issues.

export function createFoodMcpServer() {
  const server = new McpServer({
    name: 'swiggy-food-mock',
    version: '1.0.0',
  });

  // Tool 1: get_addresses
  server.tool(
    'get_addresses',
    'Retrieves the list of saved delivery addresses for the authenticated user.',
    {},
    async () => ({
      content: [{ type: 'text', text: JSON.stringify({ addresses: MOCK_ADDRESSES }) }],
    })
  );

  // Tool 2: search_restaurants
  server.tool(
    'search_restaurants',
    'Searches for food delivery restaurants near a location with optional cuisine and text query filters.',
    {
      location: z.string().describe('Delivery location name or address string'),
      cuisine: z.string().optional().describe('Optional cuisine filter (e.g. Italian, Asian, Indian)'),
      query: z.string().optional().describe('Optional text search for restaurant name or dish'),
    },
    async ({ location, cuisine, query }) => {
      let results = [...MOCK_RESTAURANTS];
      if (cuisine) {
        const lc = cuisine.toLowerCase();
        results = results.filter(
          (r) => r.cuisine.toLowerCase().includes(lc) || r.tags.some((t) => t.toLowerCase().includes(lc))
        );
      }
      if (query) {
        const lq = query.toLowerCase();
        results = results.filter(
          (r) =>
            r.name.toLowerCase().includes(lq) ||
            r.cuisine.toLowerCase().includes(lq) ||
            r.menu.some((m) => m.name.toLowerCase().includes(lq) || m.description.toLowerCase().includes(lq))
        );
      }
      const simplified = results.map((r) => ({
        id: r.id, name: r.name, cuisine: r.cuisine,
        rating: r.rating, delivery_time_min: r.delivery_time_min, tags: r.tags,
      }));
      return { content: [{ type: 'text', text: JSON.stringify({ location, restaurants: simplified }) }] };
    }
  );

  // Tool 3: search_menu
  server.tool(
    'search_menu',
    'Retrieves the full menu for a specific restaurant ID.',
    { restaurant_id: z.string().describe('The unique restaurant ID (e.g. r_001)') },
    async ({ restaurant_id }) => {
      const restaurant = MOCK_RESTAURANTS.find((r) => r.id === restaurant_id);
      if (!restaurant) {
        return { content: [{ type: 'text', text: JSON.stringify({ error: `Restaurant ${restaurant_id} not found` }) }] };
      }
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            restaurant_id: restaurant.id, restaurant_name: restaurant.name,
            cuisine: restaurant.cuisine, rating: restaurant.rating,
            delivery_time_min: restaurant.delivery_time_min, menu: restaurant.menu,
          }),
        }],
      };
    }
  );

  // Tool 4: update_food_cart
  server.tool(
    'update_food_cart',
    'Stages a food delivery cart with items from a specific restaurant.',
    {
      restaurant_id: z.string().describe('Restaurant ID to order from'),
      items: z.array(z.object({
        id: z.string().describe('Menu item ID'),
        quantity: z.number().int().min(1).describe('Quantity to order'),
        customizations: z.array(z.string()).optional().describe('Optional customization notes'),
      })).describe('List of menu items to add to cart'),
    },
    async ({ restaurant_id, items }) => {
      const restaurant = MOCK_RESTAURANTS.find((r) => r.id === restaurant_id);
      if (!restaurant) {
        return { content: [{ type: 'text', text: JSON.stringify({ error: `Restaurant ${restaurant_id} not found` }) }] };
      }
      let subtotal = 0;
      const cartItems: any[] = [];
      for (const item of items) {
        const menuItem = restaurant.menu.find((m) => m.id === item.id);
        if (menuItem) {
          const lineTotal = menuItem.price * item.quantity;
          subtotal += lineTotal;
          cartItems.push({ id: item.id, name: menuItem.name, quantity: item.quantity, unit_price: menuItem.price, line_total: lineTotal, customizations: item.customizations || [] });
        }
      }
      const deliveryFee = 49;
      const tax = Math.round(subtotal * 0.05);
      const totalPayable = subtotal + deliveryFee + tax;
      setCart(restaurant_id, items);
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            restaurant_id, restaurant_name: restaurant.name, items: cartItems,
            subtotal, delivery_fee: deliveryFee, tax, total_payable: totalPayable,
            eta_minutes: restaurant.delivery_time_min,
            checkout_url: `https://swiggy.com/food/checkout?restaurant=${restaurant_id}`,
          }),
        }],
      };
    }
  );

  // Tool 5: place_food_order
  server.tool(
    'place_food_order',
    'Places the food order for items currently in the Swiggy food cart.',
    {},
    async () => {
      try {
        return { content: [{ type: 'text', text: JSON.stringify(placeOrder()) }] };
      } catch (err: any) {
        return { content: [{ type: 'text', text: JSON.stringify({ error: err.message }) }] };
      }
    }
  );

  return server;
}

// ─── StreamableHTTP Handler ───────────────────────────────────────────────────
// Single POST endpoint handles all MCP protocol messages (no SSE required).

export function createFoodHttpHandler() {
  return {
    handle: async (req: Request, res: Response) => {
      const server = createFoodMcpServer();
      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: undefined, // stateless mode — no session tracking needed
      });
      await server.connect(transport);
      await transport.handleRequest(req, res, req.body);
      await server.close();
    },
  };
}
