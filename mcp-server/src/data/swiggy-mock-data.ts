// =============================================================================
// SWIGGY MOCK DATA — Shared across Food, Dineout, and Instamart MCP servers
// =============================================================================

// ─── Food Delivery ────────────────────────────────────────────────────────────

export interface MockAddress {
  id: string;
  name: string;
  address_line: string;
  latitude: number;
  longitude: number;
}

export interface MockMenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  calories: number;
  dietary_tags: string[];
}

export interface MockRestaurant {
  id: string;
  name: string;
  cuisine: string;
  rating: number;
  delivery_time_min: number;
  tags: string[];
  menu: MockMenuItem[];
}

export const MOCK_ADDRESSES: MockAddress[] = [
  {
    id: 'addr_001',
    name: 'Home',
    address_line: '12, MG Road, Bangalore, KA 560001',
    latitude: 12.9716,
    longitude: 77.5946,
  },
  {
    id: 'addr_002',
    name: 'Office',
    address_line: '45, Koramangala 5th Block, Bangalore, KA 560095',
    latitude: 12.9352,
    longitude: 77.6245,
  },
];

import mockFoodData from './generated/mock-food.json';
export const MOCK_RESTAURANTS: MockRestaurant[] = mockFoodData as MockRestaurant[];

// Cart state (in-memory, per server instance)
let cartState: { restaurant_id: string; items: Array<{ id: string; quantity: number; customizations?: string[] }> } = {
  restaurant_id: '',
  items: [],
};

let orderCounter = 1000;

export function getCart() {
  return cartState;
}

export function setCart(restaurant_id: string, items: any[]) {
  cartState = { restaurant_id, items };
}

export function placeOrder(): {
  order_id: string;
  restaurant_id: string;
  restaurant_name: string;
  status: string;
  items: any[];
  total_amount: number;
  message: string;
} {
  const restaurant = MOCK_RESTAURANTS.find((r) => r.id === cartState.restaurant_id);
  if (!restaurant || cartState.items.length === 0) {
    throw new Error('Cart is empty or restaurant not found');
  }

  const receiptItems: any[] = [];
  let total = 0;

  for (const cartItem of cartState.items) {
    const menuItem = restaurant.menu.find((m) => m.id === cartItem.id);
    if (menuItem) {
      const subtotal = menuItem.price * cartItem.quantity;
      total += subtotal;
      receiptItems.push({
        name: menuItem.name,
        quantity: cartItem.quantity,
        price: subtotal,
        customizations: (cartItem.customizations || []).join(', '),
      });
    }
  }

  const deliveryFee = 49;
  const tax = Math.round(total * 0.05);
  total += deliveryFee + tax;

  const orderId = `ORD_${++orderCounter}`;
  cartState = { restaurant_id: '', items: [] };

  return {
    order_id: orderId,
    restaurant_id: restaurant.id,
    restaurant_name: restaurant.name,
    status: 'CONFIRMED',
    items: receiptItems,
    total_amount: total,
    message: `Your order from ${restaurant.name} has been confirmed! Estimated delivery in ${restaurant.delivery_time_min} minutes.`,
  };
}

// ─── Dineout ──────────────────────────────────────────────────────────────────

export interface MockDineoutRestaurant {
  id: string;
  name: string;
  cuisine: string;
  rating: number;
  avg_cost_for_two: number;
  tags: string[];
  next_available_slot: string;
  wait_minutes: number;
  address: string;
  reservation_url: string;
}

import mockDineoutData from './generated/mock-dineout.json';
export const MOCK_DINEOUT_RESTAURANTS: MockDineoutRestaurant[] = mockDineoutData as MockDineoutRestaurant[];

// ─── Instamart (Grocery / Cook) ───────────────────────────────────────────────

export interface MockRecipe {
  id: string;
  recipe_name: string;
  prompt_keywords: string[];
  prep_minutes: number;
  servings: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  ingredients: MockIngredient[];
  instructions_url: string;
}

export interface MockIngredient {
  name: string;
  quantity: string;
  unit_price: number; // INR per unit
}

import mockRecipesData from './generated/mock-recipes.json';
export const MOCK_RECIPES: MockRecipe[] = mockRecipesData as MockRecipe[];

export function findBestRecipe(prompt: string): MockRecipe {
  const lower = prompt.toLowerCase();
  let bestMatch = MOCK_RECIPES[0];
  let bestScore = 0;

  for (const recipe of MOCK_RECIPES) {
    const score = recipe.prompt_keywords.filter((kw) => lower.includes(kw)).length;
    if (score > bestScore) {
      bestScore = score;
      bestMatch = recipe;
    }
  }

  if (bestScore === 0) {
    const randomIndex = Math.floor(Math.random() * MOCK_RECIPES.length);
    return MOCK_RECIPES[randomIndex];
  }

  return bestMatch;
}

export function calculateBasketPrice(
  ingredients: MockIngredient[],
  location: { lat: number; lng: number }
): { total_payable: number; delivery_eta_minutes: number; checkout_url: string } {
  const rawTotal = ingredients.reduce((sum, ing) => sum + ing.unit_price, 0);
  const deliveryFee = 29;
  const platformFee = 10;
  const total = rawTotal + deliveryFee + platformFee;

  // ETA varies slightly by location (mock: distance-based)
  const etaMinutes = 25 + Math.floor((Math.abs(location.lat - 12.97) + Math.abs(location.lng - 77.59)) * 100);

  return {
    total_payable: Math.round(total),
    delivery_eta_minutes: Math.min(etaMinutes, 60),
    checkout_url: `https://swiggy.com/instamart/checkout?basket=${encodeURIComponent(
      ingredients.map((i) => i.name).join(',')
    )}`,
  };
}
