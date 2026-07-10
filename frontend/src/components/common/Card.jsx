import PropTypes from 'prop-types';
import { CARD_STYLES, HEADER_STYLES } from '../../utils/styleClasses';

/**
 * Reusable Card component with optional header
 * Provides consistent card styling across the application
 */
const Card = ({ 
  children, 
  title, 
  icon: Icon, 
  variant = 'base',
  headerActions,
  className = '',
  ...props 
}) => {
  return (
    <section className={`${CARD_STYLES[variant]} ${className}`} {...props}>
      {title && (
        <div className={headerActions ? 'flex justify-between items-center mb-4' : ''}>
          <h2 className={HEADER_STYLES.section}>
            {Icon && <Icon className={HEADER_STYLES.iconWrapper} size={20} />}
            {title}
          </h2>
          {headerActions && <div>{headerActions}</div>}
        </div>
      )}
      {children}
    </section>
  );
};

Card.propTypes = {
  children: PropTypes.node.isRequired,
  title: PropTypes.string,
  icon: PropTypes.elementType,
  variant: PropTypes.oneOf(['base', 'compact', 'interactive', 'inner', 'info', 'warning', 'success', 'error']),
  headerActions: PropTypes.node,
  className: PropTypes.string,
};

export default Card;
