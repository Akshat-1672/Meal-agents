import PropTypes from 'prop-types';
import { DAYS } from '../../utils/constants';

const DaySelector = ({ selectedDays, onChange }) => {
  const toggleDay = (index) => {
    const newSelectedDays = [...selectedDays];
    newSelectedDays[index] = !newSelectedDays[index];
    onChange(newSelectedDays);
  };

  return (
    <div className="grid grid-cols-7 gap-2">
      {DAYS.map((day, index) => (
        <button
          key={`day-${index}`}
          type="button"
          onClick={() => toggleDay(index)}
          className={`flex-1 h-12 rounded-lg font-bold text-sm transition-all ${
            selectedDays[index]
              ? 'bg-primary-600 text-white shadow-md shadow-primary-600/30'
              : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
          }`}
        >
          {day}
        </button>
      ))}
    </div>
  );
};

DaySelector.propTypes = {
  selectedDays: PropTypes.arrayOf(PropTypes.bool).isRequired,
  onChange: PropTypes.func.isRequired,
};

export default DaySelector;
