export const MOCK_VERIFICATION_CHOICES = [
  {
    id: "mock-1",
    modality: "delivery",
    title: "Mock Pepperoni Pizza",
    sub_text: "Mock Domino's • Extra cheese",
    cost: 15.99,
    time_minutes: 35,
    deep_link_url: "https://swiggy.com/mock-pizza"
  },
  {
    id: "mock-2",
    modality: "cook",
    title: "Mock Veggie Burger Ingredients",
    sub_text: "Mock Instamart • Fresh vegetables",
    cost: 8.50,
    time_minutes: 15,
    deep_link_url: "https://swiggy.com/mock-instamart",
    ingredients: [
      { name: "Burger Buns", required: true },
      { name: "Veggie Patties", required: true },
      { name: "Lettuce", required: false },
      { name: "Tomato", required: false },
      { name: "Cheese Slices", required: false },
      { name: "Salt", required: false },
      { name: "Pepper", required: false }
    ]
  },
  {
    id: "mock-3",
    modality: "dineout",
    title: "Mock Steakhouse Reservation",
    sub_text: "Mock Dineout • Table for 2",
    cost: 45.00,
    time_minutes: 120,
    deep_link_url: "https://swiggy.com/mock-dineout"
  }
];

export const MOCK_ORDER_CONFIRMATIONS = {
  delivery: {
    message: "Mock Food Delivery order placed successfully!",
    orders: [
      {
        modality: "delivery",
        restaurant_name: "Mock Domino's",
        order_id: "MOCK-DELIVERY-" + Math.floor(Math.random() * 10000),
        items: [
          { name: "Mock Pepperoni Pizza", quantity: 1, price: 15.99 },
          { name: "Mock Garlic Bread", quantity: 1, price: 4.50 }
        ],
        sub_total: 20.49
      }
    ],
    grand_total: 20.49
  },
  cook: {
    message: "Mock Instamart groceries ordered successfully!",
    orders: [
      {
        modality: "cook",
        restaurant_name: "Mock Instamart",
        order_id: "MOCK-INSTAMART-" + Math.floor(Math.random() * 10000),
        items: [
          { name: "Mock Burger Buns", quantity: 1, price: 2.50 },
          { name: "Mock Veggie Patties", quantity: 1, price: 4.00 },
          { name: "Mock Fresh Lettuce", quantity: 1, price: 2.00 }
        ],
        sub_total: 8.50
      }
    ],
    grand_total: 8.50
  },
  dineout: {
    message: "Mock Dineout reservation confirmed!",
    orders: [
      {
        modality: "dineout",
        restaurant_name: "Mock Steakhouse",
        order_id: "MOCK-DINEOUT-" + Math.floor(Math.random() * 10000),
        items: [
          { name: "Table for 2 (Reservation Fee)", quantity: 1, price: 5.00 },
          { name: "Pre-paid Appetizer", quantity: 1, price: 40.00 }
        ],
        sub_total: 45.00
      }
    ],
    grand_total: 45.00
  }
};

export const getRandomMockOrderConfirmation = () => {
  const keys = Object.keys(MOCK_ORDER_CONFIRMATIONS) as Array<keyof typeof MOCK_ORDER_CONFIRMATIONS>;
  const randomKey = keys[Math.floor(Math.random() * keys.length)];
  return MOCK_ORDER_CONFIRMATIONS[randomKey];
};

export const getMockOrderConfirmationForModality = (modality: string) => {
  if (modality in MOCK_ORDER_CONFIRMATIONS) {
    return MOCK_ORDER_CONFIRMATIONS[modality as keyof typeof MOCK_ORDER_CONFIRMATIONS];
  }
  return getRandomMockOrderConfirmation();
};
