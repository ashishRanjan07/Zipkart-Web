import { useState, useEffect, useCallback } from 'react';
import {
  Search, RefreshCw, ChevronLeft, ChevronRight, X, Eye,
  ShoppingBag, Truck, CheckCircle, XCircle, Clock, AlertTriangle,
  MapPin, User, CreditCard, Tag, FileText, UserCheck, Package,
} from 'lucide-react';
import Card from '../components/ui/Card';
import Table from '../components/ui/Table';
import Badge from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import api from '../lib/apiClient';
import toast from '../lib/toast';

// ─── Constants ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 20;

// Use local calendar date so IST/other timezones don't bleed into yesterday.
function localDateString(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
const TODAY = localDateString();

const STATUS_TABS = [
  { key: 'all', label: 'All' },
  { key: 'placed', label: 'Placed' },
  { key: 'accepted_by_store', label: 'Accepted' },
  { key: 'picking', label: 'Picking' },
  { key: 'packed', label: 'Packed' },
  { key: 'out_for_delivery', label: 'Out for Delivery' },
  { key: 'delivered', label: 'Delivered' },
  { key: 'cancelled', label: 'Cancelled' },
  { key: 'failed_delivery', label: 'Failed' },
  { key: 'return_requested', label: 'Returns' },
];

const CANCEL_REASONS = [
  { value: 'customer_request', label: 'Customer Request' },
  { value: 'item_out_of_stock', label: 'Item Out of Stock' },
  { value: 'store_capacity_full', label: 'Store Capacity Full' },
  { value: 'payment_failure', label: 'Payment Failure' },
  { value: 'delivery_address_unserviceable', label: 'Address Unserviceable' },
  { value: 'partner_not_available', label: 'Partner Not Available' },
  { value: 'admin_cancelled', label: 'Admin Cancelled' },
  { value: 'fraud_detected', label: 'Fraud Detected' },
  { value: 'customer_unreachable', label: 'Customer Unreachable' },
];

const STATUS_FLOW = [
  'placed', 'accepted_by_store', 'picking', 'packed',
  'ready_for_pickup', 'assigned_to_partner', 'out_for_delivery', 'delivered',
];

const NEXT_STATUSES = {
  placed: ['accepted_by_store'],
  accepted_by_store: ['picking'],
  picking: ['packed'],
  packed: ['ready_for_pickup'],
  ready_for_pickup: ['assigned_to_partner'],
  assigned_to_partner: ['out_for_delivery'],
  out_for_delivery: ['delivered', 'failed_delivery'],
  failed_delivery: ['out_for_delivery'],
  return_requested: ['return_picked'],
  return_picked: ['return_processed'],
};

const CANCELLABLE = new Set(['placed', 'accepted_by_store', 'picking', 'packed', 'ready_for_pickup']);
const PARTNER_ASSIGNABLE = new Set(['packed', 'ready_for_pickup']);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtStatus(s) {
  if (!s) return '—';
  return s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function fmtCurrency(v) {
  if (v == null) return '—';
  return `₹${Number(v).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtDateTime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
  });
}

function orderStatusVariant(status) {
  const map = {
    pending_payment: 'yellow', payment_failed: 'red',
    placed: 'blue', accepted_by_store: 'blue',
    picking: 'blue', packed: 'blue', ready_for_pickup: 'blue',
    assigned_to_partner: 'orange', out_for_delivery: 'orange',
    delivered: 'green', cancelled: 'gray',
    return_requested: 'yellow', return_picked: 'yellow', return_processed: 'green',
    failed_delivery: 'red',
  };
  return map[status] ?? 'gray';
}

function slaVariant(s) {
  return s === 'within_sla' ? 'green' : s === 'at_risk' ? 'yellow' : 'red';
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [metrics, setMetrics] = useState(null);
  const [metricsLoading, setMetricsLoading] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState(TODAY);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [modal, setModal] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => { setPage(1); }, [statusFilter, dateFilter]);

  const fetchMetrics = useCallback(async () => {
    setMetricsLoading(true);
    try {
      const res = await api.get('/admin/orders/metrics', { params: { date: dateFilter } });
      setMetrics(res?.data?.summary ?? null);
    } catch {
      // silent — metrics are non-critical
    } finally {
      setMetricsLoading(false);
    }
  }, [dateFilter]);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: PAGE_SIZE };
      if (statusFilter !== 'all') params.status = statusFilter;
      if (search.trim()) params.search = search.trim();
      if (dateFilter) params.date = dateFilter;
      const res = await api.get('/admin/orders', { params });
      setOrders(res?.data?.orders ?? []);
      setTotal(res?.data?.total ?? 0);
    } catch (err) {
      toast.error(err.message ?? 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, search, dateFilter]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);
  useEffect(() => { fetchMetrics(); }, [fetchMetrics]);

  const openDetail = async (row) => {
    setShowDetail(true);
    setDetailLoading(true);
    setSelectedOrder(null);
    try {
      const res = await api.get(`/admin/orders/${row._id}`);
      setSelectedOrder(res?.data?.order ?? null);
    } catch (err) {
      toast.error(err.message ?? 'Failed to load order details');
      setShowDetail(false);
    } finally {
      setDetailLoading(false);
    }
  };

  const refreshDetail = useCallback(async () => {
    if (!selectedOrder?._id) return;
    try {
      const res = await api.get(`/admin/orders/${selectedOrder._id}`);
      setSelectedOrder(res?.data?.order ?? null);
      fetchOrders();
    } catch {
      toast.error('Failed to refresh order');
    }
  }, [selectedOrder, fetchOrders]);

  // ── Actions ─────────────────────────────────────────────────────────────────

  const handleUpdateStatus = async ({ status, note }) => {
    setSaving(true);
    try {
      await api.patch(`/admin/orders/${selectedOrder._id}/status`, { status, note });
      toast.success(`Status updated to ${fmtStatus(status)}`);
      setModal(null);
      refreshDetail();
    } catch (err) {
      toast.error(err.message ?? 'Failed to update status');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = async ({ reason, reason_note, refund_amount }) => {
    setSaving(true);
    try {
      await api.post(`/admin/orders/${selectedOrder._id}/cancel`, {
        reason, reason_note, refund_amount: Number(refund_amount),
      });
      toast.success('Order cancelled successfully');
      setModal(null);
      refreshDetail();
    } catch (err) {
      toast.error(err.message ?? 'Failed to cancel order');
    } finally {
      setSaving(false);
    }
  };

  const handleAssignPartner = async (payload) => {
    setSaving(true);
    try {
      await api.patch(`/admin/orders/${selectedOrder._id}/assign-partner`, payload);
      toast.success('Delivery partner assigned');
      setModal(null);
      refreshDetail();
    } catch (err) {
      toast.error(err.message ?? 'Failed to assign partner');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateNotes = async ({ admin_notes, internal_tags }) => {
    setSaving(true);
    try {
      await api.patch(`/admin/orders/${selectedOrder._id}/notes`, { admin_notes, internal_tags });
      toast.success('Notes updated');
      setModal(null);
      refreshDetail();
    } catch (err) {
      toast.error(err.message ?? 'Failed to update notes');
    } finally {
      setSaving(false);
    }
  };

  // ── Table columns ────────────────────────────────────────────────────────────

  const columns = [
    {
      key: 'order_display_id', label: 'Order ID',
      render: (v) => <span className="font-mono text-xs font-semibold text-gray-900">{v}</span>,
    },
    {
      key: 'customer_name', label: 'Customer',
      render: (v, row) => (
        <div>
          <div className="text-sm font-medium text-gray-900">{v}</div>
          <div className="text-xs text-gray-400 font-mono">{row.customer_phone_masked}</div>
        </div>
      ),
    },
    {
      key: 'dark_store_name', label: 'Store',
      render: (v) => <span className="text-xs text-gray-600">{v}</span>,
    },
    {
      key: 'status', label: 'Status',
      render: (v, row) => (
        <div className="flex flex-col gap-1">
          <Badge variant={orderStatusVariant(v)} dot>{fmtStatus(v)}</Badge>
          {row.sla_status && row.sla_status !== 'within_sla' && (
            <Badge variant={slaVariant(row.sla_status)}>{fmtStatus(row.sla_status)}</Badge>
          )}
        </div>
      ),
    },
    {
      key: 'total_amount', label: 'Amount',
      render: (v) => <span className="font-semibold text-gray-900">{fmtCurrency(v)}</span>,
    },
    {
      key: 'payment_method', label: 'Payment',
      render: (v, row) => (
        <div className="space-y-0.5">
          <div className="uppercase text-xs font-medium text-gray-700">{v?.replace(/_/g, ' ')}</div>
          <Badge variant={row.payment_status === 'paid' ? 'green' : row.payment_status?.includes('fail') ? 'red' : 'yellow'}>
            {row.payment_status}
          </Badge>
        </div>
      ),
    },
    {
      key: 'placed_at', label: 'Placed At',
      render: (v) => <span className="text-xs text-gray-500">{fmtDateTime(v)}</span>,
    },
    {
      key: 'delivery_partner_name', label: 'Partner',
      render: (v) => v
        ? <span className="text-xs text-gray-700">{v}</span>
        : <span className="text-xs text-gray-300">Unassigned</span>,
    },
    {
      key: '_id', label: '', width: '40px',
      render: (_, row) => (
        <button
          onClick={e => { e.stopPropagation(); openDetail(row); }}
          className="p-1.5 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
        >
          <Eye size={14} />
        </button>
      ),
    },
  ];

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-4">
      {/* Metrics */}
      <MetricsBar
        metrics={metrics}
        loading={metricsLoading}
        date={dateFilter}
        onDateChange={(d) => setDateFilter(d)}
      />

      {/* Status Tabs */}
      <div className="flex gap-2 flex-wrap">
        {STATUS_TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setStatusFilter(tab.key)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
              statusFilter === tab.key
                ? 'bg-orange-500 text-white border-orange-500'
                : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Table Card */}
      <Card>
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-orange-400"
              placeholder="Search by order ID or customer name…"
            />
          </div>
          <button
            onClick={fetchOrders}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-gray-600 disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
          <span className="text-xs text-gray-400 ml-auto">{total.toLocaleString()} orders</span>
        </div>

        <Table
          columns={columns}
          data={orders}
          onRowClick={openDetail}
          emptyMessage={loading ? 'Loading orders…' : 'No orders found.'}
        />

        {total > PAGE_SIZE && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
            <span className="text-xs text-gray-500">
              Page {page} of {totalPages} · {total.toLocaleString()} total
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={14} />
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </Card>

      {/* Detail Slide-out */}
      {showDetail && (
        <OrderDetailPanel
          order={selectedOrder}
          loading={detailLoading}
          onClose={() => { setShowDetail(false); setSelectedOrder(null); }}
          onAction={(type) => setModal({ type })}
        />
      )}

      {/* Action Modals */}
      <UpdateStatusModal
        open={modal?.type === 'status'}
        order={selectedOrder}
        onClose={() => setModal(null)}
        onConfirm={handleUpdateStatus}
        saving={saving}
      />
      <CancelOrderModal
        open={modal?.type === 'cancel'}
        order={selectedOrder}
        onClose={() => setModal(null)}
        onConfirm={handleCancel}
        saving={saving}
      />
      <AssignPartnerModal
        open={modal?.type === 'partner'}
        onClose={() => setModal(null)}
        onConfirm={handleAssignPartner}
        saving={saving}
      />
      <UpdateNotesModal
        open={modal?.type === 'notes'}
        order={selectedOrder}
        onClose={() => setModal(null)}
        onConfirm={handleUpdateNotes}
        saving={saving}
      />
    </div>
  );
}

// ─── Metrics Bar ──────────────────────────────────────────────────────────────

const IN_PROGRESS_KEYS = [
  'placed', 'accepted_by_store', 'picking', 'packed',
  'ready_for_pickup', 'assigned_to_partner', 'out_for_delivery',
];

function fmtGmv(v) {
  if (v == null) return null;
  if (v >= 10_00_000) return `₹${(v / 10_00_000).toFixed(1)}L`;  // 10L+
  if (v >= 1_000)     return `₹${(v / 1_000).toFixed(1)}K`;       // 1K+
  return `₹${v}`;
}

function MetricsBar({ metrics: m, loading, date, onDateChange }) {
  const inProgress = m
    ? IN_PROGRESS_KEYS.reduce((sum, k) => sum + (m[k] ?? 0), 0)
    : null;

  const displayDate = date
    ? new Date(`${date}T00:00:00`).toLocaleDateString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric',
      })
    : '';

  return (
    <div>
      <div className="flex items-center gap-3 mb-3">
        <h2 className="text-sm font-semibold text-gray-700">Daily Overview</h2>
        <span className="text-xs text-gray-400 font-medium">{displayDate}</span>
        <input
          type="date"
          value={date}
          max={localDateString()}
          onChange={e => onDateChange(e.target.value)}
          className="ml-auto text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-orange-400"
        />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        <MetricTile
          label="Total Orders"
          value={m?.total_orders_today}
          icon={ShoppingBag}
          color="bg-blue-500"
          loading={loading}
        />
        <MetricTile
          label="Delivered"
          value={m?.delivered_today}
          icon={CheckCircle}
          color="bg-green-500"
          loading={loading}
        />
        <MetricTile
          label="In Progress"
          value={inProgress}
          sub={inProgress > 0 ? `${m?.out_for_delivery ?? 0} out for delivery` : undefined}
          icon={Truck}
          color="bg-orange-500"
          loading={loading}
        />
        <MetricTile
          label="Cancelled"
          value={m?.cancelled_today}
          sub={m?.cancel_rate_pct != null ? `${m.cancel_rate_pct}% cancel rate` : undefined}
          icon={XCircle}
          color="bg-gray-400"
          loading={loading}
        />
        <MetricTile
          label="SLA Breaches"
          value={m?.sla_breach_count}
          sub={m?.sla_breach_pct != null ? `${m.sla_breach_pct}% of orders` : undefined}
          icon={AlertTriangle}
          color="bg-red-500"
          loading={loading}
        />
        <MetricTile
          label="Avg. Delivery"
          value={m?.avg_delivery_time_minutes != null ? `${m.avg_delivery_time_minutes}m` : null}
          icon={Clock}
          color="bg-purple-500"
          loading={loading}
        />
        <MetricTile
          label="GMV"
          value={fmtGmv(m?.total_gmv_today)}
          sub={m?.total_discount_given > 0 ? `₹${m.total_discount_given} discounts` : undefined}
          icon={CreditCard}
          color="bg-emerald-500"
          loading={loading}
        />
      </div>
    </div>
  );
}

function MetricTile({ label, value, sub, icon: Icon, color, loading }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide leading-tight">{label}</p>
          <p className={`text-xl font-bold text-gray-900 mt-1 ${loading ? 'opacity-40' : ''}`}>
            {loading ? '…' : (value ?? '—')}
          </p>
          {!loading && sub && (
            <p className="text-xs text-gray-400 mt-0.5 truncate">{sub}</p>
          )}
        </div>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${color}`}>
          <Icon size={15} className="text-white" />
        </div>
      </div>
    </div>
  );
}

// ─── Order Detail Panel ───────────────────────────────────────────────────────

function OrderDetailPanel({ order, loading, onClose, onAction }) {
  return (
    <div className="fixed inset-0 z-40 flex">
      <div className="flex-1 bg-black/30 cursor-pointer" onClick={onClose} />
      <div className="w-full max-w-2xl bg-white shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-200 shrink-0 bg-white">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-sm font-bold text-gray-900">
                {order?.order_display_id ?? '…'}
              </span>
              {order?.status && (
                <Badge variant={orderStatusVariant(order.status)} dot>
                  {fmtStatus(order.status)}
                </Badge>
              )}
              {order?.sla_status && order.sla_status !== 'within_sla' && (
                <Badge variant={slaVariant(order.sla_status)}>{fmtStatus(order.sla_status)}</Badge>
              )}
              {order?.is_priority_order && <Badge variant="orange">Priority</Badge>}
            </div>
            {order?.placed_at && (
              <p className="text-xs text-gray-400 mt-0.5">Placed {fmtDateTime(order.placed_at)}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center text-sm text-gray-400">
            Loading order details…
          </div>
        ) : !order ? null : (
          <div className="flex-1 overflow-y-auto">

            {/* Status Timeline */}
            <div className="px-6 py-5 border-b border-gray-100">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">Order Progress</p>
              <StatusTimeline currentStatus={order.status} />
            </div>

            {/* Customer & Delivery Info */}
            <div className="px-6 py-5 border-b border-gray-100 grid grid-cols-2 gap-6">
              <div>
                <SectionLabel icon={User}>Customer</SectionLabel>
                <div className="space-y-1.5">
                  <DetailRow label="Name"  value={order.customer_name} />
                  <DetailRow label="Phone" value={order.customer_phone_masked} mono />
                  <DetailRow label="Email" value={order.customer_email_masked} mono />
                  <DetailRow label="Tier"  value={
                    <Badge variant={order.customer_tier === 'gold' ? 'yellow' : order.customer_tier === 'platinum' ? 'purple' : 'gray'}>
                      {order.customer_tier}
                    </Badge>
                  } />
                </div>
              </div>
              <div>
                <SectionLabel icon={Package}>Store & Partner</SectionLabel>
                <div className="space-y-1.5">
                  <DetailRow label="Store"   value={order.dark_store_name} />
                  <DetailRow label="Zone"    value={order.delivery_zone} />
                  <DetailRow label="Partner" value={order.delivery_partner_name ?? <span className="text-gray-400">Unassigned</span>} />
                  {order.delivery_partner_code && (
                    <DetailRow label="Code" value={order.delivery_partner_code} mono />
                  )}
                  <DetailRow label="Source" value={
                    <span className="uppercase text-xs font-medium">{order.order_source?.replace(/_/g, ' ')}</span>
                  } />
                </div>
              </div>
            </div>

            {/* Delivery Address */}
            {order.delivery_address_snapshot && (
              <div className="px-6 py-5 border-b border-gray-100">
                <SectionLabel icon={MapPin}>Delivery Address</SectionLabel>
                <p className="text-sm text-gray-700 leading-relaxed">
                  {[
                    order.delivery_address_snapshot.flat_house_no,
                    order.delivery_address_snapshot.building_name,
                    order.delivery_address_snapshot.street,
                    order.delivery_address_snapshot.area,
                    order.delivery_address_snapshot.city,
                    order.delivery_address_snapshot.state,
                    order.delivery_address_snapshot.pincode,
                  ].filter(Boolean).join(', ')}
                </p>
                {order.delivery_address_snapshot.delivery_instructions && (
                  <p className="mt-1.5 text-xs text-gray-400 italic">
                    "{order.delivery_address_snapshot.delivery_instructions}"
                  </p>
                )}
              </div>
            )}

            {/* Items */}
            <div className="px-6 py-5 border-b border-gray-100">
              <SectionLabel icon={ShoppingBag}>Items ({order.items_count ?? order.items?.length ?? 0})</SectionLabel>
              <div className="border border-gray-100 rounded-lg overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left text-gray-500 px-3 py-2 font-medium">Product</th>
                      <th className="text-right text-gray-500 px-3 py-2 font-medium">Qty</th>
                      <th className="text-right text-gray-500 px-3 py-2 font-medium">MRP</th>
                      <th className="text-right text-gray-500 px-3 py-2 font-medium">Price</th>
                      <th className="text-right text-gray-500 px-3 py-2 font-medium">Total</th>
                      <th className="text-center text-gray-500 px-3 py-2 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.items?.map((item, i) => (
                      <tr key={item.order_item_id ?? i} className="border-t border-gray-100">
                        <td className="px-3 py-2.5">
                          <div className="font-medium text-gray-900">{item.product_name}</div>
                          <div className="text-gray-400">{item.brand} · {item.sku}</div>
                        </td>
                        <td className="px-3 py-2.5 text-right font-medium">×{item.quantity}</td>
                        <td className="px-3 py-2.5 text-right text-gray-400 line-through">{fmtCurrency(item.mrp)}</td>
                        <td className="px-3 py-2.5 text-right">{fmtCurrency(item.selling_price)}</td>
                        <td className="px-3 py-2.5 text-right font-semibold text-gray-900">{fmtCurrency(item.line_total_selling)}</td>
                        <td className="px-3 py-2.5 text-center">
                          {item.is_missing   ? <Badge variant="red">Missing</Badge>
                            : item.is_damaged ? <Badge variant="yellow">Damaged</Badge>
                            : item.is_returned ? <Badge variant="purple">Returned</Badge>
                            : item.is_delivered ? <Badge variant="green">Delivered</Badge>
                            : <Badge variant="gray">Pending</Badge>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Financial Summary */}
            <div className="px-6 py-5 border-b border-gray-100">
              <SectionLabel icon={CreditCard}>Financial Summary</SectionLabel>
              <div className="bg-gray-50 rounded-lg px-4 py-3 space-y-2 text-sm">
                <FinRow label="Subtotal"       value={fmtCurrency(order.subtotal)} />
                <FinRow label="Delivery Fee"   value={fmtCurrency(order.delivery_fee)} />
                <FinRow label="Packaging Fee"  value={fmtCurrency(order.packaging_fee)} />
                {order.surge_fee > 0 && (
                  <FinRow label="Surge Fee" value={fmtCurrency(order.surge_fee)} />
                )}
                {order.total_discount > 0 && (
                  <FinRow label="Discount" value={`−${fmtCurrency(order.total_discount)}`} className="text-green-600" />
                )}
                {order.wallet_amount_applied > 0 && (
                  <FinRow label="Wallet Applied" value={`−${fmtCurrency(order.wallet_amount_applied)}`} className="text-blue-600" />
                )}
                <div className="border-t border-gray-200 pt-2 mt-1">
                  <FinRow label="Total Amount" value={fmtCurrency(order.total_amount)} bold />
                </div>
                <div className="border-t border-gray-200 pt-2 mt-1 space-y-1.5">
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Payment Method</span>
                    <span className="uppercase font-medium text-gray-700">{order.payment_method?.replace(/_/g, ' ')}</span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Payment Status</span>
                    <Badge variant={order.payment_status === 'paid' ? 'green' : order.payment_status?.includes('fail') ? 'red' : 'yellow'}>
                      {order.payment_status}
                    </Badge>
                  </div>
                  {order.gst_breakdown?.total_gst > 0 && (
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>GST (incl.)</span>
                      <span>{fmtCurrency(order.gst_breakdown.total_gst)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Status History */}
            {order.status_history?.length > 0 && (
              <div className="px-6 py-5 border-b border-gray-100">
                <SectionLabel icon={Clock}>Status History</SectionLabel>
                <div className="space-y-2">
                  {[...order.status_history].reverse().map((h, i) => (
                    <div key={i} className="flex items-start gap-3 text-xs">
                      <span className="text-gray-400 whitespace-nowrap mt-0.5">{fmtDateTime(h.changed_at)}</span>
                      <Badge variant={orderStatusVariant(h.status)}>{fmtStatus(h.status)}</Badge>
                      <span className="text-gray-500">{h.changed_by}</span>
                      {h.note && <span className="text-gray-400 italic">{h.note}</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Cancellation Info */}
            {order.cancellation && (
              <div className="px-6 py-5 border-b border-gray-100">
                <p className="text-xs font-semibold text-red-500 uppercase tracking-wide mb-3">Cancellation Details</p>
                <div className="bg-red-50 border border-red-100 rounded-lg px-4 py-3 space-y-2">
                  <DetailRow label="Reason"        value={fmtStatus(order.cancellation.reason)} />
                  {order.cancellation.reason_note && (
                    <DetailRow label="Note" value={order.cancellation.reason_note} />
                  )}
                  {order.cancellation.refund_amount > 0 && (
                    <DetailRow label="Refund Amount" value={fmtCurrency(order.cancellation.refund_amount)} />
                  )}
                  {order.cancellation.refund_status && (
                    <DetailRow label="Refund Status" value={
                      <Badge variant={order.cancellation.refund_status === 'completed' ? 'green' : 'yellow'}>
                        {order.cancellation.refund_status}
                      </Badge>
                    } />
                  )}
                </div>
              </div>
            )}

            {/* Admin Notes & Tags */}
            {(order.admin_notes || order.internal_tags?.length > 0) && (
              <div className="px-6 py-5 border-b border-gray-100">
                <SectionLabel icon={FileText}>Admin Notes</SectionLabel>
                {order.admin_notes && (
                  <p className="text-sm text-gray-700 mb-2 leading-relaxed">{order.admin_notes}</p>
                )}
                {order.internal_tags?.length > 0 && (
                  <div className="flex gap-1.5 flex-wrap">
                    {order.internal_tags.map(tag => (
                      <Badge key={tag} variant="purple">
                        <Tag size={9} className="mr-0.5" />{tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="px-6 py-4 flex gap-2 flex-wrap border-t border-gray-100 bg-gray-50">
              {NEXT_STATUSES[order.status] && (
                <button
                  onClick={() => onAction('status')}
                  className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600 transition-colors"
                >
                  <RefreshCw size={14} /> Update Status
                </button>
              )}
              {CANCELLABLE.has(order.status) && (
                <button
                  onClick={() => onAction('cancel')}
                  className="flex items-center gap-2 px-4 py-2 border border-red-300 text-red-600 text-sm font-medium rounded-lg hover:bg-red-50 transition-colors"
                >
                  <XCircle size={14} /> Cancel Order
                </button>
              )}
              {PARTNER_ASSIGNABLE.has(order.status) && (
                <button
                  onClick={() => onAction('partner')}
                  className="flex items-center gap-2 px-4 py-2 border border-blue-300 text-blue-600 text-sm font-medium rounded-lg hover:bg-blue-50 transition-colors"
                >
                  <UserCheck size={14} /> Assign Partner
                </button>
              )}
              <button
                onClick={() => onAction('notes')}
                className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-600 text-sm font-medium rounded-lg hover:bg-white transition-colors"
              >
                <FileText size={14} /> Edit Notes
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Status Timeline ──────────────────────────────────────────────────────────

function StatusTimeline({ currentStatus }) {
  const terminal = ['cancelled', 'failed_delivery', 'payment_failed'];
  const isFailed = terminal.includes(currentStatus);
  const currentIdx = STATUS_FLOW.indexOf(currentStatus);

  return (
    <div className="flex items-start overflow-x-auto pb-1 gap-0">
      {STATUS_FLOW.map((s, i) => {
        const done = !isFailed && i <= currentIdx;
        const isCurrent = s === currentStatus;
        const isLast = i === STATUS_FLOW.length - 1;
        return (
          <div key={s} className="flex items-start flex-1 min-w-0">
            <div className="flex flex-col items-center flex-1 min-w-14">
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center text-xs shrink-0 font-semibold ${
                done
                  ? 'bg-orange-500 border-orange-500 text-white'
                  : isCurrent && isFailed
                  ? 'bg-red-500 border-red-500 text-white'
                  : 'border-gray-300 bg-white text-gray-400'
              }`}>
                {done ? '✓' : i + 1}
              </div>
              <span className={`text-xs mt-1 text-center leading-tight px-0.5 ${
                isCurrent
                  ? isFailed ? 'text-red-500 font-semibold' : 'text-orange-500 font-semibold'
                  : done ? 'text-gray-600'
                  : 'text-gray-400'
              }`} style={{ fontSize: '10px' }}>
                {s.replace(/_/g, ' ')}
              </span>
            </div>
            {!isLast && (
              <div className={`h-0.5 flex-1 mt-2.5 ${i < currentIdx && !isFailed ? 'bg-orange-400' : 'bg-gray-200'}`} />
            )}
          </div>
        );
      })}
      {isFailed && (
        <div className="ml-2 mt-0.5">
          <Badge variant={currentStatus === 'cancelled' ? 'gray' : 'red'}>{fmtStatus(currentStatus)}</Badge>
        </div>
      )}
    </div>
  );
}

// ─── Action Modals ─────────────────────────────────────────────────────────────

function UpdateStatusModal({ open, order, onClose, onConfirm, saving }) {
  const [status, setStatus] = useState('');
  const [note, setNote] = useState('');

  useEffect(() => {
    if (open && order) {
      const next = NEXT_STATUSES[order.status] ?? [];
      setStatus(next[0] ?? '');
      setNote('');
    }
  }, [open, order]);

  const nextStatuses = order ? (NEXT_STATUSES[order.status] ?? []) : [];

  return (
    <Modal open={open} onClose={onClose} title="Update Order Status">
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">New Status</label>
          <select
            value={status}
            onChange={e => setStatus(e.target.value)}
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-orange-400 bg-white"
          >
            {nextStatuses.map(s => <option key={s} value={s}>{fmtStatus(s)}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Note (optional)</label>
          <input
            value={note}
            onChange={e => setNote(e.target.value)}
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-orange-400"
            placeholder="Reason for this status change…"
          />
        </div>
        <div className="flex gap-2 pt-2">
          <button onClick={onClose} className="flex-1 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">
            Cancel
          </button>
          <button
            onClick={() => onConfirm({ status, note })}
            disabled={saving || !status}
            className="flex-1 py-2 text-sm font-medium bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Updating…' : 'Update Status'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

function CancelOrderModal({ open, order, onClose, onConfirm, saving }) {
  const [reason, setReason] = useState('item_out_of_stock');
  const [reasonNote, setReasonNote] = useState('');
  const [refundAmount, setRefundAmount] = useState('');

  useEffect(() => {
    if (open && order) {
      setReason('item_out_of_stock');
      setReasonNote('');
      setRefundAmount(String(order.total_amount ?? ''));
    }
  }, [open, order]);

  return (
    <Modal open={open} onClose={onClose} title="Cancel Order">
      <div className="space-y-4">
        <div className="bg-red-50 border border-red-100 rounded-lg p-3 text-xs text-red-600">
          Cancelling <strong>{order?.order_display_id}</strong> will mark it as cancelled and trigger a refund.
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Cancellation Reason</label>
          <select
            value={reason}
            onChange={e => setReason(e.target.value)}
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-orange-400 bg-white"
          >
            {CANCEL_REASONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Note</label>
          <textarea
            value={reasonNote}
            onChange={e => setReasonNote(e.target.value)}
            rows={2}
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-orange-400 resize-none"
            placeholder="Additional details…"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Refund Amount (₹)</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={refundAmount}
            onChange={e => setRefundAmount(e.target.value)}
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-orange-400"
          />
        </div>
        <div className="flex gap-2 pt-2">
          <button onClick={onClose} className="flex-1 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">
            Keep Order
          </button>
          <button
            onClick={() => onConfirm({ reason, reason_note: reasonNote, refund_amount: refundAmount })}
            disabled={saving}
            className="flex-1 py-2 text-sm font-medium bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Cancelling…' : 'Confirm Cancel'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

function AssignPartnerModal({ open, onClose, onConfirm, saving }) {
  const [form, setForm] = useState({ delivery_partner_id: '', delivery_partner_name: '', delivery_partner_code: '' });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  useEffect(() => {
    if (open) setForm({ delivery_partner_id: '', delivery_partner_name: '', delivery_partner_code: '' });
  }, [open]);

  return (
    <Modal open={open} onClose={onClose} title="Assign Delivery Partner">
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Partner ID</label>
          <input
            value={form.delivery_partner_id}
            onChange={e => set('delivery_partner_id', e.target.value)}
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-orange-400"
            placeholder="del_rajesh_1423"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Partner Name</label>
          <input
            value={form.delivery_partner_name}
            onChange={e => set('delivery_partner_name', e.target.value)}
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-orange-400"
            placeholder="Rajesh Kumar"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Partner Code</label>
          <input
            value={form.delivery_partner_code}
            onChange={e => set('delivery_partner_code', e.target.value)}
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-orange-400"
            placeholder="BLK-1423"
          />
        </div>
        <div className="flex gap-2 pt-2">
          <button onClick={onClose} className="flex-1 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">
            Cancel
          </button>
          <button
            onClick={() => onConfirm(form)}
            disabled={saving || !form.delivery_partner_id || !form.delivery_partner_name}
            className="flex-1 py-2 text-sm font-medium bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Assigning…' : 'Assign Partner'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

function UpdateNotesModal({ open, order, onClose, onConfirm, saving }) {
  const [adminNotes, setAdminNotes] = useState('');
  const [tagsInput, setTagsInput] = useState('');

  useEffect(() => {
    if (open && order) {
      setAdminNotes(order.admin_notes ?? '');
      setTagsInput((order.internal_tags ?? []).join(', '));
    }
  }, [open, order]);

  const handleConfirm = () => {
    const internal_tags = tagsInput.split(',').map(t => t.trim()).filter(Boolean);
    onConfirm({ admin_notes: adminNotes, internal_tags });
  };

  return (
    <Modal open={open} onClose={onClose} title="Edit Admin Notes & Tags">
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Admin Notes</label>
          <textarea
            value={adminNotes}
            onChange={e => setAdminNotes(e.target.value)}
            rows={3}
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-orange-400 resize-none"
            placeholder="Internal notes visible only to admins…"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
            Internal Tags <span className="normal-case font-normal text-gray-400">(comma-separated)</span>
          </label>
          <input
            value={tagsInput}
            onChange={e => setTagsInput(e.target.value)}
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-orange-400"
            placeholder="sla_at_risk, vip_customer, fraud_review"
          />
        </div>
        <div className="flex gap-2 pt-2">
          <button onClick={onClose} className="flex-1 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={saving}
            className="flex-1 py-2 text-sm font-medium bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving…' : 'Save Notes'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Small Helpers ─────────────────────────────────────────────────────────────

function SectionLabel({ icon: Icon, children }) {
  return (
    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2.5 flex items-center gap-1.5">
      <Icon size={11} />{children}
    </p>
  );
}

function DetailRow({ label, value, mono = false }) {
  return (
    <div className="flex justify-between gap-3 text-xs">
      <span className="text-gray-500 shrink-0">{label}</span>
      <span className={`text-gray-900 text-right ${mono ? 'font-mono' : ''}`}>{value ?? '—'}</span>
    </div>
  );
}

function FinRow({ label, value, bold = false, className = '' }) {
  return (
    <div className={`flex justify-between text-sm ${bold ? 'font-bold text-gray-900' : 'text-gray-600'} ${className}`}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
