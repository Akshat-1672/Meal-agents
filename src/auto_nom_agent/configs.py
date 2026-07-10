import os
from google.genai import types


retry_options = types.HttpRetryOptions(
    attempts=5,  # Maximum retry attempts
    exp_base=7,  # Delay multiplier
    initial_delay=1,
    http_status_codes=[429, 500, 503, 504],  # Retry on these HTTP errors
)

# Base model selection
default_model = os.getenv("GENIE_MODEL", "gemini-2.5-flash")

# Allow optional overrides for specific usage and diagnostics
gemini_flash = os.getenv("GENIE_FLASH_MODEL", default_model)
gemini_pro = os.getenv("GEMINI_PRO_MODEL", default_model)
selected_gemini_model = os.getenv("GEMINI_MODEL_SELECTION", default_model)

# Use the selected model consistently for the core client by default
model = selected_gemini_model

# Expose runtime metadata for diagnostics
GEMINI_CONFIG = {
    "google_api_key_present": bool(os.getenv("GOOGLE_API_KEY")),
    "google_api_key_length": len(os.getenv("GOOGLE_API_KEY", "")),
    "selected_model": selected_gemini_model,
    "default_model": default_model,
    "gemini_flash": gemini_flash,
    "gemini_pro": gemini_pro,
    "retry_options": {
        "attempts": retry_options.attempts,
        "initial_delay": retry_options.initial_delay,
        "exp_base": retry_options.exp_base,
        "http_status_codes": retry_options.http_status_codes,
    },
}
