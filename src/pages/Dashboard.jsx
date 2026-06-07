import { ShoppingCart, IndianRupee, Users, Clock, Package, AlertTriangle, CheckCircle, Zap } from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, FunnelChart, Funnel, LabelList
} from 'recharts';
import StatCard from '../components/ui/StatCard';
import Card from '../components/ui/Card';
import Badge, { statusVariant } from '../components/ui/Badge';
import {
  orderTrendData, deliverySLAData, paymentMethodData, orderFunnelData,
  orders, inventory, stores, partners
} from '../data/mockData';

const PIE_COLORS = ['#f97316', '#3b82f6', '#8b5cf6', '#10b981', '#6b7280'];

const recentOrders = orders.slice(0, 5);
const lowStockItems = inventory.filter(i => i.quantity <= i.lowStockAlert && i.quantity > 0);
const outOfStock = inventory.filter(i => i.quantity === 0);
const availablePartners = partners.filter(p => p.status === 'available').length;
const onOrderPartners = partners.filter(p => p.status === 'on_order').length;

export default function Dashboard() {
  return (
    <div className="space-y-6">
      {/* KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Orders Today" value="210" sub="vs 365 yesterday" trend={-42.5} trendLabel="vs yesterday" icon={ShoppingCart} iconColor="bg-orange-500" />
        <StatCard title="GMV Today" value="₹73,500" sub="Avg ₹350 / order" trend={-42.2} trendLabel="vs yesterday" icon={IndianRupee} iconColor="bg-blue-500" />
        <StatCard title="Active Users" value="4,210" sub="Peak concurrent: 820" trend={12.4} trendLabel="vs last week" icon={Users} iconColor="bg-purple-500" />
        <StatCard title="Avg Delivery" value="7.2 min" sub="SLA target: 8 min" trend={5.1} trendLabel="improvement" icon={Clock} iconColor="bg-green-500" />
      </div>

      {/* Second row KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Payment Success" value="96.8%" sub="3.2% failed today" trend={1.2} compact icon={IndianRupee} iconColor="bg-green-500" />
        <StatCard title="Available Partners" value={`${availablePartners} / ${partners.length}`} sub={`${onOrderPartners} on order`} icon={CheckCircle} iconColor="bg-teal-500" compact />
        <StatCard title="Low Stock Items" value={lowStockItems.length} sub={`${outOfStock.length} out of stock`} icon={AlertTriangle} iconColor="bg-yellow-500" compact />
        <StatCard title="Active Stores" value={stores.filter(s => s.status === 'active').length + ' / ' + stores.length} sub="1 in maintenance" icon={Package} iconColor="bg-indigo-500" compact />
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Order trend */}
        <Card title="Orders — Last 7 Days" className="lg:col-span-2">
          <div className="p-5">
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={orderTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#6b7280' }} />
                <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Line type="monotone" dataKey="orders" stroke="#f97316" strokeWidth={2} dot={{ r: 3 }} name="Orders" />
                <Line type="monotone" dataKey="delivered" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} name="Delivered" />
              </LineChart>
            </ResponsiveContainer>
            <div className="flex gap-4 mt-2 justify-center">
              <div className="flex items-center gap-1.5 text-xs text-gray-500"><span className="w-3 h-0.5 bg-orange-500 rounded inline-block" /> Orders placed</div>
              <div className="flex items-center gap-1.5 text-xs text-gray-500"><span className="w-3 h-0.5 bg-green-500 rounded inline-block" /> Delivered</div>
            </div>
          </div>
        </Card>

        {/* Payment methods */}
        <Card title="Payment Methods">
          <div className="p-5">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={paymentMethodData} dataKey="value" nameKey="method" cx="50%" cy="50%" outerRadius={80} innerRadius={45} paddingAngle={3}>
                  {paymentMethodData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v) => `${v}%`} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 gap-1 mt-2">
              {paymentMethodData.map((d, i) => (
                <div key={d.method} className="flex items-center gap-1.5 text-xs text-gray-600">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: PIE_COLORS[i] }} />
                  {d.method} {d.value}%
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Delivery SLA */}
        <Card title="Delivery SLA Distribution">
          <div className="p-5">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={deliverySLAData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#6b7280' }} />
                <YAxis dataKey="range" type="category" tick={{ fontSize: 11, fill: '#6b7280' }} width={60} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} name="Orders" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Recent orders */}
        <Card title="Recent Orders" action={<a href="/orders" className="text-xs text-orange-500 hover:underline">View all →</a>} className="lg:col-span-2">
          <div className="divide-y divide-gray-100">
            {recentOrders.map(order => (
              <div key={order.id} className="flex items-center gap-3 px-5 py-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-medium text-gray-900">{order.orderNumber.slice(-8)}</span>
                    <Badge variant={statusVariant(order.status)} dot>{order.status.replace(/_/g, ' ')}</Badge>
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">{order.userName} · {order.storeName}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-gray-900">₹{order.totalAmount}</div>
                  <div className="text-xs text-gray-400">{order.paymentMethod.toUpperCase()}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Alerts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Low stock alerts */}
        <Card title="Stock Alerts" action={<Badge variant="red">{outOfStock.length} OOS</Badge>}>
          <div className="divide-y divide-gray-100">
            {outOfStock.map(item => (
              <div key={item.id + 'oos'} className="flex items-center justify-between px-5 py-3">
                <div>
                  <div className="text-sm font-medium text-gray-900">{item.productName}</div>
                  <div className="text-xs text-gray-500">{item.storeName} · {item.sku}</div>
                </div>
                <Badge variant="red" dot>Out of Stock</Badge>
              </div>
            ))}
            {lowStockItems.slice(0, 3).map(item => (
              <div key={item.id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <div className="text-sm font-medium text-gray-900">{item.productName}</div>
                  <div className="text-xs text-gray-500">{item.storeName} · {item.sku}</div>
                </div>
                <Badge variant="yellow" dot>Low: {item.quantity} left</Badge>
              </div>
            ))}
            {lowStockItems.length === 0 && outOfStock.length === 0 && (
              <div className="px-5 py-6 text-center text-sm text-gray-400">All stock levels healthy</div>
            )}
          </div>
        </Card>

        {/* Store capacity */}
        <Card title="Store Live Load">
          <div className="divide-y divide-gray-100">
            {stores.map(store => {
              const pct = Math.round((store.activeOrders / store.maxOrders) * 100);
              return (
                <div key={store.id} className="px-5 py-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <div>
                      <span className="text-sm font-medium text-gray-900">{store.name}</span>
                      <span className="ml-2 text-xs text-gray-400">{store.code}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">{store.activeOrders}/{store.maxOrders}</span>
                      <Badge variant={statusVariant(store.status)}>{store.status}</Badge>
                    </div>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${pct >= 80 ? 'bg-red-500' : pct >= 60 ? 'bg-yellow-500' : 'bg-green-500'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}
