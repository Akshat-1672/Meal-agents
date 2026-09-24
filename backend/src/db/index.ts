import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from './schema';
import { eq } from 'drizzle-orm';

const sqlite = new Database('feedme.db');
export const db = drizzle(sqlite, { schema });

// Seed helper for test users
export async function seedTestUsers() {
  const testUsers = [
    {
      id: "late_night_larry",
      name: "Late Night Larry",
      preferences: JSON.stringify(["Greasy", "Comforting", "Spicy"]),
      allergies: JSON.stringify([]),
      days: JSON.stringify(["Friday", "Saturday"]),
      meals: JSON.stringify([
        {
          id: 3001,
          type: "Dinner",
          start: "23:00",
          end: "23:59",
          customName: "The Midnight Snack"
        }
      ]),
      specialInstructions: "I had a long day. I want something greasy and spicy to wake me up. Definitely NOT Indian food. Maybe Asian? Surprise me with something rated 4.5 or higher."
    },
    {
      id: "fitness_fiona",
      name: "Fitness Fiona",
      preferences: JSON.stringify(["High-Protein", "Clean Eating"]),
      allergies: JSON.stringify([]),
      days: JSON.stringify(["Monday", "Wednesday", "Friday"]),
      meals: JSON.stringify([
        {
          id: 1001,
          type: "Lunch",
          start: "12:00",
          end: "13:00",
          customName: "Post-Workout Fuel"
        }
      ]),
      specialInstructions: "I'm on a strict cut. If it's Monday or Wednesday: I want a Salad under 500 calories and the budget under $20. If it's Friday: I want a High-Protein Burger (no bun) and a dessert and the budget $40. ALWAYS ask for 'Sauce on the side' and 'Extra water'. On Friday's also ask for extra plate and napkins too."
    },
    {
      id: "cozy_chris",
      name: "Cozy Chris",
      preferences: JSON.stringify(["Warm", "Soups", "Pasta"]),
      allergies: JSON.stringify([]),
      days: JSON.stringify(["Sunday"]),
      meals: JSON.stringify([
        {
          id: 4001,
          type: "Lunch",
          start: "12:00",
          end: "13:00",
          customName: "Rainy Day Lunch"
        }
      ]),
      specialInstructions: "It is pouring rain outside and I feel cold. Find me the absolute best 'warm hug in a bowl' type of meal. I don't care about the price, but it MUST be from a place with a 4.8 rating or higher. If they have soup, get that. If not, a heavy pasta."
    },
    {
      id: "tech_lead_tina",
      name: "Tech Lead Tina",
      preferences: JSON.stringify(["Variety", "Finger Food"]),
      allergies: JSON.stringify(["Peanuts", "Shellfish"]),
      days: JSON.stringify(["Friday"]),
      meals: JSON.stringify([
        {
          id: 5001,
          type: "Lunch",
          start: "12:00",
          end: "13:00",
          customName: "Hackathon Feast"
        }
      ]),
      specialInstructions: "Ordering for the hackathon team (10 people). Budget $150. I need a variety of appetizers and mains. Half MUST be Vegan. I don't want to choose individual items. Please analyze the menu and create a SINGLE 'Hackathon Bundle' as Option 1 that includes all the items we need. Just list that one perfect bundle for me to approve."
    }
  ];

  for (const u of testUsers) {
    const existing = await db.select().from(schema.users).where(eq(schema.users.id, u.id));
    if (existing.length === 0) {
      await db.insert(schema.users).values({
        id: u.id,
        name: u.name,
        preferences: u.preferences,
        allergies: u.allergies,
        days: u.days,
        meals: u.meals,
        specialInstructions: u.specialInstructions
      });
      console.log(`Seeded user: ${u.name}`);
    }
  }
}

// Automatically seed on startup
seedTestUsers().catch(console.error);
