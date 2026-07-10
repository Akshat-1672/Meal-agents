import PropTypes from 'prop-types';
import { ALLERGIES_LIST } from '../../utils/constants';
import { 
  Cookie, 
  Beef, 
  Wheat, 
  Fish as FishIcon, 
  Leaf, 
  Egg, 
  TreeDeciduous,
  Apple 
} from 'lucide-react';

// Map allergy names to Lucide icons
const allergyIcons = {
  'Peanuts': Apple,
  'Dairy': Cookie,
  'Gluten': Wheat,
  'Shellfish': FishIcon,
  'Soy': Leaf,
  'Eggs': Egg,
  'Fish': FishIcon,
  'Tree Nuts': TreeDeciduous,
};

const AllergyGrid = ({ allergies, onChange }) => {
  const toggleAllergy = (allergyName) => {
    if (allergies.includes(allergyName)) {
      onChange(allergies.filter(a => a !== allergyName));
    } else {
      onChange([...allergies, allergyName]);
    }
  };

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
      {ALLERGIES_LIST.map((allergy) => {
        const isSelected = allergies.includes(allergy.name);
        const Icon = allergyIcons[allergy.name] || Apple;
        
        return (
          <button
            key={allergy.name}
            type="button"
            onClick={() => toggleAllergy(allergy.name)}
            className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
              isSelected
                ? 'bg-red-500/20 border-red-500/50 text-red-300'
                : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-600'
            }`}
          >
            <Icon size={24} className="mb-2" />
            <span className="text-xs font-medium text-center">{allergy.name}</span>
          </button>
        );
      })}
    </div>
  );
};

AllergyGrid.propTypes = {
  allergies: PropTypes.arrayOf(PropTypes.string).isRequired,
  onChange: PropTypes.func.isRequired,
};

export default AllergyGrid;
