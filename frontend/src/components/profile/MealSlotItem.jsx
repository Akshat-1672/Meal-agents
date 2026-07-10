import { X } from 'lucide-react';
import PropTypes from 'prop-types';
import { INPUT_STYLES } from '../../utils/styleClasses';
import { PLACEHOLDERS, ICON_SIZES } from '../../utils/uiConstants';

const MealSlotItem = ({ meal, onRemove, onChange }) => {
  const handleTypeChange = (e) => {
    const value = e.target.value;
    onChange({ ...meal, type: value, customName: value === 'Custom' ? meal.customName : '' });
  };

  const handleCustomNameChange = (e) => {
    onChange({ ...meal, customName: e.target.value, type: e.target.value });
  };

  const handleStartChange = (e) => {
    onChange({ ...meal, start: e.target.value });
  };

  const handleEndChange = (e) => {
    onChange({ ...meal, end: e.target.value });
  };

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-lg p-4 flex flex-col sm:flex-row gap-3">
      <div className="flex-1">
        <select
          value={meal.type === 'Breakfast' || meal.type === 'Lunch' || meal.type === 'Dinner' ? meal.type : 'Custom'}
          onChange={handleTypeChange}
          className={INPUT_STYLES.compact}
        >
          <option>Breakfast</option>
          <option>Lunch</option>
          <option>Dinner</option>
          <option>Custom</option>
        </select>
        {(meal.type !== 'Breakfast' && meal.type !== 'Lunch' && meal.type !== 'Dinner') && (
          <input
            type="text"
            value={meal.customName || meal.type}
            onChange={handleCustomNameChange}
            placeholder={PLACEHOLDERS.mealName}
            className={`${INPUT_STYLES.compact} mt-2`}
          />
        )}
      </div>
      <div className="flex gap-2 items-start">
        <input
          type="time"
          value={meal.start}
          onChange={handleStartChange}
          className={INPUT_STYLES.time}
        />
        <span className="text-slate-500 self-center">-</span>
        <input
          type="time"
          value={meal.end}
          onChange={handleEndChange}
          className={INPUT_STYLES.time}
        />
        <button
          type="button"
          onClick={onRemove}
          className="bg-red-500/10 hover:bg-red-500/20 text-red-400 p-2 rounded-lg transition-colors"
        >
          <X size={ICON_SIZES.md} />
        </button>
      </div>
    </div>
  );
};

MealSlotItem.propTypes = {
  meal: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    type: PropTypes.string.isRequired,
    start: PropTypes.string.isRequired,
    end: PropTypes.string.isRequired,
    customName: PropTypes.string,
  }).isRequired,
  onRemove: PropTypes.func.isRequired,
  onChange: PropTypes.func.isRequired,
};

export default MealSlotItem;
