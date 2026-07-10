from pydantic import BaseModel, Field

class Order(BaseModel):
    id: str = Field(description="Menu item id")
    name: str = Field(description="Menu item name")
    price: float = Field(description="Menu item price")
    calories: float = Field(description="Menu item calories")


class Meals(BaseModel):
    id: str = Field(description="Restaurant ID")
    name: str = Field(description="Restaurant Name")
    description: str = Field(description="Restaurant description")
    order: list[Order] = Field(
    description="list of orders from the restaurant")


class MealOptions(BaseModel):
    options: list[Meals] = Field(description="List of Meals")
