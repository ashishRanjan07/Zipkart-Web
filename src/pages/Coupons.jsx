import { useState } from 'react';
import { Tag, PlusCircle, Search } from 'lucide-react';
import Card from '../components/ui/Card';
import Table from '../components/ui/Table';
import Badge, { statusVariant } from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import StatCard from '../components/ui/StatCard';
import { coupons } from '../data/mockData';

export default function Coupons() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState(null);
  const [showAdd, setShowAdd] = useState(false);

  const filtered = coupons.filter(c => {
    const matchSearch = c.code.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || (filter === 'active' && c.isActive) || (filter === 'inactive' && !c.isActive);
    return matchSearch && matchFilter;
  });

  const typeBadge = (type) => {
    const v = { flat: 'blue', percentage: 'purple', free_delivery: 'green', bogo: 'orange' };
    return <Badge variant={v[type] ?? 'gray'}>{type.replace('_', ' ')}</Badge>;
  };

  const columns = [
    { key: 'code', label: 'Code', render: (v) => <span className="font-mono font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded">{v}</span> },
    { key: 'type', label: 'Type', render: (v) => typeBadge(v) },
    { key: 'value', label: 'Value', render: (v, row) => (
      <span className="font-semibold">{row.type === 'percentage' ? `${v}%` : row.type === 'free_delivery' ? 'Free Delivery' : `₹${v}`}</span>
    )},
    { key: 'minOrderValue', label: 'Min Order', render: (v) => `₹${v}` },
    { key: 'usedCount', label: 'Used', render: (v, row) => (
      <div>
        <span className="font-medium">{v}</span>
        {row.maxUsesTotal && <span className="text-gray-400"> / {row.maxUsesTotal}</span>}
      </div>
    )},
    { key: 'applicableTo', label: 'For', render: (v) => <Badge variant={v === 'new_user' ? 'purple' : v === 'category' ? 'blue' : 'gray'}>{v.replace('_', ' ')}</Badge> },
    { key: 'validUntil', label: 'Expires', render: (v) => <span className="text-xs text-gray-400">{v}</span> },
    { key: 'isActive', label: 'Status', render: (v) => <Badge variant={v ? 'green' : 'gray'}>{v ? 'Active' : 'Inactive'}</Badge> },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-4">
        <StatCard title="Total Coupons" value={coupons.length} icon={Tag} iconColor="bg-blue-500" compact />
        <StatCard title="Active" value={coupons.filter(c=>c.isActive).length} icon={Tag} iconColor="bg-green-500" compact />
        <StatCard title="Total Uses" value={coupons.reduce((s,c)=>s+c.usedCount,0).toLocaleString()} icon={Tag} iconColor="bg-orange-500" compact />
        <StatCard title="Discount Given" value="₹1.2L" sub="Estimated today" icon={Tag} iconColor="bg-purple-500" compact />
      </div>

      <Card>
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
          <div className="relative flex-1 max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-orange-400" placeholder="Search coupon code..." />
          </div>
          {['all', 'active', 'inactive'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors capitalize ${filter === f ? 'bg-orange-500 text-white border-orange-500' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}>
              {f}
            </button>
          ))}
          <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600 transition-colors ml-auto">
            <PlusCircle size={14} /> Create Coupon
          </button>
        </div>
        <Table columns={columns} data={filtered} onRowClick={setSelected} />
      </Card>

      <Modal open={!!selected} onClose={() => setSelected(null)} title={`Coupon — ${selected?.code}`} width="max-w-md">
        {selected && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[['Code', selected.code], ['Type', selected.type], ['Value', selected.type === 'percentage' ? `${selected.value}%` : `₹${selected.value}`], ['Min Order', `₹${selected.minOrderValue}`], ['Max Discount', selected.maxDiscount ? `₹${selected.maxDiscount}` : 'No cap'], ['Max Uses', selected.maxUsesTotal || 'Unlimited'], ['Per User', selected.maxUsesPerUser], ['Used', selected.usedCount], ['Valid From', selected.validFrom], ['Valid Until', selected.validUntil], ['Applicable', selected.applicableTo]].map(([l, v]) => (
                <div key={l}><div className="text-xs text-gray-500 mb-0.5">{l}</div><div className="font-medium text-gray-900">{v}</div></div>
              ))}
            </div>
            <div className="flex gap-2 border-t pt-4">
              <button className="flex-1 py-2 text-sm bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600">Edit Coupon</button>
              <button className="flex-1 py-2 text-sm border border-gray-200 text-gray-600 rounded-lg font-medium hover:bg-gray-50">
                {selected.isActive ? 'Deactivate' : 'Activate'}
              </button>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Create Coupon" width="max-w-md">
        <form className="space-y-3" onSubmit={e => { e.preventDefault(); setShowAdd(false); }}>
          {[['Coupon Code', 'text', 'e.g. SAVE50', false], ['Value', 'number', 'Amount or percentage', false], ['Min Order Value (₹)', 'number', '0', false], ['Max Uses Total', 'number', 'Leave blank for unlimited', false], ['Max Uses Per User', 'number', '1', false]].map(([l, t, p]) => (
            <div key={l}>
              <label className="block text-xs font-medium text-gray-600 mb-1">{l}</label>
              <input type={t} placeholder={p} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-400" />
            </div>
          ))}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Type</label>
            <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none bg-white">
              {['flat', 'percentage', 'free_delivery', 'bogo'].map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Valid From</label>
              <input type="date" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-400" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Valid Until</label>
              <input type="date" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-400" />
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <button type="submit" className="flex-1 py-2 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600">Create</button>
            <button type="button" onClick={() => setShowAdd(false)} className="flex-1 py-2 border border-gray-200 text-sm text-gray-600 rounded-lg hover:bg-gray-50">Cancel</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
