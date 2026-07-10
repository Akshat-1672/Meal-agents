/**
 * User data transformation utilities
 * Handles conversion between API format and frontend format
 */

/**
 * Converts API user format to frontend format
 * @param {Object} apiUser - User data from API
 * @returns {Object|null} User data in frontend format
 */
export const transformAPIUserToFrontend = (apiUser) => {
  if (!apiUser) return null;
  
  // Convert days array to boolean array [Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday]
  // API format uses full day names: "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"
  // Support both new format (apiUser.days) and legacy format (apiUser.schedule.days)
  // For backwards compatibility with old data, support abbreviated formats
  const scheduleBooleans = [false, false, false, false, false, false, false];
  
  // Get days from either the new direct property or legacy schedule object
  const daysArray = apiUser.days || apiUser.schedule?.days || [];
  
  if (Array.isArray(daysArray) && daysArray.length > 0) {
    // Map day names/abbreviations to indices (Monday=0, Sunday=6)
    const dayMap = { 
      'monday': 0,
      'tuesday': 1,
      'wednesday': 2,
      'thursday': 3,
      'friday': 4,
      'saturday': 5,
      'sunday': 6,
      // Legacy abbreviations for backward compatibility
      'm': 0,
      'tu': 1,
      'w': 2,
      'th': 3,
      'f': 4,
      'sa': 5,
      'su': 6
    };
    
    // Track ambiguous 't' values for backward compatibility with old database data
    const ambiguousTCount = daysArray.filter(d => d.toLowerCase().trim() === 't').length;
    let tProcessed = 0;
    
    daysArray.forEach((day) => {
      const dayLower = day.toLowerCase().trim();
      let index = dayMap[dayLower];
      
      // Handle legacy ambiguous format: 't' could be Tuesday or Thursday
      // If multiple 't' values exist, treat first as Tuesday, second as Thursday
      if (dayLower === 't') {
        if (ambiguousTCount > 1 && tProcessed === 0) {
          index = 1; // First 't' = Tuesday
        } else if (ambiguousTCount > 1 && tProcessed === 1) {
          index = 3; // Second 't' = Thursday
        } else {
          index = 1; // Single 't' = Tuesday (default)
        }
        tProcessed++;
      }
      // Handle legacy ambiguous format: 's' could be Saturday or Sunday
      else if (dayLower === 's') {
        index = 5; // Default 's' to Saturday
      }
      
      if (index !== undefined) {
        scheduleBooleans[index] = true;
      }
    });
  }
  
  // Convert meals and ensure each has an id
  // Support both new format (apiUser.meals) and legacy format (apiUser.schedule.meals)
  const mealsData = apiUser.meals || apiUser.schedule?.meals || [];
  const meals = mealsData.map((meal, index) => ({
    ...meal,
    id: meal.id || `meal_${apiUser.id}_${index}_${Date.now()}`
  }));
  
  return {
    user_id: apiUser.id,
    name: apiUser.name,
    preferences: apiUser.preferences || [],
    allergies: apiUser.allergies || [],
    schedule: scheduleBooleans,
    meals: meals,
    instructions: apiUser.special_instructions || ''
  };
};

/**
 * Converts frontend user format to API format
 * @param {Object} frontendUser - User data from frontend
 * @returns {Object|null} User data in API format
 */
export const transformFrontendUserToAPI = (frontendUser) => {
  if (!frontendUser) return null;
  
  // Convert boolean array to full day names
  // Frontend: [Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday]
  // API: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
  const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const selectedDays = [];
  frontendUser.schedule.forEach((isSelected, index) => {
    if (isSelected) {
      selectedDays.push(dayNames[index]);
    }
  });
  
  return {
    id: frontendUser.user_id,
    name: frontendUser.name,
    preferences: frontendUser.preferences || [],
    allergies: frontendUser.allergies || [],
    days: selectedDays,
    meals: frontendUser.meals || [],
    special_instructions: frontendUser.instructions || ''
  };
};
