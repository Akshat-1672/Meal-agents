import json
from fastapi import FastAPI, HTTPException
from pathlib import Path
from contextlib import asynccontextmanager
from typing import List, Dict, Any, Optional

# Import shared logger
from utils.logger import ServiceLogger

DATA_PATH = Path(__file__).parent / "data/restaurants.json"
RESTAURANTS: List[Dict[str, Any]] = []


@asynccontextmanager
async def lifespan(app: FastAPI):
    global RESTAURANTS
    if DATA_PATH.exists():
        with open(DATA_PATH, "r") as f:
            data = json.load(f)
            RESTAURANTS.clear()
            RESTAURANTS.extend(data)
        ServiceLogger.log_success(
            f"DashDoor loaded {len(RESTAURANTS)} restaurants", "STARTUP")
    else:
        ServiceLogger.log_warning(
            "No data found in restaurants.json", "STARTUP")

    ServiceLogger.startup_message("DashDoor API", port=8001)
    yield
    ServiceLogger.shutdown_message("DashDoor API")

app = FastAPI(title="DashDoor API 🍔", lifespan=lifespan)


@app.get("/")
def read_root() -> Dict[str, Any]:
    ServiceLogger.api_called_panel("GET", "/")
    ServiceLogger.health_check()
    return {"status": "DashDoor is open for business!", "restaurant_count": len(RESTAURANTS)}


@app.get("/api/v1/restaurants")
def get_restaurants():
    """Returns all restaurants (mocking a search feed)"""
    ServiceLogger.api_called_panel("GET", "/api/v1/restaurants")
    ServiceLogger.log_info(f"Returning {len(RESTAURANTS)} restaurants", "API")
    return RESTAURANTS


@app.get("/api/v1/cuisines")
def get_cuisines() -> Dict[str, List[str]]:
    """Returns list of unique cuisines available"""
    ServiceLogger.api_called_panel("GET", "/api/v1/cuisines")
    cuisines: set[str] = set()
    for r in RESTAURANTS:
        if "cuisine" in r and r["cuisine"]:
            cuisines.add(r["cuisine"])
    result = sorted(list(cuisines))
    ServiceLogger.log_info(f"Found {len(result)} unique cuisines", "API")
    return {"cuisines": result}


@app.get("/api/v1/restaurants/by-cuisine")
def get_restaurants_by_cuisine(cuisine: str) -> Dict[str, Any]:
    """Returns restaurants filtered by cuisine type"""
    ServiceLogger.api_called_panel("GET", "/api/v1/restaurants/by-cuisine",
                                   params={"cuisine": cuisine})
    filtered: List[Dict[str, Any]] = [r for r in RESTAURANTS if r.get(
        "cuisine", "").lower() == cuisine.lower()]
    ServiceLogger.log_info(
        f"Found {len(filtered)} restaurants for cuisine: {cuisine}", "API")
    return {"cuisine": cuisine, "count": len(filtered), "restaurants": filtered}

@app.get("/api/v1/tags")
def get_tags() -> Dict[str, List[str]]:
    """Returns list of unique restaurant tags"""
    ServiceLogger.api_called_panel("GET", "/api/v1/tags")
    tags: set[str] = set()
    for r in RESTAURANTS:
        if "tags" in r and r["tags"]:
            tags.update(r["tags"])
    result = sorted(list(tags))
    ServiceLogger.log_info(f"Found {len(result)} unique tags", "API")
    return {"tags": result}


@app.get("/api/v1/restaurants/by-tags")
def get_restaurants_by_tags(tags: str) -> Dict[str, Any]:
    """Returns restaurants filtered by tags (comma-separated)"""
    tag_list = [t.strip() for t in tags.split(",")]
    ServiceLogger.api_called_panel("GET", "/api/v1/restaurants/by-tags",
                                   params={"tags": tags})
    filtered: List[Dict[str, Any]] = []
    for r in RESTAURANTS:
        restaurant_tags = r.get("tags", [])
        if any(tag in restaurant_tags for tag in tag_list):
            filtered.append(r)
    ServiceLogger.log_info(
        f"Found {len(filtered)} restaurants matching tags: {tag_list}", "API")
    return {"tags": tag_list, "count": len(filtered), "restaurants": filtered}


@app.get("/api/v1/restaurants/{restaurant_id}")
def get_restaurant_detail(restaurant_id: str):
    """Returns details for a specific restaurant"""
    ServiceLogger.api_called_panel("GET", f"/api/v1/restaurants/{restaurant_id}",
                                   params={"restaurant_id": restaurant_id})
    for r in RESTAURANTS:
        if r["id"] == restaurant_id:
            ServiceLogger.log_success(
                f"Found restaurant: {r.get('name', 'Unknown')}", "API")
            return r
    ServiceLogger.log_error(f"Restaurant not found: {restaurant_id}", "API")
    raise HTTPException(status_code=404, detail="Restaurant not found")


@app.get("/api/v1/menu-items")
def get_menu_items(restaurant_id: Optional[str] = None) -> Dict[str, Any]:
    """Returns menu items, optionally filtered by restaurant_id"""
    ServiceLogger.api_called_panel("GET", "/api/v1/menu-items",
                                   params={"restaurant_id": restaurant_id} if restaurant_id else None)
    menu_items: List[Dict[str, Any]] = []

    if restaurant_id:
        for r in RESTAURANTS:
            if r["id"] == restaurant_id:
                for item in r.get("menu", []):
                    menu_items.append(
                        {**item, "restaurant_id": r["id"], "restaurant_name": r["name"]})
                break
    else:
        for r in RESTAURANTS:
            for item in r.get("menu", []):
                menu_items.append(
                    {**item, "restaurant_id": r["id"], "restaurant_name": r["name"]})

    ServiceLogger.log_info(f"Returning {len(menu_items)} menu items", "API")
    return {"count": len(menu_items), "menu_items": menu_items}


@app.get("/api/v1/dietary-tags")
def get_dietary_tags() -> Dict[str, List[str]]:
    """Returns list of unique dietary tags from all menu items"""
    ServiceLogger.api_called_panel("GET", "/api/v1/dietary-tags")
    dietary_tags: set[str] = set()
    for r in RESTAURANTS:
        for item in r.get("menu", []):
            if "dietary_tags" in item and item["dietary_tags"]:
                dietary_tags.update(item["dietary_tags"])
    result = sorted(list(dietary_tags))
    ServiceLogger.log_info(f"Found {len(result)} unique dietary tags", "API")
    return {"dietary_tags": result}


@app.get("/api/v1/menu-items/by-dietary-tags")
def get_menu_items_by_dietary_tags(tags: str) -> Dict[str, Any]:
    """Returns menu items filtered by dietary tags (comma-separated)"""
    tag_list = [t.strip() for t in tags.split(",")]
    ServiceLogger.api_called_panel("GET", "/api/v1/menu-items/by-dietary-tags",
                                   params={"tags": tags})
    menu_items: List[Dict[str, Any]] = []

    for r in RESTAURANTS:
        for item in r.get("menu", []):
            item_tags = item.get("dietary_tags", [])
            if any(tag in item_tags for tag in tag_list):
                menu_items.append(
                    {**item, "restaurant_id": r["id"], "restaurant_name": r["name"]})

    ServiceLogger.log_info(
        f"Found {len(menu_items)} menu items matching dietary tags: {tag_list}", "API")
    return {"dietary_tags": tag_list, "count": len(menu_items), "menu_items": menu_items}
