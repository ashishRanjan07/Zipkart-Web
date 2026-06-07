import { useState } from 'react';
import { Search, Shield } from 'lucide-react';
import Card from '../components/ui/Card';
import Table from '../components/ui/Table';
import Badge from '../components/ui/Badge';
import StatCard from '../components/ui/StatCard';
import { auditLogs } from '../data/mockData';

const actionVariant = (action) => {
  if (['login', 'otp_verified', 'device_registered'].includes(action)) return 'green';
  if (['logout', 'token_revoked'].includes(action)) return 'gray';
  if (['order_placed', 'payment_completed'].includes(action)) return 'blue';
  if (['refund_requested'].includes(action)) return 'orange';
  return 'purple';
};

export default function AuditLogs() {
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('all');

  const allActions = [...new Set(auditLogs.map(l => l.action))];

  const filtered = auditLogs.filter(l => {
    const matchSearch = l.userName.toLowerCase().includes(search.toLowerCase()) ||
      l.ip.includes(search) || l.action.includes(search);
    const matchAction = actionFilter === 'all' || l.action === actionFilter;
    return matchSearch && matchAction;
  });

  const columns = [
    { key: 'createdAt', label: 'Time', render: (v) => <span className="text-xs font-mono text-gray-500">{v}</span> },
    { key: 'userName', label: 'User', render: (v, row) => (
      <div>
        <div className="text-sm font-medium text-gray-900">{v}</div>
        <div className="text-xs text-gray-400 font-mono">{row.userId}</div>
      </div>
    )},
    { key: 'action', label: 'Action', render: (v) => <Badge variant={actionVariant(v)}>{v.replace(/_/g, ' ')}</Badge> },
    { key: 'resourceType', label: 'Resource', render: (v, row) => v ? (
      <div><span className="text-xs font-medium capitalize text-gray-700">{v}</span><div className="text-xs text-gray-400 font-mono">{row.resourceId?.slice(-8)}</div></div>
    ) : '—' },
    { key: 'ip', label: 'IP Address', render: (v) => <span className="font-mono text-xs text-gray-500">{v}</span> },
    { key: 'metadata', label: 'Metadata', render: (v) => (
      <span className="text-xs text-gray-400 truncate max-w-48 block" title={JSON.stringify(v)}>
        {JSON.stringify(v).slice(0, 60)}{JSON.stringify(v).length > 60 ? '…' : ''}
      </span>
    )},
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <StatCard title="Total Events" value={auditLogs.length} icon={Shield} iconColor="bg-blue-500" compact />
        <StatCard title="Login Events" value={auditLogs.filter(l=>l.action==='login').length} icon={Shield} iconColor="bg-green-500" compact />
        <StatCard title="Order Events" value={auditLogs.filter(l=>l.action==='order_placed').length} icon={Shield} iconColor="bg-orange-500" compact />
      </div>

      <Card>
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-orange-400"
              placeholder="Search user, IP, action..."
            />
          </div>
          <select value={actionFilter} onChange={e => setActionFilter(e.target.value)} className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none bg-white">
            <option value="all">All Actions</option>
            {allActions.map(a => <option key={a} value={a}>{a.replace(/_/g, ' ')}</option>)}
          </select>
          <span className="text-xs text-gray-400 ml-auto">{filtered.length} events</span>
        </div>
        <Table columns={columns} data={filtered} />
      </Card>
    </div>
  );
}
