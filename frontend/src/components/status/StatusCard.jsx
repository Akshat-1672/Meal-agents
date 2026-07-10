import { useState } from 'react';
import { ChevronDown, Loader2 } from 'lucide-react';
import PropTypes from 'prop-types';
import ResponseStream from './ResponseStream';
import { getWorkflowProgress } from '../../utils/constants';

const StatusCard = ({ title, subtitle, isActive, sessionState, workflowStatus }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  const progress = getWorkflowProgress(workflowStatus);

  return (
    <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-2xl mb-8 shadow-xl relative overflow-hidden transition-all duration-300">
      {/* Header (Always Visible) */}
      <div className="p-6 cursor-pointer relative z-10" onClick={toggleExpanded}>
        <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
        <div className="flex items-start justify-between">
          <div>
            <div className="text-xs font-bold text-green-400 uppercase tracking-widest mb-1 flex items-center gap-2">
              {isActive && <span className="animate-pulse">●</span>}
              {isActive ? 'Active Session' : 'Status'}
            </div>
            <h2 className="text-2xl font-bold text-white">{title}</h2>
            <p className="text-slate-400 text-sm mt-1">{subtitle}</p>
          </div>
          <div className="flex items-center gap-4">
            {isActive && (
              <div className="h-12 w-12 bg-slate-800 rounded-full flex items-center justify-center border border-slate-700">
                <Loader2 className="text-primary-500 animate-spin" size={24} />
              </div>
            )}
            <ChevronDown
              className={`text-slate-500 transition-transform duration-300 ${
                isExpanded ? 'rotate-180' : ''
              }`}
              size={24}
            />
          </div>
        </div>

        {/* Simple Progress Bar (Visible when collapsed) */}
        {!isExpanded && isActive && (
          <div className="mt-6 transition-opacity duration-300">
            <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary-500 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <div className="text-xs text-gray-400 mt-2 text-right">
              {progress}% Complete
            </div>
          </div>
        )}
      </div>

      {/* Response Stream (Expandable) */}
      {isExpanded && (
        <div className="border-t border-slate-700 bg-slate-900/50 p-4 max-h-96 overflow-y-auto">
          <div className="text-xs text-slate-500 uppercase tracking-wider mb-2 font-bold">
            Session Details
          </div>
          <ResponseStream sessionState={sessionState} />
        </div>
      )}
    </div>
  );
};

StatusCard.propTypes = {
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string.isRequired,
  isActive: PropTypes.bool.isRequired,
  sessionState: PropTypes.object,
  workflowStatus: PropTypes.string,
};

export default StatusCard;
