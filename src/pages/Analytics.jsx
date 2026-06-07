import Card from '../components/ui/Card';
import StatCard from '../components/ui/StatCard';
import { BarChart2, TrendingUp, Package, Clock } from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, FunnelChart, Funnel, LabelList, Cell
} from 'recharts';
import { orderTrendData, orderFunnelData, deliverySLAData, paymentMethodData } from '../data/mockData';

const GMV_DATA = orderTrendData.map(d => ({ ...d, gmv: Math.round(d.gmv / 1000) }));

const FUNNEL_COLORS = ['#f97316', '#fb923c', '#fdba74', '#fed7aa', '#ffedd5', '#fff7ed'];

export default function Analytics() {
  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard title="7-Day Orders" value="2,081" trend={8.3} trendLabel="vs prev week" icon={BarChart2} iconColor="bg-orange-500" compact />
        <StatCard title="7-Day GMV" value="₹7.3L" trend={11.2} trendLabel="vs prev week" icon={TrendingUp} iconColor="bg-blue-500" compact />
        <StatCard title="Avg Order Value" value="₹351" trend={2.8} trendLabel="vs prev week" icon={Package} iconColor="bg-purple-500" compact />
        <StatCard title="On-Time Rate" value="87.6%" trend={3.1} trendLabel="vs prev week" icon={Clock} iconColor="bg-green-500" compact />
      </div>

      {/* GMV Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card title="Daily GMV (₹ thousands)">
          <div className="p-5">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={GMV_DATA}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#6b7280' }} />
                <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} unit="k" />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} formatter={(v) => `₹${v}k`} />
                <Bar dataKey="gmv" fill="#f97316" radius={[4, 4, 0, 0]} name="GMV" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Order Volume Trend">
          <div className="p-5">
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={orderTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#6b7280' }} />
                <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Line type="monotone" dataKey="orders" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} name="Orders Placed" />
                <Line type="monotone" dataKey="delivered" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} name="Delivered" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Funnel + SLA */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card title="Conversion Funnel">
          <div className="p-5 space-y-2">
            {orderFunnelData.map((item, i) => {
              const pct = Math.round((item.value / orderFunnelData[0].value) * 100);
              return (
                <div key={item.stage}>
                  <div className="flex justify-between text-xs text-gray-600 mb-1">
                    <span>{item.stage}</span>
                    <span className="font-medium">{item.value.toLocaleString()} ({pct}%)</span>
                  </div>
                  <div className="h-6 bg-gray-100 rounded overflow-hidden">
                    <div
                      className="h-full rounded flex items-center pl-2"
                      style={{ width: `${pct}%`, background: FUNNEL_COLORS[i] }}
                    >
                      {pct > 20 && <span className="text-white text-xs font-medium">{pct}%</span>}
                    </div>
                  </div>
                </div>
              );
            })}
            <div className="pt-2 text-xs text-gray-500">
              Cart → Order conversion: <span className="font-semibold text-gray-900">{Math.round((orderFunnelData[5].value / orderFunnelData[2].value) * 100)}%</span>
            </div>
          </div>
        </Card>

        <Card title="Delivery Time Distribution">
          <div className="p-5">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={deliverySLAData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#6b7280' }} />
                <YAxis dataKey="range" type="category" tick={{ fontSize: 11, fill: '#6b7280' }} width={60} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Bar dataKey="count" radius={[0, 4, 4, 0]} name="Orders">
                  {deliverySLAData.map((entry, i) => (
                    <Cell key={i} fill={entry.range === '< 6 min' ? '#10b981' : entry.range === '6-8 min' ? '#3b82f6' : entry.range === '8-10 min' ? '#f97316' : '#ef4444'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-2 text-xs text-center text-gray-500">
              On-time (≤ 8 min): <span className="font-semibold text-gray-900">{Math.round(((312+841)/(312+841+267+89+22))*100)}%</span> of orders
            </div>
          </div>
        </Card>
      </div>

      {/* Top Products & Store Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card title="Top Products by Revenue">
          <div className="divide-y divide-gray-100">
            {[
              { name: 'Amul Taaza Milk 1L', orders: 423, revenue: 26226 },
              { name: 'Maggi Noodles 12-pack', orders: 289, revenue: 34680 },
              { name: 'Aashirvaad Atta 5kg', orders: 201, revenue: 58290 },
              { name: 'Parle-G Biscuits 800g', orders: 387, revenue: 38313 },
              { name: 'Fortune Sunflower Oil 1L', orders: 156, revenue: 22620 },
            ].map((p, i) => (
              <div key={p.name} className="flex items-center gap-3 px-5 py-3">
                <span className="text-sm font-bold text-gray-300 w-5">#{i + 1}</span>
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">{p.name}</div>
                  <div className="text-xs text-gray-400">{p.orders} orders</div>
                </div>
                <span className="text-sm font-bold text-gray-900">₹{p.revenue.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Store Performance">
          <div className="divide-y divide-gray-100">
            {[
              { name: 'HSR Layout Store', orders: 1203, gmv: 421050, sla: 94 },
              { name: 'Koramangala Store', orders: 987, gmv: 345450, sla: 91 },
              { name: 'Indiranagar Store', orders: 654, gmv: 228900, sla: 88 },
              { name: 'JP Nagar Store', orders: 543, gmv: 190050, sla: 85 },
              { name: 'Whitefield Store', orders: 0, gmv: 0, sla: 0 },
            ].map(s => (
              <div key={s.name} className="flex items-center gap-3 px-5 py-3">
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">{s.name}</div>
                  <div className="text-xs text-gray-400">{s.orders} orders · ₹{s.gmv.toLocaleString()} GMV</div>
                </div>
                <div className={`text-xs font-bold px-2 py-0.5 rounded-full ${s.sla >= 90 ? 'bg-green-100 text-green-700' : s.sla >= 80 ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-400'}`}>
                  {s.sla > 0 ? `${s.sla}% SLA` : 'N/A'}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
