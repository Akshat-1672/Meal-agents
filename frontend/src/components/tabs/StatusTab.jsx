import { useContext } from "react";
import { Info, PartyPopper } from "lucide-react";
import { useUser } from "../../hooks/useUser";
import { useAutoNom } from "../../hooks/useAutoNom";
import { useToast } from "../../hooks/useToast";
import { SessionContext } from "../../context/SessionContext";
import { useStatusStore } from "../../stores/statusStore";
import {
  getMealChoiceVerificationMessage,
  getMealChoices,
} from "../../utils/sessionAccessors";
import { createLogger } from "../../utils/logger";
import {
  INFO_MESSAGES,
  MODAL_SIZES,
  MODAL_HEIGHTS,
  ICON_SIZES,
} from "../../utils/uiConstants";
import Card from "../common/Card";
import StatusCard from "../status/StatusCard";

const logger = createLogger("StatusTab");
import SelectionModal from "../status/SelectionModal";
import SessionHistory from "../status/SessionHistory";
import OrderConfirmationCard from "../status/OrderConfirmationCard";

const StatusTab = () => {
  const { getCurrentUserId, activeSessionId } = useUser();
  const toast = useToast();
  const sessionContext = useContext(SessionContext);
  const { submitUserResponse } = useAutoNom();

  // Read all state from Zustand store (no polling logic here)
  const {
    statusTitle,
    statusSubtitle,
    isActive,
    showModal,
    modalMessage,
    modalMealChoices,
    showCelebration,
    celebrationMessage,
    sessionHistory,
    selectedSessionForChat,
    currentSessionState,
    currentWorkflowStatus,
    setModalMessage,
    setModalMealChoices,
    setShowModal,
    setShowCelebration,
    setSelectedSessionForChat,
    closeModal,
    markFeedbackReceived,
  } = useStatusStore();

  const handleChatClick = (session) => {
    const message = getMealChoiceVerificationMessage(session);
    const mealChoices = getMealChoices(session);
    if (message) {
      setSelectedSessionForChat(session);
      setModalMessage(message);
      setModalMealChoices(mealChoices);
      setShowModal(true);
    }
  };

  const handleModalSubmit = (response) => {
    const userId = getCurrentUserId();

    // Use selected session from history if available, otherwise use active session
    const sessionId = selectedSessionForChat?.session_id || activeSessionId;

    if (!userId || !sessionId) {
      toast.error("Session information not available");
      return;
    }

    // Close modal and mark this message as responded to
    markFeedbackReceived(modalMessage);

    // Submit in the background
    submitUserResponse(userId, sessionId, response)
      .then(() => {
        logger.log("User response submitted successfully");

        // Resume polling via SessionProvider
        if (sessionContext?.resumePollingAfterFeedback) {
          sessionContext.resumePollingAfterFeedback(sessionId);
        }
      })
      .catch((error) => {
        logger.error("Error submitting response:", error);
        toast.error("Failed to submit response. Please try again.");
      });
  };

  const handleModalClose = () => {
    closeModal();
  };

  return (
    <div className="space-y-6">
      {/* Status Card */}
      <StatusCard
        title={statusTitle}
        subtitle={statusSubtitle}
        isActive={isActive}
        sessionState={currentSessionState}
        workflowStatus={currentWorkflowStatus}
      />

      {/* Info Message */}
      {!currentSessionState && (
        <Card variant="info" className="flex items-start gap-3">
          <Info className="text-blue-400 mt-1" size={ICON_SIZES.xl} />
          <div className="text-sm text-blue-200">
            {INFO_MESSAGES.noActivity}
          </div>
        </Card>
      )}

      {/* Session History */}
      <SessionHistory
        sessions={sessionHistory}
        currentSessionId={activeSessionId}
        onChatClick={handleChatClick}
      />

      {/* Selection Modal */}
      <SelectionModal
        isOpen={showModal}
        onClose={handleModalClose}
        message={modalMessage}
        mealChoices={modalMealChoices}
        onSubmit={handleModalSubmit}
      />

      {/* Celebration Overlay */}
      {showCelebration && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
          <div
            className={`bg-linear-to-br from-green-600 to-green-700 border border-green-500 rounded-2xl ${MODAL_SIZES.medium} w-full mx-4 p-8 shadow-2xl transform celebration-bounce ${MODAL_HEIGHTS.tall} overflow-y-auto`}
          >
            <div className="text-center text-white">
              <PartyPopper className="mx-auto mb-6 animate-bounce" size={64} />
              <h3 className="text-3xl font-bold text-white mb-2">
                Order Confirmed! 🎉
              </h3>
              <p className="text-green-100 text-sm">
                Your order has been successfully placed
              </p>
            </div>

            <OrderConfirmationCard orderData={celebrationMessage} />

            <button
              onClick={() => setShowCelebration(false)}
              className="mt-6 w-full bg-white text-green-700 font-bold px-6 py-3 rounded-lg hover:bg-green-50 transition-colors"
            >
              👍 Awesome!
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default StatusTab;
