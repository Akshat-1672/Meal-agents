# Agent Implementation Details

## Agent Workflow Status

- IDLE: Start of a fresh workflow
- MEAL_PLANNING_STARTED: The meal_planner is running its research (gathering info + scouting).
- MEAL_PLANNING_FAILED: The meal planner failed to generate the options because of downstream service failures
- MEAL_PLANNING_COMPLETE: The meal_planner has completed its research and updated state with available options.
- AWAITING_USER_APPROVAL: The workflow is paused. We have sent the 3 options to Telegram and are waiting for a reply.
- USER_APPROVAL_RECEIVED: The user has approved a meal from 3 options.
- USER_REJECTION_RECEIVED: The user has rejected all the options and so we need to plan the meals again.
- PLACING_ORDER: The user has replied. The OrderAgent is now running and communicating with the API.
- ORDER_CONFIRMED: The API has responded with success. The workflow is complete and ready to terminate.

## Agent Workflow State

### Default Example

```bash
    "user":{
        "id":"",
        "name":""
        "dietary_preferences":""
        "allergies":""
        "special_instructions":""
    },
    "workflow_status": "",
    "planning":{
        "meal_type":"",
        "options":[]
    },
    "verification":{
        "user_feedback": "",
        "user_choice":"",
        "message":"",
        "choices":[]
    },
    "ordering":{
        "order_status":{
            "id"="",
            "restaurant_id"="",
            "status"="ORDER_PLACED",
            "order"={}
        }
        "confirmation":{
            "message":""
            bill:{
                "restaurant_name": "String",
                "items": [
                    {
                        "name": "",
                        "quantity": 1,
                        "price": "",
                        "customizations" : ""
                    }
                ],
                "total_amount": ""
            }
        }
    },
    "retries":{}
```
