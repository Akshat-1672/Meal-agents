import { Wrench, CheckCircle, MessageCircle, AlertCircle } from 'lucide-react';

const EventStream = ({ events }) => {
  const getEventIcon = (eventType) => {
    switch (eventType) {
      case 'ToolCall':
        return { Icon: Wrench, color: 'text-blue-400' };
      case 'ToolResponse':
        return { Icon: CheckCircle, color: 'text-green-400' };
      case 'TextResponse':
        return { Icon: MessageCircle, color: 'text-purple-400' };
      default:
        return { Icon: AlertCircle, color: 'text-slate-400' };
    }
  };

  const getEventTitle = (event) => {
    if (event.type === 'ToolCall' && event.calls && event.calls.length > 0) {
      return `Tool Call: ${event.calls[0].name}`;
    }
    if (event.type === 'ToolResponse' && event.responses && event.responses.length > 0) {
      return `Tool Response: ${event.responses[0].name}`;
    }
    if (event.type === 'TextResponse') {
      if (event.workflow_status === 'AWAITING_USER_APPROVAL') {
        return 'Agent: Awaiting Your Approval';
      }
      if (event.workflow_status === 'ORDER_CONFIRMED') {
        return 'Order Confirmed! 🎉';
      }
      if (event.workflow_status === 'NO_PLANNING_NEEDED') {
        return 'No Planning Needed';
      }
      return 'Agent Response';
    }
    return event.type || 'Event';
  };

  const getEventSubtitle = (event) => {
    if (event.type === 'ToolCall' && event.calls && event.calls.length > 0) {
      const args = event.calls[0].arguments;
      return args ? JSON.stringify(args).substring(0, 100) : 'Executing...';
    }
    if (event.type === 'ToolResponse' && event.responses && event.responses.length > 0) {
      const response = event.responses[0].response;
      if (response?.status) return `Status: ${response.status}`;
      if (response?.result) return `Result: ${response.result}`;
      return 'Completed';
    }
    if (event.type === 'TextResponse' && event.text) {
      return event.text.substring(0, 150) + (event.text.length > 150 ? '...' : '');
    }
    return 'Processing...';
  };

  const getEventBgColor = (event) => {
    if (event.workflow_status === 'ORDER_CONFIRMED') {
      return 'bg-green-500/10 border-green-500/30';
    }
    if (event.workflow_status === 'NO_PLANNING_NEEDED') {
      return 'bg-blue-500/10 border-blue-500/30';
    }
    if (event.workflow_status === 'AWAITING_USER_APPROVAL') {
      return 'bg-yellow-500/10 border-yellow-500/30';
    }
    if (event.type === 'ToolCall') {
      return 'bg-blue-500/10 border-slate-700';
    }
    return 'bg-slate-800/50 border-slate-700';
  };

  if (events.length === 0) {
    return (
      <div className="text-center text-slate-500 py-8">
        <AlertCircle className="mx-auto mb-2" size={32} />
        <p>No events yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {events.map((event, index) => {
        const { Icon, color } = getEventIcon(event.type);
        const title = getEventTitle(event);
        const subtitle = getEventSubtitle(event);
        const bgColor = getEventBgColor(event);
        
        // Use event_id if available, otherwise fallback to timestamp+index
        const key = event.event_id || `${event.timestamp}-${index}`;

        return (
          <div
            key={key}
            className={`border rounded-lg p-3 ${bgColor} transition-all hover:shadow-md animate-fade-in`}
          >
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-slate-700/50 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Icon className={color} size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-slate-200 text-sm">{title}</h4>
                  <span className="text-xs text-slate-500 font-mono">{event.timestamp}</span>
                </div>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">{subtitle}</p>
                {event.text && event.type === 'TextResponse' && (
                  <div className="mt-2 p-2 bg-slate-800/50 rounded text-xs text-slate-300 border border-slate-700/50 whitespace-pre-wrap">
                    {event.text}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default EventStream;
