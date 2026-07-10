import { Moon, Sun, ArrowRight } from 'lucide-react';
import PropTypes from 'prop-types';
import { CARD_STYLES, BUTTON_STYLES } from '../../utils/styleClasses';

const MealRoutineCard = ({ meal, onPlanClick }) => {
  const isDinner = meal.type.toLowerCase().includes('dinner') || meal.type.toLowerCase().includes('night');
  const Icon = isDinner ? Moon : Sun;

  return (
    <div className={`${CARD_STYLES.interactive} flex items-center justify-between group`}>
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-lg bg-slate-700 flex items-center justify-center text-slate-300 group-hover:text-primary-400 group-hover:bg-slate-700/80 transition-colors">
          <Icon size={24} />
        </div>
        <div>
          <h3 className="font-bold text-slate-200">{meal.type}</h3>
          <div className="text-xs text-slate-500 font-mono mt-1">
            <span className="mr-1">🕐</span>
            {meal.start} - {meal.end}
          </div>
        </div>
      </div>
      <button
        onClick={() => onPlanClick(meal.type)}
        className={`${BUTTON_STYLES.secondary} text-sm flex items-center gap-2 hover:bg-primary-600`}
      >
        <span>Plan Now</span>
        <ArrowRight size={16} />
      </button>
    </div>
  );
};

MealRoutineCard.propTypes = {
  meal: PropTypes.shape({
    type: PropTypes.string.isRequired,
    start: PropTypes.string.isRequired,
    end: PropTypes.string.isRequired,
  }).isRequired,
  onPlanClick: PropTypes.func.isRequired,
};

export default MealRoutineCard;
