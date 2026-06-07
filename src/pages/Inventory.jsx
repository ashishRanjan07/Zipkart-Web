import { useState } from 'react';
import { Search, AlertTriangle, PlusCircle } from 'lucide-react';
import Card from '../components/ui/Card';
import Table from '../components/ui/Table';
import Badge from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import StatCard from '../components/ui/StatCard';
import { inventory, stores } from '../data/mockData';

export default function Inventory() {
  const [search, setSearch] = useState('');
  const [storeFilter, setStoreFilter] = useState('all');
  const [stockFilter, setStockFilter] = useState('all');
  const [selected, setSelected] = useState(null);

  const filtered = inventory.filter(i => {
    const matchSearch = i.productName.toLowerCase().includes(search.toLowerCase()) ||
      i.sku.toLowerCase().includes(search.toLowerCase());
    const matchStore = storeFilter === 'all' || i.storeId === storeFilter;
    const matchStock = stockFilter === 'all' ||
      (stockFilter === 'oos' && i.quantity === 0) ||
      (stockFilter === 'low' && i.quantity > 0 && i.quantity <= i.lowStockAlert) ||
      (stockFilter === 'ok' && i.quantity > i.lowStockAlert);
    return matchSearch && matchStore && matchStock;
  });

  const oos = inventory.filter(i => i.quantity === 0).length;
  const low = inventory.filter(i => i.quantity > 0 && i.quantity <= i.lowStockAlert).length;

  const stockBadge = (item) => {
    if (item.quantity === 0) return <Badge variant="red" dot>Out of Stock</Badge>;
    if (item.quantity <= item.lowStockAlert) return <Badge variant="yellow" dot>Low: {item.quantity}</Badge>;
    return <Badge variant="green" dot>{item.quantity} in stock</Badge>;
  };

  const columns = [
    { key: 'sku', label: 'SKU', render: (v) => <span className="font-mono text-xs text-gray-600">{v}</span> },
    { key: 'productName', label: 'Product' },
    { key: 'storeName', label: 'Store' },
    { key: 'quantity', label: 'Stock', render: (_, row) => stockBadge(row) },
    { key: 'reserved', label: 'Reserved', render: (v) => <span className="text-gray-500">{v}</span> },
    { key: 'price', label: 'Price', render: (v) => `₹${v}` },
    { key: 'mrp', label: 'MRP', render: (v) => <span className="line-through text-gray-400">₹{v}</span> },
    { key: 'discountPct', label: 'Disc.', render: (v) => v > 0 ? <Badge variant="green">{v}% off</Badge> : '—' },
    { key: 'lowStockAlert', label: 'Alert Threshold', render: (v) => <span className="text-gray-400">{v}</span> },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <StatCard title="Total SKUs" value={inventory.length} icon={AlertTriangle} iconColor="bg-blue-500" compact />
        <StatCard title="Low Stock" value={low} sub="Need restocking" icon={AlertTriangle} iconColor="bg-yellow-500" compact />
        <StatCard title="Out of Stock" value={oos} sub="Urgent restocking" icon={AlertTriangle} iconColor="bg-red-500" compact />
      </div>

      <Card>
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-orange-400"
              placeholder="Search SKU or product..."
            />
          </div>
          <select
            value={storeFilter}
            onChange={e => setStoreFilter(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none bg-white"
          >
            <option value="all">All Stores</option>
            {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <select
            value={stockFilter}
            onChange={e => setStockFilter(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none bg-white"
          >
            <option value="all">All Stock</option>
            <option value="oos">Out of Stock</option>
            <option value="low">Low Stock</option>
            <option value="ok">OK</option>
          </select>
          <button className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600 transition-colors ml-auto">
            <PlusCircle size={14} /> Adjust Stock
          </button>
          <span className="text-xs text-gray-400">{filtered.length} items</span>
        </div>
        <Table columns={columns} data={filtered} onRowClick={setSelected} />
      </Card>

      <Modal open={!!selected} onClose={() => setSelected(null)} title="Inventory Detail" width="max-w-md">
        {selected && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[['Product', selected.productName], ['SKU', selected.sku], ['Store', selected.storeName], ['Quantity', selected.quantity], ['Reserved', selected.reserved], ['Available', selected.quantity - selected.reserved], ['Price', `₹${selected.price}`], ['MRP', `₹${selected.mrp}`], ['Discount', `${selected.discountPct}%`], ['Alert at', selected.lowStockAlert]].map(([l, v]) => (
                <div key={l}><div className="text-xs text-gray-500 mb-0.5">{l}</div><div className="font-medium text-gray-900">{v}</div></div>
              ))}
            </div>
            <div className="border-t pt-4 space-y-3">
              <p className="text-xs font-semibold text-gray-500 uppercase">Adjust Stock</p>
              <div className="flex gap-2">
                <input type="number" placeholder="Quantity" className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-400" />
                <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none bg-white">
                  <option>restock</option>
                  <option>correction</option>
                  <option>damaged</option>
                </select>
              </div>
              <button className="w-full py-2 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600 transition-colors">
                Submit Adjustment
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
