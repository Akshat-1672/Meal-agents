const SWIGGY_API_URL = process.env.SWIGGY_API_URL || 'http://localhost:8001';

export interface SwiggyAddress {
  id: string;
  name: string;
  address_line: string;
  latitude: number;
  longitude: number;
}

export interface SwiggyMenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  calories: number;
  dietary_tags: string[];
}

export interface SwiggyRestaurant {
  id: string;
  name: string;
  cuisine: string;
  rating: number;
  delivery_time_min: number;
  tags: string[];
  menu: SwiggyMenuItem[];
}

export interface CartItemInput {
  id: string;
  quantity: number;
  customizations?: string[];
}

export interface SwiggyCart {
  restaurant_id: string;
  items: CartItemInput[];
}

export interface OrderItemReceipt {
  name: string;
  quantity: number;
  price: number;
  customizations: string;
}

export interface SwiggyOrderResponse {
  order_id: string;
  restaurant_id: string;
  restaurant_name: string;
  status: string;
  items: OrderItemReceipt[];
  total_amount: number;
  message: string;
}

export const swiggyClient = {
  async getAddresses(): Promise<SwiggyAddress[]> {
    try {
      const res = await fetch(`${SWIGGY_API_URL}/api/v1/swiggy/addresses`);
      if (!res.ok) throw new Error(`Swiggy API Error: ${res.status}`);
      const data = await res.json();
      return data.addresses || [];
    } catch (err) {
      console.error('Error fetching addresses from Swiggy:', err);
      return [];
    }
  },

  async searchRestaurants(location: string, cuisine?: string, query?: string): Promise<SwiggyRestaurant[]> {
    try {
      const params = new URLSearchParams({ location });
      if (cuisine) params.append('cuisine', cuisine);
      if (query) params.append('query', query);

      const res = await fetch(`${SWIGGY_API_URL}/api/v1/swiggy/restaurants?${params.toString()}`);
      if (!res.ok) throw new Error(`Swiggy API Error: ${res.status}`);
      const data = await res.json();
      return data.restaurants || [];
    } catch (err) {
      console.error('Error searching restaurants from Swiggy:', err);
      return [];
    }
  },

  async searchMenu(restaurantId: string): Promise<{ restaurant_id: string; restaurant_name: string; menu: SwiggyMenuItem[] } | null> {
    try {
      const res = await fetch(`${SWIGGY_API_URL}/api/v1/swiggy/restaurants/${restaurantId}/menu`);
      if (!res.ok) {
        if (res.status === 404) return null;
        throw new Error(`Swiggy API Error: ${res.status}`);
      }
      return await res.json();
    } catch (err) {
      console.error(`Error searching menu for restaurant ${restaurantId}:`, err);
      return null;
    }
  },

  async updateFoodCart(restaurantId: string, items: CartItemInput[]): Promise<any> {
    try {
      const res = await fetch(`${SWIGGY_API_URL}/api/v1/swiggy/cart`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ restaurant_id: restaurantId, items }),
      });
      if (!res.ok) throw new Error(`Swiggy API Error: ${res.status}`);
      return await res.json();
    } catch (err) {
      console.error('Error updating Swiggy Food Cart:', err);
      throw err;
    }
  },

  async getFoodCart(): Promise<SwiggyCart> {
    try {
      const res = await fetch(`${SWIGGY_API_URL}/api/v1/swiggy/cart`);
      if (!res.ok) throw new Error(`Swiggy API Error: ${res.status}`);
      return await res.json();
    } catch (err) {
      console.error('Error fetching Swiggy Food Cart:', err);
      return { restaurant_id: '', items: [] };
    }
  },

  async placeFoodOrder(): Promise<SwiggyOrderResponse> {
    try {
      const res = await fetch(`${SWIGGY_API_URL}/api/v1/swiggy/order`, {
        method: 'POST',
      });
      if (!res.ok) throw new Error(`Swiggy API Error: ${res.status}`);
      return await res.json();
    } catch (err) {
      console.error('Error placing food order on Swiggy:', err);
      throw err;
    }
  }
};
