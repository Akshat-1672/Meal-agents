import { useState, useEffect } from 'react';
import { IdCard, Calendar, Clock, Sliders, AlertTriangle, MessageSquare, Save } from 'lucide-react';
import { useUser } from '../../hooks/useUser';
import { useAutoNom } from '../../hooks/useAutoNom';
import { useToast } from '../../hooks/useToast';
import { useLoadingState } from '../../hooks/useLoadingState';
import { createLogger } from '../../utils/logger';
import { INPUT_STYLES, BUTTON_STYLES } from '../../utils/styleClasses';
import { PLACEHOLDERS, BUTTON_LABELS, VALIDATION_MESSAGES, SUCCESS_MESSAGES, ERROR_MESSAGES, FORM_CONFIG, ICON_SIZES } from '../../utils/uiConstants';
import Card from '../common/Card';
import DaySelector from '../profile/DaySelector';

const logger = createLogger('ProfileTab');
import MealSlotList from '../profile/MealSlotList';
import PreferenceInput from '../profile/PreferenceInput';
import AllergyGrid from '../profile/AllergyGrid';

const ProfileTab = () => {
  const { currentUser, currentUserId, upsertUser, selectUser } = useUser();
  const { saveUserToAPI } = useAutoNom();
  const toast = useToast();
  const { isLoading: isSaving, withLoading } = useLoadingState();
  
  const [name, setName] = useState('');
  const [selectedDays, setSelectedDays] = useState([false, false, false, false, false, false, false]);
  const [meals, setMeals] = useState([]);
  const [preferences, setPreferences] = useState([]);
  const [allergies, setAllergies] = useState([]);
  const [instructions, setInstructions] = useState('');

  // Load current user data into form
  useEffect(() => {
    if (currentUser) {
      logger.log('Loading current user data:', currentUser);
      setName(currentUser.name || '');
      setSelectedDays(currentUser.schedule || [false, false, false, false, false, false, false]);
      setMeals(currentUser.meals || []);
      setPreferences(currentUser.preferences || []);
      setAllergies(currentUser.allergies || []);
      setInstructions(currentUser.instructions || '');
    } else if (currentUserId && currentUserId !== 'create_new') {
      // User ID exists but no data loaded yet
      setName('');
      setSelectedDays([false, false, false, false, false, false, false]);
      setMeals([]);
      setPreferences([]);
      setAllergies([]);
      setInstructions('');
    } else {
      // Creating new user
      setName('');
      setSelectedDays([false, false, false, false, false, false, false]);
      setMeals([]);
      setPreferences([]);
      setAllergies([]);
      setInstructions('');
    }
  }, [currentUser, currentUserId]);

  const handleSave = async () => {
    if (!name.trim()) {
      toast.warning(VALIDATION_MESSAGES.nameRequired);
      return;
    }

    if (meals.length === 0) {
      toast.warning(VALIDATION_MESSAGES.mealRequired);
      return;
    }

    await withLoading(
      async () => {
        const userData = {
          user_id: currentUserId,
          name: name.trim(),
          schedule: selectedDays,
          meals: meals,
          preferences: preferences,
          allergies: allergies,
          instructions: instructions.trim()
        };

        const savedUser = await saveUserToAPI(userData);
        
        logger.log('User saved, updating context with:', savedUser);
        
        // Update local state - upsertUser will update both users array
        upsertUser(savedUser);
        
        // Always select the saved user to ensure proper sync
        // This will update both currentUserId and trigger the useEffect in UserContext
        selectUser(savedUser.user_id);
        
        logger.log('User upserted and selected:', savedUser.user_id);

        return savedUser;
      },
      {
        onSuccess: () => {
          toast.success(SUCCESS_MESSAGES.profileSaved);
        },
        onError: (error) => {
          logger.error('Error saving profile:', error);
          toast.error(ERROR_MESSAGES.profileSaveFailed);
        }
      }
    );
  };

  return (
    <div className="space-y-8">
      {/* Personal Info */}
      <Card title="Personal Details" icon={IdCard}>
        <div>
          <label htmlFor="input-name" className={INPUT_STYLES.label}>
            First Name
          </label>
          <input
            type="text"
            id="input-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={PLACEHOLDERS.name}
            className={INPUT_STYLES.text}
          />
        </div>
      </Card>

      {/* Schedule */}
      <Card title="Delivery Days" icon={Calendar}>
        <DaySelector selectedDays={selectedDays} onChange={setSelectedDays} />
      </Card>

      {/* Meal Slots */}
      <Card title="Meal Schedule" icon={Clock}>
        <MealSlotList meals={meals} onChange={setMeals} />
      </Card>

      {/* Preferences */}
      <Card title="Preferences" icon={Sliders}>
        <PreferenceInput preferences={preferences} onChange={setPreferences} />
      </Card>

      {/* Allergies */}
      <Card title="Allergies" icon={AlertTriangle}>
        <AllergyGrid allergies={allergies} onChange={setAllergies} />
      </Card>

      {/* Instructions */}
      <Card title="Special Instructions" icon={MessageSquare}>
        <textarea
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          placeholder={PLACEHOLDERS.instructions}
          rows={FORM_CONFIG.textareaRows.medium}
          className={INPUT_STYLES.textarea}
        />
      </Card>

      {/* Save Button */}
      <div className="sticky bottom-6">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className={BUTTON_STYLES.primary}
        >
          <Save size={ICON_SIZES.xl} />
          {isSaving ? BUTTON_LABELS.saving : BUTTON_LABELS.save}
        </button>
      </div>
    </div>
  );
};

export default ProfileTab;
