"""
Test user profiles for AutoNom demo.
These profiles are designed to showcase different agent reasoning capabilities.
"""

from src.schema.users import UserProfile, Meal

# --- LEVEL 1: SEMANTIC SEARCH & VIBES ---
# Showcase: "Vague inputs mapped to specific database tags"
LATE_NIGHT_LARRY = UserProfile(
    id="late_night_larry",
    name="Late Night Larry",
    preferences=["Greasy", "Comforting", "Spicy"],
    allergies=[],
    days=["Friday", "Saturday"],
    meals=[
        Meal(
            id=3001,
            type="Dinner",
            start="23:00",
            end="23:59",
            customName="The Midnight Snack"
        )
    ],
    special_instructions=(
        "I had a long day. I want something greasy and spicy to wake me up. "
        "Definitely NOT Indian food. Maybe Asian? "
        "Surprise me with something rated 4.5 or higher."
    )
)

# --- LEVEL 2: HARD CONSTRAINTS & DAY LOGIC ---
# Showcase: "Math filtering (Price/Cal), Day-specific logic, Customizations"
FITNESS_FIONA = UserProfile(
    id="fitness_fiona",
    name="Fitness Fiona",
    preferences=["High-Protein", "Clean Eating"],
    allergies=[],
    days=["Monday", "Wednesday", "Friday"],
    meals=[
        Meal(
            id=1001,
            type="Lunch",
            start="12:00",
            end="13:00",
            customName="Post-Workout Fuel"
        )
    ],
    special_instructions=(
        "I'm on a strict cut. "
        "If it's Monday or Wednesday: I want a Salad under 500 calories and the budget under $20 "
        "If it's Friday: I want a High-Protein Burger (no bun) and a dessert and the budget $40. "
        "ALWAYS ask for 'Sauce on the side' and 'Extra water'."
        "On Friday's also ask for extra plate and napkins too."
    )
)

# --- LEVEL 2.5: CONTEXTUAL REASONING (THE "MOOD" READER) ---
# Showcase: "Inferring food choices from environmental context (Weather/Mood)"
COZY_CHRIS = UserProfile(
    id="cozy_chris",
    name="Cozy Chris",
    preferences=["Warm", "Soups", "Pasta"],
    allergies=[],
    days=["Sunday"],
    meals=[
        Meal(
            id=4001,
            type="Lunch",
            start="12:00",
            end="13:00",
            customName="Rainy Day Lunch"
        )
    ],
    special_instructions=(
        "It is pouring rain outside and I feel cold. "
        "Find me the absolute best 'warm hug in a bowl' type of meal. "
        "I don't care about the price, but it MUST be from a place with a 4.8 rating or higher. "
        "If they have soup, get that. If not, a heavy pasta."
    )
)

# --- LEVEL 3: HOLY GUACAMOLE (COMPLEXITY & AGENCY) ---
# Showcase: "Multi-item orders, Group constraints, Auto-decision making"
TECH_LEAD_TINA = UserProfile(
    id="tech_lead_tina",
    name="Tech Lead Tina",
    preferences=["Variety", "Finger Food"],
    allergies=["Peanuts", "Shellfish"],
    days=["Friday"],
    meals=[
        Meal(
            id=5001,
            type="Lunch",
            start="12:00",
            end="13:00",
            customName="Hackathon Feast"
        )
    ],
    special_instructions=(
        "Ordering for the hackathon team (10 people). Budget $150. "
        "I need a variety of appetizers and mains. Half MUST be Vegan. "
        "I don't want to choose individual items. "
        "Please analyze the menu and create a SINGLE 'Hackathon Bundle' as Option 1 "
        "that includes all the items we need. "
        "Just list that one perfect bundle for me to approve."
    )
)

# All test users for easy iteration
TEST_USERS = [
    LATE_NIGHT_LARRY,  # The Warm Up
    FITNESS_FIONA,    # The Flex
    COZY_CHRIS,
    TECH_LEAD_TINA    # The Mic Drop
]


def get_test_users():
    """
    Returns all test user profiles.
    """
    return TEST_USERS
