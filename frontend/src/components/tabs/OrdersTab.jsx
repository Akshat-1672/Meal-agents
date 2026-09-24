import React, { useState, useMemo } from 'react';
import { useUser } from '../../hooks/useUser';
import { useStatusStore } from '../../stores/statusStore';
import { ShoppingBag, SearchX, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import OrderHistoryCard from '../orders/OrderHistoryCard';
import { WORKFLOW_STATUS } from '../../utils/constants';
import { getWorkflowStatus, getOrderBill } from '../../utils/sessionAccessors';
import { INPUT_STYLES, BUTTON_STYLES } from '../../utils/styleClasses';

const ITEMS_PER_PAGE = 5;

const OrdersTab = () => {
  const { currentUser } = useUser();
  const { sessionHistory } = useStatusStore();
  
  const [filter, setFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  if (!currentUser) {
    return (
      <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-8 text-center mt-8">
        <ShoppingBag className="mx-auto text-slate-500 mb-4" size={48} />
        <h2 className="text-xl font-bold text-slate-300 mb-2">No Active User</h2>
        <p className="text-slate-400">Please select a user to view order history.</p>
      </div>
    );
  }

  // Filter only completed orders that have valid billing data
  const completedOrders = sessionHistory.filter(
    session => {
      if (getWorkflowStatus(session) !== WORKFLOW_STATUS.ORDER_CONFIRMED) return false;
      const bill = getOrderBill(session);
      return bill && bill.orders && bill.orders.length > 0;
    }
  );

  if (completedOrders.length === 0) {
    return (
      <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-10 text-center mt-8">
        <SearchX className="mx-auto text-slate-500 mb-4" size={48} />
        <h2 className="text-xl font-bold text-slate-300 mb-2">No Order History</h2>
        <p className="text-slate-400">You haven't placed any successful orders yet.</p>
      </div>
    );
  }

  // Memoize filtered and paginated orders
  const filteredOrders = useMemo(() => {
    let filtered = completedOrders;
    if (filter !== 'all') {
      filtered = completedOrders.filter(session => {
        const bill = getOrderBill(session);
        const modality = bill?.orders?.[0]?.modality?.toLowerCase();
        return modality === filter;
      });
    }
    return filtered;
  }, [completedOrders, filter]);

  const totalPages = Math.ceil(filteredOrders.length / ITEMS_PER_PAGE) || 1;
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedOrders = filteredOrders.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  // Handle page out of bounds when filtering
  React.useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(1);
  }, [filter, totalPages]);

  return (
    <div className="flex flex-col min-h-[600px] h-full space-y-6 pb-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-green-500/20 p-2 rounded-lg">
            <ShoppingBag className="text-green-400" size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Order History</h2>
            <p className="text-sm text-slate-400">Your past successful meal orders</p>
          </div>
        </div>

        {/* Filter Dropdown */}
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-slate-400" />
          <select 
            value={filter}
            onChange={(e) => {
              setFilter(e.target.value);
              setCurrentPage(1);
            }}
            className={`${INPUT_STYLES.compact} w-auto`}
          >
            <option value="all">All Modalities</option>
            <option value="delivery">Delivery</option>
            <option value="cook">Instamart (Cook)</option>
            <option value="dineout">Dineout</option>
          </select>
        </div>
      </div>

      {filteredOrders.length === 0 ? (
        <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-8 text-center">
          <SearchX className="mx-auto text-slate-500 mb-4" size={32} />
          <p className="text-slate-400">No orders match the selected filter.</p>
        </div>
      ) : (
        <div className="space-y-4 flex-1">
          {paginatedOrders.map((session) => (
            <OrderHistoryCard key={session.session_id} session={session} />
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="mt-auto flex items-center justify-between bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
          <span className="text-sm text-slate-400">
            Showing <span className="text-white font-medium">{startIndex + 1}</span> to <span className="text-white font-medium">{Math.min(startIndex + ITEMS_PER_PAGE, filteredOrders.length)}</span> of <span className="text-white font-medium">{filteredOrders.length}</span> results
          </span>
          <div className="flex items-center gap-2">
            <button 
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              className={`p-1.5 rounded-md ${currentPage === 1 ? 'text-slate-600 bg-slate-800' : 'text-slate-300 bg-slate-700 hover:bg-slate-600'} transition-colors`}
            >
              <ChevronLeft size={18} />
            </button>
            <span className="text-sm font-medium text-slate-300 px-2">
              {currentPage} / {totalPages}
            </span>
            <button 
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              className={`p-1.5 rounded-md ${currentPage === totalPages ? 'text-slate-600 bg-slate-800' : 'text-slate-300 bg-slate-700 hover:bg-slate-600'} transition-colors`}
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrdersTab;
