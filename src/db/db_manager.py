import sqlite3
import json
from pathlib import Path
from typing import Any, Optional, Dict, List
from datetime import datetime
from utils.logger import ServiceLogger
from src.schema.users import UserProfile, Session

CURRENT_DIR = Path(__file__).parent
DB_PATH = CURRENT_DIR / "data/autonom.db"


def get_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    # Enable Write-Ahead Logging. faster, and allows concurrent read/write.
    conn.execute("PRAGMA journal_mode=WAL;")
    return conn

def get_db_path():
    return DB_PATH

def init_db(preload_test_users: bool = False) -> None:
    with get_connection() as conn:
        # Users Table - UPDATED with separate 'days', 'meals', and 'special_instructions' columns
        conn.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            preferences TEXT, -- JSON string
            allergies TEXT,   -- JSON string
            days TEXT,        -- JSON string (List of day names)
            meals TEXT,       -- JSON string (List of meal objects)
            special_instructions TEXT, -- Text instructions from user
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """)
        
        # Migration: Add new columns if they don't exist (for existing databases)
        try:
            conn.execute("ALTER TABLE users ADD COLUMN special_instructions TEXT")
        except sqlite3.OperationalError:
            pass  # Column already exists
        
        try:
            conn.execute("ALTER TABLE users ADD COLUMN days TEXT")
        except sqlite3.OperationalError:
            pass  # Column already exists
        
        try:
            conn.execute("ALTER TABLE users ADD COLUMN meals TEXT")
        except sqlite3.OperationalError:
            pass  # Column already exists
        
        # Migration: Convert old schedule column data to new days/meals columns
        try:
            rows = conn.execute("SELECT id, schedule FROM users WHERE schedule IS NOT NULL AND (days IS NULL OR meals IS NULL)").fetchall()
            for row in rows:
                try:
                    schedule = json.loads(row['schedule'])
                    days = json.dumps(schedule.get('days', []))
                    meals = json.dumps(schedule.get('meals', []))
                    conn.execute(
                        "UPDATE users SET days = ?, meals = ? WHERE id = ?",
                        (days, meals, row['id'])
                    )
                except (json.JSONDecodeError, KeyError):
                    continue
        except sqlite3.OperationalError:
            pass  # schedule column doesn't exist or other error
        # Sessions Table
        conn.execute("""
        CREATE TABLE IF NOT EXISTS sessions (
            app_name VARCHAR(128) NOT NULL, 
            user_id VARCHAR(128) NOT NULL, 
            id VARCHAR(128) NOT NULL, 
            state TEXT NOT NULL, 
            create_time DATETIME NOT NULL, 
            update_time DATETIME NOT NULL, 
            PRIMARY KEY (app_name, user_id, id)
        );
        """)
        # Orders Table
        conn.execute("""
        CREATE TABLE IF NOT EXISTS orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id TEXT,
            meal_details TEXT,
            status TEXT
        );
        """)
        
        ServiceLogger.log_panel(
            "💾 Database Setup",
            "[green]Database initialized successfully[/green]",
            "green",
            location=str(DB_PATH),
            tables="users, orders"
        )
        
    # Preload test users if requested
    if preload_test_users:
        from src.db.test_data import get_test_users
        test_users = get_test_users()
        for user in test_users:
            upsert_user(user)
        ServiceLogger.log_success(f"Preloaded {len(test_users)} test users", "DB")

# --- User Helpers ---


def upsert_user(user_profile: UserProfile) -> None:
    """
    Creates or updates a user profile using UserProfile Pydantic model.
    """
    try:
        with get_connection() as conn:
            conn.execute(
                """
                INSERT OR REPLACE INTO users (id, name, preferences, allergies, days, meals, special_instructions) 
                VALUES (?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    user_profile.id,
                    user_profile.name,
                    json.dumps(user_profile.preferences),
                    json.dumps(user_profile.allergies),
                    json.dumps(user_profile.days),
                    json.dumps([meal.model_dump() for meal in user_profile.meals]),
                    user_profile.special_instructions
                )
            )
            ServiceLogger.log_success(f"User '{user_profile.name}' (ID: {user_profile.id}) saved to database", "DB")
    except Exception as e:
        ServiceLogger.log_error(f"Database error saving user '{user_profile.name}'", "DB", error=e)
        raise


def upsert_user_legacy(user_id: str, name: str, preferences: Any, allergies: Any, schedule: Any = None, days: Any = None, meals: Any = None, special_instructions: str = "") -> None:
    """
    Legacy function for backwards compatibility. Creates or updates a user profile.
    Consider migrating to upsert_user() which uses UserProfile Pydantic model.
    """
    # Handle legacy schedule format
    if schedule and not days and not meals:
        days = schedule.get('days', [])
        meals = schedule.get('meals', [])
    
    user_profile = UserProfile(
        id=user_id,
        name=name,
        preferences=preferences or [],
        allergies=allergies or [],
        days=days or [],
        meals=meals or [],
        special_instructions=special_instructions
    )
    upsert_user(user_profile)


def get_all_users() -> List[UserProfile]:
    try:
        with get_connection() as conn:
            rows = conn.execute("SELECT * FROM users").fetchall()
            users: List[UserProfile] = []
            for r in rows:
                u = dict(r)
                # Parse JSON fields back to objects
                preferences: List[str] = json.loads(u['preferences']) if u['preferences'] else []
                allergies: List[str] = json.loads(u['allergies']) if u['allergies'] else []
                days: List[str] = json.loads(u['days']) if u.get('days') else []
                meals_data: List[Dict[str, Any]] = json.loads(u['meals']) if u.get('meals') else []
                
                # Handle legacy schedule column for backward compatibility
                if not days and not meals_data and u.get('schedule'):
                    schedule = json.loads(u['schedule'])
                    days = schedule.get('days', [])
                    meals_data = schedule.get('meals', [])
                
                # Pydantic will automatically convert meal dicts to Meal objects
                user_profile = UserProfile(
                    id=u['id'],
                    name=u['name'],
                    preferences=preferences,
                    allergies=allergies,
                    days=days,
                    meals=meals_data,
                    special_instructions=u.get('special_instructions', '')
                )
                users.append(user_profile)
            
            ServiceLogger.log_info(f"Retrieved {len(users)} users from database", "DB")
            return users
    except Exception as e:
        ServiceLogger.log_error("Database error retrieving users", "DB", error=e)
        raise
    
def get_user(user_id: str) -> Optional[UserProfile]:
    try:
        with get_connection() as conn:
            row = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
            if row:
                u = dict(row)
                # Parse JSON fields back to objects
                preferences: List[str] = json.loads(u['preferences']) if u['preferences'] else []
                allergies: List[str] = json.loads(u['allergies']) if u['allergies'] else []
                days: List[str] = json.loads(u['days']) if u.get('days') else []
                meals_data: List[Dict[str, Any]] = json.loads(u['meals']) if u.get('meals') else []
                
                # Handle legacy schedule column for backward compatibility
                if not days and not meals_data and u.get('schedule'):
                    schedule = json.loads(u['schedule'])
                    days = schedule.get('days', [])
                    meals_data = schedule.get('meals', [])
                
                # Pydantic will automatically convert meal dicts to Meal objects
                user_profile = UserProfile(
                    id=u['id'],
                    name=u['name'],
                    preferences=preferences,
                    allergies=allergies,
                    days=days,
                    meals=meals_data,
                    special_instructions=u.get('special_instructions', '')
                )
                return user_profile
            return None
    except Exception as e:
        ServiceLogger.log_error("Database error retrieving user", "DB", error=e)
        raise

# --- Session Helpers ---


def create_session(app_name: str, user_id: str, session_id: str, state: Dict[str, Any]) -> Session:
    """
    Creates a new session with the given app_name, user_id, session_id and state.
    Returns the created Session object.
    """
    try:
        current_time = datetime.now()
        with get_connection() as conn:
            conn.execute(
                "INSERT INTO sessions (app_name, user_id, id, state, create_time, update_time) VALUES (?, ?, ?, ?, ?, ?)",
                (app_name, user_id, session_id, json.dumps(state), current_time, current_time)
            )
            ServiceLogger.log_success(f"Session {session_id[:8]}... saved to database", "DB")
            
            # Return the created session as a Session object
            return Session(
                app_name=app_name,
                user_id=user_id,
                id=session_id,
                state=state,
                create_time=current_time,
                update_time=current_time
            )
    except Exception as e:
        ServiceLogger.log_error(f"Database error saving session {session_id[:8]}...", "DB", error=e)
        raise


def update_session_state(app_name: str, user_id: str, session_id: str, state: Dict[str, Any]) -> Optional[Session]:
    """
    Updates the state of an existing session.
    Returns the updated Session object if successful, None if session not found.
    """
    try:
        current_time = datetime.now()
        with get_connection() as conn:
            cursor = conn.execute(
                "UPDATE sessions SET state = ?, update_time = ? WHERE app_name = ? AND user_id = ? AND id = ?",
                (json.dumps(state), current_time, app_name, user_id, session_id)
            )
            if cursor.rowcount > 0:
                # Return the updated session
                return Session(
                    app_name=app_name,
                    user_id=user_id,
                    id=session_id,
                    state=state,
                    create_time=current_time,  # We don't have the original create_time, using current
                    update_time=current_time
                )
            return None
    except Exception as e:
        ServiceLogger.log_error(f"Database error updating session {session_id[:8]}...", "DB", error=e)
        raise


def get_session(app_name: str, user_id: str, session_id: str) -> Optional[Session]:
    """
    Retrieves a session by app_name, user_id, and session_id.
    Returns a Session object or None if not found.
    """
    try:
        with get_connection() as conn:
            row = conn.execute(
                "SELECT * FROM sessions WHERE app_name = ? AND user_id = ? AND id = ?", 
                (app_name, user_id, session_id)
            ).fetchone()
            if row:
                session_data = dict(row)
                # Parse the JSON state back to a dictionary
                state: Dict[str, Any] = json.loads(session_data['state']) if session_data['state'] else {}
                
                return Session(
                    app_name=session_data['app_name'],
                    user_id=session_data['user_id'],
                    id=session_data['id'],
                    state=state,
                    create_time=datetime.fromisoformat(session_data['create_time']),
                    update_time=datetime.fromisoformat(session_data['update_time'])
                )
            return None
    except Exception as e:
        ServiceLogger.log_error("Database error retrieving session", "DB", error=e)
        raise


def get_session_by_id(session_id: str) -> Optional[Session]:
    """
    Retrieves a session using just the session ID.
    Note: This may return multiple sessions if the same ID exists across different apps/users.
    Returns the first match found as a Session object.
    """
    try:
        with get_connection() as conn:
            row = conn.execute(
                "SELECT * FROM sessions WHERE id = ? LIMIT 1", 
                (session_id,)
            ).fetchone()
            if row:
                session_data = dict(row)
                # Parse the JSON state back to a dictionary
                state: Dict[str, Any] = json.loads(session_data['state']) if session_data['state'] else {}
                
                return Session(
                    app_name=session_data['app_name'],
                    user_id=session_data['user_id'],
                    id=session_data['id'],
                    state=state,
                    create_time=datetime.fromisoformat(session_data['create_time']),
                    update_time=datetime.fromisoformat(session_data['update_time'])
                )
            return None
    except Exception as e:
        ServiceLogger.log_error("Database error retrieving session", "DB", error=e)
        raise


def get_active_session_by_id(session_id: str) -> Optional[Session]:
    """
    Retrieves an active session using just the session ID.
    An active session is one where state.workflow_status is not 'ORDER_CONFIRMED' or 'NO_PLANNING_NEEDED'.
    Returns the Session object if found and active, None otherwise.
    """
    try:
        with get_connection() as conn:
            row = conn.execute(
                "SELECT * FROM sessions WHERE id = ? LIMIT 1", 
                (session_id,)
            ).fetchone()
            if row:
                session_data = dict(row)
                # Parse the JSON state back to a dictionary
                state: Dict[str, Any] = json.loads(session_data['state']) if session_data['state'] else {}
                
                # Check if session is active
                workflow_status = state.get('workflow_status', '')
                if workflow_status != 'ORDER_CONFIRMED' and workflow_status != 'NO_PLANNING_NEEDED':
                    return Session(
                        app_name=session_data['app_name'],
                        user_id=session_data['user_id'],
                        id=session_data['id'],
                        state=state,
                        create_time=datetime.fromisoformat(session_data['create_time']),
                        update_time=datetime.fromisoformat(session_data['update_time'])
                    )
            return None
    except Exception as e:
        ServiceLogger.log_error("Database error retrieving active session", "DB", error=e)
        raise


def get_user_sessions(app_name: str, user_id: str) -> List[Session]:
    """
    Retrieves all sessions for a specific app_name and user_id.
    Returns a list of Session objects.
    """
    try:
        with get_connection() as conn:
            rows = conn.execute(
                "SELECT * FROM sessions WHERE app_name = ? AND user_id = ? ORDER BY update_time DESC", 
                (app_name, user_id)
            ).fetchall()
            sessions: List[Session] = []
            for row in rows:
                session_data: Dict[str, Any] = dict(row)
                # Parse the JSON state back to a dictionary
                state: Dict[str, Any] = json.loads(session_data['state']) if session_data['state'] else {}
                
                session = Session(
                    app_name=session_data['app_name'],
                    user_id=session_data['user_id'],
                    id=session_data['id'],
                    state=state,
                    create_time=datetime.fromisoformat(session_data['create_time']),
                    update_time=datetime.fromisoformat(session_data['update_time'])
                )
                sessions.append(session)
            return sessions
    except Exception as e:
        ServiceLogger.log_error("Database error retrieving users", "DB", error=e)
        raise


def get_active_user_sessions(app_name: str, user_id: str) -> List[Session]:
    """
    Retrieves all active sessions for a specific app_name and user_id.
    An active session is one where state.workflow_status is not 'ORDER_CONFIRMED'.
    Returns a list of Session objects.
    """
    try:
        with get_connection() as conn:
            rows = conn.execute(
                "SELECT * FROM sessions WHERE app_name = ? AND user_id = ? ORDER BY update_time DESC", 
                (app_name, user_id)
            ).fetchall()
            active_sessions: List[Session] = []
            for row in rows:
                session_data: Dict[str, Any] = dict(row)
                # Parse the JSON state back to a dictionary
                state: Dict[str, Any] = json.loads(session_data['state']) if session_data['state'] else {}
                
                # Check if session is active (workflow_status is not ORDER_CONFIRMED)
                workflow_status = state.get('workflow_status', '')
                if workflow_status != 'ORDER_CONFIRMED' and workflow_status != 'NO_PLANNING_NEEDED':
                    session = Session(
                        app_name=session_data['app_name'],
                        user_id=session_data['user_id'],
                        id=session_data['id'],
                        state=state,
                        create_time=datetime.fromisoformat(session_data['create_time']),
                        update_time=datetime.fromisoformat(session_data['update_time'])
                    )
                    active_sessions.append(session)
            return active_sessions
    except Exception as e:
        ServiceLogger.log_error("Database error retrieving users", "DB", error=e)
        raise


def get_session_state_val(session_id: str, key: str) -> Optional[Any]:
    """
    Retrieves a specific state value from a session using session_id and key.
    Returns None if session not found or key doesn't exist in state.
    """
    try:
        with get_connection() as conn:
            row = conn.execute(
                "SELECT state FROM sessions WHERE id = ? LIMIT 1", 
                (session_id,)
            ).fetchone()
            if row:
                state_json = row['state']
                if state_json:
                    state = json.loads(state_json)
                    return state.get(key)
            return None
    except Exception as e:
        ServiceLogger.log_error("Database error retrieving session state", "DB", error=e)
        raise


def delete_session(app_name: str, user_id: str, session_id: str) -> bool:
    """
    Deletes a session by app_name, user_id, and session_id.
    Returns True if session was deleted, False if not found.
    """
    try:
        with get_connection() as conn:
            cursor = conn.execute(
                "DELETE FROM sessions WHERE app_name = ? AND user_id = ? AND id = ?", 
                (app_name, user_id, session_id)
            )
            return cursor.rowcount > 0
    except Exception as e:
        ServiceLogger.log_error(f"Database error deleting session {session_id[:8]}...", "DB", error=e)
        raise


def delete_all_sessions() -> int:
    """
    Deletes all sessions from the sessions table.
    Returns the number of sessions deleted.
    """
    try:
        with get_connection() as conn:
            cursor = conn.execute("DELETE FROM sessions")
            deleted_count = cursor.rowcount
            ServiceLogger.log_success(f"Deleted {deleted_count} sessions from database", "DB")
            return deleted_count
    except Exception as e:
        ServiceLogger.log_error("Database error deleting all sessions", "DB", error=e)
        raise


if __name__ == "__main__":
    init_db(preload_test_users=True)
