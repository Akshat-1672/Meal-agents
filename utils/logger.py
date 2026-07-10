"""
Shared utilities package for all services.
Provides attractive console output for various operations.
"""

from rich.console import Console
from rich.panel import Panel
from rich.table import Table
from rich import box
from datetime import datetime
from typing import List, Dict, Any, Optional

# Initialize Rich Console
console = Console()

class ServiceLogger:
    """Logger class with rich formatting for service operations."""
    
    # --- GENERIC LOGGING METHODS ---
    
    @staticmethod
    def log_debug(message: str, context: str | None = None, **kwargs: Any):
        """Log debug information."""
        if context:
            console.print(f"[dim]🔍 [{context}] {message}[/dim]")
        else:
            console.print(f"[dim]🔍 {message}[/dim]")
        
        if kwargs:
            for key, value in kwargs.items():
                console.print(f"[dim]  └─ {key}: {value}[/dim]")
    
    @staticmethod
    def log_info(message: str, context: str | None = None, **kwargs: Any):
        """Log general information."""
        if context:
            console.print(f"[blue]ℹ️ [{context}] {message}[/blue]")
        else:
            console.print(f"[blue]ℹ️ {message}[/blue]")
        
        if kwargs:
            for key, value in kwargs.items():
                console.print(f"[blue]  └─ {key}: {value}[/blue]")
    
    @staticmethod
    def log_success(message: str, context: str | None = None, **kwargs: Any):
        """Log success messages."""
        if context:
            console.print(f"[green]✅ [{context}] {message}[/green]")
        else:
            console.print(f"[green]✅ {message}[/green]")
        
        if kwargs:
            for key, value in kwargs.items():
                console.print(f"[green]  └─ {key}: {value}[/green]")
    
    @staticmethod
    def log_warning(message: str, context: str | None = None, **kwargs: Any):
        """Log warning messages."""
        if context:
            console.print(f"[yellow]⚠️ [{context}] {message}[/yellow]")
        else:
            console.print(f"[yellow]⚠️ {message}[/yellow]")
        
        if kwargs:
            for key, value in kwargs.items():
                console.print(f"[yellow]  └─ {key}: {value}[/yellow]")
    
    @staticmethod
    def log_error(message: str, context: str | None = None, error: Exception | None = None, **kwargs: Any):
        """Log error messages."""
        if context:
            console.print(f"[red]❌ [{context}] {message}[/red]")
        else:
            console.print(f"[red]❌ {message}[/red]")
        
        if error:
            console.print(f"[red]  └─ Error Details: {str(error)}[/red]")
        
        if kwargs:
            for key, value in kwargs.items():
                console.print(f"[red]  └─ {key}: {value}[/red]")
    
    @staticmethod
    def log_panel(title: str, content: str, style: str = "blue", **kwargs: Any):
        """Log a message in a panel format."""
        panel_content = content
        if kwargs:
            panel_content += "\n" + "\n".join([f"[cyan]{key}:[/cyan] {value}" for key, value in kwargs.items()])
        
        console.print(Panel(
            panel_content,
            title=title,
            border_style=style
        ))
    
    @staticmethod
    def log_table(title: str, headers: List[str], rows: List[List[str]], style: str = "minimal"):
        """Log data in a table format."""
        table = Table(title=title, box=getattr(box, style.upper(), box.MINIMAL))
        
        for header in headers:
            table.add_column(header, style="cyan")
        
        for row in rows:
            table.add_row(*[str(cell) for cell in row])
        
        console.print(table)
    
    @staticmethod
    def log_api_request(method: str, endpoint: str, params: Optional[Dict[str, Any]] = None, **kwargs: Any):
        """Log API request information."""
        request_info = f"[bold cyan]{method}[/bold cyan] {endpoint}"
        
        console.print(f"🌐 {request_info}")
        
        if params:
            console.print("[cyan]Parameters:[/cyan]")
            for key, value in params.items():
                console.print(f"[cyan]  └─ {key}: {value}[/cyan]")
        
        if kwargs:
            for key, value in kwargs.items():
                console.print(f"[cyan]  └─ {key}: {value}[/cyan]")
    
    @staticmethod
    def log_api_response(status_code: int, message: str | None = None, duration: float | None = None, **kwargs: Any):
        """Log API response information."""
        if status_code >= 200 and status_code < 300:
            color = "green"
            icon = "✅"
        elif status_code >= 400:
            color = "red"
            icon = "❌"
        else:
            color = "yellow"
            icon = "⚠️"
        
        response_info = f"[{color}]{icon} Response: {status_code}[/{color}]"
        if message:
            response_info += f" - {message}"
        if duration:
            response_info += f" [dim]({duration:.2f}ms)[/dim]"
        
        console.print(response_info)
        
        if kwargs:
            for key, value in kwargs.items():
                console.print(f"[{color}]  └─ {key}: {value}[/{color}]")
    
    @staticmethod
    def api_called_panel(method: str, endpoint: str, params: Optional[Dict[str, Any]] = None, 
                        user_id: Optional[str] = None, request_id: Optional[str] = None):
        """Display a generic API call panel for logging method and parameters."""
        content_lines = [f"[bold cyan]API Call: {method.upper()} {endpoint}[/bold cyan]"]
        
        content_lines.append(f"[yellow]Timestamp:[/yellow] {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        
        if user_id:
            content_lines.append(f"[yellow]User ID:[/yellow] {user_id}")
        
        if request_id:
            content_lines.append(f"[yellow]Request ID:[/yellow] {request_id}")
        
        if params:
            content_lines.append("[yellow]Parameters:[/yellow]")
            for key, value in params.items():
                display_value = str(value)
                if len(display_value) > 100:
                    display_value = display_value[:97] + "..."
                content_lines.append(f"  [cyan]└─ {key}:[/cyan] {display_value}")
        
        content = "\n".join(content_lines)
        
        console.print(Panel(
            content,
            title="🌐 API Call",
            border_style="blue"
        ))
    
    @staticmethod
    def startup_message(service_name: str, port: int = 8000, docs_path: str = "/docs"):
        """Display service startup message."""
        ServiceLogger.log_panel(
            f"🤖 {service_name} Server",
            f"[bold magenta]{service_name} Server[/bold magenta]",
            "bright_blue"
        )
        ServiceLogger.log_success("Service initialized successfully")
        ServiceLogger.log_info("Server ready to accept requests", "🚀")
        ServiceLogger.log_info(f"API Documentation: http://localhost:{port}{docs_path}", "📍")
    
    @staticmethod
    def shutdown_message(service_name: str):
        """Display service shutdown message."""
        ServiceLogger.log_panel(
            f"👋 {service_name} Server Shutting Down",
            f"[bold red]{service_name} Server Shutting Down[/bold red]",
            "red"
        )
        ServiceLogger.log_warning("Cleanup completed", "🔄")
    
    @staticmethod
    def health_check():
        """Log health check access."""
        ServiceLogger.log_debug("Health check endpoint accessed", "🔍")


# Convenience functions for quick access to common logging patterns
class Logger:
    """Convenience wrapper for common logging operations."""
    
    # Direct access to ServiceLogger methods
    debug = ServiceLogger.log_debug
    info = ServiceLogger.log_info
    success = ServiceLogger.log_success
    warning = ServiceLogger.log_warning
    error = ServiceLogger.log_error
    panel = ServiceLogger.log_panel
    table = ServiceLogger.log_table
    api_request = ServiceLogger.log_api_request
    api_response = ServiceLogger.log_api_response
    
    @staticmethod
    def function_entry(func_name: str, **kwargs: Any):
        """Log function entry with parameters."""
        ServiceLogger.log_debug(f"Entering function: {func_name}", "FUNC", **kwargs)
    
    @staticmethod
    def function_exit(func_name: str, result: Any = None, duration: float | None = None):
        """Log function exit with result and duration."""
        extras = {}
        if result is not None:
            extras["result"] = str(result)[:100]  # Truncate long results
        if duration is not None:
            extras["duration_ms"] = f"{duration:.2f}"
        
        ServiceLogger.log_debug(f"Exiting function: {func_name}", "FUNC", **extras)
    
    @staticmethod
    def performance(operation: str, duration: float, **kwargs: Any):
        """Log performance metrics."""
        if duration > 1000:  # > 1 second
            ServiceLogger.log_warning(f"Slow operation: {operation}", "PERF", duration_ms=f"{duration:.2f}", **kwargs)
        elif duration > 500:  # > 500ms
            ServiceLogger.log_info(f"Operation completed: {operation}", "PERF", duration_ms=f"{duration:.2f}", **kwargs)
        else:
            ServiceLogger.log_debug(f"Operation completed: {operation}", "PERF", duration_ms=f"{duration:.2f}", **kwargs)
