import { useState } from 'react';
import { Search, UserCheck, UserX, Wallet } from 'lucide-react';
import Card from '../components/ui/Card';
import Table from '../components/ui/Table';
import Badge from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import StatCard from '../components/ui/StatCard';
import { users } from '../data/mockData';

export default function Users() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState(null);

  const filtered = users.filter(u => {
    const matchSearch = u.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.phone.includes(search) || u.email?.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' ||
      (filter === 'active' && u.isActive) ||
      (filter === 'inactive' && !u.isActive) ||
      (filter === 'verified' && u.isVerified);
    return matchSearch && matchFilter;
  });

  const columns = [
    { key: 'name', label: 'Name', render: (v, row) => (
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
          {v?.charAt(0) || '?'}
        </div>
        <div>
          <div className="font-medium text-gray-900 text-sm">{v || 'Unknown'}</div>
          <div className="text-xs text-gray-400">{row.email || 'No email'}</div>
        </div>
      </div>
    )},
    { key: 'phone', label: 'Phone', render: (v) => <span className="font-mono text-xs">{v}</span> },
    { key: 'isVerified', label: 'Verified', render: (v) => v ? <Badge variant="green" dot>Verified</Badge> : <Badge variant="yellow" dot>Unverified</Badge> },
    { key: 'isActive', label: 'Status', render: (v) => v ? <Badge variant="green">Active</Badge> : <Badge variant="gray">Inactive</Badge> },
    { key: 'walletBalance', label: 'Wallet', render: (v) => <span className="font-semibold text-gray-900">₹{v.toFixed(2)}</span> },
    { key: 'totalOrders', label: 'Orders', render: (v) => <span className="font-medium">{v}</span> },
    { key: 'referralCode', label: 'Referral', render: (v) => <span className="font-mono text-xs text-purple-600">{v}</span> },
    { key: 'createdAt', label: 'Joined', render: (v) => <span className="text-xs text-gray-400">{v}</span> },
  ];

  const totalWallet = users.reduce((s, u) => s + u.walletBalance, 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-4">
        <StatCard title="Total Users" value={users.length} icon={UserCheck} iconColor="bg-blue-500" compact />
        <StatCard title="Verified" value={users.filter(u => u.isVerified).length} icon={UserCheck} iconColor="bg-green-500" compact />
        <StatCard title="Active" value={users.filter(u => u.isActive).length} icon={UserCheck} iconColor="bg-orange-500" compact />
        <StatCard title="Total Wallet" value={`₹${totalWallet.toFixed(0)}`} icon={Wallet} iconColor="bg-purple-500" compact />
      </div>

      <Card>
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
          <div className="relative flex-1 max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-orange-400"
              placeholder="Search name, phone, email..."
            />
          </div>
          <div className="flex gap-2">
            {['all', 'active', 'inactive', 'verified'].map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${filter === f ? 'bg-orange-500 text-white border-orange-500' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}>
                {f}
              </button>
            ))}
          </div>
          <span className="text-xs text-gray-400 ml-auto">{filtered.length} users</span>
        </div>
        <Table columns={columns} data={filtered} onRowClick={setSelected} />
      </Card>

      <Modal open={!!selected} onClose={() => setSelected(null)} title={`User — ${selected?.name}`} width="max-w-lg">
        {selected && (
          <div className="space-y-4">
            <div className="flex items-center gap-4 pb-4 border-b">
              <div className="w-14 h-14 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-xl font-bold">
                {selected.name?.charAt(0)}
              </div>
              <div>
                <div className="font-semibold text-gray-900">{selected.name}</div>
                <div className="text-sm text-gray-500">{selected.phone}</div>
                <div className="flex gap-2 mt-1">
                  <Badge variant={selected.isVerified ? 'green' : 'yellow'} dot>{selected.isVerified ? 'Verified' : 'Unverified'}</Badge>
                  <Badge variant={selected.isActive ? 'green' : 'gray'}>{selected.isActive ? 'Active' : 'Inactive'}</Badge>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                ['Email', selected.email || '—'],
                ['Referral Code', selected.referralCode],
                ['Wallet Balance', `₹${selected.walletBalance.toFixed(2)}`],
                ['Total Orders', selected.totalOrders],
                ['Joined', selected.createdAt],
                ['Referred By', selected.referredBy || '—'],
              ].map(([l, v]) => (
                <div key={l}><div className="text-xs text-gray-500 mb-0.5">{l}</div><div className="font-medium text-gray-900">{v}</div></div>
              ))}
            </div>

            <div className="flex gap-2 pt-2 border-t">
              <button className="flex-1 py-2 text-sm font-medium bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors">
                View Orders
              </button>
              <button className="flex-1 py-2 text-sm font-medium border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors">
                {selected.isActive ? 'Deactivate' : 'Activate'} User
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
