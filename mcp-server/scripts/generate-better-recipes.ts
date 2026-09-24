import fs from 'fs';
import path from 'path';

const recipes = [
  {
    id: "rec_001", recipe_name: "Paneer Butter Masala",
    prompt_keywords: ["paneer", "butter", "masala", "indian", "vegetarian", "curry", "rich", "dinner", "lunch"],
    prep_minutes: 30, servings: 4, difficulty: "Medium",
    ingredients: [
      { name: "Milky Mist Paneer", quantity: "200g", unit_price: 85 },
      { name: "Amul Butter", quantity: "100g", unit_price: 56 },
      { name: "Tomato", quantity: "500g", unit_price: 15 }
    ],
    instructions_url: "https://swiggy.com/instamart/recipe/rec_001"
  },
  {
    id: "rec_002", recipe_name: "High-Protein Chicken Salad",
    prompt_keywords: ["chicken", "salad", "high-protein", "protein", "healthy", "diet", "low-carb", "dinner", "lunch"],
    prep_minutes: 15, servings: 2, difficulty: "Easy",
    ingredients: [
      { name: "Chicken Breast", quantity: "400g", unit_price: 220 },
      { name: "Lettuce", quantity: "1 head", unit_price: 40 },
      { name: "Olive Oil", quantity: "1 bottle", unit_price: 250 }
    ],
    instructions_url: "https://swiggy.com/instamart/recipe/rec_002"
  },
  {
    id: "rec_003", recipe_name: "Vegan Tofu Stir-fry",
    prompt_keywords: ["vegan", "tofu", "stir-fry", "healthy", "dinner", "asian", "protein", "high-protein"],
    prep_minutes: 20, servings: 2, difficulty: "Medium",
    ingredients: [
      { name: "Firm Tofu", quantity: "200g", unit_price: 60 },
      { name: "Broccoli", quantity: "1 pc", unit_price: 30 },
      { name: "Soy Sauce", quantity: "1 bottle", unit_price: 45 }
    ],
    instructions_url: "https://swiggy.com/instamart/recipe/rec_003"
  },
  {
    id: "rec_004", recipe_name: "Quick Masala Maggi",
    prompt_keywords: ["maggi", "quick", "snack", "noodles", "easy", "midnight"],
    prep_minutes: 10, servings: 1, difficulty: "Easy",
    ingredients: [
      { name: "Maggi 2-Minute Noodles", quantity: "140g", unit_price: 28 },
      { name: "Onion", quantity: "1 pc", unit_price: 5 }
    ],
    instructions_url: "https://swiggy.com/instamart/recipe/rec_004"
  },
  {
    id: "rec_005", recipe_name: "Egg White Omelette",
    prompt_keywords: ["egg", "omelette", "breakfast", "protein", "high-protein", "healthy", "quick"],
    prep_minutes: 10, servings: 1, difficulty: "Easy",
    ingredients: [
      { name: "Eggs", quantity: "6 pcs", unit_price: 40 },
      { name: "Spinach", quantity: "1 bunch", unit_price: 15 }
    ],
    instructions_url: "https://swiggy.com/instamart/recipe/rec_005"
  },
  {
    id: "rec_006", recipe_name: "Chicken Biryani",
    prompt_keywords: ["chicken", "biryani", "rice", "spicy", "sunday", "dinner", "feast"],
    prep_minutes: 60, servings: 4, difficulty: "Hard",
    ingredients: [
      { name: "India Gate Basmati Rice", quantity: "500g", unit_price: 75 },
      { name: "Chicken Curry Cut", quantity: "500g", unit_price: 160 }
    ],
    instructions_url: "https://swiggy.com/instamart/recipe/rec_006"
  },
  {
    id: "rec_007", recipe_name: "Lentil Soup (Dal Tadka)",
    prompt_keywords: ["dal", "lentil", "soup", "healthy", "comfort", "dinner", "vegetarian", "protein"],
    prep_minutes: 30, servings: 3, difficulty: "Easy",
    ingredients: [
      { name: "Toor Dal", quantity: "500g", unit_price: 80 },
      { name: "Ghee", quantity: "100ml", unit_price: 90 }
    ],
    instructions_url: "https://swiggy.com/instamart/recipe/rec_007"
  },
  {
    id: "rec_008", recipe_name: "Grilled Fish with Asparagus",
    prompt_keywords: ["fish", "grilled", "seafood", "protein", "high-protein", "healthy", "dinner", "keto"],
    prep_minutes: 25, servings: 2, difficulty: "Medium",
    ingredients: [
      { name: "Fish Fillet", quantity: "300g", unit_price: 250 },
      { name: "Asparagus", quantity: "1 bunch", unit_price: 120 }
    ],
    instructions_url: "https://swiggy.com/instamart/recipe/rec_008"
  },
  {
    id: "rec_009", recipe_name: "Quinoa Bowl",
    prompt_keywords: ["quinoa", "bowl", "vegan", "healthy", "diet", "lunch", "protein"],
    prep_minutes: 20, servings: 1, difficulty: "Easy",
    ingredients: [
      { name: "Quinoa", quantity: "200g", unit_price: 150 },
      { name: "Avocado", quantity: "1 pc", unit_price: 80 }
    ],
    instructions_url: "https://swiggy.com/instamart/recipe/rec_009"
  },
  {
    id: "rec_010", recipe_name: "Aloo Paratha",
    prompt_keywords: ["aloo", "paratha", "breakfast", "punjabi", "potato", "heavy"],
    prep_minutes: 30, servings: 2, difficulty: "Medium",
    ingredients: [
      { name: "Whole Wheat Atta", quantity: "500g", unit_price: 25 },
      { name: "Potato", quantity: "500g", unit_price: 18 }
    ],
    instructions_url: "https://swiggy.com/instamart/recipe/rec_010"
  },
  {
    id: "rec_011", recipe_name: "Mushroom Risotto",
    prompt_keywords: ["mushroom", "risotto", "italian", "dinner", "vegetarian", "fancy"],
    prep_minutes: 45, servings: 2, difficulty: "Hard",
    ingredients: [
      { name: "Arborio Rice", quantity: "200g", unit_price: 180 },
      { name: "Button Mushrooms", quantity: "200g", unit_price: 50 }
    ],
    instructions_url: "https://swiggy.com/instamart/recipe/rec_011"
  },
  {
    id: "rec_012", recipe_name: "Peanut Butter Protein Shake",
    prompt_keywords: ["peanut", "butter", "protein", "shake", "drink", "gym", "workout", "high-protein", "quick"],
    prep_minutes: 5, servings: 1, difficulty: "Easy",
    ingredients: [
      { name: "Peanut Butter", quantity: "1 jar", unit_price: 150 },
      { name: "Milk", quantity: "500ml", unit_price: 30 },
      { name: "Whey Protein", quantity: "1 scoop", unit_price: 100 }
    ],
    instructions_url: "https://swiggy.com/instamart/recipe/rec_012"
  },
  {
    id: "rec_013", recipe_name: "Beef Steak with Mash",
    prompt_keywords: ["beef", "steak", "meat", "protein", "high-protein", "dinner", "heavy"],
    prep_minutes: 30, servings: 1, difficulty: "Medium",
    ingredients: [
      { name: "Beef Steak", quantity: "250g", unit_price: 300 },
      { name: "Potato", quantity: "500g", unit_price: 18 }
    ],
    instructions_url: "https://swiggy.com/instamart/recipe/rec_013"
  },
  {
    id: "rec_014", recipe_name: "Chickpea Curry (Chole)",
    prompt_keywords: ["chickpea", "chole", "curry", "indian", "vegan", "protein", "dinner", "lunch"],
    prep_minutes: 40, servings: 4, difficulty: "Medium",
    ingredients: [
      { name: "Kabuli Chana", quantity: "500g", unit_price: 90 },
      { name: "Onion", quantity: "500g", unit_price: 25 }
    ],
    instructions_url: "https://swiggy.com/instamart/recipe/rec_014"
  },
  {
    id: "rec_015", recipe_name: "Greek Yogurt Parfait",
    prompt_keywords: ["yogurt", "parfait", "breakfast", "snack", "healthy", "protein", "sweet"],
    prep_minutes: 10, servings: 1, difficulty: "Easy",
    ingredients: [
      { name: "Greek Yogurt", quantity: "200g", unit_price: 60 },
      { name: "Granola", quantity: "100g", unit_price: 40 }
    ],
    instructions_url: "https://swiggy.com/instamart/recipe/rec_015"
  }
];

const outDir = path.join(__dirname, '../src/data/generated');
fs.writeFileSync(path.join(outDir, 'mock-recipes.json'), JSON.stringify(recipes, null, 2));
console.log('✅ Generated better recipes');
