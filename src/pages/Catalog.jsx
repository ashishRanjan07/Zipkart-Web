import { useState } from 'react';
import { Search, Star, PlusCircle, BookOpen } from 'lucide-react';
import Card from '../components/ui/Card';
import Table from '../components/ui/Table';
import Badge from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import StatCard from '../components/ui/StatCard';
import { products, categories } from '../data/mockData';

export default function Catalog() {
  const [tab, setTab] = useState('products');
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('all');
  const [selected, setSelected] = useState(null);

  const filteredProducts = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase()) ||
      p.brand.toLowerCase().includes(search.toLowerCase());
    const matchCat = catFilter === 'all' || p.category === catFilter;
    return matchSearch && matchCat;
  });

  const productColumns = [
    { key: 'sku', label: 'SKU', render: (v) => <span className="font-mono text-xs text-gray-500">{v}</span> },
    { key: 'name', label: 'Product', render: (v, row) => (
      <div>
        <div className="font-medium text-sm text-gray-900">{v}</div>
        <div className="text-xs text-gray-400">{row.brand} · {row.unit}</div>
      </div>
    )},
    { key: 'category', label: 'Category' },
    { key: 'mrp', label: 'MRP', render: (v) => `₹${v}` },
    { key: 'rating', label: 'Rating', render: (v) => (
      <div className="flex items-center gap-1">
        <Star size={12} className="text-yellow-400 fill-yellow-400" />
        <span className="font-medium">{v}</span>
        <span className="text-xs text-gray-400">({products.find(p => p.rating === v)?.reviewCount?.toLocaleString()})</span>
      </div>
    )},
    { key: 'isActive', label: 'Status', render: (v) => <Badge variant={v ? 'green' : 'gray'}>{v ? 'Active' : 'Inactive'}</Badge> },
  ];

  const categoryColumns = [
    { key: 'name', label: 'Category', render: (v) => <span className="font-medium text-gray-900">{v}</span> },
    { key: 'slug', label: 'Slug', render: (v) => <span className="font-mono text-xs text-gray-400">{v}</span> },
    { key: 'productCount', label: 'Products', render: (v) => <Badge variant="blue">{v}</Badge> },
    { key: 'isActive', label: 'Status', render: (v) => <Badge variant={v ? 'green' : 'gray'}>{v ? 'Active' : 'Inactive'}</Badge> },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <StatCard title="Total Products" value={products.length} icon={BookOpen} iconColor="bg-blue-500" compact />
        <StatCard title="Active Products" value={products.filter(p => p.isActive).length} icon={BookOpen} iconColor="bg-green-500" compact />
        <StatCard title="Categories" value={categories.length} icon={BookOpen} iconColor="bg-purple-500" compact />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        {['products', 'categories'].map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm font-medium capitalize border-b-2 transition-colors ${tab === t ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'products' ? (
        <Card>
          <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 flex-wrap">
            <div className="relative flex-1 min-w-48">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-orange-400"
                placeholder="Search SKU, name, brand..."
              />
            </div>
            <select value={catFilter} onChange={e => setCatFilter(e.target.value)} className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none bg-white">
              <option value="all">All Categories</option>
              {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
            <button className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600 transition-colors ml-auto">
              <PlusCircle size={14} /> Add Product
            </button>
          </div>
          <Table columns={productColumns} data={filteredProducts} onRowClick={setSelected} />
        </Card>
      ) : (
        <Card>
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <span className="text-sm text-gray-500">{categories.length} categories</span>
            <button className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600 transition-colors">
              <PlusCircle size={14} /> Add Category
            </button>
          </div>
          <Table columns={categoryColumns} data={categories} />
        </Card>
      )}

      <Modal open={!!selected} onClose={() => setSelected(null)} title={selected?.name} width="max-w-lg">
        {selected && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[['SKU', selected.sku], ['Brand', selected.brand], ['Category', selected.category], ['Unit', selected.unit], ['MRP', `₹${selected.mrp}`], ['Rating', `${selected.rating} ★ (${selected.reviewCount} reviews)`], ['Status', selected.isActive ? 'Active' : 'Inactive']].map(([l, v]) => (
                <div key={l}><div className="text-xs text-gray-500 mb-0.5">{l}</div><div className="font-medium text-gray-900">{v}</div></div>
              ))}
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-xs text-gray-500 mb-2">Update MRP</p>
              <div className="flex gap-2">
                <input defaultValue={selected.mrp} type="number" className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-400" />
                <button className="px-4 py-2 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600">Save</button>
              </div>
            </div>
            <div className="flex gap-2 border-t pt-4">
              <button className="flex-1 py-2 text-sm bg-orange-500 text-white rounded-lg hover:bg-orange-600 font-medium">Edit Full Details</button>
              <button className="flex-1 py-2 text-sm border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 font-medium">
                {selected.isActive ? 'Deactivate' : 'Activate'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
