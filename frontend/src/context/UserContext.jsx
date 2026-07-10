import { createContext, useState, useCallback, useMemo, useEffect } from 'react';

const UserContext = createContext(null);

export const UserProvider = ({ children }) => {
  const savedUserId = localStorage.getItem('autonom_current_user');
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(savedUserId);
  const [activeSessionId, setActiveSessionId] = useState(null);

  // Sync currentUser when currentUserId or users change
  useEffect(() => {
    if (currentUserId && currentUserId !== 'create_new') {
      const user = users.find(u => u.user_id === currentUserId);
      setCurrentUser(user || null);
    }
  }, [currentUserId, users]);

  // Get user by ID
  const getUserById = useCallback((userId) => {
    return users.find(u => u.user_id === userId) || null;
  }, [users]);

  // Set current user by ID  
  const selectUser = useCallback((userId) => {
    if (userId === 'create_new') {
      const timestamp = Date.now();
      const newUserId = `user_${timestamp}`;
      setCurrentUserId(newUserId);
      setCurrentUser(null);
      localStorage.removeItem('autonom_current_user');
    } else {
      setCurrentUserId(userId);
      localStorage.setItem('autonom_current_user', userId);
    }
  }, []);

  // Update current user data
  const updateCurrentUser = useCallback((userData) => {
    setCurrentUser(prev => ({ ...prev, ...userData }));
  }, []);

  // Add or update user in the users list
  const upsertUser = useCallback((userData) => {
    setUsers(prevUsers => {
      const existingIndex = prevUsers.findIndex(u => u.user_id === userData.user_id);
      if (existingIndex >= 0) {
        const updatedUsers = [...prevUsers];
        updatedUsers[existingIndex] = userData;
        return updatedUsers;
      } else {
        return [...prevUsers, userData];
      }
    });
    // Note: currentUser will be synced by the useEffect that watches users and currentUserId
  }, []);

  // Helper functions to safely get user data
  const getUserPreferences = useCallback((userId = null) => {
    const user = userId ? users.find(u => u.user_id === userId) : currentUser;
    return user?.preferences || [];
  }, [users, currentUser]);

  const getUserAllergies = useCallback((userId = null) => {
    const user = userId ? users.find(u => u.user_id === userId) : currentUser;
    return user?.allergies || [];
  }, [users, currentUser]);

  const getUserSchedule = useCallback((userId = null) => {
    const user = userId ? users.find(u => u.user_id === userId) : currentUser;
    return user?.schedule || [];
  }, [users, currentUser]);

  const getUserInstructions = useCallback((userId = null) => {
    const user = userId ? users.find(u => u.user_id === userId) : currentUser;
    return user?.instructions || '';
  }, [users, currentUser]);

  const getUserMeals = useCallback((userId = null) => {
    const user = userId ? users.find(u => u.user_id === userId) : currentUser;
    return user?.meals || [];
  }, [users, currentUser]);

  // Get current user ID with fallback logic
  const getCurrentUserId = useCallback(() => {
    if (currentUserId && currentUserId !== 'create_new') {
      return currentUserId;
    }
    if (currentUser?.user_id) {
      return currentUser.user_id;
    }
    return null;
  }, [currentUserId, currentUser]);

  const value = useMemo(() => ({
    users,
    setUsers,
    currentUser,
    currentUserId,
    activeSessionId,
    setActiveSessionId,
    getUserById,
    selectUser,
    updateCurrentUser,
    upsertUser,
    getUserPreferences,
    getUserAllergies,
    getUserSchedule,
    getUserInstructions,
    getUserMeals,
    getCurrentUserId,
  }), [
    users,
    currentUser,
    currentUserId,
    activeSessionId,
    getUserById,
    selectUser,
    updateCurrentUser,
    upsertUser,
    getUserPreferences,
    getUserAllergies,
    getUserSchedule,
    getUserInstructions,
    getUserMeals,
    getCurrentUserId,
  ]);

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

export { UserContext };
