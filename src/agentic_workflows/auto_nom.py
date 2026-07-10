
import uuid
import json
from pathlib import Path

from google.adk.runners import Runner
from google.adk.sessions import DatabaseSessionService
from google.adk.events import Event
from google.genai import types
from typing import Any
from pydantic import BaseModel, Field
from src.auto_nom_agent.agents import root_agent

from rich.console import Console
from rich.panel import Panel
from rich.markdown import Markdown
from rich.syntax import Syntax
from rich import box


from src.db import db_manager
from src.schema.users import UserProfile
from src.auto_nom_agent.configs import GEMINI_CONFIG
from utils.logger import ServiceLogger
console = Console()

# 1. Get the directory of the current file (inside src/agentic_workflows)
CURRENT_FILE_DIR = Path(__file__).resolve().parent

# 2. Go up one level to 'src'
#    .parent of 'agentic_workflows' is 'src'
SRC_ROOT = CURRENT_FILE_DIR.parent

# 3. Construct the path to the DB folder
#    Target: src/db
DB_DIR = SRC_ROOT / "db" / "data"
DB_FILE = DB_DIR / "autonom.db"


class SessionState(BaseModel):
    """Pydantic model for session state structure"""
    workflow_status: str = Field(default="IDLE")
    planning_meal_type: str = Field(default="")
    planning_options: list[Any] = Field(default_factory=list)
    user_id: str = Field(default="")
    user_name: str = Field(default="")
    user_days: str = Field(default="")
    user_meals: str = Field(default="")
    user_dietary_preferences: str = Field(default="")
    user_allergies: list[str] = Field(default_factory=list)
    user_special_instructions: str = Field(default="")
    mock_day: str = Field(default="")
    verification_user_feedback: str = Field(default="")
    verification_user_choice: str = Field(default="")
    verification_message: str = Field(default="")
    verification_choices: list[Any] = Field(default_factory=list)
    ordering_order_status_id: str = Field(default="")
    ordering_order_status_restaurant_id: str = Field(default="")
    ordering_order_status_status: str = Field(default="")
    ordering_order_status_order: dict[str, Any] = Field(default_factory=dict)
    ordering_confirmation_message: str = Field(default="")
    ordering_confirmation_bill_restaurant_name: str = Field(default="")
    ordering_confirmation_bill_items: list[Any] = Field(default_factory=list)
    ordering_confirmation_bill_total_amount: str = Field(default="")


class AutoNom():
    def __init__(self, user: UserProfile, meal_type: str = "", session_id: str = "", mock_day: str | None = None):
        self._app_name = "auto_nom_agent"
        self.user = user
        self.meal_type = meal_type
        self.mock_day = mock_day
        
        # Create state using Pydantic model with user-specific values
        state_model = SessionState(
            workflow_status="IDLE",
            planning_meal_type=meal_type,
            user_id=user.id,
            user_name=user.name,
            user_days=",".join(user.days),
            user_meals=",".join(map(lambda meals: f"{meals.type}{':'+meals.customName if meals.customName else ''}", user.meals)),
            user_dietary_preferences=",".join(user.preferences),
            user_allergies=user.allergies,
            user_special_instructions=user.special_instructions,
            mock_day=mock_day if mock_day else ""
        )
        
        # Convert to dict for use with session service
        self.initial_state: dict[str, Any] = state_model.model_dump()
        self.session_id = session_id if session_id else str(uuid.uuid4())

        ServiceLogger.log_info(
            f"Initialized AutoNom for user {self.user.id}, with session : {self.session_id}")
        ServiceLogger.log_debug(
            "Gemini runtime diagnostics",
            "GEMINI",
            selected_model=GEMINI_CONFIG["selected_model"],
            default_model=GEMINI_CONFIG["default_model"],
            gemini_pro=GEMINI_CONFIG["gemini_pro"],
            gemini_flash=GEMINI_CONFIG["gemini_flash"],
            google_api_key_present=GEMINI_CONFIG["google_api_key_present"],
            google_api_key_length=GEMINI_CONFIG["google_api_key_length"],
        )
        # private properties # database url
        self.__db_url = f"sqlite+aiosqlite:///{DB_FILE}"
        print(f"📍 Database path resolved to: {DB_FILE}")
        print(f"🔌 Async URL: {self.__db_url}")
        # setting db session service for persistent storage
        self.__session_service = DatabaseSessionService(db_url=self.__db_url)

    def __print_function_calls(self, agent_name: str, event: Event):
        """Helper function to print function call events

        Args:
            agent_name (str): _description_
            event (Event): _description_
        """
        calls = event.get_function_calls()
        if calls:
            # Event is a tool call request
            response: dict[str, Any] = {
                "type": "ToolCall",
                "calls": []
            }
            for call in calls:
                tool_name = call.name
                arguments = call.args  # This is usually a dictionary
                console.print(Panel(
                    f"[bold yellow]Function:[/bold yellow] {tool_name}\n\n"
                    f"[bold yellow]Arguments:[/bold yellow]\n{arguments}",
                    title=f"[bold yellow]🔧 {agent_name} - Tool Call[/bold yellow]",
                    border_style="yellow",
                    box=box.ROUNDED
                ))
                response["calls"].append({
                    "name": tool_name,
                    "arguments": arguments
                })
            return response
        return None

    def __print_function_responses(self, agent_name: str, event: Event):
        """Helper function to print function call response events

        Args:
            agent_name (str): _description_
            event (Event): _description_
        """
        responses = event.get_function_responses()
        if responses:
            response: dict[str, Any] = {
                "type": "ToolResponse",
                "responses": []
            }
            for resp in responses:
                tool_name = resp.name
                result_dict = resp.response
                console.print(Panel(
                    f"[bold magenta]Function:[/bold magenta] {tool_name}\n\n"
                    f"[bold magenta]Response:[/bold magenta]\n{result_dict}",
                    title=f"[bold magenta]✅ Tool Response[/bold magenta]",
                    border_style="magenta",
                    box=box.ROUNDED
                ))
                response["responses"].append({
                    "name": tool_name,
                    "response": result_dict
                })
            return response
        return None

    def __print_conversation(self, agent_name: str, event: Event):
        response: dict[str, Any] = {
            "type": "TextResponse",
            "isFinalResponse": False,
            "text": ""
        }

        if event.content and event.content.parts:
            if event.content.parts[0].text:
                text = event.content.parts[0].text
                if event.partial:
                    print("  Type: Streaming Text Chunk")
                else:
                    print("  Type: Complete Text Message")
                if event.is_final_response():
                    console.print(Panel(
                        Markdown(text),
                        title=f"[bold green]🤖 {agent_name}[/bold green]",
                        border_style="green",
                        box=box.ROUNDED
                    ))
                    response["text"] = text
                    response["isFinalResponse"] = True
                else:
                    # Intermediate thinking
                    console.print(Panel(
                        text,
                        title=f"[bold cyan]💭 {agent_name} (thinking)[/bold cyan]",
                        border_style="cyan",
                        box=box.ROUNDED
                    ))
                    response["text"] = text
                    response["isFinalResponse"] = False

            return response

    async def __get_or_create_session(self):
        existing_sessions = db_manager.get_session_by_id(
            session_id=self.session_id)
        # existing_sessions = await self.__session_service.list_sessions(app_name=self._app_name, user_id=self.user.id)
        if existing_sessions:
            # session_id = existing_sessions.sessions[0].id
            # self.__session = existing_sessions.sessions[0]
            ServiceLogger.log_info(
                f"Loaded existing session:{self.session_id[:8]}...")
        else:
            ServiceLogger.log_info(
                f"Creating new session:{self.session_id[:8]}...")

            self.__session = await self.__session_service.create_session(
                app_name=self._app_name,
                user_id=self.user.id,
                session_id=self.session_id,
                state=self.initial_state
            )

    async def run(self, user_input: str):
        # Step 1 : Create a new session
        await self.__get_or_create_session()

        # Step 2 : Create a new Runner instance
        self.runner = Runner(
            agent=root_agent,
            app_name=self._app_name,
            session_service=self.__session_service,
        )

        # TODO: Update this prompt to a improve the performance
        ServiceLogger.log_info(f"Starting session : {self.session_id}")

        # Step 3: Create a user query
        # user_input = f"Plan a {self.meal_type} for {self.user.name}"
        query = types.Content(role="user", parts=[
            types.Part(text=user_input)])
        
        
        try:
            async for event in self.runner.run_async(
                user_id=self.user.id, session_id=self.session_id, new_message=query
            ):
                agent_name = event.author if hasattr(event, "author") else "System"

                response = self.__print_function_calls(
                    agent_name=agent_name, event=event)

                if not response:
                    response = self.__print_function_responses(
                        agent_name=agent_name, event=event)

                if not response:
                    response = self.__print_conversation(
                        agent_name=agent_name, event=event)

                if response:
                    workflow_status = db_manager.get_session_state_val(
                        self.session_id, "workflow_status")
                    response["workflow_status"] = workflow_status

                yield response
        except Exception as e:
            error_info: dict[str, Any] = {
                "exception_type": type(e).__name__,
                "exception_args": e.args,
                "exception_repr": repr(e),
            }
            if hasattr(e, "status_code"):
                error_info["status_code"] = getattr(e, "status_code")
            if hasattr(e, "error_code"):
                error_info["error_code"] = getattr(e, "error_code")
            if hasattr(e, "response"):
                error_info["response"] = str(getattr(e, "response"))
            if hasattr(e, "headers"):
                try:
                    error_info["headers"] = dict(getattr(e, "headers"))
                except Exception:
                    error_info["headers"] = str(getattr(e, "headers"))

            ServiceLogger.log_error(
                "Gemini runner failed",
                "GEMINI",
                error=e,
                **error_info
            )
            raise

    async def get_sse_event_stream(self, user_input: str):
        """Generate Server-Sent Events stream for real-time communication with client.

        Args:
            user_input (str): The input message to process

        Yields:
            str: SSE formatted data events
        """
        import json
        try:
            async for item in self.run(user_input=user_input):
                if item is None:
                    continue
                try:
                    # Add session ID to every response
                    if isinstance(item, dict):
                        item["session_id"] = self.session_id
                    data = json.dumps(item)
                except Exception:
                    data = json.dumps(
                        {"data": str(item), "session_id": self.session_id})
                # SSE format: each message prefixed with "data: " and separated by a blank line
                yield f"data: {data}\n\n"
        except Exception as e:
            ServiceLogger.log_error(
                "SSE event stream failed",
                "GEMINI",
                error=e,
                exception_type=type(e).__name__,
                exception_repr=repr(e)
            )
            yield f"data: {json.dumps({'error': str(e), 'session_id': self.session_id})}\n\n"
            raise
        # final keep-alive/termination event (optional)
        yield "event: done\ndata: {}\n\n"
