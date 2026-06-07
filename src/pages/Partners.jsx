import { useState } from 'react';
import { Search, Star, PlusCircle } from 'lucide-react';
import Card from '../components/ui/Card';
import Table from '../components/ui/Table';
import Badge, { statusVariant } from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import StatCard from '../components/ui/StatCard';
import { partners, stores } from '../data/mockData';

export default function Partners() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [storeFilter, setStoreFilter] = useState('all');
  const [selected, setSelected] = useState(null);
  const [showAdd, setShowAdd] = useState(false);

  const filtered = partners.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.phone.includes(search);
    const matchStatus = statusFilter === 'all' || p.status === statusFilter;
    const matchStore = storeFilter === 'all' || p.storeId === storeFilter;
    return matchSearch && matchStatus && matchStore;
  });

  const columns = [
    { key: 'name', label: 'Partner', render: (v, row) => (
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">{v.charAt(0)}</div>
        <div>
          <div className="font-medium text-sm text-gray-900">{v}</div>
          <div className="text-xs text-gray-400 font-mono">{row.phone}</div>
        </div>
      </div>
    )},
    { key: 'storeName', label: 'Store' },
    { key: 'status', label: 'Status', render: (v) => <Badge variant={statusVariant(v)} dot>{v.replace('_', ' ')}</Badge> },
    { key: 'vehicleType', label: 'Vehicle', render: (v, row) => (
      <span className="capitalize">{v} {row.vehicleNumber ? `· ${row.vehicleNumber}` : ''}</span>
    )},
    { key: 'rating', label: 'Rating', render: (v) => (
      <div className="flex items-center gap-1">
        <Star size={12} className="text-yellow-400 fill-yellow-400" />
        <span className="font-medium">{v}</span>
      </div>
    )},
    { key: 'totalOrders', label: 'Orders', render: (v) => <span className="font-medium">{v.toLocaleString()}</span> },
    { key: 'isActive', label: 'Active', render: (v) => <Badge variant={v ? 'green' : 'gray'}>{v ? 'Yes' : 'No'}</Badge> },
    { key: 'lastSeen', label: 'Last Seen', render: (v) => <span className="text-xs text-gray-400">{v}</span> },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-4">
        <StatCard title="Total Partners" value={partners.length} icon={Star} iconColor="bg-blue-500" compact />
        <StatCard title="Available" value={partners.filter(p => p.status === 'available').length} icon={Star} iconColor="bg-green-500" compact />
        <StatCard title="On Order" value={partners.filter(p => p.status === 'on_order').length} icon={Star} iconColor="bg-orange-500" compact />
        <StatCard title="Offline" value={partners.filter(p => p.status === 'offline').length} icon={Star} iconColor="bg-gray-400" compact />
      </div>

      <Card>
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-orange-400"
              placeholder="Search partner name or phone..."
            />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none bg-white">
            <option value="all">All Status</option>
            <option value="available">Available</option>
            <option value="on_order">On Order</option>
            <option value="offline">Offline</option>
          </select>
          <select value={storeFilter} onChange={e => setStoreFilter(e.target.value)} className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none bg-white">
            <option value="all">All Stores</option>
            {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600 transition-colors ml-auto">
            <PlusCircle size={14} /> Add Partner
          </button>
        </div>
        <Table columns={columns} data={filtered} onRowClick={setSelected} />
      </Card>

      <Modal open={!!selected} onClose={() => setSelected(null)} title={`Partner — ${selected?.name}`} width="max-w-md">
        {selected && (
          <div className="space-y-4">
            <div className="flex items-center gap-4 pb-4 border-b">
              <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xl font-bold">{selected.name.charAt(0)}</div>
              <div>
                <div className="font-semibold text-gray-900">{selected.name}</div>
                <div className="text-sm text-gray-500 font-mono">{selected.phone}</div>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant={statusVariant(selected.status)} dot>{selected.status.replace('_', ' ')}</Badge>
                  <div className="flex items-center gap-0.5 text-xs text-yellow-500 font-medium">
                    <Star size={11} className="fill-current" /> {selected.rating}
                  </div>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[['Store', selected.storeName], ['Vehicle', `${selected.vehicleType} ${selected.vehicleNumber}`], ['Total Orders', selected.totalOrders.toLocaleString()], ['Active', selected.isActive ? 'Yes' : 'No'], ['Last Seen', selected.lastSeen]].map(([l, v]) => (
                <div key={l}><div className="text-xs text-gray-500 mb-0.5">{l}</div><div className="font-medium text-gray-900">{v}</div></div>
              ))}
            </div>
            <div className="flex gap-2 border-t pt-4">
              <button className="flex-1 py-2 text-sm bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium">Edit Partner</button>
              <button className="flex-1 py-2 text-sm border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors font-medium">
                {selected.isActive ? 'Deactivate' : 'Activate'}
              </button>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add Delivery Partner" width="max-w-md">
        <form className="space-y-3" onSubmit={e => { e.preventDefault(); setShowAdd(false); }}>
          {[['Name', 'text', 'Full name'], ['Phone', 'tel', '+91...'], ['Vehicle Type', 'text', 'bike / cycle / foot'], ['Vehicle Number', 'text', 'KA01AB1234 (optional)']].map(([l, t, p]) => (
            <div key={l}>
              <label className="block text-xs font-medium text-gray-600 mb-1">{l}</label>
              <input type={t} placeholder={p} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-400" />
            </div>
          ))}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Assign Store</label>
            <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none bg-white">
              {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div className="flex gap-2 pt-2">
            <button type="submit" className="flex-1 py-2 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600">Add Partner</button>
            <button type="button" onClick={() => setShowAdd(false)} className="flex-1 py-2 border border-gray-200 text-sm text-gray-600 rounded-lg hover:bg-gray-50">Cancel</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
