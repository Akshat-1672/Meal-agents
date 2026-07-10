import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import PropTypes from 'prop-types';
import { useToast } from '../../hooks/useToast';

const Toast = ({ id, message, type }) => {
  const { removeToast } = useToast();

  const variants = {
    success: {
      icon: CheckCircle2,
      bgColor: 'bg-gradient-to-r from-emerald-500 to-green-500',
      iconColor: 'text-emerald-100',
      textColor: 'text-white',
      borderColor: 'border-emerald-400',
      shadowColor: 'shadow-emerald-500/30'
    },
    error: {
      icon: XCircle,
      bgColor: 'bg-gradient-to-r from-red-500 to-rose-500',
      iconColor: 'text-red-100',
      textColor: 'text-white',
      borderColor: 'border-red-400',
      shadowColor: 'shadow-red-500/30'
    },
    warning: {
      icon: AlertTriangle,
      bgColor: 'bg-gradient-to-r from-amber-500 to-orange-500',
      iconColor: 'text-amber-100',
      textColor: 'text-white',
      borderColor: 'border-amber-400',
      shadowColor: 'shadow-amber-500/30'
    },
    info: {
      icon: Info,
      bgColor: 'bg-gradient-to-r from-blue-500 to-cyan-500',
      iconColor: 'text-blue-100',
      textColor: 'text-white',
      borderColor: 'border-blue-400',
      shadowColor: 'shadow-blue-500/30'
    }
  };

  const variant = variants[type] || variants.info;
  const Icon = variant.icon;

  const handleClose = () => {
    removeToast(id);
  };

  return (
    <div
      className={`flex items-center gap-3 min-w-[320px] max-w-md p-4 rounded-xl border ${variant.bgColor} ${variant.borderColor} ${variant.shadowColor} shadow-lg backdrop-blur-sm animate-slide-in-right`}
    >
      <div className={`shrink-0 ${variant.iconColor}`}>
        <Icon size={24} />
      </div>
      <p className={`flex-1 text-sm font-medium ${variant.textColor}`}>
        {message}
      </p>
      <button
        onClick={handleClose}
        className={`shrink-0 ${variant.iconColor} hover:opacity-75 transition-opacity`}
        aria-label="Close"
      >
        <X size={18} />
      </button>
    </div>
  );
};

Toast.propTypes = {
  id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  message: PropTypes.string.isRequired,
  type: PropTypes.oneOf(['success', 'error', 'warning', 'info']).isRequired,
};

export default Toast;
