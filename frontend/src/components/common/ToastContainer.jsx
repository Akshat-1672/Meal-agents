import Toast from './Toast';
import { useToast } from '../../hooks/useToast';

const ToastContainer = () => {
  const { toasts } = useToast();

  return (
    <div className="fixed top-20 right-4 z-[100] flex flex-col gap-3 pointer-events-none">
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <Toast
            id={toast.id}
            message={toast.message}
            type={toast.type}
          />
        </div>
      ))}
    </div>
  );
};

export default ToastContainer;
