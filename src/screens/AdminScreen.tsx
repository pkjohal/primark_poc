// Admin screen for user and store management

import { useState, useEffect } from 'react';
import { Users as UsersIcon, Building2, Plus, Edit, Power } from 'lucide-react';
import NavBar from '@/components/layout/NavBar';
import BottomNav from '@/components/layout/BottomNav';
import PageHeader from '@/components/layout/PageHeader';
import Button from '@/components/ui/Button';
import { supabase } from '@/lib/supabase';
import { Store, TeamMember } from '@/lib/types';
import { formatDate } from '@/lib/utils';

type Tab = 'users' | 'stores';

export default function AdminScreen() {
  const [activeTab, setActiveTab] = useState<Tab>('users');
  const [users, setUsers] = useState<TeamMember[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers();
    } else {
      fetchStores();
    }
  }, [activeTab]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('team_members')
        .select('*, store:stores(store_name)')
        .order('full_name');

      if (error) throw error;
      setUsers(data || []);
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStores = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('stores')
        .select('*, team_members(count)')
        .order('store_name');

      if (error) throw error;
      setStores(data || []);
    } catch (err) {
      console.error('Error fetching stores:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = () => {
    // TODO: Implement user modal
    console.log('Add user');
  };

  const handleEditUser = (user: TeamMember) => {
    // TODO: Implement edit user modal
    console.log('Edit user:', user);
  };

  const handleAddStore = () => {
    // TODO: Implement store modal
    console.log('Add store');
  };

  const handleEditStore = (store: Store) => {
    // TODO: Implement edit store modal
    console.log('Edit store:', store);
  };

  return (
    <div className="min-h-screen flex flex-col bg-primark-light-grey pb-20">
      <NavBar />
      <PageHeader title="Admin Panel" subtitle="User and store management" />

      <div className="flex-1 max-w-7xl mx-auto w-full p-4">
        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('users')}
            className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${
              activeTab === 'users'
                ? 'bg-primark-blue text-white'
                : 'bg-white text-primark-grey hover:bg-primark-light-blue'
            }`}
          >
            <UsersIcon size={20} className="inline mr-2" />
            Users
          </button>
          <button
            onClick={() => setActiveTab('stores')}
            className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${
              activeTab === 'stores'
                ? 'bg-primark-blue text-white'
                : 'bg-white text-primark-grey hover:bg-primark-light-blue'
            }`}
          >
            <Building2 size={20} className="inline mr-2" />
            Stores
          </button>
        </div>

        {/* Content */}
        {activeTab === 'users' ? (
          <UsersTab
            users={users}
            loading={loading}
            onAdd={handleAddUser}
            onEdit={handleEditUser}
            onRefresh={fetchUsers}
          />
        ) : (
          <StoresTab
            stores={stores}
            loading={loading}
            onAdd={handleAddStore}
            onEdit={handleEditStore}
            onRefresh={fetchStores}
          />
        )}
      </div>

      <BottomNav />
    </div>
  );
}

// Users Tab Component (placeholder for now)
function UsersTab({
  users,
  loading,
  onAdd,
  onEdit,
}: {
  users: TeamMember[];
  loading: boolean;
  onAdd: () => void;
  onEdit: (user: TeamMember) => void;
  onRefresh: () => void;
}) {
  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-primark-navy">Team Members</h2>
        <Button onClick={onAdd} className="inline-flex items-center gap-2">
          <Plus size={20} />
          Add User
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="w-12 h-12 border-4 border-primark-blue/30 border-t-primark-blue rounded-full animate-spin mx-auto" />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-primark-grey/20">
                <th className="text-left py-3 px-2 text-sm font-semibold text-primark-navy">Name</th>
                <th className="text-left py-3 px-2 text-sm font-semibold text-primark-navy">Store</th>
                <th className="text-left py-3 px-2 text-sm font-semibold text-primark-navy">Role</th>
                <th className="text-left py-3 px-2 text-sm font-semibold text-primark-navy">Status</th>
                <th className="text-left py-3 px-2 text-sm font-semibold text-primark-navy">Created</th>
                <th className="text-right py-3 px-2 text-sm font-semibold text-primark-navy">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-primark-grey/10">
                  <td className="py-3 px-2 text-sm text-primark-navy">{user.full_name}</td>
                  <td className="py-3 px-2 text-sm text-primark-grey">
                    {(user as any).store?.store_name || 'Unknown'}
                  </td>
                  <td className="py-3 px-2 text-sm">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primark-light-blue text-primark-blue capitalize">
                      {user.role.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-3 px-2 text-sm">
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        user.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {user.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="py-3 px-2 text-sm text-primark-grey">
                    {formatDate(user.created_at)}
                  </td>
                  <td className="py-3 px-2 text-right">
                    <button
                      onClick={() => onEdit(user)}
                      className="text-primark-blue hover:text-primark-navy mr-3"
                    >
                      <Edit size={18} />
                    </button>
                    <button className="text-primark-grey hover:text-primark-navy">
                      <Power size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// Stores Tab Component (placeholder for now)
function StoresTab({
  stores,
  loading,
  onAdd,
  onEdit,
}: {
  stores: Store[];
  loading: boolean;
  onAdd: () => void;
  onEdit: (store: Store) => void;
  onRefresh: () => void;
}) {
  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-primark-navy">Stores</h2>
        <Button onClick={onAdd} className="inline-flex items-center gap-2">
          <Plus size={20} />
          Add Store
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="w-12 h-12 border-4 border-primark-blue/30 border-t-primark-blue rounded-full animate-spin mx-auto" />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-primark-grey/20">
                <th className="text-left py-3 px-2 text-sm font-semibold text-primark-navy">Name</th>
                <th className="text-left py-3 px-2 text-sm font-semibold text-primark-navy">Code</th>
                <th className="text-left py-3 px-2 text-sm font-semibold text-primark-navy">Location</th>
                <th className="text-left py-3 px-2 text-sm font-semibold text-primark-navy">Team Members</th>
                <th className="text-left py-3 px-2 text-sm font-semibold text-primark-navy">Status</th>
                <th className="text-right py-3 px-2 text-sm font-semibold text-primark-navy">Actions</th>
              </tr>
            </thead>
            <tbody>
              {stores.map((store) => (
                <tr key={store.id} className="border-b border-primark-grey/10">
                  <td className="py-3 px-2 text-sm text-primark-navy">{store.store_name}</td>
                  <td className="py-3 px-2 text-sm text-primark-grey font-mono">
                    {store.store_code}
                  </td>
                  <td className="py-3 px-2 text-sm text-primark-grey">{store.location}</td>
                  <td className="py-3 px-2 text-sm text-primark-grey">
                    {(store as any).team_members?.[0]?.count || 0}
                  </td>
                  <td className="py-3 px-2 text-sm">
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        store.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {store.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="py-3 px-2 text-right">
                    <button
                      onClick={() => onEdit(store)}
                      className="text-primark-blue hover:text-primark-navy mr-3"
                    >
                      <Edit size={18} />
                    </button>
                    <button className="text-primark-grey hover:text-primark-navy">
                      <Power size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
