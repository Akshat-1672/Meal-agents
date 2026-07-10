import { useState } from 'react';
import { 
  CheckCircle, 
  Clock, 
  XCircle, 
  AlertCircle, 
  PlayCircle, 
  MessageSquare,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import PropTypes from 'prop-types';
import { WORKFLOW_STATUS, getStatusDisplay } from '../../utils/constants';
import {
  getWorkflowStatus,
  getMealType,
  hasUserChoice,
  getUserChoice,
  getOrderConfirmationMessage,
  shouldShowChatIcon,
  getFormattedCreateTime
} from '../../utils/sessionAccessors';

// Visual display attributes for session history items
const getStatusVisuals = (workflowStatus) => {
  const visualMap = {
    [WORKFLOW_STATUS.ORDER_CONFIRMED]: {
      icon: CheckCircle,
      color: 'text-green-400',
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500/20'
    },
    [WORKFLOW_STATUS.AWAITING_USER_APPROVAL]: {
      icon: AlertCircle,
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/10',
      borderColor: 'border-yellow-500/20'
    },
    [WORKFLOW_STATUS.MEAL_PLANNING_STARTED]: {
      icon: Clock,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/20'
    },
    [WORKFLOW_STATUS.MEAL_PLANNING_COMPLETE]: {
      icon: CheckCircle,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/20'
    },
    [WORKFLOW_STATUS.USER_APPROVAL_RECEIVED]: {
      icon: CheckCircle,
      color: 'text-green-400',
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500/20'
    },
    [WORKFLOW_STATUS.USER_REJECTION_RECEIVED]: {
      icon: XCircle,
      color: 'text-orange-400',
      bgColor: 'bg-orange-500/10',
      borderColor: 'border-orange-500/20'
    },
    [WORKFLOW_STATUS.PLACING_ORDER]: {
      icon: PlayCircle,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10',
      borderColor: 'border-purple-500/20'
    },
    [WORKFLOW_STATUS.ORDER_EXECUTION_STARTED]: {
      icon: PlayCircle,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10',
      borderColor: 'border-purple-500/20'
    },
    [WORKFLOW_STATUS.STARTED]: {
      icon: PlayCircle,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/20'
    },
    [WORKFLOW_STATUS.COMPLETED]: {
      icon: CheckCircle,
      color: 'text-green-400',
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500/20'
    },
    [WORKFLOW_STATUS.ERROR]: {
      icon: XCircle,
      color: 'text-red-400',
      bgColor: 'bg-red-500/10',
      borderColor: 'border-red-500/20'
    }
  };

  return visualMap[workflowStatus] || {
    icon: Clock,
    color: 'text-gray-400',
    bgColor: 'bg-gray-500/10',
    borderColor: 'border-gray-500/20'
  };
};

const SessionHistoryItem = ({ session, isActive, onChatClick }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const workflowStatus = getWorkflowStatus(session);
  
  // Get status text from helper
  const statusInfo = getStatusDisplay(workflowStatus);
  
  // Get visual attributes
  const statusVisuals = getStatusVisuals(workflowStatus);
  const StatusIcon = statusVisuals.icon;
  
  const mealType = getMealType(session);
  const createTime = getFormattedCreateTime(session);

  const showChatIcon = shouldShowChatIcon(session);

  return (
    <div className={`border rounded-lg p-4 ${statusVisuals.borderColor} ${statusVisuals.bgColor} ${isActive ? 'ring-2 ring-blue-400' : ''}`}>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3 flex-1">
          <StatusIcon className={`${statusVisuals.color} mt-1`} size={20} />
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-semibold text-white">{mealType}</h4>
              {isActive && (
                <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full border border-blue-500/30">
                  Active
                </span>
              )}
            </div>
            <p className={`text-sm ${statusVisuals.color}`}>{statusInfo.title}</p>
            <p className="text-xs text-gray-400 mt-1">{createTime}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {showChatIcon && (
            <button
              onClick={() => onChatClick(session)}
              className="p-2 hover:bg-yellow-500/20 rounded-lg transition-colors"
              title="View and respond to approval request"
            >
              <MessageSquare className="text-yellow-400" size={20} />
            </button>
          )}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 hover:bg-white/5 rounded-lg transition-colors"
          >
            {isExpanded ? (
              <ChevronUp className="text-gray-400" size={20} />
            ) : (
              <ChevronDown className="text-gray-400" size={20} />
            )}
          </button>
        </div>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-white/10">
          <div className="space-y-2 text-sm">
            <div>
              <span className="text-gray-400">Session ID:</span>
              <span className="text-white ml-2 font-mono text-xs">{session.session_id}</span>
            </div>
            {hasUserChoice(session) && (
              <div>
                <span className="text-gray-400">User Choice:</span>
                <span className="text-white ml-2">{getUserChoice(session).join(', ')}</span>
              </div>
            )}
            {getOrderConfirmationMessage(session) && (
              <div>
                <span className="text-gray-400">Order Details:</span>
                <p className="text-white mt-1 text-xs leading-relaxed">
                  {getOrderConfirmationMessage(session)}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

SessionHistoryItem.propTypes = {
  session: PropTypes.object.isRequired,
  isActive: PropTypes.bool,
  onChatClick: PropTypes.func.isRequired
};

const SessionHistory = ({ sessions, currentSessionId, onChatClick }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Ensure sessions is always an array
  const sessionsList = Array.isArray(sessions) ? sessions : [];

  if (!sessionsList || sessionsList.length === 0) {
    return (
      <div className="bg-gray-800/30 border border-gray-700/50 rounded-xl p-6 text-center">
        <Clock className="mx-auto text-gray-500 mb-3" size={32} />
        <p className="text-gray-400">No session history yet</p>
        <p className="text-gray-500 text-sm mt-1">
          Start a meal plan to see your sessions here
        </p>
      </div>
    );
  }

  // Calculate pagination
  const totalPages = Math.ceil(sessionsList.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentSessions = sessionsList.slice(startIndex, endIndex);

  const handlePrevPage = () => {
    setCurrentPage(prev => Math.max(1, prev - 1));
  };

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(totalPages, prev + 1));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-white">Session History</h3>
        <span className="text-sm text-gray-400">
          {sessionsList.length} session{sessionsList.length !== 1 ? 's' : ''}
        </span>
      </div>

      {currentSessions.map((session) => (
        <SessionHistoryItem
          key={session.session_id}
          session={session}
          isActive={session.session_id === currentSessionId}
          onChatClick={onChatClick}
        />
      ))}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-gray-700/50">
          <button
            onClick={handlePrevPage}
            disabled={currentPage === 1}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              currentPage === 1
                ? 'text-gray-600 cursor-not-allowed'
                : 'text-blue-400 hover:bg-blue-500/10'
            }`}
          >
            <ChevronLeft size={16} />
            <span className="text-sm">Previous</span>
          </button>

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">
              Page {currentPage} of {totalPages}
            </span>
          </div>

          <button
            onClick={handleNextPage}
            disabled={currentPage === totalPages}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              currentPage === totalPages
                ? 'text-gray-600 cursor-not-allowed'
                : 'text-blue-400 hover:bg-blue-500/10'
            }`}
          >
            <span className="text-sm">Next</span>
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
};

SessionHistory.propTypes = {
  sessions: PropTypes.array.isRequired,
  currentSessionId: PropTypes.string,
  onChatClick: PropTypes.func.isRequired
};

export default SessionHistory;
