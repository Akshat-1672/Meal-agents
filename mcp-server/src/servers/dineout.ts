import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { Request, Response } from 'express';
import { z } from 'zod';
import { MOCK_DINEOUT_RESTAURANTS } from '../data/swiggy-mock-data';

// ─── Dineout MCP Server ───────────────────────────────────────────────────────

export function createDineoutMcpServer() {
  const server = new McpServer({
    name: 'swiggy-dineout-mock',
    version: '1.0.0',
  });

  // Tool 1: search_restaurants
  server.tool(
    'search_restaurants',
    'Searches for dine-in restaurants near given coordinates with optional cuisine and budget filters.',
    {
      query: z.string().optional().describe('Cuisine type or dining style (e.g. Italian, Seafood, Rooftop)'),
      location: z.object({ lat: z.number(), lng: z.number() }).optional().describe('User GPS coordinates'),
      budget_for_two: z.number().optional().describe('Maximum budget for two people in INR'),
    },
    async ({ query, location, budget_for_two }) => {
      let results = [...MOCK_DINEOUT_RESTAURANTS];
      if (query) {
        const lq = query.toLowerCase();
        results = results.filter(
          (r) => r.name.toLowerCase().includes(lq) || r.cuisine.toLowerCase().includes(lq) || r.tags.some((t) => t.toLowerCase().includes(lq))
        );
      }
      if (budget_for_two) {
        results = results.filter((r) => r.avg_cost_for_two <= budget_for_two);
      }
      results.sort((a, b) => b.rating - a.rating);
      const simplified = results.map((r) => ({
        id: r.id, name: r.name, cuisine: r.cuisine, rating: r.rating,
        avg_cost_for_two: r.avg_cost_for_two, tags: r.tags, address: r.address,
      }));
      return { content: [{ type: 'text', text: JSON.stringify({ restaurants: simplified, total: simplified.length }) }] };
    }
  );

  // Tool 2: check_table_availability
  server.tool(
    'check_table_availability',
    'Checks table availability and next booking slot at a specific dineout restaurant.',
    {
      restaurant_id: z.string().describe('The unique dineout restaurant ID (e.g. do_001)'),
      party_size: z.number().int().min(1).max(20).describe('Number of people for the reservation'),
    },
    async ({ restaurant_id, party_size }) => {
      const restaurant = MOCK_DINEOUT_RESTAURANTS.find((r) => r.id === restaurant_id);
      if (!restaurant) {
        return { content: [{ type: 'text', text: JSON.stringify({ error: `Restaurant ${restaurant_id} not found` }) }] };
      }
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            restaurant_id, restaurant_name: restaurant.name, party_size,
            available: restaurant.wait_minutes <= 20,
            next_slot: restaurant.next_available_slot,
            wait_minutes: restaurant.wait_minutes,
            avg_cost_for_two: restaurant.avg_cost_for_two,
            reservation_url: restaurant.reservation_url,
          }),
        }],
      };
    }
  );

  // Tool 3: make_reservation
  server.tool(
    'make_reservation',
    'Books a table at a dineout restaurant and returns a booking confirmation.',
    {
      restaurant_id: z.string().describe('The unique dineout restaurant ID'),
      party_size: z.number().int().min(1).max(20).describe('Number of people'),
      time_slot: z.string().describe('Requested time slot (e.g. "7:30 PM")'),
      user_name: z.string().describe('Name for the reservation'),
    },
    async ({ restaurant_id, party_size, time_slot, user_name }) => {
      const restaurant = MOCK_DINEOUT_RESTAURANTS.find((r) => r.id === restaurant_id);
      if (!restaurant) {
        return { content: [{ type: 'text', text: JSON.stringify({ error: `Restaurant ${restaurant_id} not found` }) }] };
      }
      const bookingId = `BKG_${Date.now()}`;
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            booking_id: bookingId, restaurant_id, restaurant_name: restaurant.name,
            party_size, confirmed_time_slot: time_slot || restaurant.next_available_slot,
            user_name, status: 'CONFIRMED',
            estimated_cost_for_two: restaurant.avg_cost_for_two,
            confirmation_url: `${restaurant.reservation_url}?booking=${bookingId}`,
            message: `Table for ${party_size} at ${restaurant.name} confirmed for ${time_slot || restaurant.next_available_slot}. Booking reference: ${bookingId}`,
          }),
        }],
      };
    }
  );

  return server;
}

// ─── StreamableHTTP Handler ───────────────────────────────────────────────────

export function createDineoutHttpHandler() {
  return {
    handle: async (req: Request, res: Response) => {
      const server = createDineoutMcpServer();
      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: undefined,
      });
      await server.connect(transport);
      await transport.handleRequest(req, res, req.body);
      await server.close();
    },
  };
}
