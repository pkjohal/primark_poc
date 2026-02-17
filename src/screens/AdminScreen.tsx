// Admin screen for user and store management

import { useState, useEffect } from 'react';
import { Users as UsersIcon, Building2, Plus, Edit, Power, X, AlertCircle } from 'lucide-react';
import NavBar from '@/components/layout/NavBar';
import BottomNav from '@/components/layout/BottomNav';
import PageHeader from '@/components/layout/PageHeader';
import Button from '@/components/ui/Button';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import AlertDialog from '@/components/ui/AlertDialog';
import { supabase } from '@/lib/supabase';
import { Store, TeamMember } from '@/lib/types';
import { formatDate } from '@/lib/utils';

type Tab = 'users' | 'stores';

export default function AdminScreen() {
  const [activeTab, setActiveTab] = useState<Tab>('users');
  const [users, setUsers] = useState<TeamMember[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showStoreModal, setShowStoreModal] = useState(false);
  const [editingUser, setEditingUser] = useState<TeamMember | null>(null);
  const [editingStore, setEditingStore] = useState<Store | null>(null);
  const [toggleTarget, setToggleTarget] = useState<{ type: 'user' | 'store'; id: string; currentStatus: boolean } | null>(null);
  const [alert, setAlert] = useState<{ title: string; message: string; variant: 'success' | 'error' | 'warning' | 'info' } | null>(null);

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
    setEditingUser(null);
    setShowUserModal(true);
  };

  const handleEditUser = (user: TeamMember) => {
    setEditingUser(user);
    setShowUserModal(true);
  };

  const handleAddStore = () => {
    setEditingStore(null);
    setShowStoreModal(true);
  };

  const handleEditStore = (store: Store) => {
    setEditingStore(store);
    setShowStoreModal(true);
  };

  const handleToggleUser = async () => {
    if (!toggleTarget || toggleTarget.type !== 'user') return;

    const user = users.find(u => u.id === toggleTarget.id);
    if (!user) return;

    // Prevent deactivating admin users
    if (user.is_active && user.role === 'admin') {
      setAlert({
        title: 'Cannot Deactivate',
        message: 'Admin users cannot be deactivated.',
        variant: 'warning',
      });
      setToggleTarget(null);
      return;
    }

    try {
      const { error } = await supabase
        .from('team_members')
        .update({ is_active: !toggleTarget.currentStatus })
        .eq('id', toggleTarget.id);

      if (error) throw error;

      await fetchUsers();
      setToggleTarget(null);
    } catch (err) {
      console.error('Error toggling user:', err);
      setAlert({
        title: 'Error',
        message: 'Failed to update user status. Please try again.',
        variant: 'error',
      });
    }
  };

  const handleToggleStore = async () => {
    if (!toggleTarget || toggleTarget.type !== 'store') return;

    try {
      const { error } = await supabase
        .from('stores')
        .update({ is_active: !toggleTarget.currentStatus })
        .eq('id', toggleTarget.id);

      if (error) throw error;

      await fetchStores();
      setToggleTarget(null);
    } catch (err) {
      console.error('Error toggling store:', err);
      setAlert({
        title: 'Error',
        message: 'Failed to update store status. Please try again.',
        variant: 'error',
      });
    }
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
            onToggle={(userId, currentStatus) => setToggleTarget({ type: 'user', id: userId, currentStatus })}
          />
        ) : (
          <StoresTab
            stores={stores}
            loading={loading}
            onAdd={handleAddStore}
            onEdit={handleEditStore}
            onToggle={(storeId, currentStatus) => setToggleTarget({ type: 'store', id: storeId, currentStatus })}
          />
        )}
      </div>

      {/* User Modal */}
      {showUserModal && (
        <UserModal
          user={editingUser}
          stores={stores}
          users={users}
          onClose={() => {
            setShowUserModal(false);
            setEditingUser(null);
          }}
          onSave={() => {
            setShowUserModal(false);
            setEditingUser(null);
            fetchUsers();
          }}
        />
      )}

      {/* Store Modal */}
      {showStoreModal && (
        <StoreModal
          store={editingStore}
          existingStores={stores}
          onClose={() => {
            setShowStoreModal(false);
            setEditingStore(null);
          }}
          onSave={() => {
            setShowStoreModal(false);
            setEditingStore(null);
            fetchStores();
          }}
        />
      )}

      {/* Toggle Confirmation */}
      <ConfirmDialog
        isOpen={!!toggleTarget}
        onClose={() => setToggleTarget(null)}
        onConfirm={toggleTarget?.type === 'user' ? handleToggleUser : handleToggleStore}
        title={`${toggleTarget?.currentStatus ? 'Deactivate' : 'Activate'} ${toggleTarget?.type === 'user' ? 'User' : 'Store'}?`}
        message={`Are you sure you want to ${toggleTarget?.currentStatus ? 'deactivate' : 'activate'} this ${toggleTarget?.type}?`}
        confirmText={toggleTarget?.currentStatus ? 'Deactivate' : 'Activate'}
        variant={toggleTarget?.currentStatus ? 'danger' : 'info'}
      />

      {/* Alert Dialog */}
      <AlertDialog
        isOpen={!!alert}
        onClose={() => setAlert(null)}
        title={alert?.title || ''}
        message={alert?.message || ''}
        variant={alert?.variant || 'info'}
      />

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
  onToggle,
}: {
  users: TeamMember[];
  loading: boolean;
  onAdd: () => void;
  onEdit: (user: TeamMember) => void;
  onToggle: (userId: string, currentStatus: boolean) => void;
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
                      title="Edit user"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => onToggle(user.id, user.is_active)}
                      disabled={user.role === 'admin' && user.is_active}
                      className={`${
                        user.role === 'admin' && user.is_active
                          ? 'text-gray-300 cursor-not-allowed'
                          : user.is_active
                          ? 'text-red-600 hover:text-red-800'
                          : 'text-green-600 hover:text-green-800'
                      }`}
                      title={
                        user.role === 'admin' && user.is_active
                          ? 'Cannot deactivate admin users'
                          : user.is_active
                          ? 'Deactivate'
                          : 'Activate'
                      }
                    >
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
  onToggle,
}: {
  stores: Store[];
  loading: boolean;
  onAdd: () => void;
  onEdit: (store: Store) => void;
  onToggle: (storeId: string, currentStatus: boolean) => void;
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
                      title="Edit store"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => onToggle(store.id, store.is_active)}
                      className={`${store.is_active ? 'text-red-600 hover:text-red-800' : 'text-green-600 hover:text-green-800'}`}
                      title={store.is_active ? 'Deactivate' : 'Activate'}
                    >
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

// User Modal Component
function UserModal({
  user,
  stores,
  users,
  onClose,
  onSave,
}: {
  user: TeamMember | null;
  stores: Store[];
  users: TeamMember[];
  onClose: () => void;
  onSave: () => void;
}) {
  const [formData, setFormData] = useState({
    full_name: user?.full_name || '',
    pin_code: user?.pin_code || '',
    store_id: user?.store_id || '',
    role: user?.role || 'team_member',
  });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Check if this is the last active admin
  const isLastAdmin = user?.role === 'admin' && user?.is_active && users.filter(u => u.role === 'admin' && u.is_active).length === 1;

  const validate = () => {
    if (formData.full_name.trim().length < 2) {
      setError('Name must be at least 2 characters');
      return false;
    }
    if (!/^\d{4}$/.test(formData.pin_code)) {
      setError('PIN must be exactly 4 digits');
      return false;
    }
    if (!formData.store_id) {
      setError('Please select a store');
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validate()) return;

    // Prevent changing role of last admin
    if (isLastAdmin && formData.role !== 'admin') {
      setError('Cannot change the role of the last admin user');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      if (user) {
        const { error: updateError } = await supabase
          .from('team_members')
          .update({
            full_name: formData.full_name.trim(),
            pin_code: formData.pin_code,
            store_id: formData.store_id,
            role: formData.role,
          })
          .eq('id', user.id);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('team_members')
          .insert({
            full_name: formData.full_name.trim(),
            pin_code: formData.pin_code,
            store_id: formData.store_id,
            role: formData.role,
            member_code: `TM${Date.now().toString().slice(-8)}`,
            is_active: true,
          });

        if (insertError) throw insertError;
      }

      onSave();
    } catch (err: any) {
      console.error('Error saving user:', err);
      setError(err.message || 'Failed to save user');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-primark-navy">
            {user ? 'Edit User' : 'Add User'}
          </h2>
          <button onClick={onClose} className="text-primark-grey hover:text-primark-navy">
            <X size={24} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-primark-navy mb-1">
              Full Name *
            </label>
            <input
              type="text"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              className="input"
              placeholder="Enter full name"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-primark-navy mb-1">
              4-Digit PIN *
            </label>
            <input
              type="text"
              value={formData.pin_code}
              onChange={(e) => setFormData({ ...formData, pin_code: e.target.value.replace(/\D/g, '').slice(0, 4) })}
              className="input font-mono"
              placeholder="0000"
              maxLength={4}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-primark-navy mb-1">
              Store *
            </label>
            <select
              value={formData.store_id}
              onChange={(e) => setFormData({ ...formData, store_id: e.target.value })}
              className="input"
            >
              <option value="">Select store...</option>
              {stores.filter(s => s.is_active).map((store) => (
                <option key={store.id} value={store.id}>
                  {store.store_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-primark-navy mb-1">
              Role * {isLastAdmin && <span className="text-sm text-gray-500">(Cannot change last admin)</span>}
            </label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
              className="input"
              disabled={isLastAdmin}
            >
              <option value="team_member">Team Member</option>
              <option value="manager">Manager</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button onClick={onClose} variant="outline" className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleSave} isLoading={saving} className="flex-1">
              {user ? 'Update' : 'Create'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Store Modal Component
function StoreModal({
  store,
  existingStores,
  onClose,
  onSave,
}: {
  store: Store | null;
  existingStores: Store[];
  onClose: () => void;
  onSave: () => void;
}) {
  const [formData, setFormData] = useState({
    store_name: store?.store_name || '',
    store_code: store?.store_code || '',
    location: store?.location || '',
  });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const validate = () => {
    if (formData.store_name.trim().length < 2) {
      setError('Store name must be at least 2 characters');
      return false;
    }
    if (formData.store_code.trim().length === 0) {
      setError('Store code is required');
      return false;
    }
    if (formData.store_code.trim().length > 10) {
      setError('Store code must be 10 characters or less');
      return false;
    }
    const duplicate = existingStores.find(
      s => s.store_code.toUpperCase() === formData.store_code.trim().toUpperCase() && s.id !== store?.id
    );
    if (duplicate) {
      setError('Store code must be unique');
      return false;
    }
    if (formData.location.trim().length < 2) {
      setError('Location must be at least 2 characters');
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validate()) return;

    setSaving(true);
    setError(null);

    try {
      if (store) {
        const { error: updateError } = await supabase
          .from('stores')
          .update({
            store_name: formData.store_name.trim(),
            store_code: formData.store_code.trim().toUpperCase(),
            location: formData.location.trim(),
          })
          .eq('id', store.id);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('stores')
          .insert({
            store_name: formData.store_name.trim(),
            store_code: formData.store_code.trim().toUpperCase(),
            location: formData.location.trim(),
            is_active: true,
          });

        if (insertError) throw insertError;
      }

      onSave();
    } catch (err: any) {
      console.error('Error saving store:', err);
      setError(err.message || 'Failed to save store');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-primark-navy">
            {store ? 'Edit Store' : 'Add Store'}
          </h2>
          <button onClick={onClose} className="text-primark-grey hover:text-primark-navy">
            <X size={24} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-primark-navy mb-1">
              Store Name *
            </label>
            <input
              type="text"
              value={formData.store_name}
              onChange={(e) => setFormData({ ...formData, store_name: e.target.value })}
              className="input"
              placeholder="Enter store name"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-primark-navy mb-1">
              Store Code *
            </label>
            <input
              type="text"
              value={formData.store_code}
              onChange={(e) => setFormData({ ...formData, store_code: e.target.value.toUpperCase() })}
              className="input font-mono"
              placeholder="STORE01"
            />
            <p className="text-xs text-primark-grey mt-1">Must be unique</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-primark-navy mb-1">
              Location *
            </label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="input"
              placeholder="Enter location"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button onClick={onClose} variant="outline" className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleSave} isLoading={saving} className="flex-1">
              {store ? 'Update' : 'Create'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
