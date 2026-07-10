import { create } from 'zustand';
import { getWorkflowStatus } from '../utils/sessionAccessors';

export const useStatusStore = create((set, get) => ({
  // Status display
  statusTitle: 'No Active Session',
  statusSubtitle: 'Start a meal plan from the Meals tab',
  isActive: false,
  
  // Current session state
  currentSessionState: null,
  currentWorkflowStatus: null,
  
  // Modal state
  showModal: false,
  modalMessage: '',
  modalMealChoices: [],
  
  // Celebration state
  showCelebration: false,
  celebrationMessage: '',
  celebrationShownForSession: null,
  
  // Session history
  sessionHistory: [],
  selectedSessionForChat: null,
  
  // User feedback tracking
  userFeedbackReceived: false,
  
  // Actions
  setStatusTitle: (title) => set({ statusTitle: title }),
  setStatusSubtitle: (subtitle) => set({ statusSubtitle: subtitle }),
  setIsActive: (active) => set({ isActive: active }),
  
  setCurrentSessionState: (sessionState) => set({ 
    currentSessionState: sessionState,
    currentWorkflowStatus: getWorkflowStatus(sessionState)
  }),
  
  setShowModal: (show) => set({ showModal: show }),
  setModalMessage: (message) => set({ modalMessage: message }),
  setModalMealChoices: (choices) => set({ modalMealChoices: choices }),
  
  setShowCelebration: (show) => set({ showCelebration: show }),
  setCelebrationMessage: (message) => set({ celebrationMessage: message }),
  setCelebrationShownForSession: (sessionId) => set({ celebrationShownForSession: sessionId }),
  
  setSessionHistory: (history) => set({ sessionHistory: history }),
  setSelectedSessionForChat: (session) => set({ selectedSessionForChat: session }),
  
  setUserFeedbackReceived: (received) => set({ userFeedbackReceived: received }),
  
  // Combined actions
  showApprovalModal: (message) => set({
    statusTitle: 'Awaiting Your Approval',
    statusSubtitle: 'The agent needs your input to continue',
    isActive: true,
    modalMessage: message,
    showModal: true
  }),
  
  closeModal: () => set({
    showModal: false,
    selectedSessionForChat: null,
    modalMealChoices: []
  }),
  
  markFeedbackReceived: (message) => set({
    userFeedbackReceived: true,
    showModal: false,
    selectedSessionForChat: null,
    modalMealChoices: [],
    statusTitle: 'Processing Your Response',
    statusSubtitle: 'The agent is continuing with your selection...',
    isActive: true
  }),
  
  showOrderConfirmation: (sessionId, message) => {
    const state = get();
    if (state.celebrationShownForSession !== sessionId) {
      set({
        statusTitle: 'Order Confirmed! 🎉',
        statusSubtitle: 'Your meal has been successfully ordered',
        isActive: false,
        celebrationMessage: message,
        showCelebration: true,
        celebrationShownForSession: sessionId
      });
    }
  },
  
  resetForNewSession: () => set({
    userFeedbackReceived: false,
    currentSessionState: null,
    currentWorkflowStatus: null
  }),
  
  updateStatus: (title, subtitle, active) => set({
    statusTitle: title,
    statusSubtitle: subtitle,
    isActive: active
  })
}));
