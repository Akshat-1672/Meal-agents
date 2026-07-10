import { ChefHat, DollarSign, Flame } from 'lucide-react';
import PropTypes from 'prop-types';
import { CARD_STYLES } from '../../utils/styleClasses';

const MealChoiceCard = ({ choice, index }) => {
  return (
    <div className={`${CARD_STYLES.interactive} hover:border-slate-600`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg font-bold text-white">{choice.menu_item_name}</span>
            <span className="text-xs px-2 py-1 bg-blue-500/20 text-blue-400 rounded-full font-medium">
              #{index + 1}
            </span>
          </div>
          <div className="flex items-center gap-1 text-xs text-slate-400">
            <ChefHat size={14} />
            <span>{choice.restaurant_name}</span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-1 text-green-400 font-bold">
            <DollarSign size={16} />
            <span>{choice.price.toFixed(2)}</span>
          </div>
          <div className="flex items-center gap-1 text-orange-400 text-xs">
            <Flame size={14} />
            <span>{choice.calories} cal</span>
          </div>
        </div>
      </div>

      <p className="text-sm text-slate-300 leading-relaxed mb-3">
        {choice.description}
      </p>

      {choice.special_instructions && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-2 mt-3">
          <div className="text-xs text-yellow-400 font-medium mb-1">
            ⚠️ Special Instructions
          </div>
          <p className="text-xs text-yellow-200/80">
            {choice.special_instructions}
          </p>
        </div>
      )}
    </div>
  );
};

MealChoiceCard.propTypes = {
  choice: PropTypes.shape({
    menu_item_name: PropTypes.string.isRequired,
    restaurant_name: PropTypes.string.isRequired,
    price: PropTypes.number.isRequired,
    calories: PropTypes.number.isRequired,
    description: PropTypes.string.isRequired,
    special_instructions: PropTypes.string,
  }).isRequired,
  index: PropTypes.number.isRequired,
};

export default MealChoiceCard;
