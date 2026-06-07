import { useState } from 'react';
import { Search, IndianRupee, RotateCcw } from 'lucide-react';
import Card from '../components/ui/Card';
import Table from '../components/ui/Table';
import Badge, { statusVariant } from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import StatCard from '../components/ui/StatCard';
import { payments } from '../data/mockData';

export default function Payments() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selected, setSelected] = useState(null);

  const filtered = payments.filter(p => {
    const matchSearch = p.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
      p.userName.toLowerCase().includes(search.toLowerCase()) ||
      (p.gatewayPaymentId ?? '').toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalRevenue = payments.filter(p => p.status === 'captured').reduce((s, p) => s + p.amount, 0);
  const totalRefunded = payments.filter(p => p.status === 'refunded').reduce((s, p) => s + (p.refundAmount ?? 0), 0);
  const failed = payments.filter(p => p.status === 'failed').length;

  const columns = [
    { key: 'orderNumber', label: 'Order', render: (v) => <span className="font-mono text-xs">{v.slice(-10)}</span> },
    { key: 'userName', label: 'Customer' },
    { key: 'method', label: 'Method', render: (v) => (
      <span className="uppercase text-xs font-mono bg-gray-100 px-2 py-0.5 rounded">{v}</span>
    )},
    { key: 'amount', label: 'Amount', render: (v) => <span className="font-semibold">₹{v}</span> },
    { key: 'status', label: 'Status', render: (v) => <Badge variant={statusVariant(v)} dot>{v}</Badge> },
    { key: 'gatewayPaymentId', label: 'Gateway ID', render: (v) => <span className="font-mono text-xs text-gray-400">{v || '—'}</span> },
    { key: 'refundAmount', label: 'Refund', render: (v) => v ? <span className="text-red-500 font-medium">₹{v}</span> : '—' },
    { key: 'createdAt', label: 'Date', render: (v) => <span className="text-xs text-gray-400">{v}</span> },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-4">
        <StatCard title="Total Captured" value={`₹${totalRevenue.toLocaleString()}`} icon={IndianRupee} iconColor="bg-green-500" compact />
        <StatCard title="Total Refunded" value={`₹${totalRefunded.toLocaleString()}`} icon={RotateCcw} iconColor="bg-red-500" compact />
        <StatCard title="Failed Payments" value={failed} icon={IndianRupee} iconColor="bg-orange-500" compact />
        <StatCard title="Success Rate" value={`${Math.round((payments.filter(p=>p.status==='captured').length/payments.length)*100)}%`} icon={IndianRupee} iconColor="bg-blue-500" compact />
      </div>

      <Card>
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-orange-400"
              placeholder="Search order #, customer, gateway ID..."
            />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none bg-white">
            {['all', 'pending', 'captured', 'failed', 'refunded', 'refund_pending'].map(s => (
              <option key={s} value={s}>{s === 'all' ? 'All statuses' : s}</option>
            ))}
          </select>
          <span className="text-xs text-gray-400 ml-auto">{filtered.length} payments</span>
        </div>
        <Table columns={columns} data={filtered} onRowClick={setSelected} />
      </Card>

      <Modal open={!!selected} onClose={() => setSelected(null)} title={`Payment — ${selected?.orderNumber}`} width="max-w-md">
        {selected && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                ['Customer', selected.userName],
                ['Method', selected.method.toUpperCase()],
                ['Amount', `₹${selected.amount}`],
                ['Status', selected.status],
                ['Gateway', selected.gateway],
                ['Payment ID', selected.gatewayPaymentId || '—'],
                ['Date', selected.createdAt],
                ['Refund Amount', selected.refundAmount ? `₹${selected.refundAmount}` : '—'],
                ['Failure Reason', selected.failureReason || '—'],
              ].map(([l, v]) => (
                <div key={l}><div className="text-xs text-gray-500 mb-0.5">{l}</div><div className="font-medium text-gray-900 break-all">{v}</div></div>
              ))}
            </div>
            {selected.status === 'captured' && (
              <div className="border-t pt-4 space-y-3">
                <p className="text-xs font-semibold text-gray-500 uppercase">Initiate Refund</p>
                <input type="number" placeholder={`Amount (max ₹${selected.amount})`} max={selected.amount} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-400" />
                <input type="text" placeholder="Reason for refund" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-400" />
                <button className="w-full py-2 bg-red-500 text-white text-sm font-medium rounded-lg hover:bg-red-600 transition-colors flex items-center justify-center gap-2">
                  <RotateCcw size={14} /> Process Refund
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
