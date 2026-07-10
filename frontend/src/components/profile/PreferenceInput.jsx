import { useState } from 'react';
import { X, Plus } from 'lucide-react';
import PropTypes from 'prop-types';
import { INPUT_STYLES, BUTTON_STYLES } from '../../utils/styleClasses';
import { PLACEHOLDERS, ICON_SIZES } from '../../utils/uiConstants';

const PreferenceInput = ({ preferences, onChange }) => {
  const [inputValue, setInputValue] = useState('');

  const addPreference = () => {
    const trimmed = inputValue.trim();
    if (trimmed && !preferences.includes(trimmed)) {
      onChange([...preferences, trimmed]);
      setInputValue('');
    }
  };

  const removePreference = (pref) => {
    onChange(preferences.filter(p => p !== pref));
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addPreference();
    }
  };

  return (
    <div>
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder={PLACEHOLDERS.preference}
          className={INPUT_STYLES.text}
        />
        <button
          type="button"
          onClick={addPreference}
          className={BUTTON_STYLES.primaryCompact}
        >
          Add
        </button>
      </div>
      <div className="flex flex-wrap gap-2 mb-3">
        {preferences.map((pref) => (
          <span
            key={pref}
            className="bg-primary-500/20 border border-primary-500/30 text-primary-300 px-3 py-1.5 rounded-full text-sm flex items-center gap-2"
          >
            {pref}
            <button
              type="button"
              onClick={() => removePreference(pref)}
              className="hover:text-primary-100 transition-colors"
            >
              <X size={14} />
            </button>
          </span>
        ))}
      </div>
    </div>
  );
};

PreferenceInput.propTypes = {
  preferences: PropTypes.arrayOf(PropTypes.string).isRequired,
  onChange: PropTypes.func.isRequired,
};

export default PreferenceInput;
