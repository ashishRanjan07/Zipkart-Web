import { useState } from 'react';
import { MapPin, Clock, Package, Users, PlusCircle } from 'lucide-react';
import Card from '../components/ui/Card';
import Badge, { statusVariant } from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import StatCard from '../components/ui/StatCard';
import { stores, partners, orders } from '../data/mockData';

export default function DarkStores() {
  const [selected, setSelected] = useState(null);
  const [showAdd, setShowAdd] = useState(false);

  const activeStores = stores.filter(s => s.status === 'active').length;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <StatCard title="Total Stores" value={stores.length} icon={Package} iconColor="bg-blue-500" compact />
        <StatCard title="Active" value={activeStores} icon={Package} iconColor="bg-green-500" compact />
        <StatCard title="Total Capacity" value={stores.reduce((s, st) => s + st.maxOrders, 0)} sub="Max concurrent orders" icon={Package} iconColor="bg-orange-500" compact />
      </div>

      <div className="flex justify-between items-center">
        <h3 className="text-sm font-semibold text-gray-700">All Dark Stores</h3>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600 transition-colors"
        >
          <PlusCircle size={14} /> Add Store
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {stores.map(store => {
          const storePartners = partners.filter(p => p.storeId === store.id);
          const available = storePartners.filter(p => p.status === 'available').length;
          const onOrder = storePartners.filter(p => p.status === 'on_order').length;
          const load = store.maxOrders > 0 ? Math.round((store.activeOrders / store.maxOrders) * 100) : 0;

          return (
            <div
              key={store.id}
              onClick={() => setSelected(store)}
              className="bg-white rounded-xl border border-gray-200 p-5 cursor-pointer hover:border-orange-300 hover:shadow-sm transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-gray-900">{store.name}</h3>
                    <Badge variant={statusVariant(store.status)} dot>{store.status}</Badge>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                    <span className="font-mono text-orange-500">{store.code}</span>
                    <span>·</span>
                    <MapPin size={11} />
                    <span>{store.city}</span>
                  </div>
                </div>
                <div className={`text-xs font-bold px-2.5 py-1 rounded-full ${load >= 80 ? 'bg-red-100 text-red-700' : load >= 60 ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                  {load}% load
                </div>
              </div>

              {/* Load bar */}
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mb-3">
                <div
                  className={`h-full rounded-full ${load >= 80 ? 'bg-red-500' : load >= 60 ? 'bg-yellow-500' : 'bg-green-500'}`}
                  style={{ width: `${load}%` }}
                />
              </div>

              <div className="grid grid-cols-3 gap-3 text-xs">
                <div className="bg-gray-50 rounded-lg p-2.5">
                  <div className="text-gray-500 mb-0.5">Active Orders</div>
                  <div className="font-bold text-gray-900">{store.activeOrders}/{store.maxOrders}</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-2.5">
                  <div className="text-gray-500 mb-0.5">Partners</div>
                  <div className="font-bold text-gray-900">{available} avail · {onOrder} on order</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-2.5">
                  <div className="text-gray-500 mb-0.5">Hours</div>
                  <div className="font-bold text-gray-900">{store.opens} – {store.closes}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Store detail modal */}
      <Modal open={!!selected} onClose={() => setSelected(null)} title={selected?.name ?? ''} width="max-w-lg">
        {selected && <StoreDetail store={selected} />}
      </Modal>

      {/* Add store modal */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add New Dark Store" width="max-w-md">
        <AddStoreForm onClose={() => setShowAdd(false)} />
      </Modal>
    </div>
  );
}

function StoreDetail({ store }) {
  const storePartners = partners.filter(p => p.storeId === store.id);
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 text-sm">
        {[['Code', store.code], ['City', store.city], ['Address', store.address], ['Manager', store.manager], ['Phone', store.phone], ['Radius', `${(store.serviceRadius / 1000).toFixed(1)} km`], ['Opens', store.opens], ['Closes', store.closes], ['Max Orders', store.maxOrders], ['Status', store.status]].map(([l, v]) => (
          <div key={l}><div className="text-xs text-gray-500 mb-0.5">{l}</div><div className="font-medium text-gray-900">{v}</div></div>
        ))}
      </div>

      <div className="border-t pt-4">
        <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Delivery Partners ({storePartners.length})</p>
        {storePartners.map(p => (
          <div key={p.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
            <div>
              <div className="text-sm font-medium text-gray-900">{p.name}</div>
              <div className="text-xs text-gray-400">{p.phone} · {p.vehicleType}</div>
            </div>
            <Badge variant={statusVariant(p.status)} dot>{p.status.replace('_', ' ')}</Badge>
          </div>
        ))}
      </div>

      <div className="flex gap-2 border-t pt-4">
        <button className="flex-1 py-2 text-sm bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium">Edit Store</button>
        <button className="flex-1 py-2 text-sm border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors font-medium">
          {store.status === 'active' ? 'Set Maintenance' : 'Set Active'}
        </button>
      </div>
    </div>
  );
}

function AddStoreForm({ onClose }) {
  return (
    <form className="space-y-3" onSubmit={e => { e.preventDefault(); onClose(); }}>
      {[['Store Name', 'text', 'e.g. Bellandur Store'], ['Store Code', 'text', 'e.g. BLR-BEL-01'], ['City', 'text', 'e.g. Bengaluru'], ['Address', 'text', 'Full address'], ['Manager Name', 'text', 'Store manager'], ['Manager Phone', 'tel', '+91...'], ['Service Radius (m)', 'number', '5000'], ['Max Concurrent Orders', 'number', '20']].map(([label, type, placeholder]) => (
        <div key={label}>
          <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
          <input type={type} placeholder={placeholder} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-400" />
        </div>
      ))}
      <div className="flex gap-2 pt-2">
        <button type="submit" className="flex-1 py-2 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600 transition-colors">Create Store</button>
        <button type="button" onClick={onClose} className="flex-1 py-2 border border-gray-200 text-sm text-gray-600 rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
      </div>
    </form>
  );
}
