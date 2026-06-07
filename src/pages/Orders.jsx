import { useState } from 'react';
import { Search, Filter, Eye } from 'lucide-react';
import Card from '../components/ui/Card';
import Table from '../components/ui/Table';
import Badge, { statusVariant } from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import { orders } from '../data/mockData';

const STATUS_OPTIONS = ['all', 'pending', 'payment_pending', 'confirmed', 'picking', 'packed', 'dispatched', 'delivered', 'cancelled', 'refunded'];

export default function Orders() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selected, setSelected] = useState(null);

  const filtered = orders.filter(o => {
    const matchSearch = o.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
      o.userName.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const columns = [
    { key: 'orderNumber', label: 'Order #', render: (v) => <span className="font-mono text-xs text-gray-900">{v}</span> },
    { key: 'userName', label: 'Customer' },
    { key: 'storeName', label: 'Store' },
    { key: 'status', label: 'Status', render: (v) => <Badge variant={statusVariant(v)} dot>{v.replace(/_/g, ' ')}</Badge> },
    { key: 'totalAmount', label: 'Total', render: (v) => <span className="font-semibold">₹{v}</span> },
    { key: 'paymentMethod', label: 'Payment', render: (v) => <span className="uppercase text-xs">{v}</span> },
    { key: 'createdAt', label: 'Placed At', render: (v) => <span className="text-xs text-gray-500">{v}</span> },
    { key: 'partnerName', label: 'Partner', render: (v) => v || <span className="text-gray-400">—</span> },
    {
      key: 'id', label: '', width: '40px',
      render: (_, row) => (
        <button onClick={(e) => { e.stopPropagation(); setSelected(row); }} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors">
          <Eye size={14} />
        </button>
      )
    },
  ];

  const statusCounts = STATUS_OPTIONS.reduce((acc, s) => {
    acc[s] = s === 'all' ? orders.length : orders.filter(o => o.status === s).length;
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      {/* Status tabs */}
      <div className="flex gap-2 flex-wrap">
        {['all', 'pending', 'confirmed', 'dispatched', 'delivered', 'cancelled'].map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
              statusFilter === s
                ? 'bg-orange-500 text-white border-orange-500'
                : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
            }`}
          >
            {s === 'all' ? 'All' : s.replace(/_/g, ' ')} ({statusCounts[s]})
          </button>
        ))}
      </div>

      <Card>
        {/* Toolbar */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
          <div className="relative flex-1 max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-orange-400"
              placeholder="Search by order # or customer..."
            />
          </div>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-orange-400 bg-white"
          >
            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s === 'all' ? 'All statuses' : s.replace(/_/g, ' ')}</option>)}
          </select>
          <span className="text-xs text-gray-400 ml-auto">{filtered.length} orders</span>
        </div>
        <Table columns={columns} data={filtered} onRowClick={setSelected} />
      </Card>

      {/* Order detail modal */}
      <Modal open={!!selected} onClose={() => setSelected(null)} title={`Order ${selected?.orderNumber}`} width="max-w-2xl">
        {selected && <OrderDetail order={selected} onClose={() => setSelected(null)} />}
      </Modal>
    </div>
  );
}

function OrderDetail({ order, onClose }) {
  const statusFlow = ['pending', 'payment_pending', 'confirmed', 'picking', 'packed', 'dispatched', 'delivered'];
  const currentIdx = statusFlow.indexOf(order.status);

  return (
    <div className="space-y-5">
      {/* Status timeline */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Order Progress</p>
        <div className="flex items-center gap-0">
          {statusFlow.map((s, i) => {
            const done = i <= currentIdx && order.status !== 'cancelled';
            const current = i === currentIdx;
            return (
              <div key={s} className="flex items-center flex-1">
                <div className={`flex flex-col items-center flex-1`}>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center text-xs ${
                    done ? 'bg-orange-500 border-orange-500 text-white' : 'border-gray-300 bg-white'
                  }`}>
                    {done ? '✓' : i + 1}
                  </div>
                  <span className={`text-xs mt-1 text-center ${current ? 'text-orange-500 font-medium' : done ? 'text-gray-600' : 'text-gray-400'}`}>{s.replace(/_/g, ' ')}</span>
                </div>
                {i < statusFlow.length - 1 && (
                  <div className={`h-0.5 flex-1 -mt-4 ${i < currentIdx ? 'bg-orange-500' : 'bg-gray-200'}`} />
                )}
              </div>
            );
          })}
        </div>
        {order.status === 'cancelled' && <Badge variant="red" dot>Cancelled</Badge>}
      </div>

      {/* Info grid */}
      <div className="grid grid-cols-2 gap-4 text-sm">
        <InfoRow label="Customer" value={order.userName} />
        <InfoRow label="Store" value={order.storeName} />
        <InfoRow label="Partner" value={order.partnerName || '—'} />
        <InfoRow label="Payment" value={order.paymentMethod.toUpperCase()} />
        <InfoRow label="Placed At" value={order.createdAt} />
        <InfoRow label="Delivered At" value={order.deliveredAt || '—'} />
      </div>

      {/* Items */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Items</p>
        <div className="border border-gray-100 rounded-lg overflow-hidden">
          {order.items.map((item, i) => (
            <div key={i} className="flex justify-between px-4 py-2.5 border-b border-gray-100 last:border-0 text-sm">
              <span className="text-gray-700">{item.name}</span>
              <span className="text-gray-500">×{item.qty} · <span className="font-medium text-gray-900">₹{item.price * item.qty}</span></span>
            </div>
          ))}
        </div>
      </div>

      {/* Financials */}
      <div className="bg-gray-50 rounded-lg p-4 space-y-1.5 text-sm">
        <div className="flex justify-between text-gray-600"><span>Subtotal</span><span>₹{order.subtotal}</span></div>
        {order.discountAmount > 0 && <div className="flex justify-between text-green-600"><span>Discount ({order.couponCode})</span><span>−₹{order.discountAmount}</span></div>}
        {order.walletApplied > 0 && <div className="flex justify-between text-blue-600"><span>Wallet Applied</span><span>−₹{order.walletApplied}</span></div>}
        <div className="flex justify-between text-gray-600"><span>Delivery Fee</span><span>₹{order.deliveryFee}</span></div>
        <div className="flex justify-between font-bold text-gray-900 border-t border-gray-200 pt-1.5 mt-1.5"><span>Total</span><span>₹{order.totalAmount}</span></div>
      </div>

      {/* Actions */}
      {!['delivered', 'cancelled', 'refunded'].includes(order.status) && (
        <div className="flex gap-2 pt-2">
          <button className="flex-1 py-2 text-sm font-medium bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors">
            Update Status
          </button>
          <button onClick={onClose} className="flex-1 py-2 text-sm font-medium border border-red-300 text-red-500 rounded-lg hover:bg-red-50 transition-colors">
            Cancel Order
          </button>
        </div>
      )}
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div>
      <div className="text-xs text-gray-500 mb-0.5">{label}</div>
      <div className="text-sm font-medium text-gray-900">{value}</div>
    </div>
  );
}
