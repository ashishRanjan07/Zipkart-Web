import { useState } from 'react';
import { Bell, Send, Search } from 'lucide-react';
import Card from '../components/ui/Card';
import Table from '../components/ui/Table';
import Badge, { statusVariant } from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import StatCard from '../components/ui/StatCard';
import { notifications, notificationHealthData } from '../data/mockData';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function Notifications() {
  const [tab, setTab] = useState('logs');
  const [search, setSearch] = useState('');
  const [channelFilter, setChannelFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showSend, setShowSend] = useState(false);

  const filtered = notifications.filter(n => {
    const matchSearch = n.userName.toLowerCase().includes(search.toLowerCase()) || n.eventType.includes(search);
    const matchChannel = channelFilter === 'all' || n.channel === channelFilter;
    const matchStatus = statusFilter === 'all' || n.status === statusFilter;
    return matchSearch && matchChannel && matchStatus;
  });

  const delivered = notifications.filter(n => n.status === 'delivered').length;
  const failed = notifications.filter(n => n.status === 'failed').length;
  const deliveryRate = Math.round((delivered / notifications.length) * 100);

  const channelBadge = (c) => {
    const v = { push: 'blue', sms: 'green', email: 'purple', in_app: 'gray' };
    return <Badge variant={v[c] ?? 'gray'}>{c}</Badge>;
  };

  const columns = [
    { key: 'userName', label: 'User' },
    { key: 'channel', label: 'Channel', render: (v) => channelBadge(v) },
    { key: 'eventType', label: 'Event', render: (v) => <span className="font-mono text-xs text-gray-600">{v}</span> },
    { key: 'title', label: 'Title', render: (v) => <span className="text-sm truncate max-w-48 block">{v || '—'}</span> },
    { key: 'status', label: 'Status', render: (v) => <Badge variant={statusVariant(v)} dot>{v}</Badge> },
    { key: 'platform', label: 'Platform', render: (v) => v ? <Badge variant="gray">{v}</Badge> : '—' },
    { key: 'queuedAt', label: 'Queued At', render: (v) => <span className="text-xs text-gray-400">{v}</span> },
    { key: 'deliveredAt', label: 'Delivered At', render: (v) => <span className="text-xs text-gray-400">{v || '—'}</span> },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-4">
        <StatCard title="Total Sent" value={notifications.length} icon={Bell} iconColor="bg-blue-500" compact />
        <StatCard title="Delivered" value={delivered} icon={Bell} iconColor="bg-green-500" compact />
        <StatCard title="Failed" value={failed} icon={Bell} iconColor="bg-red-500" compact />
        <StatCard title="Delivery Rate" value={`${deliveryRate}%`} icon={Bell} iconColor="bg-orange-500" compact />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        {['logs', 'health', 'send'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm font-medium capitalize border-b-2 transition-colors ${tab === t ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {t === 'send' ? 'Send Notification' : t === 'health' ? 'Channel Health' : 'Logs'}
          </button>
        ))}
      </div>

      {tab === 'logs' && (
        <Card>
          <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 flex-wrap">
            <div className="relative flex-1 min-w-48">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-orange-400" placeholder="Search user or event..." />
            </div>
            <select value={channelFilter} onChange={e => setChannelFilter(e.target.value)} className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none bg-white">
              {['all', 'push', 'sms', 'email', 'in_app'].map(c => <option key={c} value={c}>{c === 'all' ? 'All Channels' : c}</option>)}
            </select>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none bg-white">
              {['all', 'queued', 'sent', 'delivered', 'failed'].map(s => <option key={s} value={s}>{s === 'all' ? 'All Status' : s}</option>)}
            </select>
          </div>
          <Table columns={columns} data={filtered} />
        </Card>
      )}

      {tab === 'health' && (
        <Card title="Delivery Rate by Channel — Last 7 Days">
          <div className="p-5">
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={notificationHealthData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#6b7280' }} />
                <YAxis domain={[80, 100]} tick={{ fontSize: 11, fill: '#6b7280' }} unit="%" />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} formatter={(v) => `${v}%`} />
                <Line type="monotone" dataKey="push" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} name="Push (FCM)" />
                <Line type="monotone" dataKey="sms" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} name="SMS (MSG91)" />
                <Line type="monotone" dataKey="email" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 3 }} name="Email (SES)" />
              </LineChart>
            </ResponsiveContainer>
            <div className="flex gap-6 justify-center mt-2">
              {[['Push (FCM)', '#3b82f6'], ['SMS (MSG91)', '#10b981'], ['Email (SES)', '#8b5cf6']].map(([l, c]) => (
                <div key={l} className="flex items-center gap-1.5 text-xs text-gray-500"><span className="w-3 h-0.5 rounded inline-block" style={{ background: c }} />{l}</div>
              ))}
            </div>

            {/* Token health summary */}
            <div className="mt-6 grid grid-cols-3 gap-4">
              {[['FCM Tokens', '12,341 active', '89 invalid today', 'bg-blue-50 border-blue-200'], ['SMS Gateway', 'MSG91 · DLT active', '99.1% delivery rate', 'bg-green-50 border-green-200'], ['Email SES', 'SES AP-South-1', '97.4% delivery rate', 'bg-purple-50 border-purple-200']].map(([title, sub1, sub2, cls]) => (
                <div key={title} className={`border rounded-lg p-3 ${cls}`}>
                  <div className="text-sm font-semibold text-gray-900">{title}</div>
                  <div className="text-xs text-gray-600 mt-0.5">{sub1}</div>
                  <div className="text-xs text-gray-400">{sub2}</div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {tab === 'send' && (
        <Card title="Send Bulk Notification">
          <div className="p-5 max-w-lg space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Target Audience</label>
              <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none bg-white">
                <option>All Users</option>
                <option>Active Users (last 7 days)</option>
                <option>Users with pending orders</option>
                <option>Specific User IDs (CSV)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Channel</label>
              <div className="flex gap-3">
                {['push', 'sms', 'email'].map(c => (
                  <label key={c} className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" className="rounded border-gray-300 accent-orange-500" defaultChecked={c === 'push'} />
                    <span className="capitalize">{c}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Notification Title</label>
              <input type="text" placeholder="e.g. Weekend Flash Sale is Live!" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-400" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Message Body</label>
              <textarea rows={3} placeholder="Enter notification message..." className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-400 resize-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Deep Link (optional)</label>
              <input type="text" placeholder="zipkart://flash-sale" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-400" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Schedule</label>
              <div className="flex gap-2">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="radio" name="schedule" defaultChecked className="accent-orange-500" /> Send Now
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="radio" name="schedule" className="accent-orange-500" /> Schedule
                </label>
              </div>
            </div>
            <button className="w-full py-2.5 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600 transition-colors flex items-center justify-center gap-2">
              <Send size={14} /> Send Notification
            </button>
          </div>
        </Card>
      )}
    </div>
  );
}
