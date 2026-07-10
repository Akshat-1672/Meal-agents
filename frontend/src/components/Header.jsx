import { useEffect } from 'react';
import { User, Plus } from 'lucide-react';
import { useUser } from '../hooks/useUser';
import { useAutoNom } from '../hooks/useAutoNom';

const Header = () => {
  const { users, setUsers, currentUserId, selectUser } = useUser();
  const { fetchUsers } = useAutoNom();

  useEffect(() => {
    const loadUsers = async () => {
      const fetchedUsers = await fetchUsers();
      setUsers(fetchedUsers);

      // Load the saved user if it exists
      const savedUserId = localStorage.getItem('autonom_current_user');
      if (savedUserId && fetchedUsers.find(u => u.user_id === savedUserId)) {
        selectUser(savedUserId);
      } else if (fetchedUsers.length > 0) {
        selectUser(fetchedUsers[0].user_id);
      }
    };

    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  const handleUserChange = (e) => {
    const userId = e.target.value;
    selectUser(userId);
  };

  const handleCreateNew = () => {
    selectUser('create_new');
  };

  return (
    <header className="fixed top-0 w-full bg-slate-900/80 backdrop-blur-md border-b border-slate-800 z-50">
      <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-tr from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
            <User className="text-white" size={20} />
          </div>
          <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400 hidden sm:block">
            Auto-Nom
          </h1>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg blur opacity-30 group-hover:opacity-75 transition duration-200"></div>
            <select 
              value={currentUserId || ''} 
              onChange={handleUserChange}
              className="relative bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-48 p-2.5 outline-none cursor-pointer"
            >
              <option value="">Select User</option>
              {users.map((user) => (
                <option key={user.user_id} value={user.user_id}>
                  {user.name}
                </option>
              ))}
              <option value="create_new">+ Create New User</option>
            </select>
          </div>
          <button
            onClick={handleCreateNew}
            className="bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-200 p-2.5 rounded-lg transition-colors"
            title="Create New User"
          >
            <Plus size={16} />
          </button>
          <div className="text-xs font-mono text-slate-500 hidden sm:block">v0.1.0</div>
        </div>
      </div>
    </header>
  );
};

export default Header;
