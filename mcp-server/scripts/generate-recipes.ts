import fs from 'fs';
import path from 'path';

const randomPrice = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

const recipes = [
  {
    id: "rec_001",
    recipe_name: "Paneer Butter Masala",
    prompt_keywords: ["paneer", "butter", "masala", "indian", "vegetarian", "curry", "rich"],
    prep_minutes: 30,
    servings: 4,
    difficulty: "Medium",
    ingredients: [
      { name: "Milky Mist Paneer", quantity: "200g", unit_price: 85 },
      { name: "Amul Butter", quantity: "100g", unit_price: 56 },
      { name: "Tomato Local", quantity: "500g", unit_price: 15 },
      { name: "Onion", quantity: "250g", unit_price: 12 },
      { name: "Cashews", quantity: "50g", unit_price: 60 },
      { name: "Everest Garam Masala", quantity: "50g", unit_price: 40 }
    ],
    instructions_url: "https://swiggy.com/instamart/recipe/rec_001"
  },
  {
    id: "rec_002",
    recipe_name: "Quick Masala Maggi",
    prompt_keywords: ["maggi", "quick", "snack", "noodles", "easy"],
    prep_minutes: 10,
    servings: 1,
    difficulty: "Easy",
    ingredients: [
      { name: "Maggi 2-Minute Noodles", quantity: "140g", unit_price: 28 },
      { name: "Onion", quantity: "1 pc", unit_price: 5 },
      { name: "Tomato Local", quantity: "1 pc", unit_price: 4 },
      { name: "Green Chilli", quantity: "2 pcs", unit_price: 2 }
    ],
    instructions_url: "https://swiggy.com/instamart/recipe/rec_002"
  },
  {
    id: "rec_003",
    recipe_name: "Chicken Biryani",
    prompt_keywords: ["chicken", "biryani", "rice", "spicy", "sunday"],
    prep_minutes: 60,
    servings: 4,
    difficulty: "Hard",
    ingredients: [
      { name: "India Gate Basmati Rice", quantity: "500g", unit_price: 75 },
      { name: "Chicken Curry Cut", quantity: "500g", unit_price: 160 },
      { name: "Onion", quantity: "500g", unit_price: 25 },
      { name: "Amul Taaza Milk", quantity: "250ml", unit_price: 14 },
      { name: "Everest Biryani Masala", quantity: "50g", unit_price: 45 }
    ],
    instructions_url: "https://swiggy.com/instamart/recipe/rec_003"
  },
  {
    id: "rec_004",
    recipe_name: "Aloo Paratha",
    prompt_keywords: ["aloo", "paratha", "breakfast", "punjabi", "potato"],
    prep_minutes: 30,
    servings: 2,
    difficulty: "Medium",
    ingredients: [
      { name: "Aashirvaad Whole Wheat Atta", quantity: "500g", unit_price: 25 },
      { name: "Potato", quantity: "500g", unit_price: 18 },
      { name: "Amul Butter", quantity: "50g", unit_price: 28 },
      { name: "Green Chilli", quantity: "50g", unit_price: 8 },
      { name: "Coriander Leaves", quantity: "1 bunch", unit_price: 10 }
    ],
    instructions_url: "https://swiggy.com/instamart/recipe/rec_004"
  },
  {
    id: "rec_005",
    recipe_name: "Healthy Fruit Salad",
    prompt_keywords: ["fruit", "salad", "healthy", "diet", "breakfast"],
    prep_minutes: 15,
    servings: 2,
    difficulty: "Easy",
    ingredients: [
      { name: "Banana Robusta", quantity: "500g", unit_price: 30 },
      { name: "Apple Washington", quantity: "2 pcs", unit_price: 60 },
      { name: "Pomegranate", quantity: "1 pc", unit_price: 40 },
      { name: "Papaya", quantity: "1 pc", unit_price: 45 }
    ],
    instructions_url: "https://swiggy.com/instamart/recipe/rec_005"
  }
];

// Duplicate to get 20 recipes by mixing keywords
for (let i = 6; i <= 20; i++) {
  const base = recipes[i % 5];
  recipes.push({
    ...base,
    id: `rec_${i.toString().padStart(3, '0')}`,
    recipe_name: `${base.recipe_name} Variant ${i}`,
    ingredients: base.ingredients.map(ing => ({...ing, unit_price: ing.unit_price + randomPrice(-3, 3)}))
  });
}

const outDir = path.join(__dirname, '../src/data/generated');
fs.writeFileSync(path.join(outDir, 'mock-recipes.json'), JSON.stringify(recipes, null, 2));
console.log('✅ Generated recipes');
