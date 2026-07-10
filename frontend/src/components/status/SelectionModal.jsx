import { useState } from 'react';
import { X, Send } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import PropTypes from 'prop-types';
import { useToast } from '../../hooks/useToast';
import { CARD_STYLES, INPUT_STYLES, BUTTON_STYLES } from '../../utils/styleClasses';
import { MODAL_SIZES, MODAL_HEIGHTS, BUTTON_LABELS, ICON_SIZES, PLACEHOLDERS, FORM_CONFIG } from '../../utils/uiConstants';
import MealChoiceCard from './MealChoiceCard';

const SelectionModal = ({ isOpen, onClose, message, mealChoices = [], onSubmit }) => {
  const [response, setResponse] = useState('');
  const toast = useToast();

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (!response.trim()) {
      toast.warning('Please enter a response');
      return;
    }

    // Call onSubmit synchronously - parent handles the rest
    onSubmit(response);
    setResponse('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className={`${CARD_STYLES.base} ${MODAL_SIZES.medium} w-full mx-4 ${MODAL_HEIGHTS.standard} flex flex-col shadow-2xl`}>
        {/* Header */}
        <div className="p-6 border-b border-slate-700">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-white flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <span className="text-2xl">🤖</span>
              </div>
              Agent Response - Approval Required
            </h3>
                      <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors p-2"
            aria-label={BUTTON_LABELS.close}
          >
            <X size={ICON_SIZES['2xl']} />
          </button>
          </div>
        </div>

        {/* Message Content */}
        <div className="flex-1 p-6 overflow-y-auto">
          {message && (
            <div className={`${CARD_STYLES.inner} mb-4`}>
              <div className="text-sm text-slate-400 mb-2 flex items-center gap-2">
                <span>🤖</span>
                <span>Agent Message</span>
              </div>
              <div className="prose prose-sm prose-invert max-w-none">
                <ReactMarkdown>
                  {message}
                </ReactMarkdown>
              </div>
            </div>
          )}
          
          {mealChoices && mealChoices.length > 0 && (
            <div className="space-y-3">
              <div className="text-sm text-slate-400 font-medium flex items-center gap-2">
                <span>🍽️</span>
                <span>Your Meal Options ({mealChoices.length})</span>
              </div>
              {mealChoices.map((choice, index) => (
                <MealChoiceCard key={choice.id || index} choice={choice} index={index} />
              ))}
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-6 border-t border-slate-700">
          <div className="flex flex-col gap-3">
            <label className="text-sm font-medium text-slate-300">Your Response:</label>
            <div className="flex gap-3">
              <textarea
                value={response}
                onChange={(e) => setResponse(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={PLACEHOLDERS.userResponse}
                rows={FORM_CONFIG.textareaRows.small}
                className={`${INPUT_STYLES.textarea} flex-1`}
              />
              <button
                onClick={handleSubmit}
                className={`${BUTTON_STYLES.primaryCompact} self-end flex items-center gap-2`}
              >
                <span>Send</span>
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

SelectionModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  message: PropTypes.string,
  mealChoices: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      menu_item_name: PropTypes.string,
      restaurant_name: PropTypes.string,
      price: PropTypes.number,
      calories: PropTypes.number,
      description: PropTypes.string,
    })
  ),
  onSubmit: PropTypes.func.isRequired,
};

SelectionModal.defaultProps = {
  message: '',
  mealChoices: [],
};

export default SelectionModal;
