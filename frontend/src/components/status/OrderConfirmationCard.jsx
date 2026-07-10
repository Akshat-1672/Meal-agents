import { Store, DollarSign, ShoppingBag, CheckCircle2 } from 'lucide-react';
import PropTypes from 'prop-types';

const OrderConfirmationCard = ({ orderData }) => {
  // orderData is now the bill object with orders array, message, and grand_total
  const bill = orderData;

  return (
    <div className="space-y-4">
      {/* Message */}
      {bill?.message && (
        <div className="bg-white/10 rounded-lg p-4 border border-white/20 backdrop-blur-sm">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="text-white" size={20} />
            <span className="font-semibold text-white">Order Status</span>
          </div>
          <p className="text-white text-base leading-relaxed">{bill.message}</p>
        </div>
      )}

      {/* Bill Details - Loop through orders array */}
      {bill?.orders && bill.orders.length > 0 && (
        <div className="space-y-4">
          {bill.orders.map((order, orderIndex) => (
            <div key={order.order_id || orderIndex} className="bg-white/10 rounded-lg border border-white/20 backdrop-blur-sm overflow-hidden">
              {/* Restaurant Header */}
              <div className="bg-white/5 px-4 py-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <Store className="text-white" size={18} />
                  <span className="font-bold text-white text-lg">{order.restaurant_name}</span>
                </div>
              </div>

              {/* Order Items */}
              <div className="p-4 space-y-3">
                {order.items && order.items.map((item, itemIndex) => (
                  <div key={itemIndex} className="space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <ShoppingBag className="text-green-200" size={16} />
                          <span className="font-semibold text-white">{item.name}</span>
                          {item.quantity > 1 && (
                            <span className="text-xs px-2 py-0.5 bg-white/20 text-white rounded-full">
                              x{item.quantity}
                            </span>
                          )}
                        </div>
                        {item.customizations && (
                          <div className="mt-1 ml-6 text-xs text-green-200/80 italic">
                            {item.customizations}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-white font-bold">
                        <DollarSign size={16} />
                        <span>{item.price.toFixed(2)}</span>
                      </div>
                    </div>
                    {itemIndex < order.items.length - 1 && (
                      <div className="border-b border-white/10"></div>
                    )}
                  </div>
                ))}
              </div>

              {/* Subtotal for this order */}
              <div className="bg-white/5 px-4 py-3 border-t border-white/10">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-white">Subtotal</span>
                  <div className="flex items-center gap-1 text-white font-semibold">
                    <DollarSign size={16} />
                    <span>{order.sub_total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Grand Total */}
          {bill.grand_total !== undefined && (
            <div className="bg-linear-to-r from-green-500/20 to-emerald-500/20 rounded-lg border border-green-400/30 backdrop-blur-sm p-4">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-xl">Grand Total</span>
                <div className="flex items-center gap-1 text-white font-bold text-2xl">
                  <DollarSign size={24} />
                  <span>{bill.grand_total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

OrderConfirmationCard.propTypes = {
  orderData: PropTypes.object.isRequired,
};

export default OrderConfirmationCard;
