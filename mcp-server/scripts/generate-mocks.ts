import fs from 'fs';
import path from 'path';

// Helper to pick random item
const sample = (arr: any[]) => arr[Math.floor(Math.random() * arr.length)];
const randomPrice = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomFloat = (min: number, max: number) => parseFloat((Math.random() * (max - min) + min).toFixed(1));

// --- GROCERY (INSTAMART) ---
const groceryCategories = {
  "Staples & Atta": [
    { name: "Aashirvaad Whole Wheat Atta 5kg", basePrice: 250 },
    { name: "India Gate Basmati Rice 1kg", basePrice: 150 },
    { name: "Fortune Sunflower Oil 1L", basePrice: 120 },
    { name: "Tata Salt 1kg", basePrice: 28 },
    { name: "Toor Dal 1kg", basePrice: 160 },
  ],
  "Dairy & Bread": [
    { name: "Amul Taaza Milk 500ml", basePrice: 27 },
    { name: "Nandini GoodLife Milk 500ml", basePrice: 25 },
    { name: "Amul Butter 100g", basePrice: 56 },
    { name: "Britannia Whole Wheat Bread 400g", basePrice: 45 },
    { name: "Milky Mist Paneer 200g", basePrice: 85 },
    { name: "Eggs Regular 6 pcs", basePrice: 48 },
  ],
  "Snacks & Beverages": [
    { name: "Maggi 2-Minute Noodles 140g", basePrice: 28 },
    { name: "Lays India's Magic Masala 50g", basePrice: 20 },
    { name: "Haldiram's Bhujia Sev 200g", basePrice: 55 },
    { name: "Coca Cola 750ml", basePrice: 40 },
    { name: "Tata Tea Gold 500g", basePrice: 320 },
    { name: "Bru Instant Coffee 50g", basePrice: 95 },
  ],
  "Fruits & Vegetables": [
    { name: "Onion 1kg", basePrice: 45 },
    { name: "Tomato Local 1kg", basePrice: 30 },
    { name: "Potato 1kg", basePrice: 35 },
    { name: "Green Chilli 100g", basePrice: 15 },
    { name: "Coriander Leaves 1 bunch", basePrice: 10 },
    { name: "Banana Robusta 500g", basePrice: 30 },
  ],
  "Sauces & Spices": [
    { name: "Kissan Fresh Tomato Ketchup 500g", basePrice: 90 },
    { name: "Everest Garam Masala 50g", basePrice: 40 },
    { name: "MDH Kashmiri Red Chilli 100g", basePrice: 85 },
    { name: "Ginger Garlic Paste 100g", basePrice: 25 },
    { name: "Soy Sauce 200ml", basePrice: 45 },
  ],
  "Meat & Seafood": [
    { name: "Chicken Breast Boneless 500g", basePrice: 280 },
    { name: "Mutton Curry Cut 500g", basePrice: 550 },
    { name: "Prawns (Medium) 250g", basePrice: 320 },
  ]
};

const groceryItems = [];
for (const [category, items] of Object.entries(groceryCategories)) {
  for (const item of items) {
    groceryItems.push({
      id: `gro_${groceryItems.length + 1}`,
      name: item.name,
      category: category,
      unit_price: item.basePrice + randomPrice(-5, 5) // Slight variation
    });
  }
}

// --- DINEOUT RESTAURANTS ---
const dineoutNames = ["The Glass House", "Spice Terrace", "Olive Bar & Kitchen", "Toit", "Arbor Brewing Company", "Truffles", "Biergarten", "The Fatty Bao", "Byg Brewski", "Farzi Cafe", "Windmills Craftworks", "Karavalli", "Rim Naam", "Edo Restaurant", "Yauatcha", "Burma Burma", "Oko", "Sanchez", "Sriracha", "Social", "Hard Rock Cafe", "The Black Pearl", "Brahma Brews", "Ironhill", "Uru Brewpark", "K&K", "Toscano", "Fenny's", "The Reservoire", "Bob's Bar"];
const dineoutCuisines = ["Continental", "North Indian", "Italian", "Asian", "Pan-Asian", "Pub Food", "Seafood", "Mediterranean"];
const dineoutTags = ["Fine Dining", "Rooftop", "Date Night", "Live Music", "Craft Beer", "Buffet", "Casual Dining"];

const dineoutRestaurants = dineoutNames.map((name, i) => ({
  id: `do_${i + 1}`,
  name,
  cuisine: sample(dineoutCuisines),
  rating: randomFloat(3.8, 4.9),
  avg_cost_for_two: randomPrice(800, 3500),
  tags: [sample(dineoutTags), sample(dineoutTags)],
  next_available_slot: `${randomPrice(6, 9)}:30 PM`,
  wait_minutes: randomPrice(0, 45),
  address: `${randomPrice(1, 100)}, Bangalore`,
  reservation_url: `https://swiggy.com/dineout/reserve/do_${i + 1}`
}));

// --- FOOD RESTAURANTS ---
const foodNames = ["Meghana Foods", "Empire Restaurant", "Leon Grill", "KFC", "McDonald's", "Domino's Pizza", "Pizza Hut", "A2B", "Udupi Grand", "Truffles", "Burger King", "Nandhana Palace", "Polar Bear", "Corner House", "California Burrito", "Taco Bell", "Beijing Bites", "Mainland China", "Hole in the Wall", "FreshMenu", "EatFit", "Bowl Company", "Faasos", "Behrouz Biryani", "Ovenstory", "Kanti Sweets", "Ambur Biryani", "Mani's Dum Biryani", "Nagarjuna", "Andhra Gunpowder"];
const foodCuisines = ["South Indian", "North Indian", "Chinese", "Desserts", "Biryani", "Fast Food", "American", "Italian", "Healthy Food"];

const generateMenu = (restaurantName: string, cuisine: string) => {
  const menu = [];
  const numItems = randomPrice(10, 25);
  for (let i = 0; i < numItems; i++) {
    const isVeg = Math.random() > 0.5;
    menu.push({
      id: `m_${restaurantName.replace(/\s+/g, '')}_${i}`,
      name: `${cuisine} Specialty Item ${i + 1}`,
      description: `Delicious ${cuisine.toLowerCase()} dish prepared with fresh ingredients.`,
      price: randomPrice(99, 499),
      calories: randomPrice(150, 800),
      dietary_tags: isVeg ? ["Vegetarian"] : ["High-Protein", "Non-Veg"]
    });
  }
  return menu;
};

const foodRestaurants = foodNames.map((name, i) => {
  const cuisine = sample(foodCuisines);
  return {
    id: `f_${i + 1}`,
    name,
    cuisine,
    rating: randomFloat(3.5, 4.8),
    delivery_time_min: randomPrice(15, 60),
    tags: [cuisine, "Bestseller"],
    menu: generateMenu(name, cuisine)
  };
});

// --- SAVE TO FILES ---
const outDir = path.join(__dirname, '../src/data/generated');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

fs.writeFileSync(path.join(outDir, 'mock-grocery.json'), JSON.stringify(groceryItems, null, 2));
fs.writeFileSync(path.join(outDir, 'mock-dineout.json'), JSON.stringify(dineoutRestaurants, null, 2));
fs.writeFileSync(path.join(outDir, 'mock-food.json'), JSON.stringify(foodRestaurants, null, 2));

console.log('✅ Generated highly realistic mock data files in src/data/generated/');
