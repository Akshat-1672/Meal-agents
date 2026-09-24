import React, { useState } from 'react';
import { ChefHat, IndianRupee, Clock, ShoppingCart, Bike, ExternalLink, Calendar, Users, AlertTriangle } from 'lucide-react';
import PropTypes from 'prop-types';
import { CARD_STYLES, BUTTON_STYLES, INPUT_STYLES } from '../../utils/styleClasses';

const MealChoiceCard = ({ choice, index, onSelect }) => {
  const [excludedIngredients, setExcludedIngredients] = useState(new Set());
  const [dineoutDetails, setDineoutDetails] = useState({ time: '19:30', partySize: 2 });

  const handleIngredientToggle = (ingredientName, isRequired) => {
    if (isRequired && !excludedIngredients.has(ingredientName)) {
      const confirmed = window.confirm(`"${ingredientName}" is a required ingredient for this recipe. Are you sure you want to remove it? (You might already have it in your pantry)`);
      if (!confirmed) return;
    }
    
    setExcludedIngredients(prev => {
      const newSet = new Set(prev);
      if (newSet.has(ingredientName)) {
        newSet.delete(ingredientName);
      } else {
        newSet.add(ingredientName);
      }
      return newSet;
    });
  };

  const handleSelect = () => {
    let selectString = `Option ${index + 1}`;
    
    if (choice.modality === 'cook' && excludedIngredients.size > 0) {
      selectString += `. I already have these ingredients, exclude them from the order: ${Array.from(excludedIngredients).join(', ')}.`;
    } else if (choice.modality === 'dineout') {
      selectString += `. Party of ${dineoutDetails.partySize} at ${dineoutDetails.time}.`;
    }
    
    onSelect(selectString);
  };
  // Determine icons and colors based on modality
  const getModalityStyles = (modality) => {
    switch (modality) {
      case 'delivery':
        return { icon: Bike, label: 'Food Delivery', color: 'text-orange-400', bg: 'bg-orange-500/20' };
      case 'cook':
      case 'instamart':
        return { icon: ShoppingCart, label: 'Instamart Groceries', color: 'text-green-400', bg: 'bg-green-500/20' };
      case 'dineout':
        return { icon: ChefHat, label: 'Dineout Reservation', color: 'text-purple-400', bg: 'bg-purple-500/20' };
      default:
        return { icon: ChefHat, label: 'Meal Option', color: 'text-blue-400', bg: 'bg-blue-500/20' };
    }
  };

  const styles = getModalityStyles(choice.modality);
  const ModalityIcon = styles.icon;

  return (
    <div className={`${CARD_STYLES.interactive} hover:border-slate-600 flex flex-col`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 pr-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg font-bold text-white leading-tight">{choice.title}</span>
            <span className="shrink-0 text-xs px-2 py-1 bg-blue-500/20 text-blue-400 rounded-full font-medium">
              Option {index + 1}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
            <ModalityIcon size={14} className={styles.color} />
            <span className={`font-medium ${styles.color}`}>{styles.label}</span>
            <span className="text-slate-600 mx-1">•</span>
            <span className="truncate">{choice.sub_text}</span>
          </div>
        </div>
        
        <div className="flex flex-col items-end gap-1 shrink-0">
          <div className="flex items-center gap-1 text-green-400 font-bold text-lg">
            <IndianRupee size={16} />
            <span>{choice?.cost?.toFixed(2) || '0.00'}</span>
          </div>
          <div className="flex items-center gap-1 text-slate-300 text-xs">
            <Clock size={14} className="text-slate-400" />
            <span>{choice.time_minutes} mins</span>
          </div>
        </div>
      </div>

      {/* Interactive Section for Cook (Instamart) */}
      {choice.modality === 'cook' && choice.ingredients && (
        <div className="mb-4 mt-2 p-3 bg-slate-900/50 rounded-lg border border-slate-700/50">
          <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-2">
            <span>Recipe Ingredients</span>
            <span className="text-slate-500 font-normal lowercase">(Uncheck what you already have)</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
            {choice.ingredients.map((ing, i) => {
              const isExcluded = excludedIngredients.has(ing.name);
              return (
                <label key={i} className={`flex items-start gap-2 p-2 rounded border cursor-pointer transition-colors ${isExcluded ? 'bg-slate-800/50 border-slate-700/50 opacity-60' : 'bg-slate-800 border-slate-600 hover:border-blue-500/50'}`}>
                  <input 
                    type="checkbox" 
                    checked={!isExcluded}
                    onChange={() => handleIngredientToggle(ing.name, ing.required)}
                    className="mt-0.5 rounded border-slate-600 text-blue-500 focus:ring-blue-500/20 bg-slate-700"
                  />
                  <div className="flex flex-col">
                    <span className={`text-sm ${isExcluded ? 'text-slate-500 line-through' : 'text-slate-200'}`}>{ing.name}</span>
                    {ing.required && <span className="text-[10px] text-orange-400 font-medium flex items-center gap-1"><AlertTriangle size={10} /> Required</span>}
                  </div>
                </label>
              );
            })}
          </div>
        </div>
      )}

      {/* Interactive Section for Dineout */}
      {choice.modality === 'dineout' && (
        <div className="mb-4 mt-2 p-3 bg-slate-900/50 rounded-lg border border-slate-700/50 flex gap-4">
          <div className="flex-1">
            <label className="block text-xs font-semibold text-slate-400 mb-1 flex items-center gap-1"><Calendar size={12}/> Time Slot</label>
            <select 
              value={dineoutDetails.time}
              onChange={(e) => setDineoutDetails(prev => ({...prev, time: e.target.value}))}
              className={`${INPUT_STYLES.compact} text-sm py-1.5`}
            >
              <option value="18:30">6:30 PM</option>
              <option value="19:00">7:00 PM</option>
              <option value="19:30">7:30 PM</option>
              <option value="20:00">8:00 PM</option>
              <option value="20:30">8:30 PM</option>
              <option value="21:00">9:00 PM</option>
            </select>
          </div>
          <div className="w-1/3">
            <label className="block text-xs font-semibold text-slate-400 mb-1 flex items-center gap-1"><Users size={12}/> Party Size</label>
            <input 
              type="number" 
              min="1" max="20"
              value={dineoutDetails.partySize}
              onChange={(e) => setDineoutDetails(prev => ({...prev, partySize: parseInt(e.target.value) || 2}))}
              className={`${INPUT_STYLES.compact} text-sm py-1.5`}
            />
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 mt-auto pt-4 border-t border-slate-700/50">
        {choice.deep_link_url && (
          <a
            href={choice.deep_link_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 rounded-lg transition-colors"
          >
            <ExternalLink size={16} />
            View on Swiggy
          </a>
        )}
        
        <button
          onClick={handleSelect}
          className={`flex-1 ${BUTTON_STYLES.primaryCompact} text-sm font-semibold`}
        >
          Select This Option
        </button>
      </div>
    </div>
  );
};

MealChoiceCard.propTypes = {
  choice: PropTypes.shape({
    id: PropTypes.string,
    modality: PropTypes.string,
    title: PropTypes.string.isRequired,
    sub_text: PropTypes.string,
    cost: PropTypes.number,
    time_minutes: PropTypes.number,
    deep_link_url: PropTypes.string,
    ingredients: PropTypes.arrayOf(PropTypes.shape({
      name: PropTypes.string,
      required: PropTypes.bool
    }))
  }).isRequired,
  index: PropTypes.number.isRequired,
  onSelect: PropTypes.func.isRequired,
};

export default MealChoiceCard;
