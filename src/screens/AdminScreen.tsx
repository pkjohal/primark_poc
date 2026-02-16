// Admin screen for user and store management (Simplified MVP)

import { Settings, Users, Store } from 'lucide-react';
import NavBar from '@/components/layout/NavBar';
import BottomNav from '@/components/layout/BottomNav';
import PageHeader from '@/components/layout/PageHeader';

export default function AdminScreen() {
  return (
    <div className="min-h-screen flex flex-col bg-primark-light-grey pb-20">
      <NavBar />
      <PageHeader title="Admin Panel" subtitle="User and store management" />

      <div className="flex-1 max-w-7xl mx-auto w-full p-4">
        <div className="card mb-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-primark-light-blue rounded-lg flex items-center justify-center">
              <Users size={24} className="text-primark-blue" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-primark-navy">User Management</h3>
              <p className="text-sm text-primark-grey">Create, edit, and deactivate team members</p>
            </div>
          </div>
          <p className="text-sm text-primark-grey bg-primark-light-blue p-3 rounded-lg">
            User management interface with forms for creating/editing team members, PIN management, and role assignment can be implemented in future iterations.
          </p>
        </div>

        <div className="card mb-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Store size={24} className="text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-primark-navy">Store Management</h3>
              <p className="text-sm text-primark-grey">Create, edit, and deactivate stores</p>
            </div>
          </div>
          <p className="text-sm text-primark-grey bg-primark-light-blue p-3 rounded-lg">
            Store management interface with forms for creating/editing stores, location management, and activation status can be implemented in future iterations.
          </p>
        </div>

        <div className="card bg-amber-50 border border-amber-200">
          <div className="flex items-center gap-3">
            <Settings size={24} className="text-amber-600" />
            <div>
              <h4 className="font-semibold text-primark-navy">MVP Note</h4>
              <p className="text-sm text-primark-grey mt-1">
                This MVP focuses on core scanning flows. Admin features for managing users and stores can be added as a next phase, along with audit logs and advanced settings.
              </p>
            </div>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
