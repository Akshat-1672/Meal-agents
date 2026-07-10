import { CheckCircle, Clock, AlertCircle } from 'lucide-react';
import PropTypes from 'prop-types';
import { WORKFLOW_STATUS } from '../../utils/constants';

const ResponseStream = ({ sessionState }) => {
  if (!sessionState || !sessionState.state) {
    return (
      <div className="text-center text-gray-500 py-4">
        <p className="text-sm">No session data available</p>
      </div>
    );
  }

  const { state } = sessionState;
  const workflowStatus = state.workflow_status;

  // Build the response stream based on available data
  const responses = [];

  // Add workflow status
  responses.push({
    status: 'Workflow Status',
    meaning: workflowStatus || 'Unknown',
    timestamp: sessionState.create_time,
    isComplete: workflowStatus === WORKFLOW_STATUS.ORDER_CONFIRMED
  });

  // Add meal type if available
  if (state.planning.meal_type) {
    responses.push({
      status: 'Meal Type',
      meaning: state.planning.meal_type,
      isComplete: true
    });
  }

  // Add meal planning result if available
  if (state.meal_planning_result && Array.isArray(state.meal_planning_result) && state.meal_planning_result.length > 0) {
    responses.push({
      status: 'Meal Options Found',
      meaning: `${state.meal_planning_result.length} option(s) available`,
      isComplete: true
    });
  }

  // Add verification message if available
  if (state?.planning?.meal_choice_verification_message) {
    responses.push({
      status: 'Awaiting User Approval',
      meaning: state.planning.meal_choice_verification_message.substring(0, 100) + (state.planning.meal_choice_verification_message.length > 100 ? '...' : ''),
      isComplete: workflowStatus !== WORKFLOW_STATUS.AWAITING_USER_APPROVAL
    });
  }

  // Add user choice if available
  if (state.user_choice && Array.isArray(state.user_choice) && state.user_choice.length > 0) {
    responses.push({
      status: 'User Selection',
      meaning: state.user_choice.join(', '),
      isComplete: true
    });
  }

  // Add order confirmation if available
  if (state?.ordering?.confirmation?.bill?.message) {
    const message = state.ordering.confirmation.bill.message;
    responses.push({
      status: 'Order Confirmed',
      meaning: message.substring(0, 100) + (message.length > 100 ? '...' : ''),
      isComplete: true
    });
  }

  return (
    <div className="space-y-3">
      {responses.map((response, index) => (
        <div
          key={index}
          className={`flex items-start gap-3 p-3 rounded-lg transition-colors ${
            response.isComplete
              ? 'bg-slate-800/50 border border-slate-700/50'
              : 'bg-yellow-500/10 border border-yellow-500/20'
          }`}
        >
          <div className="mt-0.5">
            {response.isComplete ? (
              <CheckCircle className="text-green-400" size={18} />
            ) : (
              <Clock className="text-yellow-400 animate-pulse" size={18} />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-white mb-1">
              {response.status}
            </div>
            <div className="text-xs text-gray-400 wrap-break-word">
              {response.meaning}
            </div>
            {response.timestamp && (
              <div className="text-xs text-gray-500 mt-1">
                {new Date(response.timestamp).toLocaleString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit'
                })}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

ResponseStream.propTypes = {
  sessionState: PropTypes.shape({
    create_time: PropTypes.string,
    state: PropTypes.shape({
      workflow_status: PropTypes.string,
      planning: PropTypes.object,
      meal_planning_result: PropTypes.array,
      user_choice: PropTypes.array,
      ordering: PropTypes.object,
    }),
  }),
};

export default ResponseStream;
