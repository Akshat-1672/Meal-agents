#!/usr/bin/env python3
"""
Generate synthetic restaurant dataset for food ordering application.
Creates 50 diverse restaurants with realistic menus for AI Agent testing.
"""

import json
import random
from pathlib import Path
from typing import List, Dict, Any, Set
from faker import Faker

from src.scripts.constants import CUISINES


# Configuration
OUTPUT_PATH = Path(__file__).parent.parent / "data" / "restaurants.json"
NUM_RESTAURANTS = 100
fake = Faker()


# Additional restaurant tags
ADDITIONAL_TAGS = [
    "Fast Delivery", "Late Night", "Outdoor Seating", "Free Delivery", 
    "Locally Sourced", "Award Winning", "Chef's Specials", "Catering Available"
]


def generate_restaurant_name(cuisine: str) -> str:
    """Generate a creative restaurant name based on cuisine."""
    cuisine_data = CUISINES[cuisine]
    
    # Use a mix of Faker-generated names and cuisine-specific names
    if random.random() < 0.4:
        # Use Faker for more realistic business names
        company_name = fake.company()
        # Clean up common suffixes that don't fit restaurants
        for suffix in [" Inc", " LLC", " Ltd", " Group", " and Sons", "-"]:
            company_name = company_name.replace(suffix, "")
        
        # Add cuisine-specific suffix
        suffix = random.choice(cuisine_data["suffixes"])
        return f"{company_name} {suffix}"
    else:
        # Use traditional cuisine-specific naming
        prefix = random.choice(cuisine_data["prefixes"])
        suffix = random.choice(cuisine_data["suffixes"])
        
        # Sometimes just use prefix or suffix alone
        if random.random() < 0.3:
            return f"{prefix}'s"
        elif random.random() < 0.2:
            return f"The {prefix} {suffix}"
        else:
            return f"{prefix} {suffix}"


def generate_menu_item(cuisine: str, restaurant_id: str, item_index: int) -> Dict[str, Any]:
    """Generate a single menu item for a restaurant."""
    cuisine_data = CUISINES[cuisine]
    dish_name, description, dietary_tags = random.choice(cuisine_data["dishes"])
    
    return {
        "id": f"{restaurant_id}_m_{item_index:03d}",
        "name": dish_name,
        "description": description,
        "price": round(random.uniform(10.0, 35.0), 2),
        "calories": random.randint(300, 1200),
        "dietary_tags": dietary_tags
    }


def generate_restaurant(restaurant_index: int) -> Dict[str, Any]:
    """Generate a complete restaurant object."""
    restaurant_id = f"r_{restaurant_index:03d}"
    cuisine = random.choice(list(CUISINES.keys()))
    
    # Generate base tags from cuisine
    cuisine_tags = random.sample(CUISINES[cuisine]["tags"], k=random.randint(2, 4))
    
    # Add some additional random tags
    extra_tags = random.sample(ADDITIONAL_TAGS, k=random.randint(1, 2))
    all_tags = cuisine_tags + extra_tags
    
    # Generate menu items (10-30 items per restaurant)
    num_menu_items = random.randint(10, 30)
    menu:List[Dict[str, Any]] = []
    used_dishes: Set[str] = set()
    
    for i in range(num_menu_items):
        # Ensure variety in menu items
        attempts = 0
        while attempts < 20:  # Prevent infinite loop
            menu_item = generate_menu_item(cuisine, restaurant_id, i + 1)
            if menu_item["name"] not in used_dishes:
                used_dishes.add(menu_item["name"])
                menu.append(menu_item)
                break
            attempts += 1
    
    return {
        "id": restaurant_id,
        "name": generate_restaurant_name(cuisine),
        "cuisine": cuisine,
        "rating": round(random.uniform(3.5, 5.0), 1),
        "delivery_time_min": random.choice([20, 25, 30, 35, 40, 45, 50, 60]),
        "tags": all_tags,
        "menu": menu
    }


def ensure_dietary_diversity(restaurants: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Ensure at least 20% of items are vegan or vegetarian."""
    total_items = sum(len(r["menu"]) for r in restaurants)
    vegan_vegetarian_count = 0
    
    for restaurant in restaurants:
        for item in restaurant["menu"]:
            if "Vegan" in item["dietary_tags"] or "Vegetarian" in item["dietary_tags"]:
                vegan_vegetarian_count += 1
    
    vegan_percentage = (vegan_vegetarian_count / total_items) * 100
    print(f"  → {vegan_vegetarian_count}/{total_items} items are Vegan/Vegetarian ({vegan_percentage:.1f}%)")
    
    return restaurants


def generate_dataset() -> List[Dict[str, Any]]:
    """Generate the complete restaurant dataset."""
    print(f"Generating {NUM_RESTAURANTS} restaurants...")
    
    restaurants:List[Dict[str, Any]] = []
    for i in range(1, NUM_RESTAURANTS + 1):
        restaurant = generate_restaurant(i)
        restaurants.append(restaurant)
        
        if i % 10 == 0:
            print(f"  → Generated {i} restaurants...")
    
    # Ensure dietary diversity
    restaurants = ensure_dietary_diversity(restaurants)
    
    return restaurants


def save_to_file(restaurants: List[Dict[str, Any]]) -> None:
    """Save the restaurant dataset to JSON file."""
    # Ensure the data directory exists
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    
    # Write to file with pretty printing
    with open(OUTPUT_PATH, 'w', encoding='utf-8') as f:
        json.dump(restaurants, f, indent=2, ensure_ascii=False)
    
    print(f"\n✓ Generated {len(restaurants)} restaurants to {OUTPUT_PATH}")
    
    # Print some statistics
    total_items = sum(len(r["menu"]) for r in restaurants)
    cuisines_count:Dict[str, int] = {}
    for r in restaurants:
        cuisines_count[r["cuisine"]] = cuisines_count.get(r["cuisine"], 0) + 1
    
    print(f"\nDataset Statistics:")
    print(f"  → Total restaurants: {len(restaurants)}")
    print(f"  → Total menu items: {total_items}")
    print(f"  → Cuisine distribution:")
    for cuisine, count in sorted(cuisines_count.items()):
        print(f"      • {cuisine}: {count}")


def main():
    """Main entry point."""
    print("=" * 60)
    print("Restaurant Dataset Generator")
    print("=" * 60)
    
    restaurants = generate_dataset()
    save_to_file(restaurants)
    
    print("\n" + "=" * 60)
    print("Done! Dataset is ready for use.")
    print("=" * 60)


if __name__ == "__main__":
    main()
