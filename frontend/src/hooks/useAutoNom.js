import { useState, useCallback } from 'react';
import axios from 'axios';
import { createLogger } from '../utils/logger';
import { transformAPIUserToFrontend, transformFrontendUserToAPI } from '../utils/userTransformers';
import { useLoadingState } from './useLoadingState';

const logger = createLogger('useAutoNom');

export const useAutoNom = () => {
  const { isLoading: isProcessing, setIsLoading: setIsProcessing } = useLoadingState();
  const [eventLog, setEventLog] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);

  // Fetch all users
  const fetchUsers = useCallback(async () => {
    try {
      const response = await axios.get('/api/users');
      // Transform API format to frontend format
      const users = response.data.map(transformAPIUserToFrontend);
      return users;
    } catch (error) {
      logger.error('Error fetching users:', error);
      return [];
    }
  }, []);

  // Save user profile
  const saveUserToAPI = useCallback(async (userData) => {
    try {
      // Transform frontend format to API format
      const apiData = transformFrontendUserToAPI(userData);
      const response = await axios.post('/api/users', apiData);
      // Transform response back to frontend format
      return transformAPIUserToFrontend(response.data);
    } catch (error) {
      logger.error('Error saving user:', error);
      throw error;
    }
  }, []);

  // Fetch all sessions for a user
  const fetchUserSessions = useCallback(async (userId) => {
    try {
      const response = await axios.get(`/api/users/${userId}/sessions`);
      return response.data;
    } catch (error) {
      logger.error('Error fetching user sessions:', error);
      return null;
    }
  }, []);

  // Fetch active sessions for a user
  const fetchActiveSessionsForUser = useCallback(async (userId) => {
    try {
      const response = await axios.get(`/api/users/${userId}/active-sessions`);
      return response.data;
    } catch (error) {
      logger.error('Error fetching active sessions:', error);
      return null;
    }
  }, []);

  // Fetch session state
  const fetchSessionState = useCallback(async (userId, sessionId) => {
    try {
      const response = await axios.get(`/api/users/${userId}/active-sessions/${sessionId}/state`);
      return response.data;
    } catch (error) {
      logger.error('Error fetching session state:', error);
      return null;
    }
  }, []);

  // Submit user response to approval
  const submitUserResponse = useCallback(async (userId, sessionId, userResponse) => {
    try {
      logger.log('Submitting user response:', { userId, sessionId, userResponse });
      const response = await axios.post(
        `/api/sessions/${sessionId}/resume?streaming=false`,
        { choice: userResponse }
      );
      
      logger.log('Resume response:', response.data);
      
      if (response.data) {
        // Add event to log
        const eventData = {
          type: 'UserResponseSubmitted',
          session_id: response.data.session_id,
          workflow_status: response.data.workflow_status,
          user_id: response.data.user_id,
          user_choice: response.data.user_choice,
          timestamp: new Date().toLocaleTimeString('en-US', {
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          })
        };
        
        setEventLog(prev => [...prev, eventData]);
      }
      
      return response.data;
    } catch (error) {
      logger.error('Error submitting user response:', error);
      throw error;
    }
  }, []);

  // Trigger plan with non-streaming API
  const triggerPlan = useCallback(async (userId, mealType, mockDay, onEvent, onComplete, onError) => {
    setIsProcessing(true);
    setEventLog([]);
    
    try {
      logger.log('Triggering plan:', { userId, mealType, mockDay });
      
      // Build URL with optional mock_day query parameter
      let url = `/api/users/${userId}/meals/${mealType}/trigger?streaming=false`;
      if (mockDay) {
        url += `&mock_day=${encodeURIComponent(mockDay)}`;
      }
      
      const response = await axios.post(url);

      logger.log('Trigger response:', response.data);

      if (response.data) {
        const { session_id, workflow_status } = response.data;
        
        logger.log('Setting session ID:', session_id);
        
        // Store session ID
        if (session_id) {
          setCurrentSessionId(session_id);
          logger.log('Session ID set to:', session_id);
        }

        // Add event to log
        const eventData = {
          type: 'WorkflowStarted',
          session_id,
          workflow_status,
          user_id: userId,
          meal_type: mealType,
          timestamp: new Date().toLocaleTimeString('en-US', {
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          })
        };

        setEventLog(prev => [...prev, eventData]);

        // Call the event handler
        if (onEvent) onEvent(eventData);
        
        setIsProcessing(false);
        if (onComplete) onComplete(response.data);
      }
    } catch (error) {
      logger.error('Error in triggerPlan:', error);
      setIsProcessing(false);
      if (onError) onError(error);
    }
  }, [setIsProcessing]);

  return {
    isProcessing,
    eventLog,
    currentSessionId,
    fetchUsers,
    saveUserToAPI,
    fetchUserSessions,
    fetchActiveSessionsForUser,
    fetchSessionState,
    submitUserResponse,
    triggerPlan,
    setEventLog,
    setCurrentSessionId
  };
};
