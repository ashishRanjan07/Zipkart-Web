import { useState, useEffect, useCallback } from 'react';
import {
  Search, RefreshCw, ChevronLeft, ChevronRight, X, Eye,
  AlertTriangle, Package, ShoppingCart, PlusCircle, TrendingDown,
  AlertCircle, Truck, RotateCcw, Archive, ArrowDownCircle,
  ArrowUpCircle, Layers, CheckCircle,
} from 'lucide-react';
import Card from '../components/ui/Card';
import Table from '../components/ui/Table';
import Badge from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import api from '../lib/apiClient';
import toast from '../lib/toast';

// ─── Constants ─────────────────────────────────────────────────────────────────

const PAGE_SIZE = 20;

const MAIN_TABS = [
  { key: 'stock',    label: 'Stock',            icon: Package },
  { key: 'lowstock', label: 'Low Stock',         icon: TrendingDown },
  { key: 'expiry',   label: 'Expiry Alerts',     icon: AlertCircle },
  { key: 'pos',      label: 'Purchase Orders',   icon: ShoppingCart },
  { key: 'damage',   label: 'Damage Log',        icon: AlertTriangle },
];

const INV_STATUS_OPTIONS = [
  { value: 'in_stock',      label: 'In Stock' },
  { value: 'low_stock',     label: 'Low Stock' },
  { value: 'out_of_stock',  label: 'Out of Stock' },
  { value: 'hold_qc',       label: 'QC Hold' },
  { value: 'unserviceable', label: 'Unserviceable' },
  { value: 'expiring_soon', label: 'Expiring Soon' },
  { value: 'expired',       label: 'Expired' },
];

const MOVEMENT_TYPE_OPTIONS = [
  { value: 'manual_adjustment_add',    label: 'Add Stock (Manual)' },
  { value: 'manual_adjustment_remove', label: 'Remove Stock (Manual)' },
  { value: 'return_from_customer',     label: 'Return from Customer' },
  { value: 'inter_store_transfer_in',  label: 'Transfer In' },
  { value: 'inter_store_transfer_out', label: 'Transfer Out' },
  { value: 'return_to_supplier',       label: 'Return to Supplier' },
];

const ADJUSTMENT_REASON_OPTIONS = [
  { value: 'stock_count_correction',  label: 'Stock Count Correction' },
  { value: 'damage',                  label: 'Damage' },
  { value: 'expiry',                  label: 'Expiry' },
  { value: 'theft',                   label: 'Theft' },
  { value: 'supplier_short_delivery', label: 'Supplier Short Delivery' },
  { value: 'system_error_correction', label: 'System Error Correction' },
  { value: 'inter_store_transfer',    label: 'Inter-Store Transfer' },
  { value: 'return_from_customer',    label: 'Return from Customer' },
  { value: 'promotional_sample',      label: 'Promotional Sample' },
];

const PO_NEXT_STATUS = {
  draft:              ['sent_to_supplier', 'cancelled'],
  sent_to_supplier:   ['confirmed', 'cancelled'],
  confirmed:          ['cancelled'],
  partially_received: ['cancelled'],
};

const DAMAGE_TYPE_OPTIONS = [
  { value: 'packaging_breach', label: 'Packaging Breach' },
  { value: 'physical_damage',  label: 'Physical Damage' },
  { value: 'expiry',           label: 'Expiry' },
  { value: 'contamination',    label: 'Contamination' },
  { value: 'theft',            label: 'Theft' },
  { value: 'transit_damage',   label: 'Transit Damage' },
  { value: 'other',            label: 'Other' },
];

const QC_STATUS_OPTIONS = [
  { value: 'passed',  label: 'Passed' },
  { value: 'failed',  label: 'Failed' },
  { value: 'pending', label: 'Pending' },
];

// ─── Helpers ───────────────────────────────────────────────────────────────────

// Ensures API responses always yield an array regardless of shape.
const safeArr = (v) => (Array.isArray(v) ? v : []);

function fmtStatus(s) {
  if (!s) return '—';
  return s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function fmtCurrency(v) {
  if (v == null) return '—';
  return `₹${Number(v).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtCurrencyCompact(v) {
  if (v == null) return '—';
  if (v >= 1_00_00_000) return `₹${(v / 1_00_00_000).toFixed(1)}Cr`;
  if (v >= 1_00_000)    return `₹${(v / 1_00_000).toFixed(1)}L`;
  if (v >= 1_000)       return `₹${(v / 1_000).toFixed(1)}K`;
  return `₹${v}`;
}

function fmtDateTime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function fmtDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

function stockStatusVariant(status) {
  const map = {
    in_stock: 'green', low_stock: 'yellow', out_of_stock: 'red',
    hold_qc: 'orange', unserviceable: 'gray', expiring_soon: 'yellow', expired: 'red',
  };
  return map[status] ?? 'gray';
}

function poStatusVariant(status) {
  const map = {
    draft: 'gray', sent_to_supplier: 'blue', confirmed: 'orange',
    partially_received: 'yellow', received: 'green', cancelled: 'red',
  };
  return map[status] ?? 'gray';
}

function movementVariant(type) {
  const positive = ['purchase_receipt', 'manual_adjustment_add', 'return_from_customer', 'qc_release', 'inter_store_transfer_in'];
  const negative = ['sale_deduction', 'manual_adjustment_remove', 'damage_write_off', 'expiry_write_off', 'inter_store_transfer_out', 'return_to_supplier', 'qc_hold'];
  if (positive.includes(type)) return 'green';
  if (negative.includes(type)) return 'red';
  return 'gray';
}

function daysClass(days) {
  if (days == null) return 'text-gray-400';
  if (days <= 2) return 'text-red-600 font-bold';
  if (days <= 7) return 'text-yellow-600 font-semibold';
  return 'text-gray-700';
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function Inventory() {
  const [activeTab, setActiveTab] = useState('stock');
  const [storeId, setStoreId] = useState('ds_noida_sec62');

  // Dashboard
  const [dashData, setDashData] = useState(null);
  const [dashLoading, setDashLoading] = useState(false);

  // Stock list
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  // Item detail
  const [showDetail, setShowDetail] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailTab, setDetailTab] = useState('info');
  const [batches, setBatches] = useState([]);
  const [batchesLoading, setBatchesLoading] = useState(false);
  const [movementsList, setMovementsList] = useState([]);
  const [movementsLoading, setMovementsLoading] = useState(false);

  // Low stock
  const [lowStockList, setLowStockList] = useState([]);
  const [lowStockLoading, setLowStockLoading] = useState(false);

  // Expiry alerts
  const [expiryList, setExpiryList] = useState([]);
  const [expiryLoading, setExpiryLoading] = useState(false);
  const [expiryDays, setExpiryDays] = useState('7');

  // Purchase orders
  const [poList, setPOList] = useState([]);
  const [poTotal, setPOTotal] = useState(0);
  const [poPage, setPOPage] = useState(1);
  const [poLoading, setPOLoading] = useState(false);
  const [poStatusFilter, setPOStatusFilter] = useState('');
  const [showPODetail, setShowPODetail] = useState(false);
  const [selectedPO, setSelectedPO] = useState(null);
  const [poDetailLoading, setPODetailLoading] = useState(false);

  // Damage log
  const [damageList, setDamageList] = useState([]);
  const [damageLoading, setDamageLoading] = useState(false);

  // Modals
  const [modal, setModal] = useState(null);
  const [saving, setSaving] = useState(false);

  // ── Search debounce ─────────────────────────────────────────────────────────
  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => { setPage(1); }, [statusFilter, categoryFilter, storeId]);

  // ── Fetch: Dashboard ────────────────────────────────────────────────────────
  const fetchDashboard = useCallback(async () => {
    if (!storeId.trim()) return;
    setDashLoading(true);
    try {
      const res = await api.get('/admin/inventory/inventory/dashboard', { params: { dark_store_id: storeId } });
      setDashData(res?.data ?? null);
    } catch {
      // non-critical
    } finally {
      setDashLoading(false);
    }
  }, [storeId]);

  // ── Fetch: Stock list ────────────────────────────────────────────────────────
  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: PAGE_SIZE };
      if (storeId.trim()) params.dark_store_id = storeId.trim();
      if (statusFilter) params.status = statusFilter;
      if (categoryFilter.trim()) params.category = categoryFilter.trim();
      if (search.trim()) params.search = search.trim();
      const res = await api.get('/admin/inventory', { params });
      setItems(safeArr(res?.data?.inventory ?? res?.data?.items ?? res?.data));
      setTotal(res?.data?.pagination?.total ?? res?.data?.total ?? 0);
    } catch (err) {
      toast.error(err.message ?? 'Failed to load inventory');
    } finally {
      setLoading(false);
    }
  }, [page, storeId, statusFilter, categoryFilter, search]);

  // ── Fetch: Item detail ───────────────────────────────────────────────────────
  const openDetail = async (row) => {
    setShowDetail(true);
    setDetailLoading(true);
    setSelectedItem(null);
    setDetailTab('info');
    setBatches([]);
    setMovementsList([]);
    try {
      const res = await api.get(`/admin/inventory/${row._id}`);
      setSelectedItem(res?.data?.item ?? res?.data?.inventory ?? null);
      setBatches(safeArr(res?.data?.active_batches));
      setMovementsList(safeArr(res?.data?.recent_movements));
    } catch (err) {
      toast.error(err.message ?? 'Failed to load item details');
      setShowDetail(false);
    } finally {
      setDetailLoading(false);
    }
  };

  const fetchBatches = useCallback(async () => {
    if (!selectedItem) return;
    setBatchesLoading(true);
    try {
      const res = await api.get(`/admin/inventory/${selectedItem._id}/batches`);
      setBatches(safeArr(res?.data?.batches ?? res?.data));
    } catch {
      toast.error('Failed to load batches');
    } finally {
      setBatchesLoading(false);
    }
  }, [selectedItem]);

  const fetchMovements = useCallback(async () => {
    if (!selectedItem) return;
    setMovementsLoading(true);
    try {
      const res = await api.get(`/admin/inventory/${selectedItem._id}/movements`, {
        params: { page: 1, limit: 30 },
      });
      setMovementsList(safeArr(res?.data?.movements ?? res?.data?.items ?? res?.data));
    } catch {
      toast.error('Failed to load movements');
    } finally {
      setMovementsLoading(false);
    }
  }, [selectedItem]);

  useEffect(() => {
    if (detailTab === 'batches' && selectedItem && batches.length === 0) fetchBatches();
    if (detailTab === 'movements' && selectedItem && movementsList.length === 0) fetchMovements();
  }, [detailTab, selectedItem]); // eslint-disable-line

  // ── Fetch: Low stock ─────────────────────────────────────────────────────────
  const fetchLowStock = useCallback(async () => {
    setLowStockLoading(true);
    try {
      const params = {};
      if (storeId.trim()) params.dark_store_id = storeId.trim();
      const res = await api.get('/admin/inventory/alerts/low-stock', { params });
      setLowStockList(safeArr(res?.data?.alerts ?? res?.data?.items ?? res?.data));
    } catch (err) {
      toast.error(err.message ?? 'Failed to load low stock alerts');
    } finally {
      setLowStockLoading(false);
    }
  }, [storeId]);

  // ── Fetch: Expiry ────────────────────────────────────────────────────────────
  const fetchExpiry = useCallback(async () => {
    setExpiryLoading(true);
    try {
      const params = { days: expiryDays };
      if (storeId.trim()) params.dark_store_id = storeId.trim();
      const res = await api.get('/admin/inventory/alerts/expiry', { params });
      setExpiryList(safeArr(res?.data?.alerts ?? res?.data?.items ?? res?.data));
    } catch (err) {
      toast.error(err.message ?? 'Failed to load expiry alerts');
    } finally {
      setExpiryLoading(false);
    }
  }, [storeId, expiryDays]);

  // ── Fetch: Purchase orders ───────────────────────────────────────────────────
  const fetchPOs = useCallback(async () => {
    setPOLoading(true);
    try {
      const params = { page: poPage, limit: PAGE_SIZE };
      if (storeId.trim()) params.dark_store_id = storeId.trim();
      if (poStatusFilter) params.status = poStatusFilter;
      const res = await api.get('/admin/purchase-orders', { params });
      setPOList(safeArr(res?.data?.purchase_orders ?? res?.data?.items ?? res?.data));
      setPOTotal(res?.data?.pagination?.total ?? res?.data?.total ?? 0);
    } catch (err) {
      toast.error(err.message ?? 'Failed to load purchase orders');
    } finally {
      setPOLoading(false);
    }
  }, [storeId, poPage, poStatusFilter]);

  const openPODetail = async (row) => {
    setShowPODetail(true);
    setPODetailLoading(true);
    setSelectedPO(null);
    try {
      const res = await api.get(`/admin/purchase-orders/${row._id}`);
      setSelectedPO(res?.data?.purchase_order ?? res?.data ?? null);
    } catch (err) {
      toast.error(err.message ?? 'Failed to load PO details');
      setShowPODetail(false);
    } finally {
      setPODetailLoading(false);
    }
  };

  // ── Fetch: Damage log ────────────────────────────────────────────────────────
  const fetchDamageLog = useCallback(async () => {
    setDamageLoading(true);
    try {
      const params = {};
      if (storeId.trim()) params.dark_store_id = storeId.trim();
      const res = await api.get('/admin/inventory/inventory/damage-log', { params });
      setDamageList(safeArr(res?.data?.damage_log ?? res?.data?.items ?? res?.data));
    } catch (err) {
      toast.error(err.message ?? 'Failed to load damage log');
    } finally {
      setDamageLoading(false);
    }
  }, [storeId]);

  // ── Effects ──────────────────────────────────────────────────────────────────
  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);
  useEffect(() => { if (activeTab === 'stock') fetchItems(); }, [fetchItems, activeTab]);
  useEffect(() => { if (activeTab === 'lowstock') fetchLowStock(); }, [fetchLowStock, activeTab]);
  useEffect(() => { if (activeTab === 'expiry') fetchExpiry(); }, [fetchExpiry, activeTab]);
  useEffect(() => { if (activeTab === 'pos') fetchPOs(); }, [fetchPOs, activeTab]);
  useEffect(() => { if (activeTab === 'damage') fetchDamageLog(); }, [fetchDamageLog, activeTab]);

  // ── Actions ──────────────────────────────────────────────────────────────────
  const handleCreateItem = async (form) => {
    setSaving(true);
    try {
      await api.post('/admin/inventory', form);
      toast.success('Inventory item created — you can now receive stock via PO or Receive Batch');
      setModal(null);
      fetchItems();
      fetchDashboard();
    } catch (err) {
      toast.error(err.message ?? 'Failed to create inventory item');
    } finally {
      setSaving(false);
    }
  };

  const handleAdjust = async (form) => {
    setSaving(true);
    try {
      await api.post(`/admin/inventory/${selectedItem._id}/adjust`, form);
      toast.success('Stock adjusted successfully');
      setModal(null);
      const res = await api.get(`/admin/inventory/${selectedItem._id}`);
      setSelectedItem(res?.data?.item ?? res?.data?.inventory ?? null);
      setMovementsList(safeArr(res?.data?.recent_movements));
      fetchItems();
    } catch (err) {
      toast.error(err.message ?? 'Failed to adjust stock');
    } finally {
      setSaving(false);
    }
  };

  const handleReceiveBatch = async (form) => {
    setSaving(true);
    try {
      await api.post(`/admin/inventory/${selectedItem._id}/batches`, form);
      toast.success('Batch received and stock updated');
      setModal(null);
      const res = await api.get(`/admin/inventory/${selectedItem._id}`);
      setSelectedItem(res?.data?.item ?? res?.data?.inventory ?? null);
      setBatches(safeArr(res?.data?.active_batches));
      fetchItems();
    } catch (err) {
      toast.error(err.message ?? 'Failed to receive batch');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateItemStatus = async (form) => {
    setSaving(true);
    try {
      await api.patch(`/admin/inventory/${selectedItem._id}/status`, form);
      toast.success('Item status updated');
      setModal(null);
      const res = await api.get(`/admin/inventory/${selectedItem._id}`);
      setSelectedItem(res?.data?.item ?? res?.data?.inventory ?? null);
      fetchItems();
    } catch (err) {
      toast.error(err.message ?? 'Failed to update status');
    } finally {
      setSaving(false);
    }
  };

  const handleWriteOff = async (form) => {
    setSaving(true);
    try {
      await api.post(`/admin/inventory/${selectedItem._id}/write-off`, form);
      toast.success('Stock written off successfully');
      setModal(null);
      const res = await api.get(`/admin/inventory/${selectedItem._id}`);
      setSelectedItem(res?.data?.item ?? res?.data?.inventory ?? null);
      setBatches(safeArr(res?.data?.active_batches));
      fetchItems();
    } catch (err) {
      toast.error(err.message ?? 'Failed to write off stock');
    } finally {
      setSaving(false);
    }
  };

  const handleReportDamage = async (form) => {
    setSaving(true);
    try {
      await api.post('/admin/inventory/damage-log', form);
      toast.success('Damage reported successfully');
      setModal(null);
      if (activeTab === 'damage') fetchDamageLog();
    } catch (err) {
      toast.error(err.message ?? 'Failed to report damage');
    } finally {
      setSaving(false);
    }
  };

  const handleCreatePO = async (form) => {
    setSaving(true);
    try {
      await api.post('/admin/purchase-orders', form);
      toast.success('Purchase order created');
      setModal(null);
      fetchPOs();
    } catch (err) {
      toast.error(err.message ?? 'Failed to create purchase order');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdatePOStatus = async (form) => {
    setSaving(true);
    try {
      await api.patch(`/admin/purchase-orders/${selectedPO._id}/status`, form);
      toast.success('PO status updated');
      setModal(null);
      const res = await api.get(`/admin/purchase-orders/${selectedPO._id}`);
      setSelectedPO(res?.data?.purchase_order ?? res?.data ?? null);
      fetchPOs();
    } catch (err) {
      toast.error(err.message ?? 'Failed to update PO status');
    } finally {
      setSaving(false);
    }
  };

  const handleReceivePO = async (form) => {
    setSaving(true);
    try {
      await api.post(`/admin/purchase-orders/${selectedPO._id}/receive`, form);
      toast.success('PO received — stock updated');
      setModal(null);
      const res = await api.get(`/admin/purchase-orders/${selectedPO._id}`);
      setSelectedPO(res?.data?.purchase_order ?? res?.data ?? null);
      fetchPOs();
      fetchDashboard();
    } catch (err) {
      toast.error(err.message ?? 'Failed to receive PO');
    } finally {
      setSaving(false);
    }
  };

  // ── Helpers ──────────────────────────────────────────────────────────────────
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const poTotalPages = Math.max(1, Math.ceil(poTotal / PAGE_SIZE));

  // ── Stock table columns ───────────────────────────────────────────────────────
  const stockColumns = [
    {
      key: 'sku', label: 'SKU',
      render: (v) => <span className="font-mono text-xs text-gray-600">{v}</span>,
    },
    {
      key: 'product_name', label: 'Product',
      render: (v, row) => (
        <div>
          <div className="text-sm font-medium text-gray-900 max-w-52 truncate">{v}</div>
          <div className="text-xs text-gray-400">{row.brand} · {row.category}</div>
        </div>
      ),
    },
    {
      key: 'status', label: 'Status',
      render: (v) => <Badge variant={stockStatusVariant(v)} dot>{fmtStatus(v)}</Badge>,
    },
    {
      key: 'quantity_available', label: 'Available',
      render: (v, row) => (
        <div className="text-sm">
          <span className="font-semibold text-gray-900">{v ?? 0}</span>
          {row.quantity_net_sellable != null && row.quantity_reserved > 0 && (
            <span className="text-xs text-gray-400 ml-1">(net: {row.quantity_net_sellable})</span>
          )}
        </div>
      ),
    },
    {
      key: 'reorder_point', label: 'Reorder At',
      render: (v) => <span className="text-xs text-gray-500">{v ?? '—'}</span>,
    },
    {
      key: 'days_of_stock_remaining', label: 'Days Left',
      render: (v) => (
        <span className={`text-xs ${daysClass(v)}`}>
          {v != null ? `${Number(v).toFixed(1)}d` : '—'}
        </span>
      ),
    },
    {
      key: 'dark_store_name', label: 'Store',
      render: (v) => <span className="text-xs text-gray-500 max-w-32 truncate block">{v ?? '—'}</span>,
    },
    {
      key: 'auto_reorder_enabled', label: 'Auto PO',
      render: (v) => v
        ? <Badge variant="green">On</Badge>
        : <Badge variant="gray">Off</Badge>,
    },
    {
      key: 'inventory_id', label: '',
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

  return (
    <div className="space-y-4">
      {/* Dashboard Metrics */}
      <DashboardMetrics
        data={dashData}
        loading={dashLoading}
        storeId={storeId}
        onStoreChange={(v) => { setStoreId(v); }}
        onRefresh={fetchDashboard}
      />

      {/* Tab Navigation */}
      <div className="flex gap-2 flex-wrap items-center">
        {MAIN_TABS.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                activeTab === tab.key
                  ? 'bg-orange-500 text-white border-orange-500'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
              }`}
            >
              <Icon size={13} />
              {tab.label}
              {tab.key === 'lowstock' && dashData?.low_stock_count > 0 && (
                <span className={`text-xs rounded-full px-1.5 ${activeTab === tab.key ? 'bg-white/20' : 'bg-yellow-100 text-yellow-700'}`}>
                  {dashData.low_stock_count}
                </span>
              )}
              {tab.key === 'expiry' && dashData?.expiring_in_7_days_count > 0 && (
                <span className={`text-xs rounded-full px-1.5 ${activeTab === tab.key ? 'bg-white/20' : 'bg-red-100 text-red-600'}`}>
                  {dashData.expiring_in_7_days_count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Tab: Stock ─────────────────────────────────────────────────────── */}
      {activeTab === 'stock' && (
        <Card>
          <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 flex-wrap">
            <div className="relative flex-1 min-w-48">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-orange-400"
                placeholder="Search SKU, product or brand…"
              />
            </div>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none bg-white"
            >
              <option value="">All Status</option>
              {INV_STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <input
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none w-36"
              placeholder="Category…"
            />
            <button
              onClick={fetchItems}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh
            </button>
            <button
              onClick={() => setModal({ type: 'createItem' })}
              className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600"
            >
              <PlusCircle size={14} /> Add Item
            </button>
            <span className="text-xs text-gray-400 ml-auto">{total.toLocaleString()} items</span>
          </div>
          <Table
            columns={stockColumns}
            data={items}
            onRowClick={openDetail}
            emptyMessage={loading ? 'Loading inventory…' : 'No inventory items found.'}
          />
          <Pagination page={page} totalPages={totalPages} total={total} pageSize={PAGE_SIZE} onPage={setPage} />
        </Card>
      )}

      {/* ── Tab: Low Stock ──────────────────────────────────────────────────── */}
      {activeTab === 'lowstock' && (
        <Card>
          <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
            <p className="text-sm font-medium text-gray-700">Items below reorder point</p>
            <button
              onClick={fetchLowStock}
              disabled={lowStockLoading}
              className="ml-auto flex items-center gap-1.5 px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              <RefreshCw size={13} className={lowStockLoading ? 'animate-spin' : ''} /> Refresh
            </button>
          </div>
          <Table
            columns={[
              { key: 'sku', label: 'SKU', render: v => <span className="font-mono text-xs text-gray-600">{v}</span> },
              {
                key: 'product_name', label: 'Product',
                render: (v, row) => (
                  <div>
                    <div className="text-sm font-medium text-gray-900">{v}</div>
                    <div className="text-xs text-gray-400">{row.category}</div>
                  </div>
                ),
              },
              { key: 'quantity_available', label: 'Available', render: v => <span className="font-semibold text-red-600">{v ?? 0}</span> },
              { key: 'quantity_net_sellable', label: 'Net Sellable', render: v => <span className="text-sm">{v ?? 0}</span> },
              { key: 'reorder_point', label: 'Reorder At', render: v => <span className="text-xs text-gray-500">{v}</span> },
              {
                key: 'days_of_stock_remaining', label: 'Days Left',
                render: v => <span className={`text-xs ${daysClass(v)}`}>{v != null ? `${Number(v).toFixed(1)}d` : '—'}</span>,
              },
              { key: 'reorder_quantity_suggested', label: 'Suggested Order', render: v => <span className="text-xs">{v ?? '—'}</span> },
              {
                key: 'action_needed', label: 'Action',
                render: v => {
                  const variant = v === 'URGENT' ? 'red' : v === 'WARNING' ? 'yellow' : 'gray';
                  return v ? <Badge variant={variant}>{v}</Badge> : '—';
                },
              },
              {
                key: 'auto_po_raised', label: 'Auto PO',
                render: (v, row) => v
                  ? <Badge variant="green">Raised · {row.po_id}</Badge>
                  : <Badge variant="gray">Not raised</Badge>,
              },
            ]}
            data={lowStockList}
            emptyMessage={lowStockLoading ? 'Loading…' : 'No low stock alerts.'}
          />
        </Card>
      )}

      {/* ── Tab: Expiry Alerts ──────────────────────────────────────────────── */}
      {activeTab === 'expiry' && (
        <Card>
          <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 flex-wrap">
            <p className="text-sm font-medium text-gray-700">Batches expiring within</p>
            <select
              value={expiryDays}
              onChange={e => setExpiryDays(e.target.value)}
              className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none"
            >
              <option value="3">3 days</option>
              <option value="7">7 days</option>
              <option value="14">14 days</option>
              <option value="30">30 days</option>
            </select>
            <button
              onClick={fetchExpiry}
              disabled={expiryLoading}
              className="ml-auto flex items-center gap-1.5 px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              <RefreshCw size={13} className={expiryLoading ? 'animate-spin' : ''} /> Refresh
            </button>
          </div>
          <Table
            columns={[
              { key: 'batch_no', label: 'Batch No.', render: v => <span className="font-mono text-xs">{v}</span> },
              { key: 'sku_col', label: 'SKU', render: (_, row) => <span className="font-mono text-xs text-gray-600">{row.inventory_id?.sku ?? '—'}</span> },
              { key: 'product_col', label: 'Product', render: (_, row) => <span className="text-sm font-medium">{row.inventory_id?.product_name ?? '—'}</span> },
              { key: 'expiry_date', label: 'Expiry', render: v => <span className="text-xs">{fmtDate(v)}</span> },
              {
                key: 'days_to_expiry', label: 'Days Left',
                render: v => <span className={`text-sm font-semibold ${daysClass(v)}`}>{v}</span>,
              },
              { key: 'quantity_remaining', label: 'Qty Remaining', render: v => <span className="font-medium">{v}</span> },
              { key: 'value_at_cost', label: 'Cost Value', render: v => <span className="text-sm">{fmtCurrency(v)}</span> },
              { key: 'value_at_mrp', label: 'MRP Value', render: v => <span className="text-sm text-gray-400 line-through">{fmtCurrency(v)}</span> },
              {
                key: 'recommended_action', label: 'Suggested Action',
                render: v => v ? <Badge variant="yellow">{fmtStatus(v)}</Badge> : '—',
              },
            ]}
            data={expiryList}
            emptyMessage={expiryLoading ? 'Loading…' : `No batches expiring within ${expiryDays} days.`}
          />
        </Card>
      )}

      {/* ── Tab: Purchase Orders ────────────────────────────────────────────── */}
      {activeTab === 'pos' && (
        <Card>
          <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 flex-wrap">
            <select
              value={poStatusFilter}
              onChange={e => { setPOStatusFilter(e.target.value); setPOPage(1); }}
              className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none"
            >
              <option value="">All Status</option>
              <option value="draft">Draft</option>
              <option value="sent_to_supplier">Sent to Supplier</option>
              <option value="confirmed">Confirmed</option>
              <option value="partially_received">Partially Received</option>
              <option value="received">Received</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <button
              onClick={fetchPOs}
              disabled={poLoading}
              className="flex items-center gap-1.5 px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              <RefreshCw size={13} className={poLoading ? 'animate-spin' : ''} /> Refresh
            </button>
            <button
              onClick={() => setModal({ type: 'createPO' })}
              className="ml-auto flex items-center gap-2 px-4 py-2 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600"
            >
              <PlusCircle size={14} /> New Purchase Order
            </button>
          </div>
          <Table
            columns={[
              { key: 'po_display_id', label: 'PO ID', render: v => <span className="font-mono text-xs font-semibold">{v}</span> },
              { key: 'dark_store_name', label: 'Store', render: v => <span className="text-xs text-gray-600">{v ?? '—'}</span> },
              { key: 'supplier_name', label: 'Supplier', render: v => <span className="text-sm">{v}</span> },
              { key: 'status', label: 'Status', render: v => <Badge variant={poStatusVariant(v)} dot>{fmtStatus(v)}</Badge> },
              { key: 'total_skus', label: 'SKUs', render: v => <span className="text-xs">{v}</span> },
              { key: 'total_units', label: 'Units', render: v => <span className="text-xs">{v}</span> },
              { key: 'total_cost', label: 'Total Cost', render: v => <span className="text-sm font-semibold">{fmtCurrency(v)}</span> },
              {
                key: 'expected_delivery_at', label: 'Expected',
                render: v => <span className="text-xs text-gray-500">{fmtDateTime(v)}</span>,
              },
              {
                key: 'is_auto_generated', label: 'Source',
                render: v => <Badge variant={v ? 'blue' : 'gray'}>{v ? 'Auto' : 'Manual'}</Badge>,
              },
              {
                key: 'po_id', label: '',
                render: (_, row) => (
                  <button
                    onClick={e => { e.stopPropagation(); openPODetail(row); }}
                    className="p-1.5 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                  >
                    <Eye size={14} />
                  </button>
                ),
              },
            ]}
            data={poList}
            onRowClick={openPODetail}
            emptyMessage={poLoading ? 'Loading purchase orders…' : 'No purchase orders found.'}
          />
          <Pagination page={poPage} totalPages={poTotalPages} total={poTotal} pageSize={PAGE_SIZE} onPage={setPOPage} />
        </Card>
      )}

      {/* ── Tab: Damage Log ─────────────────────────────────────────────────── */}
      {activeTab === 'damage' && (
        <Card>
          <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
            <p className="text-sm font-medium text-gray-700">Reported damage incidents</p>
            <button
              onClick={fetchDamageLog}
              disabled={damageLoading}
              className="flex items-center gap-1.5 px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              <RefreshCw size={13} className={damageLoading ? 'animate-spin' : ''} /> Refresh
            </button>
            <button
              onClick={() => setModal({ type: 'reportDamage' })}
              className="ml-auto flex items-center gap-2 px-4 py-2 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600"
            >
              <PlusCircle size={14} /> Report Damage
            </button>
          </div>
          <Table
            columns={[
              { key: 'reported_at', label: 'Reported', render: v => <span className="text-xs text-gray-500">{fmtDateTime(v)}</span> },
              { key: 'sku', label: 'SKU', render: v => <span className="font-mono text-xs text-gray-600">{v}</span> },
              { key: 'product_name', label: 'Product', render: v => <span className="text-sm font-medium">{v}</span> },
              { key: 'quantity_damaged', label: 'Qty', render: v => <span className="font-semibold text-red-600">{v}</span> },
              { key: 'damage_type', label: 'Type', render: v => <Badge variant="orange">{fmtStatus(v)}</Badge> },
              { key: 'damage_reason', label: 'Reason', render: v => <span className="text-xs text-gray-600 max-w-48 truncate block">{v}</span> },
              { key: 'cost_value_lost', label: 'Cost Lost', render: v => <span className="text-sm">{fmtCurrency(v)}</span> },
              {
                key: 'verified_by', label: 'Verified',
                render: v => v
                  ? <Badge variant="green"><CheckCircle size={10} className="mr-0.5 inline" />Verified</Badge>
                  : <Badge variant="yellow">Pending</Badge>,
              },
            ]}
            data={damageList}
            emptyMessage={damageLoading ? 'Loading…' : 'No damage reports found.'}
          />
        </Card>
      )}

      {/* ── Item Detail Slide-out ───────────────────────────────────────────── */}
      {showDetail && (
        <ItemDetailPanel
          item={selectedItem}
          loading={detailLoading}
          detailTab={detailTab}
          onTabChange={setDetailTab}
          batches={batches}
          batchesLoading={batchesLoading}
          movements={movementsList}
          movementsLoading={movementsLoading}
          onClose={() => { setShowDetail(false); setSelectedItem(null); }}
          onAction={type => setModal({ type })}
        />
      )}

      {/* ── PO Detail Slide-out ─────────────────────────────────────────────── */}
      {showPODetail && (
        <PODetailPanel
          po={selectedPO}
          loading={poDetailLoading}
          onClose={() => { setShowPODetail(false); setSelectedPO(null); }}
          onAction={type => setModal({ type })}
        />
      )}

      {/* ── Modals ──────────────────────────────────────────────────────────── */}
      <CreateInventoryItemModal
        open={modal?.type === 'createItem'}
        storeId={storeId}
        onClose={() => setModal(null)}
        onConfirm={handleCreateItem}
        saving={saving}
      />
      <AdjustStockModal
        open={modal?.type === 'adjust'}
        item={selectedItem}
        onClose={() => setModal(null)}
        onConfirm={handleAdjust}
        saving={saving}
      />
      <ReceiveBatchModal
        open={modal?.type === 'receiveBatch'}
        item={selectedItem}
        onClose={() => setModal(null)}
        onConfirm={handleReceiveBatch}
        saving={saving}
      />
      <UpdateItemStatusModal
        open={modal?.type === 'itemStatus'}
        item={selectedItem}
        onClose={() => setModal(null)}
        onConfirm={handleUpdateItemStatus}
        saving={saving}
      />
      <WriteOffModal
        open={modal?.type === 'writeOff'}
        item={selectedItem}
        batches={batches}
        onClose={() => setModal(null)}
        onConfirm={handleWriteOff}
        saving={saving}
      />
      <ReportDamageModal
        open={modal?.type === 'reportDamage'}
        storeId={storeId}
        onClose={() => setModal(null)}
        onConfirm={handleReportDamage}
        saving={saving}
      />
      <CreatePOModal
        open={modal?.type === 'createPO'}
        storeId={storeId}
        onClose={() => setModal(null)}
        onConfirm={handleCreatePO}
        saving={saving}
      />
      <UpdatePOStatusModal
        open={modal?.type === 'poStatus'}
        po={selectedPO}
        onClose={() => setModal(null)}
        onConfirm={handleUpdatePOStatus}
        saving={saving}
      />
      <ReceivePOModal
        open={modal?.type === 'receivePO'}
        po={selectedPO}
        onClose={() => setModal(null)}
        onConfirm={handleReceivePO}
        saving={saving}
      />
    </div>
  );
}

// ─── Dashboard Metrics ─────────────────────────────────────────────────────────

function DashboardMetrics({ data: d, loading, storeId, onStoreChange, onRefresh }) {
  return (
    <div>
      <div className="flex items-center gap-3 mb-3 flex-wrap">
        <h2 className="text-sm font-semibold text-gray-700">Inventory Overview</h2>
        <div className="flex items-center gap-1.5 ml-auto">
          <label className="text-xs text-gray-500">Store ID</label>
          <input
            value={storeId}
            onChange={e => onStoreChange(e.target.value)}
            className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-orange-400 w-44 font-mono"
            placeholder="ds_noida_sec62"
          />
          <button
            onClick={onRefresh}
            disabled={loading}
            className="p-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin text-orange-500' : 'text-gray-500'} />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <MetricTile label="Total SKUs"     value={d?.active_sku_count} sub={d?.total_sku_count ? `${d.total_sku_count} total` : undefined} icon={Layers} color="bg-blue-500" loading={loading} />
        <MetricTile label="Inventory Value" value={fmtCurrencyCompact(d?.total_inventory_value_cost)} sub={d?.total_inventory_value_mrp ? `MRP ${fmtCurrencyCompact(d.total_inventory_value_mrp)}` : undefined} icon={BarChart2} color="bg-emerald-500" loading={loading} />
        <MetricTile label="Low Stock"       value={d?.low_stock_count}  sub="Need restocking"    icon={TrendingDown}  color="bg-yellow-500" loading={loading} />
        <MetricTile label="Out of Stock"    value={d?.out_of_stock_count} sub="Urgent"            icon={AlertTriangle} color="bg-red-500"    loading={loading} />
        <MetricTile label="Expiring (7d)"   value={d?.expiring_in_7_days_count}                   icon={AlertCircle}  color="bg-orange-500" loading={loading} />
        <MetricTile label="QC Hold"         value={d?.qc_hold_count}                              icon={Archive}      color="bg-purple-500" loading={loading} />
      </div>
      {d?.last_updated_at && (
        <p className="text-xs text-gray-400 mt-2">Last updated {fmtDateTime(d.last_updated_at)}</p>
      )}
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
          {!loading && sub && <p className="text-xs text-gray-400 mt-0.5 truncate">{sub}</p>}
        </div>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${color}`}>
          <Icon size={15} className="text-white" />
        </div>
      </div>
    </div>
  );
}

// ─── Pagination ────────────────────────────────────────────────────────────────

function Pagination({ page, totalPages, total, pageSize, onPage }) {
  if (total <= pageSize) return null;
  return (
    <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
      <span className="text-xs text-gray-500">
        Page {page} of {totalPages} · {total.toLocaleString()} total
      </span>
      <div className="flex gap-2">
        <button
          onClick={() => onPage(p => Math.max(1, p - 1))}
          disabled={page === 1}
          className="p-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ChevronLeft size={14} />
        </button>
        <button
          onClick={() => onPage(p => Math.min(totalPages, p + 1))}
          disabled={page === totalPages}
          className="p-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}

// ─── Item Detail Panel ─────────────────────────────────────────────────────────

function ItemDetailPanel({ item, loading, detailTab, onTabChange, batches, batchesLoading, movements, movementsLoading, onClose, onAction }) {
  const PANEL_TABS = ['info', 'batches', 'movements'];

  return (
    <div className="fixed inset-0 z-40 flex">
      <div className="flex-1 bg-black/30 cursor-pointer" onClick={onClose} />
      <div className="w-full max-w-2xl bg-white shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-200 shrink-0">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-sm font-bold text-gray-900">{item?.sku ?? '…'}</span>
              {item?.status && (
                <Badge variant={stockStatusVariant(item.status)} dot>{fmtStatus(item.status)}</Badge>
              )}
              {item?.auto_reorder_enabled && <Badge variant="blue">Auto-reorder On</Badge>}
            </div>
            {item?.product_name && (
              <p className="text-xs text-gray-500 mt-0.5 truncate">{item.product_name} · {item.brand}</p>
            )}
          </div>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
            <X size={18} />
          </button>
        </div>

        {/* Sub-tabs */}
        <div className="flex border-b border-gray-200 shrink-0 px-6 gap-4">
          {PANEL_TABS.map(t => (
            <button
              key={t}
              onClick={() => onTabChange(t)}
              className={`py-3 text-xs font-medium border-b-2 transition-colors capitalize ${
                detailTab === t
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center text-sm text-gray-400">Loading details…</div>
        ) : !item ? null : (
          <div className="flex-1 overflow-y-auto">
            {/* ─ Info Tab ─ */}
            {detailTab === 'info' && (
              <>
                {/* Stock Levels */}
                <div className="px-6 py-5 border-b border-gray-100">
                  <SectionLabel icon={Package}>Stock Levels</SectionLabel>
                  <div className="grid grid-cols-3 gap-3">
                    <StockTile label="Available" value={item.quantity_available} color="text-green-600" />
                    <StockTile label="Reserved" value={item.quantity_reserved} color="text-yellow-600" />
                    <StockTile label="Net Sellable" value={item.quantity_net_sellable} color="text-blue-600" />
                    <StockTile label="QC Hold" value={item.quantity_qc_hold} color="text-orange-600" />
                    <StockTile label="Damaged" value={item.quantity_damaged} color="text-red-600" />
                    <StockTile label="In Transit" value={item.quantity_in_transit} color="text-gray-500" />
                  </div>
                </div>
                {/* Sales Velocity */}
                <div className="px-6 py-5 border-b border-gray-100 grid grid-cols-2 gap-6">
                  <div>
                    <SectionLabel icon={TrendingDown}>Sales Velocity</SectionLabel>
                    <div className="space-y-1.5">
                      <DetailRow label="Sold Today" value={item.units_sold_today} />
                      <DetailRow label="Sold (7d)" value={item.units_sold_last_7_days} />
                      <DetailRow label="Avg Daily" value={item.avg_daily_sales_units ? `${item.avg_daily_sales_units} units` : '—'} />
                      <DetailRow label="Days of Stock" value={item.days_of_stock_remaining != null ? <span className={daysClass(item.days_of_stock_remaining)}>{Number(item.days_of_stock_remaining).toFixed(1)}d</span> : '—'} />
                    </div>
                  </div>
                  <div>
                    <SectionLabel icon={RotateCcw}>Reorder Config</SectionLabel>
                    <div className="space-y-1.5">
                      <DetailRow label="Reorder Point" value={item.reorder_point} />
                      <DetailRow label="Reorder Qty" value={item.reorder_quantity} />
                      <DetailRow label="Max Stock" value={item.max_stock_level} />
                      <DetailRow label="Auto Reorder" value={item.auto_reorder_enabled ? <Badge variant="green">On</Badge> : <Badge variant="gray">Off</Badge>} />
                    </div>
                  </div>
                </div>
                {/* Pricing */}
                <div className="px-6 py-5 border-b border-gray-100">
                  <SectionLabel icon={Layers}>Pricing & Location</SectionLabel>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                      <DetailRow label="Cost Price" value={fmtCurrency(item.cost_price)} />
                      <DetailRow label="MRP" value={fmtCurrency(item.mrp)} />
                      <DetailRow label="Selling Price" value={fmtCurrency(item.selling_price)} />
                    </div>
                    <div className="space-y-1.5">
                      <DetailRow label="Storage Zone" value={fmtStatus(item.storage_zone)} />
                      <DetailRow label="Location" value={
                        item.location_in_store
                          ? `${item.location_in_store.aisle}-${item.location_in_store.rack}-${item.location_in_store.shelf}-${item.location_in_store.bin}`
                          : '—'
                      } mono />
                      <DetailRow label="Weight" value={item.weight_per_unit_grams ? `${item.weight_per_unit_grams}g` : '—'} />
                    </div>
                  </div>
                </div>
                {/* Supplier */}
                <div className="px-6 py-5 border-b border-gray-100">
                  <SectionLabel icon={Truck}>Supplier</SectionLabel>
                  <div className="space-y-1.5">
                    <DetailRow label="Supplier" value={item.supplier_name} />
                    <DetailRow label="Lead Time" value={item.supplier_lead_time_days ? `${item.supplier_lead_time_days}d` : '—'} />
                    <DetailRow label="Last Received" value={fmtDateTime(item.last_received_at)} />
                    <DetailRow label="Last Batch" value={item.last_received_batch} mono />
                    <DetailRow label="Last Qty" value={item.last_received_quantity} />
                  </div>
                </div>
              </>
            )}

            {/* ─ Batches Tab ─ */}
            {detailTab === 'batches' && (
              <div className="px-6 py-5">
                {batchesLoading ? (
                  <p className="text-sm text-gray-400">Loading batches…</p>
                ) : batches.length === 0 ? (
                  <p className="text-sm text-gray-400">No batches found.</p>
                ) : (
                  <div className="space-y-3">
                    {batches.map((b) => (
                      <div key={b.batch_id ?? b.batch_no} className={`border rounded-lg px-4 py-3 text-xs space-y-1 ${b.is_expired ? 'border-red-200 bg-red-50' : b.is_expiring_soon ? 'border-yellow-200 bg-yellow-50' : 'border-gray-200'}`}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono font-semibold text-gray-900">{b.batch_no}</span>
                          {b.is_expired && <Badge variant="red">Expired</Badge>}
                          {!b.is_expired && b.is_expiring_soon && <Badge variant="yellow">Expiring Soon</Badge>}
                          <Badge variant={b.qc_status === 'passed' ? 'green' : b.qc_status === 'failed' ? 'red' : 'gray'}>
                            QC: {b.qc_status}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-gray-600">
                          <span>Received: <strong>{b.quantity_received}</strong></span>
                          <span>Remaining: <strong>{b.quantity_remaining}</strong></span>
                          <span>Sold: <strong>{b.quantity_sold}</strong></span>
                          <span>Expiry: <strong className={daysClass(b.days_to_expiry)}>{fmtDate(b.expiry_date)}</strong></span>
                          <span>Days Left: <strong className={daysClass(b.days_to_expiry)}>{b.days_to_expiry}</strong></span>
                          <span>Cost: <strong>{fmtCurrency(b.cost_price_per_unit)}</strong></span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ─ Movements Tab ─ */}
            {detailTab === 'movements' && (
              <div className="px-6 py-5">
                {movementsLoading ? (
                  <p className="text-sm text-gray-400">Loading movements…</p>
                ) : movements.length === 0 ? (
                  <p className="text-sm text-gray-400">No movements found.</p>
                ) : (
                  <div className="space-y-2">
                    {movements.map((m, i) => (
                      <div key={m.movement_id ?? i} className="flex items-start gap-3 text-xs border-b border-gray-100 pb-2">
                        <span className="text-gray-400 whitespace-nowrap mt-0.5 min-w-28">{fmtDateTime(m.created_at)}</span>
                        <Badge variant={movementVariant(m.movement_type)}>{fmtStatus(m.movement_type)}</Badge>
                        <div className="flex-1">
                          <span className={`font-bold ${m.quantity_change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {m.quantity_change > 0 ? '+' : ''}{m.quantity_change}
                          </span>
                          <span className="text-gray-500 ml-1">{m.quantity_before} → {m.quantity_after}</span>
                          {m.notes && <p className="text-gray-400 mt-0.5">{m.notes}</p>}
                        </div>
                        <span className="text-gray-400 shrink-0">{m.performed_by}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="px-6 py-4 flex gap-2 flex-wrap border-t border-gray-100 bg-gray-50 shrink-0">
              <button
                onClick={() => onAction('adjust')}
                className="flex items-center gap-2 px-3 py-2 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600"
              >
                <ArrowUpCircle size={14} /> Adjust Stock
              </button>
              <button
                onClick={() => onAction('receiveBatch')}
                className="flex items-center gap-2 px-3 py-2 border border-green-300 text-green-700 text-sm font-medium rounded-lg hover:bg-green-50"
              >
                <Truck size={14} /> Receive Batch
              </button>
              <button
                onClick={() => onAction('itemStatus')}
                className="flex items-center gap-2 px-3 py-2 border border-blue-300 text-blue-700 text-sm font-medium rounded-lg hover:bg-blue-50"
              >
                <RotateCcw size={14} /> Update Status
              </button>
              <button
                onClick={() => onAction('writeOff')}
                className="flex items-center gap-2 px-3 py-2 border border-red-300 text-red-600 text-sm font-medium rounded-lg hover:bg-red-50"
              >
                <ArrowDownCircle size={14} /> Write-Off
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── PO Detail Panel ───────────────────────────────────────────────────────────

function PODetailPanel({ po, loading, onClose, onAction }) {
  const canUpdateStatus = po && PO_NEXT_STATUS[po.status]?.length > 0;
  const canReceive = po && ['sent_to_supplier', 'confirmed', 'partially_received'].includes(po.status);

  return (
    <div className="fixed inset-0 z-40 flex">
      <div className="flex-1 bg-black/30 cursor-pointer" onClick={onClose} />
      <div className="w-full max-w-2xl bg-white shadow-2xl flex flex-col overflow-hidden">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-200 shrink-0">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-sm font-bold text-gray-900">{po?.po_display_id ?? '…'}</span>
              {po?.status && <Badge variant={poStatusVariant(po.status)} dot>{fmtStatus(po.status)}</Badge>}
              {po?.is_auto_generated && <Badge variant="blue">Auto-generated</Badge>}
            </div>
            {po?.supplier_name && <p className="text-xs text-gray-500 mt-0.5">{po.supplier_name}</p>}
          </div>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
            <X size={18} />
          </button>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center text-sm text-gray-400">Loading PO details…</div>
        ) : !po ? null : (
          <div className="flex-1 overflow-y-auto">
            {/* PO Info */}
            <div className="px-6 py-5 border-b border-gray-100 grid grid-cols-2 gap-6">
              <div>
                <SectionLabel icon={ShoppingCart}>PO Details</SectionLabel>
                <div className="space-y-1.5">
                  <DetailRow label="Store" value={po.dark_store_name} />
                  <DetailRow label="Supplier" value={po.supplier_name} />
                  <DetailRow label="Contact" value={po.supplier_contact} mono />
                  <DetailRow label="Created By" value={po.created_by} />
                </div>
              </div>
              <div>
                <SectionLabel icon={Clock}>Timeline</SectionLabel>
                <div className="space-y-1.5">
                  <DetailRow label="Created" value={fmtDateTime(po.created_at)} />
                  <DetailRow label="Expected" value={fmtDateTime(po.expected_delivery_at)} />
                  {po.received_at && <DetailRow label="Received" value={fmtDateTime(po.received_at)} />}
                  {po.approved_by && <DetailRow label="Approved By" value={po.approved_by} />}
                </div>
              </div>
            </div>
            {/* Financial */}
            <div className="px-6 py-4 border-b border-gray-100">
              <SectionLabel icon={Layers}>Summary</SectionLabel>
              <div className="bg-gray-50 rounded-lg px-4 py-3 grid grid-cols-3 gap-4 text-sm">
                <div><p className="text-xs text-gray-500">Total SKUs</p><p className="font-bold mt-0.5">{po.total_skus}</p></div>
                <div><p className="text-xs text-gray-500">Total Units</p><p className="font-bold mt-0.5">{po.total_units}</p></div>
                <div><p className="text-xs text-gray-500">Total Cost</p><p className="font-bold text-orange-600 mt-0.5">{fmtCurrency(po.total_cost)}</p></div>
              </div>
            </div>
            {/* Items */}
            {po.items?.length > 0 && (
              <div className="px-6 py-5 border-b border-gray-100">
                <SectionLabel icon={Package}>Items ({po.items.length})</SectionLabel>
                <div className="border border-gray-100 rounded-lg overflow-hidden">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left text-gray-500 px-3 py-2 font-medium">Product</th>
                        <th className="text-right text-gray-500 px-3 py-2 font-medium">Ordered</th>
                        <th className="text-right text-gray-500 px-3 py-2 font-medium">Received</th>
                        <th className="text-right text-gray-500 px-3 py-2 font-medium">Unit Cost</th>
                        <th className="text-right text-gray-500 px-3 py-2 font-medium">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {po.items.map((item, i) => (
                        <tr key={item.po_item_id ?? i} className="border-t border-gray-100">
                          <td className="px-3 py-2.5">
                            <div className="font-medium text-gray-900">{item.product_name}</div>
                            <div className="text-gray-400 font-mono">{item.sku}</div>
                          </td>
                          <td className="px-3 py-2.5 text-right font-medium">{item.quantity_ordered}</td>
                          <td className="px-3 py-2.5 text-right">
                            {item.quantity_received != null
                              ? <span className={item.quantity_shortage > 0 ? 'text-yellow-600' : 'text-green-600'}>{item.quantity_received}</span>
                              : <span className="text-gray-400">—</span>
                            }
                          </td>
                          <td className="px-3 py-2.5 text-right">{fmtCurrency(item.unit_cost)}</td>
                          <td className="px-3 py-2.5 text-right font-semibold">{fmtCurrency(item.total_cost)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            {po.notes && (
              <div className="px-6 py-4 border-b border-gray-100">
                <SectionLabel icon={Archive}>Notes</SectionLabel>
                <p className="text-sm text-gray-700">{po.notes}</p>
              </div>
            )}
            {/* Actions */}
            <div className="px-6 py-4 flex gap-2 flex-wrap border-t border-gray-100 bg-gray-50 shrink-0">
              {canUpdateStatus && (
                <button
                  onClick={() => onAction('poStatus')}
                  className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600"
                >
                  <RotateCcw size={14} /> Update Status
                </button>
              )}
              {canReceive && (
                <button
                  onClick={() => onAction('receivePO')}
                  className="flex items-center gap-2 px-4 py-2 border border-green-300 text-green-700 text-sm font-medium rounded-lg hover:bg-green-50"
                >
                  <Truck size={14} /> Receive PO
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Action Modals ─────────────────────────────────────────────────────────────

function AdjustStockModal({ open, item, onClose, onConfirm, saving }) {
  const [form, setForm] = useState({
    quantity_change: '',
    movement_type: 'manual_adjustment_add',
    adjustment_reason: 'stock_count_correction',
    notes: '',
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  useEffect(() => {
    if (open) setForm({ quantity_change: '', movement_type: 'manual_adjustment_add', adjustment_reason: 'stock_count_correction', notes: '' });
  }, [open]);

  const isAdd = form.movement_type === 'manual_adjustment_add';

  return (
    <Modal open={open} onClose={onClose} title="Manual Stock Adjustment">
      <div className="space-y-4">
        {item && (
          <div className="bg-gray-50 rounded-lg px-4 py-2.5 text-xs text-gray-600">
            <strong>{item.product_name}</strong> · SKU: {item.sku} · Current: <strong>{item.quantity_available}</strong> units
          </div>
        )}
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Movement Type</label>
          <select value={form.movement_type} onChange={e => set('movement_type', e.target.value)}
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-orange-400 bg-white">
            {MOVEMENT_TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
            Quantity {isAdd ? '(positive = add)' : '(will be deducted)'}
          </label>
          <input
            type="number"
            min={isAdd ? '1' : undefined}
            value={form.quantity_change}
            onChange={e => set('quantity_change', e.target.value)}
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-orange-400"
            placeholder={isAdd ? 'e.g. 50' : 'e.g. -5'}
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Reason</label>
          <select value={form.adjustment_reason} onChange={e => set('adjustment_reason', e.target.value)}
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-orange-400 bg-white">
            {ADJUSTMENT_REASON_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Notes</label>
          <textarea rows={2} value={form.notes} onChange={e => set('notes', e.target.value)}
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-orange-400 resize-none"
            placeholder="Additional context…" />
        </div>
        <div className="flex gap-2 pt-2">
          <button onClick={onClose} className="flex-1 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
          <button
            onClick={() => onConfirm({ ...form, quantity_change: Number(form.quantity_change) })}
            disabled={saving || !form.quantity_change}
            className="flex-1 py-2 text-sm font-medium bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Submit Adjustment'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

function ReceiveBatchModal({ open, item, onClose, onConfirm, saving }) {
  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState({
    batch_no: '', lot_number: '', quantity_received: '',
    cost_price_per_unit: '', mrp: '', expiry_date: '',
    manufactured_date: today, qc_status: 'passed', received_by: '',
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  useEffect(() => {
    if (open) setForm({
      batch_no: '', lot_number: '', quantity_received: '',
      cost_price_per_unit: item?.cost_price ?? '', mrp: item?.mrp ?? '',
      expiry_date: '', manufactured_date: today, qc_status: 'passed', received_by: '',
    });
  }, [open, item]); // eslint-disable-line

  return (
    <Modal open={open} onClose={onClose} title="Receive New Batch" width="max-w-xl">
      <div className="space-y-4">
        {item && (
          <div className="bg-gray-50 rounded-lg px-4 py-2.5 text-xs text-gray-600">
            <strong>{item.product_name}</strong> · SKU: {item.sku}
          </div>
        )}
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Batch No." required>
            <input value={form.batch_no} onChange={e => set('batch_no', e.target.value)}
              className={INPUT} placeholder="BATCH-AMK-2602" />
          </FormField>
          <FormField label="Lot Number">
            <input value={form.lot_number} onChange={e => set('lot_number', e.target.value)}
              className={INPUT} placeholder="LOT-2026-06-09" />
          </FormField>
          <FormField label="Quantity Received" required>
            <input type="number" min="1" value={form.quantity_received} onChange={e => set('quantity_received', e.target.value)}
              className={INPUT} placeholder="500" />
          </FormField>
          <FormField label="QC Status">
            <select value={form.qc_status} onChange={e => set('qc_status', e.target.value)} className={SELECT}>
              {QC_STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </FormField>
          <FormField label="Cost Price / Unit (₹)">
            <input type="number" min="0" step="0.01" value={form.cost_price_per_unit} onChange={e => set('cost_price_per_unit', e.target.value)}
              className={INPUT} placeholder="52.00" />
          </FormField>
          <FormField label="MRP / Unit (₹)">
            <input type="number" min="0" step="0.01" value={form.mrp} onChange={e => set('mrp', e.target.value)}
              className={INPUT} placeholder="72.00" />
          </FormField>
          <FormField label="Manufactured Date">
            <input type="date" value={form.manufactured_date} onChange={e => set('manufactured_date', e.target.value)} className={INPUT} />
          </FormField>
          <FormField label="Expiry Date" required>
            <input type="date" value={form.expiry_date} onChange={e => set('expiry_date', e.target.value)} className={INPUT} />
          </FormField>
        </div>
        <FormField label="Received By">
          <input value={form.received_by} onChange={e => set('received_by', e.target.value)}
            className={INPUT} placeholder="store_staff_emp_010" />
        </FormField>
        <div className="flex gap-2 pt-2">
          <button onClick={onClose} className="flex-1 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
          <button
            onClick={() => onConfirm({ ...form, quantity_received: Number(form.quantity_received), cost_price_per_unit: Number(form.cost_price_per_unit), mrp: Number(form.mrp) })}
            disabled={saving || !form.batch_no || !form.quantity_received || !form.expiry_date}
            className="flex-1 py-2 text-sm font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            {saving ? 'Receiving…' : 'Receive Batch'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

function UpdateItemStatusModal({ open, item, onClose, onConfirm, saving }) {
  const [status, setStatus] = useState('');
  const [note, setNote] = useState('');
  useEffect(() => { if (open && item) { setStatus(item.status ?? ''); setNote(''); } }, [open, item]);
  return (
    <Modal open={open} onClose={onClose} title="Update Inventory Status">
      <div className="space-y-4">
        {item && <div className="bg-gray-50 rounded-lg px-4 py-2.5 text-xs text-gray-600"><strong>{item.product_name}</strong> · Current: <Badge variant={stockStatusVariant(item.status)}>{fmtStatus(item.status)}</Badge></div>}
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">New Status</label>
          <select value={status} onChange={e => setStatus(e.target.value)} className={`w-full ${SELECT}`}>
            {INV_STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Note (optional)</label>
          <input value={note} onChange={e => setNote(e.target.value)} className={`w-full ${INPUT}`} placeholder="Reason for status change…" />
        </div>
        <div className="flex gap-2 pt-2">
          <button onClick={onClose} className="flex-1 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
          <button
            onClick={() => onConfirm({ status, note })}
            disabled={saving || !status}
            className="flex-1 py-2 text-sm font-medium bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50"
          >
            {saving ? 'Updating…' : 'Update Status'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

function WriteOffModal({ open, item, batches, onClose, onConfirm, saving }) {
  const [form, setForm] = useState({ batch_id: '', quantity: '', reason: 'expiry', notes: '' });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  useEffect(() => { if (open) setForm({ batch_id: '', quantity: '', reason: 'expiry', notes: '' }); }, [open]);
  return (
    <Modal open={open} onClose={onClose} title="Write-Off Stock">
      <div className="space-y-4">
        <div className="bg-red-50 border border-red-100 rounded-lg px-4 py-2.5 text-xs text-red-600">
          Writing off stock permanently removes it from inventory. This action cannot be undone.
        </div>
        {batches.length > 0 ? (
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Batch <span className="text-red-400">*</span>
            </label>
            <select value={form.batch_id} onChange={e => set('batch_id', e.target.value)} className={`w-full ${SELECT}`}>
              <option value="">Select batch…</option>
              {batches.map(b => (
                <option key={b._id ?? b.batch_id} value={b._id ?? b.batch_id}>
                  {b.batch_no} · Remaining: {b.quantity_remaining} · Expiry: {fmtDate(b.expiry_date)}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-2.5 text-xs text-yellow-700">
            No batches available. Open this item's detail panel and switch to the Batches tab first, then retry.
          </div>
        )}
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Quantity to Write Off</label>
          <input type="number" min="1" value={form.quantity} onChange={e => set('quantity', e.target.value)} className={`w-full ${INPUT}`} placeholder="10" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Reason</label>
          <select value={form.reason} onChange={e => set('reason', e.target.value)} className={`w-full ${SELECT}`}>
            <option value="expiry">Expiry</option>
            <option value="damage">Damage</option>
            <option value="theft">Theft</option>
            <option value="qc_fail">QC Failure</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Notes</label>
          <textarea rows={2} value={form.notes} onChange={e => set('notes', e.target.value)}
            className={`w-full resize-none ${INPUT}`} placeholder="Describe the write-off reason…" />
        </div>
        <div className="flex gap-2 pt-2">
          <button onClick={onClose} className="flex-1 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
          <button
            onClick={() => onConfirm({ ...form, quantity: Number(form.quantity) })}
            disabled={saving || !form.quantity || !form.batch_id}
            className="flex-1 py-2 text-sm font-medium bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50"
          >
            {saving ? 'Writing Off…' : 'Confirm Write-Off'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

function ReportDamageModal({ open, storeId, onClose, onConfirm, saving }) {
  const [form, setForm] = useState({
    inventory_id: '', quantity_damaged: '', damage_type: 'packaging_breach',
    damage_reason: '', write_off_immediately: false,
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  useEffect(() => {
    if (open) setForm({ inventory_id: '', quantity_damaged: '', damage_type: 'packaging_breach', damage_reason: '', write_off_immediately: false });
  }, [open]);
  return (
    <Modal open={open} onClose={onClose} title="Report Damage">
      <div className="space-y-4">
        <FormField label="Inventory ID" required>
          <input value={form.inventory_id} onChange={e => set('inventory_id', e.target.value)} className={INPUT} placeholder="inv_amk_gold_1l_ds_noida_sec62" />
        </FormField>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Quantity Damaged" required>
            <input type="number" min="1" value={form.quantity_damaged} onChange={e => set('quantity_damaged', e.target.value)} className={INPUT} placeholder="8" />
          </FormField>
          <FormField label="Damage Type">
            <select value={form.damage_type} onChange={e => set('damage_type', e.target.value)} className={SELECT}>
              {DAMAGE_TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </FormField>
        </div>
        <FormField label="Damage Reason" required>
          <textarea rows={2} value={form.damage_reason} onChange={e => set('damage_reason', e.target.value)}
            className={`w-full resize-none ${INPUT}`} placeholder="Describe how the damage occurred…" />
        </FormField>
        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
          <input type="checkbox" checked={form.write_off_immediately} onChange={e => set('write_off_immediately', e.target.checked)} className="rounded" />
          Write off stock immediately
        </label>
        <div className="flex gap-2 pt-2">
          <button onClick={onClose} className="flex-1 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
          <button
            onClick={() => onConfirm({ ...form, quantity_damaged: Number(form.quantity_damaged) })}
            disabled={saving || !form.inventory_id || !form.quantity_damaged || !form.damage_reason}
            className="flex-1 py-2 text-sm font-medium bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50"
          >
            {saving ? 'Reporting…' : 'Report Damage'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

function CreatePOModal({ open, storeId, onClose, onConfirm, saving }) {
  const [form, setForm] = useState({
    dark_store_id: storeId, dark_store_name: '', supplier_id: '',
    supplier_name: '', supplier_contact: '', expected_delivery_at: '', notes: '',
    items: [{ sku: '', product_name: '', quantity_ordered: '', unit_cost: '' }],
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const setItem = (i, k, v) => setForm(f => {
    const items = [...f.items];
    items[i] = { ...items[i], [k]: v };
    return { ...f, items };
  });
  const addItem = () => setForm(f => ({ ...f, items: [...f.items, { sku: '', product_name: '', quantity_ordered: '', unit_cost: '' }] }));
  const removeItem = (i) => setForm(f => ({ ...f, items: f.items.filter((_, idx) => idx !== i) }));

  useEffect(() => {
    if (open) setForm({
      dark_store_id: storeId, dark_store_name: '', supplier_id: '',
      supplier_name: '', supplier_contact: '', expected_delivery_at: '', notes: '',
      items: [{ sku: '', product_name: '', quantity_ordered: '', unit_cost: '' }],
    });
  }, [open, storeId]);

  const payload = {
    ...form,
    items: form.items.map(it => ({
      ...it,
      quantity_ordered: Number(it.quantity_ordered),
      unit_cost: Number(it.unit_cost),
    })),
  };

  const isValid = form.supplier_id && form.supplier_name && form.items.every(it => it.sku && it.quantity_ordered);

  return (
    <Modal open={open} onClose={onClose} title="Create Purchase Order" width="max-w-2xl">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Dark Store ID" required>
            <input value={form.dark_store_id} onChange={e => set('dark_store_id', e.target.value)} className={INPUT} placeholder="ds_noida_sec62" />
          </FormField>
          <FormField label="Store Name">
            <input value={form.dark_store_name} onChange={e => set('dark_store_name', e.target.value)} className={INPUT} placeholder="Zipkart - Noida Sector 62" />
          </FormField>
          <FormField label="Supplier ID" required>
            <input value={form.supplier_id} onChange={e => set('supplier_id', e.target.value)} className={INPUT} placeholder="sup_amul_distributor_noida" />
          </FormField>
          <FormField label="Supplier Name" required>
            <input value={form.supplier_name} onChange={e => set('supplier_name', e.target.value)} className={INPUT} placeholder="Amul Distributor - Noida Branch" />
          </FormField>
          <FormField label="Supplier Contact">
            <input value={form.supplier_contact} onChange={e => set('supplier_contact', e.target.value)} className={INPUT} placeholder="9999988001" />
          </FormField>
          <FormField label="Expected Delivery">
            <input type="datetime-local" value={form.expected_delivery_at} onChange={e => set('expected_delivery_at', e.target.value)} className={INPUT} />
          </FormField>
        </div>
        <FormField label="Notes">
          <input value={form.notes} onChange={e => set('notes', e.target.value)} className={INPUT} placeholder="Urgent restock…" />
        </FormField>

        {/* Items */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Items</label>
            <button onClick={addItem} className="text-xs text-orange-600 hover:text-orange-700 flex items-center gap-1">
              <PlusCircle size={12} /> Add Item
            </button>
          </div>
          <div className="space-y-2">
            {form.items.map((it, i) => (
              <div key={i} className="border border-gray-200 rounded-lg p-3 grid grid-cols-4 gap-2 items-end">
                <FormField label="SKU" required>
                  <input value={it.sku} onChange={e => setItem(i, 'sku', e.target.value)} className={INPUT} placeholder="AMK-GOLD-1L-001" />
                </FormField>
                <FormField label="Product Name">
                  <input value={it.product_name} onChange={e => setItem(i, 'product_name', e.target.value)} className={INPUT} placeholder="Amul Gold Milk 1L" />
                </FormField>
                <FormField label="Qty Ordered" required>
                  <input type="number" min="1" value={it.quantity_ordered} onChange={e => setItem(i, 'quantity_ordered', e.target.value)} className={INPUT} placeholder="500" />
                </FormField>
                <div className="flex gap-2 items-end">
                  <FormField label="Unit Cost (₹)" className="flex-1">
                    <input type="number" min="0" step="0.01" value={it.unit_cost} onChange={e => setItem(i, 'unit_cost', e.target.value)} className={INPUT} placeholder="52.00" />
                  </FormField>
                  {form.items.length > 1 && (
                    <button onClick={() => removeItem(i)} className="mb-0.5 p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                      <X size={14} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <button onClick={onClose} className="flex-1 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
          <button
            onClick={() => onConfirm(payload)}
            disabled={saving || !isValid}
            className="flex-1 py-2 text-sm font-medium bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50"
          >
            {saving ? 'Creating…' : 'Create Purchase Order'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

function UpdatePOStatusModal({ open, po, onClose, onConfirm, saving }) {
  const [status, setStatus] = useState('');
  const [notes, setNotes] = useState('');
  useEffect(() => {
    if (open && po) {
      const next = PO_NEXT_STATUS[po.status] ?? [];
      setStatus(next[0] ?? '');
      setNotes('');
    }
  }, [open, po]);
  const nextStatuses = po ? (PO_NEXT_STATUS[po.status] ?? []) : [];
  return (
    <Modal open={open} onClose={onClose} title="Update PO Status">
      <div className="space-y-4">
        {po && <div className="bg-gray-50 rounded-lg px-4 py-2.5 text-xs text-gray-600"><strong>{po.po_display_id}</strong> · Current: <Badge variant={poStatusVariant(po.status)}>{fmtStatus(po.status)}</Badge></div>}
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">New Status</label>
          <select value={status} onChange={e => setStatus(e.target.value)} className={`w-full ${SELECT}`}>
            {nextStatuses.map(s => <option key={s} value={s}>{fmtStatus(s)}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Notes (optional)</label>
          <input value={notes} onChange={e => setNotes(e.target.value)} className={`w-full ${INPUT}`} placeholder="Sent via WhatsApp to supplier…" />
        </div>
        <div className="flex gap-2 pt-2">
          <button onClick={onClose} className="flex-1 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
          <button
            onClick={() => onConfirm({ status, notes })}
            disabled={saving || !status}
            className="flex-1 py-2 text-sm font-medium bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50"
          >
            {saving ? 'Updating…' : 'Update Status'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

function ReceivePOModal({ open, po, onClose, onConfirm, saving }) {
  const [receivedBy, setReceivedBy] = useState('');
  const [notes, setNotes] = useState('');
  const [itemForms, setItemForms] = useState([]);

  useEffect(() => {
    if (open && po?.items) {
      setReceivedBy('');
      setNotes('');
      setItemForms(po.items.map(it => ({
        sku: it.sku,
        product_name: it.product_name,
        quantity_ordered: it.quantity_ordered,
        quantity_received: String(it.quantity_ordered),
        batch_no: '',
        expiry_date: '',
        cost_price_per_unit: String(it.unit_cost ?? ''),
      })));
    }
  }, [open, po]);

  const setItemField = (i, k, v) => setItemForms(f => {
    const arr = [...f];
    arr[i] = { ...arr[i], [k]: v };
    return arr;
  });

  const payload = {
    received_by: receivedBy,
    notes,
    items: itemForms.map(it => ({
      sku: it.sku,
      quantity_received: Number(it.quantity_received),
      batch_no: it.batch_no,
      expiry_date: it.expiry_date,
      cost_price_per_unit: Number(it.cost_price_per_unit),
    })),
  };

  return (
    <Modal open={open} onClose={onClose} title="Receive Purchase Order" width="max-w-2xl">
      <div className="space-y-4">
        {po && <div className="bg-gray-50 rounded-lg px-4 py-2.5 text-xs text-gray-600"><strong>{po.po_display_id}</strong> · {po.supplier_name}</div>}
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Received By" required>
            <input value={receivedBy} onChange={e => setReceivedBy(e.target.value)} className={INPUT} placeholder="store_staff_emp_010" />
          </FormField>
          <FormField label="Notes">
            <input value={notes} onChange={e => setNotes(e.target.value)} className={INPUT} placeholder="All items received in good condition" />
          </FormField>
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">Items Received</label>
          <div className="space-y-3">
            {itemForms.map((it, i) => (
              <div key={i} className="border border-gray-200 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-mono text-xs text-gray-700 font-semibold">{it.sku}</span>
                  <span className="text-xs text-gray-500">{it.product_name}</span>
                  <span className="ml-auto text-xs text-gray-400">Ordered: {it.quantity_ordered}</span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  <FormField label="Qty Received" required>
                    <input type="number" min="0" max={it.quantity_ordered} value={it.quantity_received}
                      onChange={e => setItemField(i, 'quantity_received', e.target.value)} className={INPUT} />
                  </FormField>
                  <FormField label="Batch No." required>
                    <input value={it.batch_no} onChange={e => setItemField(i, 'batch_no', e.target.value)} className={INPUT} placeholder="BATCH-001" />
                  </FormField>
                  <FormField label="Expiry Date">
                    <input type="date" value={it.expiry_date} onChange={e => setItemField(i, 'expiry_date', e.target.value)} className={INPUT} />
                  </FormField>
                  <FormField label="Cost/Unit (₹)">
                    <input type="number" min="0" step="0.01" value={it.cost_price_per_unit}
                      onChange={e => setItemField(i, 'cost_price_per_unit', e.target.value)} className={INPUT} />
                  </FormField>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <button onClick={onClose} className="flex-1 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
          <button
            onClick={() => onConfirm(payload)}
            disabled={saving || !receivedBy || itemForms.some(it => !it.batch_no)}
            className="flex-1 py-2 text-sm font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            {saving ? 'Receiving…' : 'Confirm Receipt'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Create Inventory Item Modal ───────────────────────────────────────────────

function CreateInventoryItemModal({ open, storeId, onClose, onConfirm, saving }) {
  const emptyForm = () => ({
    dark_store_id: storeId,
    product_id: '',
    variant_id: '',
    sku: '',
    product_name: '',
    brand: '',
    category: '',
    cost_price: '',
    mrp: '',
    selling_price: '',
    reorder_point: '',
    reorder_quantity: '',
    max_stock_level: '',
    supplier_id: '',
    supplier_name: '',
    supplier_lead_time_days: '',
    storage_zone: 'ambient',
    weight_per_unit_grams: '',
    auto_reorder_enabled: false,
  });

  const [form, setForm] = useState(emptyForm);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  useEffect(() => {
    if (open) setForm(emptyForm());
  }, [open, storeId]); // eslint-disable-line

  const payload = {
    ...form,
    cost_price:              Number(form.cost_price),
    mrp:                     Number(form.mrp),
    selling_price:           Number(form.selling_price),
    reorder_point:           form.reorder_point           ? Number(form.reorder_point)           : undefined,
    reorder_quantity:        form.reorder_quantity        ? Number(form.reorder_quantity)        : undefined,
    max_stock_level:         form.max_stock_level         ? Number(form.max_stock_level)         : undefined,
    supplier_lead_time_days: form.supplier_lead_time_days ? Number(form.supplier_lead_time_days) : undefined,
    weight_per_unit_grams:   form.weight_per_unit_grams   ? Number(form.weight_per_unit_grams)   : undefined,
    quantity_available: 0,
  };

  const isValid = form.dark_store_id && form.product_id && form.variant_id &&
    form.sku && form.product_name && form.cost_price && form.mrp && form.selling_price;

  const STORAGE_ZONES = ['ambient', 'refrigerated', 'frozen', 'dry', 'hazardous'];

  return (
    <Modal open={open} onClose={onClose} title="Add Inventory Item" width="max-w-2xl">
      <div className="space-y-5">

        {/* Info banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-xs text-blue-700">
          <strong>Step 1 of 2:</strong> Create the inventory record here (stock starts at 0).
          After saving, create a Purchase Order for this SKU and receive it — that will add the opening stock.
        </div>

        {/* Store & IDs */}
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Store & Product IDs</p>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Dark Store ID" required>
              <input value={form.dark_store_id} onChange={e => set('dark_store_id', e.target.value)} className={INPUT} placeholder="ds_noida_sec62" />
            </FormField>
            <FormField label="SKU" required>
              <input value={form.sku} onChange={e => set('sku', e.target.value)} className={INPUT} placeholder="AMK-GOLD-1L-001" />
            </FormField>
            <FormField label="Product ID" required>
              <input value={form.product_id} onChange={e => set('product_id', e.target.value)} className={INPUT} placeholder="prod_amul_gold_1l" />
            </FormField>
            <FormField label="Variant ID" required>
              <input value={form.variant_id} onChange={e => set('variant_id', e.target.value)} className={INPUT} placeholder="var_amul_gold_1l_pack" />
            </FormField>
          </div>
        </div>

        {/* Product info */}
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Product Details</p>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Product Name" required>
              <input value={form.product_name} onChange={e => set('product_name', e.target.value)} className={INPUT} placeholder="Amul Gold Full Cream Milk 1L" />
            </FormField>
            <FormField label="Brand">
              <input value={form.brand} onChange={e => set('brand', e.target.value)} className={INPUT} placeholder="Amul" />
            </FormField>
            <FormField label="Category">
              <input value={form.category} onChange={e => set('category', e.target.value)} className={INPUT} placeholder="Dairy" />
            </FormField>
            <FormField label="Storage Zone">
              <select value={form.storage_zone} onChange={e => set('storage_zone', e.target.value)} className={SELECT}>
                {STORAGE_ZONES.map(z => <option key={z} value={z}>{z.charAt(0).toUpperCase() + z.slice(1)}</option>)}
              </select>
            </FormField>
            <FormField label="Weight (grams)">
              <input type="number" min="0" value={form.weight_per_unit_grams} onChange={e => set('weight_per_unit_grams', e.target.value)} className={INPUT} placeholder="1000" />
            </FormField>
            <FormField label="Auto Reorder">
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer mt-2">
                <input type="checkbox" checked={form.auto_reorder_enabled} onChange={e => set('auto_reorder_enabled', e.target.checked)} className="rounded" />
                Enable auto purchase order
              </label>
            </FormField>
          </div>
        </div>

        {/* Pricing */}
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Pricing</p>
          <div className="grid grid-cols-3 gap-4">
            <FormField label="Cost Price (₹)" required>
              <input type="number" min="0" step="0.01" value={form.cost_price} onChange={e => set('cost_price', e.target.value)} className={INPUT} placeholder="52.00" />
            </FormField>
            <FormField label="MRP (₹)" required>
              <input type="number" min="0" step="0.01" value={form.mrp} onChange={e => set('mrp', e.target.value)} className={INPUT} placeholder="72.00" />
            </FormField>
            <FormField label="Selling Price (₹)" required>
              <input type="number" min="0" step="0.01" value={form.selling_price} onChange={e => set('selling_price', e.target.value)} className={INPUT} placeholder="68.00" />
            </FormField>
          </div>
        </div>

        {/* Reorder config */}
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Reorder Configuration</p>
          <div className="grid grid-cols-3 gap-4">
            <FormField label="Reorder Point">
              <input type="number" min="0" value={form.reorder_point} onChange={e => set('reorder_point', e.target.value)} className={INPUT} placeholder="50" />
            </FormField>
            <FormField label="Reorder Quantity">
              <input type="number" min="0" value={form.reorder_quantity} onChange={e => set('reorder_quantity', e.target.value)} className={INPUT} placeholder="200" />
            </FormField>
            <FormField label="Max Stock Level">
              <input type="number" min="0" value={form.max_stock_level} onChange={e => set('max_stock_level', e.target.value)} className={INPUT} placeholder="500" />
            </FormField>
          </div>
        </div>

        {/* Supplier */}
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Supplier (optional)</p>
          <div className="grid grid-cols-3 gap-4">
            <FormField label="Supplier ID">
              <input value={form.supplier_id} onChange={e => set('supplier_id', e.target.value)} className={INPUT} placeholder="sup_amul_noida" />
            </FormField>
            <FormField label="Supplier Name">
              <input value={form.supplier_name} onChange={e => set('supplier_name', e.target.value)} className={INPUT} placeholder="Amul Distributor" />
            </FormField>
            <FormField label="Lead Time (days)">
              <input type="number" min="0" value={form.supplier_lead_time_days} onChange={e => set('supplier_lead_time_days', e.target.value)} className={INPUT} placeholder="2" />
            </FormField>
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <button onClick={onClose} className="flex-1 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
          <button
            onClick={() => onConfirm(payload)}
            disabled={saving || !isValid}
            className="flex-1 py-2 text-sm font-medium bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50"
          >
            {saving ? 'Creating…' : 'Create Inventory Item'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Small Helpers ─────────────────────────────────────────────────────────────

const INPUT ='text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-orange-400 w-full';
const SELECT = 'text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-orange-400 bg-white w-full';

function FormField({ label, children, required }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

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

function StockTile({ label, value, color }) {
  return (
    <div className="bg-gray-50 rounded-lg px-3 py-2.5 text-center">
      <p className={`text-lg font-bold ${color}`}>{value ?? 0}</p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
    </div>
  );
}

// missing import used above
function BarChart2({ size, className }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/></svg>;
}

function Clock({ size, className }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
}
