import React, { useState } from 'react';
import { Store, IndianRupee, ShoppingBag, Clock, Calendar, ChefHat, Bike, ShoppingCart, Users, Ticket, ChevronDown, ChevronUp } from 'lucide-react';
import PropTypes from 'prop-types';
import { getOrderBill, getFormattedCreateTime, getMealType } from '../../utils/sessionAccessors';

const OrderHistoryCard = ({ session }) => {
  const bill = getOrderBill(session);
  const createTime = getFormattedCreateTime(session);
  const mealType = getMealType(session);

  if (!bill || !bill.orders || bill.orders.length === 0) {
    return null; // Don't render if there's no valid billing data
  }

  const [isExpanded, setIsExpanded] = useState(false);

  const getModalityInfo = (modality) => {
    switch (modality) {
      case 'delivery': return { icon: Bike, color: 'text-orange-400', label: 'Delivery' };
      case 'cook': return { icon: ShoppingCart, color: 'text-green-400', label: 'Instamart' };
      case 'dineout': return { icon: Ticket, color: 'text-purple-400', label: 'Dineout' };
      default: return { icon: ChefHat, color: 'text-blue-400', label: 'Meal' };
    }
  };
  const modInfo = getModalityInfo(bill.orders[0]?.modality);

  return (
    <div className="bg-slate-800/80 rounded-xl border border-slate-700/50 shadow-md overflow-hidden mb-4 hover:border-slate-600 transition-colors">
      {/* Header: Date, Meal Type, and Grand Total */}
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full text-left bg-slate-700/30 hover:bg-slate-700/50 transition-colors px-5 py-4 border-b border-slate-700/50 flex justify-between items-center cursor-pointer"
      >
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 text-slate-300">
            <Calendar size={16} className="text-blue-400" />
            <span className="font-medium text-sm">{createTime}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-1.5 ${modInfo.color} bg-slate-800/50 px-2.5 py-1 rounded-md border border-slate-700/50`}>
              <modInfo.icon size={14} />
              <span className="text-xs font-bold uppercase tracking-wider">{modInfo.label}</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-400">
              <Clock size={14} />
              <span className="text-xs uppercase tracking-wider font-semibold">{mealType}</span>
            </div>
          </div>
        </div>
        
        {bill.grand_total !== undefined && (
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-end">
              <span className="text-xs text-slate-400 font-medium mb-0.5">Grand Total</span>
              <div className="flex items-center text-green-400 font-bold text-lg">
                <IndianRupee size={18} />
                <span>{bill.grand_total.toFixed(2)}</span>
              </div>
            </div>
            <div className="text-slate-500">
              {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </div>
          </div>
        )}
      </button>

      {/* Orders List */}
      {isExpanded && (
        <div className="p-5 space-y-4">
        {bill.orders.map((order, orderIndex) => (
          <div key={order.order_id || orderIndex} className="bg-slate-900/50 rounded-lg border border-slate-700/50 overflow-hidden">
            {/* Header logic based on modality */}
            <div className={`px-4 py-3 border-b border-slate-700/50 flex items-center gap-2 ${
              order.modality === 'delivery' ? 'bg-orange-500/10' :
              order.modality === 'cook' ? 'bg-green-500/10' :
              order.modality === 'dineout' ? 'bg-purple-500/10' : 'bg-slate-800/80'
            }`}>
              {order.modality === 'delivery' && <Bike className="text-orange-400" size={18} />}
              {order.modality === 'cook' && <ShoppingCart className="text-green-400" size={18} />}
              {order.modality === 'dineout' && <Ticket className="text-purple-400" size={18} />}
              
              <div className="flex flex-col">
                <span className="font-semibold text-slate-200 text-sm">
                  {order.modality === 'cook' && order.recipe_name ? order.recipe_name : order.restaurant_name}
                </span>
                {order.modality === 'cook' && order.recipe_name && (
                  <span className="text-xs text-slate-400 flex items-center gap-1"><Store size={10}/> {order.restaurant_name}</span>
                )}
              </div>

              {/* Modality specific badges right side */}
              {order.modality === 'dineout' && (
                <div className="ml-auto flex items-center gap-3 text-xs font-medium text-purple-300 bg-purple-500/20 px-3 py-1 rounded-full border border-purple-500/20">
                  <span className="flex items-center gap-1"><Calendar size={12}/> {order.time_slot || 'TBD'}</span>
                  <span className="flex items-center gap-1"><Users size={12}/> {order.party_size || 2}</span>
                </div>
              )}
            </div>

            {/* Items */}
            <div className="p-3 space-y-2">
              {order.items && order.items.map((item, itemIndex) => (
                <div key={itemIndex} className="flex items-start justify-between text-sm">
                  <div className="flex-1 pr-4">
                    <div className="flex items-center gap-2">
                      <ShoppingBag className="text-blue-400" size={14} />
                      <span className="text-slate-300">{item.name}</span>
                      {item.quantity > 1 && (
                        <span className="text-xs px-1.5 py-0.5 bg-slate-700 text-slate-300 rounded font-medium">
                          x{item.quantity}
                        </span>
                      )}
                    </div>
                    {item.customizations && (
                      <div className="mt-0.5 ml-5 text-xs text-slate-500 italic">
                        {item.customizations}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center text-slate-300 font-medium">
                    <IndianRupee size={14} className="text-slate-500" />
                    <span>{item.price.toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      )}
    </div>
  );
};

OrderHistoryCard.propTypes = {
  session: PropTypes.object.isRequired,
};

export default OrderHistoryCard;
