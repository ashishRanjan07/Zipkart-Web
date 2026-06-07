import { useState } from 'react';
import { Zap, PlusCircle, Clock } from 'lucide-react';
import Card from '../components/ui/Card';
import Badge, { statusVariant } from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import StatCard from '../components/ui/StatCard';
import { flashSales } from '../data/mockData';

export default function FlashSales() {
  const [showAdd, setShowAdd] = useState(false);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <StatCard title="Total Sales" value={flashSales.length} icon={Zap} iconColor="bg-orange-500" compact />
        <StatCard title="Active Now" value={flashSales.filter(f=>f.status==='active').length} icon={Zap} iconColor="bg-green-500" compact />
        <StatCard title="Scheduled" value={flashSales.filter(f=>f.status==='scheduled').length} icon={Zap} iconColor="bg-blue-500" compact />
      </div>

      <div className="flex justify-between items-center">
        <h3 className="text-sm font-semibold text-gray-700">Flash Sales</h3>
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600 transition-colors">
          <PlusCircle size={14} /> Create Flash Sale
        </button>
      </div>

      <div className="space-y-4">
        {flashSales.map(sale => (
          <Card key={sale.id}>
            <div className="p-5">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-gray-900">{sale.title}</h3>
                    <Badge variant={statusVariant(sale.status)} dot>{sale.status}</Badge>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
                    <Clock size={11} />
                    <span>{sale.startsAt} → {sale.endsAt}</span>
                    <span>·</span>
                    <span>{sale.storeName}</span>
                  </div>
                </div>
                {sale.status === 'active' && (
                  <button className="px-3 py-1.5 text-xs font-medium border border-red-300 text-red-500 rounded-lg hover:bg-red-50 transition-colors">
                    End Sale
                  </button>
                )}
                {sale.status === 'scheduled' && (
                  <div className="flex gap-2">
                    <button className="px-3 py-1.5 text-xs font-medium bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors">Launch Now</button>
                    <button className="px-3 py-1.5 text-xs font-medium border border-gray-200 text-gray-500 rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                {sale.items.map((item, i) => {
                  const progress = Math.round((item.soldCount / item.maxQtyTotal) * 100);
                  return (
                    <div key={i} className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-900">{item.productName}</span>
                        <div className="flex items-center gap-2">
                          <span className="line-through text-xs text-gray-400">₹{item.originalPrice}</span>
                          <span className="text-sm font-bold text-orange-600">₹{item.flashPrice}</span>
                          <Badge variant="orange">{item.discountPct}% off</Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${progress >= 90 ? 'bg-red-500' : progress >= 60 ? 'bg-orange-500' : 'bg-green-500'}`}
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500 whitespace-nowrap">{item.soldCount} / {item.maxQtyTotal} sold ({progress}%)</span>
                      </div>
                      <div className="text-xs text-gray-400 mt-1">Max {item.maxQtyPerUser} per user</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Create Flash Sale" width="max-w-lg">
        <form className="space-y-3" onSubmit={e => { e.preventDefault(); setShowAdd(false); }}>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Sale Title</label>
            <input type="text" placeholder="e.g. Weekend Milk Bonanza" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-400" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Start Date & Time</label>
              <input type="datetime-local" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-400" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">End Date & Time</label>
              <input type="datetime-local" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-400" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Store (leave blank for all)</label>
            <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none bg-white">
              <option value="">All Stores</option>
            </select>
          </div>
          <div className="border border-dashed border-gray-200 rounded-lg p-4 space-y-2">
            <p className="text-xs font-semibold text-gray-500 uppercase">Add Item</p>
            {[['Product SKU', 'text', 'AMUL-TAAZA-1L'], ['Flash Price (₹)', 'number', '45'], ['Max Qty Total', 'number', '500'], ['Max Qty Per User', 'number', '2']].map(([l, t, p]) => (
              <div key={l} className="flex items-center gap-2">
                <label className="text-xs text-gray-500 w-36 flex-shrink-0">{l}</label>
                <input type={t} placeholder={p} className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-orange-400" />
              </div>
            ))}
            <button type="button" className="text-xs text-orange-500 hover:underline">+ Add Another Item</button>
          </div>
          <div className="flex gap-2 pt-2">
            <button type="submit" className="flex-1 py-2 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600">Create Flash Sale</button>
            <button type="button" onClick={() => setShowAdd(false)} className="flex-1 py-2 border border-gray-200 text-sm text-gray-600 rounded-lg hover:bg-gray-50">Cancel</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
