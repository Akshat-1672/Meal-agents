import os
import requests
from typing import Any, List, Dict, Optional
import httpx

from src.schema.restaurant import Restaurants
from utils.logger import ServiceLogger

DOORDASH_API_URL: str = os.environ.get("DOORDASH_API_URL", "http://dashdoor:8001")


def get_health_status() -> Dict[str, Any]:
    """Get DashDoor API health status"""
    try:
        response = httpx.get(f'{DOORDASH_API_URL}/')
        response.raise_for_status()
        return response.json()
    except (requests.exceptions.RequestException, httpx.HTTPError) as e:
        ServiceLogger.log_error("Error querying health status from dashdoor", "DASHDOOR_API_CALL", e)
        return {}


def get_restaurant_list() -> Restaurants:
    """Fetch restaurant list from DashDoor API"""
    restaurants = Restaurants()
    try:
        response = httpx.get(f'{DOORDASH_API_URL}/api/v1/restaurants')
        response.raise_for_status()
        restaurants = response.json()
        return restaurants
    except (requests.exceptions.RequestException, httpx.HTTPError) as e:
        ServiceLogger.log_error("Error querying restaurant list from dashdoor", "DASHDOOR_API_CALL", e)
        return restaurants


def get_restaurant_detail(restaurant_id: str) -> Dict[str, Any]:
    """Get details for a specific restaurant by ID"""
    try:
        response = httpx.get(f'{DOORDASH_API_URL}/api/v1/restaurants/{restaurant_id}')
        response.raise_for_status()
        return response.json()
    except (requests.exceptions.RequestException, httpx.HTTPError) as e:
        ServiceLogger.log_error(f"Error querying restaurant detail for {restaurant_id} from dashdoor", "DASHDOOR_API_CALL", e)
        return {}


def get_cuisines() -> List[str]:
    """Get list of unique cuisines available"""
    try:
        response = httpx.get(f'{DOORDASH_API_URL}/api/v1/cuisines')
        response.raise_for_status()
        data = response.json()
        return data.get("cuisines", [])
    except (requests.exceptions.RequestException, httpx.HTTPError) as e:
        ServiceLogger.log_error("Error querying cuisines from dashdoor", "DASHDOOR_API_CALL", e)
        return []


def get_restaurants_by_cuisine(cuisine: str) -> Dict[str, Any]:
    """Get restaurants filtered by cuisine type"""
    try:
        response = httpx.get(f'{DOORDASH_API_URL}/api/v1/restaurants/by-cuisine', params={"cuisine": cuisine})
        response.raise_for_status()
        return response.json()
    except (requests.exceptions.RequestException, httpx.HTTPError) as e:
        ServiceLogger.log_error(f"Error querying restaurants by cuisine '{cuisine}' from dashdoor", "DASHDOOR_API_CALL", e)
        return {"cuisine": cuisine, "count": 0, "restaurants": []}


def get_tags() -> List[str]:
    """Get list of unique restaurant tags"""
    try:
        response = httpx.get(f'{DOORDASH_API_URL}/api/v1/tags')
        response.raise_for_status()
        data = response.json()
        return data.get("tags", [])
    except (requests.exceptions.RequestException, httpx.HTTPError) as e:
        ServiceLogger.log_error("Error querying tags from dashdoor", "DASHDOOR_API_CALL", e)
        return []


def get_restaurants_by_tags(tags: List[str]) -> Dict[str, Any]:
    """Get restaurants filtered by tags (accepts list of tags)"""
    try:
        tags_param = ",".join(tags)
        response = httpx.get(f'{DOORDASH_API_URL}/api/v1/restaurants/by-tags', params={"tags": tags_param})
        response.raise_for_status()
        return response.json()
    except (requests.exceptions.RequestException, httpx.HTTPError) as e:
        ServiceLogger.log_error(f"Error querying restaurants by tags '{tags}' from dashdoor", "DASHDOOR_API_CALL", e)
        return {"tags": tags, "count": 0, "restaurants": []}


def get_menu_items(restaurant_id: Optional[str] = None) -> Dict[str, Any]:
    """Get menu items, optionally filtered by restaurant_id"""
    try:
        params = {"restaurant_id": restaurant_id} if restaurant_id else {}
        response = httpx.get(f'{DOORDASH_API_URL}/api/v1/menu-items', params=params)
        response.raise_for_status()
        return response.json()
    except (requests.exceptions.RequestException, httpx.HTTPError) as e:
        ServiceLogger.log_error("Error querying menu items from dashdoor", "DASHDOOR_API_CALL", e)
        return {"count": 0, "menu_items": []}


def get_dietary_tags() -> List[str]:
    """Get list of unique dietary tags from all menu items"""
    try:
        response = httpx.get(f'{DOORDASH_API_URL}/api/v1/dietary-tags')
        response.raise_for_status()
        data = response.json()
        return data.get("dietary_tags", [])
    except (requests.exceptions.RequestException, httpx.HTTPError) as e:
        ServiceLogger.log_error("Error querying dietary tags from dashdoor", "DASHDOOR_API_CALL", e)
        return []


def get_menu_items_by_dietary_tags(tags: List[str]) -> Dict[str, Any]:
    """Get menu items filtered by dietary tags (accepts list of tags)"""
    try:
        tags_param = ",".join(tags)
        response = httpx.get(f'{DOORDASH_API_URL}/api/v1/menu-items/by-dietary-tags', params={"tags": tags_param})
        response.raise_for_status()
        return response.json()
    except (requests.exceptions.RequestException, httpx.HTTPError) as e:
        ServiceLogger.log_error(f"Error querying menu items by dietary tags '{tags}' from dashdoor", "DASHDOOR_API_CALL", e)
        return {"dietary_tags": tags, "count": 0, "menu_items": []}