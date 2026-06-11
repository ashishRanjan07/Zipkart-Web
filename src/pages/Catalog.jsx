import { useState, useEffect, useCallback } from 'react';
import {
  Package, Tag, Layers, CheckCircle, Search, Plus, RefreshCw,
  ChevronLeft, ChevronRight, X, Edit2, Trash2, Star, AlertTriangle,
  Image, List, BarChart2, Sliders, ShoppingBag, Award, TrendingUp,
  Eye, Send, DollarSign, Clock, CheckSquare, XCircle,
} from 'lucide-react';
import Badge from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import StatCard from '../components/ui/StatCard';
import Table from '../components/ui/Table';
import toast from '../lib/toast';
import catalogService from '../services/catalog.service';

// ─── Constants ────────────────────────────────────────────────────────────────
const LIMIT = 20;

const STATUS_VARIANTS = {
  active:            'green',
  draft:             'gray',
  pending_approval:  'yellow',
  inactive:          'red',
  rejected:          'red',
  discontinued:      'red',
  out_of_season:     'orange',
};

const LISTING_TYPES  = ['standard','weighted','combo','bundle','fresh_produce'];
const STORAGE_TYPES  = ['ambient','refrigerated','frozen','cool_and_dry'];
const GST_RATES      = [0, 5, 12, 18, 28];
const AGE_OPTS       = ['none','18_plus','21_plus'];
const PRODUCT_STATUSES = ['draft','pending_approval','active','inactive','discontinued','out_of_season'];
const BULK_STATUSES    = ['inactive','discontinued','out_of_season','draft'];

const safeArr = (v) => (Array.isArray(v) ? v : []);
const fmtCur  = (n) => typeof n === 'number' ? `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—';
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const fmt     = (s) => s ? s.replace(/_/g, ' ') : '—';
const capFirst= (s) => s ? s.charAt(0).toUpperCase() + s.slice(1) : '';

// ─── Shared UI ────────────────────────────────────────────────────────────────
const inp = 'w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-orange-400';
const sel = 'w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-orange-400 bg-white';

function FormField({ label, required, children, col2 }) {
  return (
    <div className={col2 ? 'col-span-2' : ''}>
      <label className="block text-xs font-medium text-gray-600 mb-1">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

function SectionHead({ title }) {
  return <div className="col-span-2 text-[11px] font-semibold text-gray-400 uppercase tracking-wider pt-2">{title}</div>;
}

function DetailRow({ label, value }) {
  return (
    <div className="flex items-start justify-between py-2.5 gap-3 border-b border-gray-100 last:border-0">
      <span className="text-xs text-gray-500 shrink-0 mt-0.5">{label}</span>
      <span className="text-sm font-medium text-gray-900 text-right break-all max-w-[60%]">{value ?? '—'}</span>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div>
      <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">{title}</div>
      <div className="bg-gray-50 rounded-xl px-4">{children}</div>
    </div>
  );
}

function ProductThumb({ url, name }) {
  if (url) return <img src={url} alt={name} className="w-10 h-10 rounded-lg object-cover border border-gray-100" />;
  return (
    <div className="w-10 h-10 rounded-lg bg-linear-to-br from-orange-100 to-orange-200 flex items-center justify-center shrink-0">
      <Package size={16} className="text-orange-400" />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PRODUCT MODALS
// ═══════════════════════════════════════════════════════════════════════════════

function CreateProductModal({ onClose, onCreated }) {
  const [form, setForm] = useState({
    name:'', sku:'', brand_id:'', category_id:'',
    mrp:'', selling_price:'', cost_price:'',
    listing_type:'standard', short_description:'', long_description:'',
    weight_grams:'', weight_display:'', storage_condition:'ambient',
    country_of_origin:'India', manufacturer_name:'', fssai_license_number:'',
    gst_rate_pct:5, gst_inclusive:true, hsn_code:'',
  });
  const [brands,     setBrands]     = useState([]);
  const [categories, setCategories] = useState([]);
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  useEffect(() => {
    Promise.all([
      catalogService.listBrands({ limit: 200 }),
      catalogService.listCategories({ limit: 200 }),
    ]).then(([b, c]) => {
      setBrands(safeArr(b?.data?.brands));
      setCategories(safeArr(c?.data?.categories));
    }).catch(() => {});
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    const { name, sku, brand_id, category_id, mrp, selling_price } = form;
    if (!name || !sku || !brand_id || !category_id || !mrp || !selling_price) {
      toast.error('Name, SKU, brand, category, MRP and selling price are required'); return;
    }
    if (parseFloat(selling_price) > parseFloat(mrp)) { toast.error('Selling price cannot exceed MRP'); return; }
    setSaving(true);
    try {
      const body = {
        name: name.trim(), sku: sku.trim().toUpperCase(),
        brand_id, category_id,
        mrp: parseFloat(mrp), selling_price: parseFloat(selling_price),
        cost_price: form.cost_price ? parseFloat(form.cost_price) : undefined,
        listing_type: form.listing_type,
        short_description: form.short_description || undefined,
        long_description:  form.long_description  || undefined,
        weight_grams:      form.weight_grams  ? parseFloat(form.weight_grams)  : undefined,
        weight_display:    form.weight_display  || undefined,
        storage_condition: form.storage_condition,
        country_of_origin: form.country_of_origin || undefined,
        manufacturer_name: form.manufacturer_name || undefined,
        fssai_license_number: form.fssai_license_number || undefined,
        gst_rate_pct:  parseInt(form.gst_rate_pct),
        gst_inclusive: form.gst_inclusive,
        hsn_code:      form.hsn_code || undefined,
      };
      await catalogService.createProduct(body);
      toast.success('Product created');
      onCreated(); onClose();
    } catch (err) { toast.error(err.message || 'Failed'); }
    finally { setSaving(false); }
  };

  return (
    <form onSubmit={submit} className="space-y-4 max-h-[74vh] overflow-y-auto pr-1">
      <div className="grid grid-cols-2 gap-3">
        <SectionHead title="Basic Info" />
        <FormField label="Product Name" required col2><input className={inp} value={form.name} onChange={e => set('name', e.target.value)} /></FormField>
        <FormField label="SKU" required><input className={inp} value={form.sku} onChange={e => set('sku', e.target.value)} placeholder="e.g. MLK-500ML" /></FormField>
        <FormField label="Listing Type">
          <select className={sel} value={form.listing_type} onChange={e => set('listing_type', e.target.value)}>
            {LISTING_TYPES.map(t => <option key={t} value={t}>{fmt(t)}</option>)}
          </select>
        </FormField>
        <FormField label="Brand" required>
          <select className={sel} value={form.brand_id} onChange={e => set('brand_id', e.target.value)}>
            <option value="">Select brand</option>
            {brands.map(b => <option key={b._id} value={b._id}>{b.brand_name}</option>)}
          </select>
        </FormField>
        <FormField label="Category" required>
          <select className={sel} value={form.category_id} onChange={e => set('category_id', e.target.value)}>
            <option value="">Select category</option>
            {categories.map(c => <option key={c._id} value={c._id}>{' '.repeat((c.level - 1) * 4)}{c.name}</option>)}
          </select>
        </FormField>

        <SectionHead title="Pricing" />
        <FormField label="MRP (₹)" required><input className={inp} type="number" step="0.01" min="0" value={form.mrp} onChange={e => set('mrp', e.target.value)} /></FormField>
        <FormField label="Selling Price (₹)" required><input className={inp} type="number" step="0.01" min="0" value={form.selling_price} onChange={e => set('selling_price', e.target.value)} /></FormField>
        <FormField label="Cost Price (₹)"><input className={inp} type="number" step="0.01" min="0" value={form.cost_price} onChange={e => set('cost_price', e.target.value)} /></FormField>
        <FormField label="GST Rate (%)">
          <select className={sel} value={form.gst_rate_pct} onChange={e => set('gst_rate_pct', e.target.value)}>
            {GST_RATES.map(r => <option key={r} value={r}>{r}%</option>)}
          </select>
        </FormField>
        <FormField label="HSN Code"><input className={inp} value={form.hsn_code} onChange={e => set('hsn_code', e.target.value)} placeholder="e.g. 0402" /></FormField>
        <div className="flex items-center gap-2 mt-1">
          <input type="checkbox" id="gst_inc" checked={form.gst_inclusive} onChange={e => set('gst_inclusive', e.target.checked)} className="rounded" />
          <label htmlFor="gst_inc" className="text-sm text-gray-600">GST inclusive in price</label>
        </div>

        <SectionHead title="Physical" />
        <FormField label="Weight (grams)"><input className={inp} type="number" min="0" value={form.weight_grams} onChange={e => set('weight_grams', e.target.value)} /></FormField>
        <FormField label="Weight Display"><input className={inp} value={form.weight_display} onChange={e => set('weight_display', e.target.value)} placeholder="e.g. 500g" /></FormField>
        <FormField label="Storage Condition">
          <select className={sel} value={form.storage_condition} onChange={e => set('storage_condition', e.target.value)}>
            {STORAGE_TYPES.map(s => <option key={s} value={s}>{fmt(s)}</option>)}
          </select>
        </FormField>

        <SectionHead title="Description" />
        <FormField label="Short Description" col2><textarea className={`${inp} resize-none`} rows={2} value={form.short_description} onChange={e => set('short_description', e.target.value)} /></FormField>

        <SectionHead title="Regulatory" />
        <FormField label="Country of Origin"><input className={inp} value={form.country_of_origin} onChange={e => set('country_of_origin', e.target.value)} /></FormField>
        <FormField label="Manufacturer Name"><input className={inp} value={form.manufacturer_name} onChange={e => set('manufacturer_name', e.target.value)} /></FormField>
        <FormField label="FSSAI License No."><input className={inp} value={form.fssai_license_number} onChange={e => set('fssai_license_number', e.target.value)} /></FormField>
      </div>
      <div className="flex gap-2 pt-2 border-t sticky bottom-0 bg-white pb-1">
        <button type="submit" disabled={saving} className="flex-1 py-2.5 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600 disabled:opacity-50">{saving ? 'Creating…' : 'Create Product'}</button>
        <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-gray-200 text-sm text-gray-600 rounded-lg hover:bg-gray-50">Cancel</button>
      </div>
    </form>
  );
}

function ProductStatusModal({ product, onClose, onSaved }) {
  const [status, setStatus] = useState(product.status || 'draft');
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await catalogService.updateProductStatus(product._id, { status, reason: reason || undefined });
      toast.success('Status updated');
      onSaved(); onClose();
    } catch (err) { toast.error(err.message || 'Failed'); }
    finally { setSaving(false); }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <FormField label="New Status">
        <div className="grid grid-cols-2 gap-2">
          {PRODUCT_STATUSES.map(s => (
            <button key={s} type="button" onClick={() => setStatus(s)}
              className={`py-2 text-sm font-medium rounded-lg border transition-colors ${status === s ? 'bg-orange-500 text-white border-orange-500' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
              {capFirst(fmt(s))}
            </button>
          ))}
        </div>
      </FormField>
      {['inactive','discontinued','rejected'].includes(status) && (
        <FormField label="Reason">
          <textarea className={`${inp} resize-none`} rows={3} value={reason} onChange={e => setReason(e.target.value)} placeholder="Optional reason" />
        </FormField>
      )}
      <div className="flex gap-2 pt-1">
        <button type="submit" disabled={saving} className="flex-1 py-2.5 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600 disabled:opacity-50">{saving ? 'Saving…' : 'Update Status'}</button>
        <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-gray-200 text-sm text-gray-600 rounded-lg hover:bg-gray-50">Cancel</button>
      </div>
    </form>
  );
}

function UpdatePricingModal({ product, onClose, onSaved }) {
  const [form, setForm] = useState({
    mrp: product.mrp ?? '', selling_price: product.selling_price ?? '',
    cost_price: product.cost_price ?? '', change_reason: '',
    special_price: product.special_price ?? '', special_price_from: '', special_price_to: '',
  });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    if (parseFloat(form.selling_price) > parseFloat(form.mrp)) { toast.error('Selling price cannot exceed MRP'); return; }
    setSaving(true);
    try {
      await catalogService.updatePricing(product._id, {
        mrp: parseFloat(form.mrp),
        selling_price: parseFloat(form.selling_price),
        cost_price: form.cost_price ? parseFloat(form.cost_price) : undefined,
        change_reason: form.change_reason || undefined,
        special_price: form.special_price ? parseFloat(form.special_price) : undefined,
        special_price_from: form.special_price_from || undefined,
        special_price_to:   form.special_price_to   || undefined,
      });
      toast.success('Pricing updated');
      onSaved(); onClose();
    } catch (err) { toast.error(err.message || 'Failed'); }
    finally { setSaving(false); }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <FormField label="MRP (₹)" required><input className={inp} type="number" step="0.01" min="0" value={form.mrp} onChange={e => set('mrp', e.target.value)} /></FormField>
        <FormField label="Selling Price (₹)" required><input className={inp} type="number" step="0.01" min="0" value={form.selling_price} onChange={e => set('selling_price', e.target.value)} /></FormField>
        <FormField label="Cost Price (₹)"><input className={inp} type="number" step="0.01" min="0" value={form.cost_price} onChange={e => set('cost_price', e.target.value)} /></FormField>
        <FormField label="Change Reason"><input className={inp} value={form.change_reason} onChange={e => set('change_reason', e.target.value)} placeholder="e.g. seasonal update" /></FormField>
        <div className="col-span-2 text-[11px] font-semibold text-gray-400 uppercase tracking-wider pt-1">Special Price (Optional)</div>
        <FormField label="Special Price (₹)"><input className={inp} type="number" step="0.01" min="0" value={form.special_price} onChange={e => set('special_price', e.target.value)} /></FormField>
        <div />
        <FormField label="Valid From"><input className={inp} type="datetime-local" value={form.special_price_from} onChange={e => set('special_price_from', e.target.value)} /></FormField>
        <FormField label="Valid To"><input className={inp} type="datetime-local" value={form.special_price_to} onChange={e => set('special_price_to', e.target.value)} /></FormField>
      </div>
      <div className="flex gap-2 pt-1">
        <button type="submit" disabled={saving} className="flex-1 py-2.5 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600 disabled:opacity-50">{saving ? 'Saving…' : 'Update Pricing'}</button>
        <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-gray-200 text-sm text-gray-600 rounded-lg hover:bg-gray-50">Cancel</button>
      </div>
    </form>
  );
}

function DeleteProductModal({ product, onClose, onDeleted }) {
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (product.status === 'active') { toast.error('Deactivate product before deleting'); return; }
    setSaving(true);
    try {
      await catalogService.deleteProduct(product._id, { reason: reason.trim() || 'Deleted by admin' });
      toast.success('Product deleted');
      onDeleted(); onClose();
    } catch (err) { toast.error(err.message || 'Failed'); }
    finally { setSaving(false); }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
        <AlertTriangle size={18} className="text-red-500 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-red-700">Delete "{product.name}"?</p>
          <p className="text-xs text-red-500 mt-0.5">Product must be inactive or draft before deletion. This action is irreversible.</p>
          {product.status === 'active' && <p className="text-xs font-bold text-red-600 mt-1">⚠ Product is currently ACTIVE — deactivate first.</p>}
        </div>
      </div>
      <FormField label="Reason">
        <input className={inp} value={reason} onChange={e => setReason(e.target.value)} placeholder="Reason for deletion" />
      </FormField>
      <div className="flex gap-2 pt-1">
        <button type="submit" disabled={saving || product.status === 'active'} className="flex-1 py-2.5 bg-red-500 text-white text-sm font-medium rounded-lg hover:bg-red-600 disabled:opacity-50">{saving ? 'Deleting…' : 'Delete'}</button>
        <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-gray-200 text-sm text-gray-600 rounded-lg hover:bg-gray-50">Cancel</button>
      </div>
    </form>
  );
}

// ─── Variant / Media Modals ────────────────────────────────────────────────────

function AddVariantModal({ productId, variant, onClose, onSaved }) {
  const isEdit = !!variant;
  const [form, setForm] = useState({
    variant_name:  variant?.variant_name  || '',
    sku:           variant?.sku           || '',
    mrp:           variant?.mrp           ?? '',
    selling_price: variant?.selling_price ?? '',
    cost_price:    variant?.cost_price    ?? '',
    weight_grams:  variant?.weight_grams  ?? '',
    weight_display:variant?.weight_display|| '',
    stock_quantity:variant?.stock_quantity ?? 0,
    min_order_qty: variant?.min_order_qty  ?? 1,
    max_order_qty: variant?.max_order_qty  ?? 10,
    is_default:    variant?.is_default     || false,
    is_active:     variant?.is_active      ?? true,
  });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.variant_name || !form.sku || !form.mrp || !form.selling_price) { toast.error('Name, SKU, MRP, selling price required'); return; }
    setSaving(true);
    try {
      const body = { ...form, sku: form.sku.toUpperCase(), mrp: parseFloat(form.mrp), selling_price: parseFloat(form.selling_price), cost_price: form.cost_price ? parseFloat(form.cost_price) : undefined, weight_grams: form.weight_grams ? parseFloat(form.weight_grams) : undefined, stock_quantity: parseInt(form.stock_quantity), min_order_qty: parseInt(form.min_order_qty), max_order_qty: parseInt(form.max_order_qty) };
      if (isEdit) await catalogService.updateVariant(productId, variant._id, body);
      else await catalogService.addVariant(productId, body);
      toast.success(isEdit ? 'Variant updated' : 'Variant added');
      onSaved(); onClose();
    } catch (err) { toast.error(err.message || 'Failed'); }
    finally { setSaving(false); }
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Variant Name" required col2><input className={inp} value={form.variant_name} onChange={e => set('variant_name', e.target.value)} placeholder="e.g. 500ml" /></FormField>
        <FormField label="SKU" required><input className={inp} value={form.sku} onChange={e => set('sku', e.target.value)} disabled={isEdit} /></FormField>
        <FormField label="Weight Display"><input className={inp} value={form.weight_display} onChange={e => set('weight_display', e.target.value)} placeholder="e.g. 500g" /></FormField>
        <FormField label="MRP (₹)" required><input className={inp} type="number" step="0.01" value={form.mrp} onChange={e => set('mrp', e.target.value)} /></FormField>
        <FormField label="Selling Price (₹)" required><input className={inp} type="number" step="0.01" value={form.selling_price} onChange={e => set('selling_price', e.target.value)} /></FormField>
        <FormField label="Cost Price (₹)"><input className={inp} type="number" step="0.01" value={form.cost_price} onChange={e => set('cost_price', e.target.value)} /></FormField>
        <FormField label="Stock Qty"><input className={inp} type="number" min="0" value={form.stock_quantity} onChange={e => set('stock_quantity', e.target.value)} /></FormField>
        <div className="col-span-2 flex gap-4 text-sm text-gray-600">
          <label className="flex items-center gap-1.5"><input type="checkbox" checked={form.is_default} onChange={e => set('is_default', e.target.checked)} />Default</label>
          <label className="flex items-center gap-1.5"><input type="checkbox" checked={form.is_active} onChange={e => set('is_active', e.target.checked)} />Active</label>
        </div>
      </div>
      <div className="flex gap-2 pt-1">
        <button type="submit" disabled={saving} className="flex-1 py-2.5 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600 disabled:opacity-50">{saving ? 'Saving…' : isEdit ? 'Update' : 'Add Variant'}</button>
        <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-gray-200 text-sm text-gray-600 rounded-lg hover:bg-gray-50">Cancel</button>
      </div>
    </form>
  );
}

function AddMediaModal({ productId, mediaItem, onClose, onSaved }) {
  const isEdit = !!mediaItem;
  const [form, setForm] = useState({ url: mediaItem?.url || '', type: mediaItem?.type || 'image', alt_text: mediaItem?.alt_text || '', thumbnail_url: mediaItem?.thumbnail_url || '', is_primary: mediaItem?.is_primary || false });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.url) { toast.error('URL required'); return; }
    setSaving(true);
    try {
      if (isEdit) await catalogService.updateMedia(productId, mediaItem._id, form);
      else await catalogService.addMedia(productId, form);
      toast.success(isEdit ? 'Media updated' : 'Media added');
      onSaved(); onClose();
    } catch (err) { toast.error(err.message || 'Failed'); }
    finally { setSaving(false); }
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <FormField label="Media URL" required><input className={inp} type="url" value={form.url} onChange={e => set('url', e.target.value)} placeholder="https://…" /></FormField>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Type">
          <select className={sel} value={form.type} onChange={e => set('type', e.target.value)}>
            <option value="image">Image</option>
            <option value="video">Video</option>
            <option value="360_view">360° View</option>
          </select>
        </FormField>
        <FormField label="Alt Text"><input className={inp} value={form.alt_text} onChange={e => set('alt_text', e.target.value)} /></FormField>
        <FormField label="Thumbnail URL" col2><input className={inp} type="url" value={form.thumbnail_url} onChange={e => set('thumbnail_url', e.target.value)} placeholder="https://… (optional)" /></FormField>
      </div>
      <label className="flex items-center gap-2 text-sm text-gray-600">
        <input type="checkbox" checked={form.is_primary} onChange={e => set('is_primary', e.target.checked)} /> Set as primary image
      </label>
      <div className="flex gap-2 pt-1">
        <button type="submit" disabled={saving} className="flex-1 py-2.5 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600 disabled:opacity-50">{saving ? 'Saving…' : isEdit ? 'Update' : 'Add Media'}</button>
        <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-gray-200 text-sm text-gray-600 rounded-lg hover:bg-gray-50">Cancel</button>
      </div>
    </form>
  );
}

// ─── Category Modals ──────────────────────────────────────────────────────────

function CategoryModal({ category, categories, onClose, onSaved }) {
  const isEdit = !!category;
  const [form, setForm] = useState({
    name:              category?.name              || '',
    display_name:      category?.display_name      || '',
    description:       category?.description       || '',
    parent_category_id:category?.parent_category_id?._id || category?.parent_category_id || '',
    image_url:         category?.image_url         || '',
    sort_order:        category?.sort_order        ?? 0,
    is_active:         category?.is_active         ?? true,
    is_featured:       category?.is_featured       || false,
    commission_pct:    category?.commission_pct    ?? 0,
    requires_cold_storage: category?.requires_cold_storage || false,
  });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const roots = categories.filter(c => c._id !== category?._id && (!category || c.level < 4));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name) { toast.error('Name required'); return; }
    setSaving(true);
    try {
      const body = { ...form, sort_order: parseInt(form.sort_order), commission_pct: parseFloat(form.commission_pct), parent_category_id: form.parent_category_id || undefined };
      if (isEdit) await catalogService.updateCategory(category._id, body);
      else await catalogService.createCategory(body);
      toast.success(isEdit ? 'Category updated' : 'Category created');
      onSaved(); onClose();
    } catch (err) { toast.error(err.message || 'Failed'); }
    finally { setSaving(false); }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Name" required col2><input className={inp} value={form.name} onChange={e => set('name', e.target.value)} /></FormField>
        <FormField label="Display Name" col2><input className={inp} value={form.display_name} onChange={e => set('display_name', e.target.value)} /></FormField>
        <FormField label="Parent Category" col2>
          <select className={sel} value={form.parent_category_id} onChange={e => set('parent_category_id', e.target.value)}>
            <option value="">None (Root Category)</option>
            {roots.map(c => <option key={c._id} value={c._id}>{' '.repeat((c.level - 1) * 4)}{c.name}</option>)}
          </select>
        </FormField>
        <FormField label="Description" col2><textarea className={`${inp} resize-none`} rows={2} value={form.description} onChange={e => set('description', e.target.value)} /></FormField>
        <FormField label="Image URL" col2><input className={inp} type="url" value={form.image_url} onChange={e => set('image_url', e.target.value)} placeholder="https://…" /></FormField>
        <FormField label="Sort Order"><input className={inp} type="number" min="0" value={form.sort_order} onChange={e => set('sort_order', e.target.value)} /></FormField>
        <FormField label="Commission %"><input className={inp} type="number" step="0.1" min="0" max="100" value={form.commission_pct} onChange={e => set('commission_pct', e.target.value)} /></FormField>
        <div className="col-span-2 flex gap-4 text-sm text-gray-600">
          <label className="flex items-center gap-1.5"><input type="checkbox" checked={form.is_active}  onChange={e => set('is_active', e.target.checked)} /> Active</label>
          <label className="flex items-center gap-1.5"><input type="checkbox" checked={form.is_featured} onChange={e => set('is_featured', e.target.checked)} /> Featured</label>
          <label className="flex items-center gap-1.5"><input type="checkbox" checked={form.requires_cold_storage} onChange={e => set('requires_cold_storage', e.target.checked)} /> Cold Storage</label>
        </div>
      </div>
      <div className="flex gap-2 pt-1">
        <button type="submit" disabled={saving} className="flex-1 py-2.5 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600 disabled:opacity-50">{saving ? 'Saving…' : isEdit ? 'Update' : 'Create Category'}</button>
        <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-gray-200 text-sm text-gray-600 rounded-lg hover:bg-gray-50">Cancel</button>
      </div>
    </form>
  );
}

// ─── Brand Modals ─────────────────────────────────────────────────────────────

function BrandModal({ brand, onClose, onSaved }) {
  const isEdit = !!brand;
  const [form, setForm] = useState({
    brand_name:         brand?.brand_name         || '',
    brand_display_name: brand?.brand_display_name || '',
    brand_logo_url:     brand?.brand_logo_url     || '',
    brand_banner_url:   brand?.brand_banner_url   || '',
    country_of_origin:  brand?.country_of_origin  || 'India',
    manufacturer_name:  brand?.manufacturer_name  || '',
    contact_email:      brand?.contact_email       || '',
    contact_phone:      brand?.contact_phone       || '',
    fssai_license_number: brand?.fssai_license_number || '',
    is_active:          brand?.is_active           ?? true,
    is_featured:        brand?.is_featured         || false,
    is_premium_brand:   brand?.is_premium_brand    || false,
  });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.brand_name) { toast.error('Brand name required'); return; }
    setSaving(true);
    try {
      if (isEdit) await catalogService.updateBrand(brand._id, form);
      else await catalogService.createBrand(form);
      toast.success(isEdit ? 'Brand updated' : 'Brand created');
      onSaved(); onClose();
    } catch (err) { toast.error(err.message || 'Failed'); }
    finally { setSaving(false); }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Brand Name" required col2><input className={inp} value={form.brand_name} onChange={e => set('brand_name', e.target.value)} /></FormField>
        <FormField label="Display Name" col2><input className={inp} value={form.brand_display_name} onChange={e => set('brand_display_name', e.target.value)} /></FormField>
        <FormField label="Logo URL" col2><input className={inp} type="url" value={form.brand_logo_url} onChange={e => set('brand_logo_url', e.target.value)} placeholder="https://…" /></FormField>
        <FormField label="Country of Origin"><input className={inp} value={form.country_of_origin} onChange={e => set('country_of_origin', e.target.value)} /></FormField>
        <FormField label="Manufacturer Name"><input className={inp} value={form.manufacturer_name} onChange={e => set('manufacturer_name', e.target.value)} /></FormField>
        <FormField label="Contact Email"><input className={inp} type="email" value={form.contact_email} onChange={e => set('contact_email', e.target.value)} /></FormField>
        <FormField label="Contact Phone"><input className={inp} value={form.contact_phone} onChange={e => set('contact_phone', e.target.value)} /></FormField>
        <FormField label="FSSAI License"><input className={inp} value={form.fssai_license_number} onChange={e => set('fssai_license_number', e.target.value)} /></FormField>
        <div className="col-span-2 flex gap-4 text-sm text-gray-600">
          <label className="flex items-center gap-1.5"><input type="checkbox" checked={form.is_active}        onChange={e => set('is_active',        e.target.checked)} /> Active</label>
          <label className="flex items-center gap-1.5"><input type="checkbox" checked={form.is_featured}      onChange={e => set('is_featured',      e.target.checked)} /> Featured</label>
          <label className="flex items-center gap-1.5"><input type="checkbox" checked={form.is_premium_brand} onChange={e => set('is_premium_brand', e.target.checked)} /> Premium</label>
        </div>
      </div>
      <div className="flex gap-2 pt-1">
        <button type="submit" disabled={saving} className="flex-1 py-2.5 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600 disabled:opacity-50">{saving ? 'Saving…' : isEdit ? 'Update' : 'Create Brand'}</button>
        <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-gray-200 text-sm text-gray-600 rounded-lg hover:bg-gray-50">Cancel</button>
      </div>
    </form>
  );
}

// ─── Review Approval Modal ────────────────────────────────────────────────────

function ReviewApprovalModal({ approval, onClose, onSaved }) {
  const [decision, setDecision]  = useState('approved');
  const [reason,   setReason]    = useState('');
  const [notes,    setNotes]     = useState('');
  const [saving,   setSaving]    = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (decision === 'rejected' && !reason.trim()) { toast.error('Rejection reason required'); return; }
    setSaving(true);
    try {
      await catalogService.reviewApproval(approval._id, { decision, rejection_reason: reason || undefined, revision_notes: notes || undefined });
      toast.success(`Product ${decision}`);
      onSaved(); onClose();
    } catch (err) { toast.error(err.message || 'Failed'); }
    finally { setSaving(false); }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-xs text-blue-500 mb-0.5">Product</p>
        <p className="text-sm font-semibold text-blue-800">{approval.product_name}</p>
        <p className="text-xs text-blue-500 mt-0.5">MRP {fmtCur(approval.mrp)} · SP {fmtCur(approval.selling_price)}</p>
      </div>
      <FormField label="Decision">
        <div className="grid grid-cols-3 gap-2">
          {[['approved','Approve','green'],['rejected','Reject','red'],['revision_requested','Revision','yellow']].map(([d, l, c]) => (
            <button key={d} type="button" onClick={() => setDecision(d)}
              className={`py-2 text-xs font-semibold rounded-lg border transition-colors ${decision === d ? `bg-${c}-500 text-white border-${c}-500` : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
              {l}
            </button>
          ))}
        </div>
      </FormField>
      {decision === 'rejected' && (
        <FormField label="Rejection Reason" required>
          <textarea className={`${inp} resize-none`} rows={3} value={reason} onChange={e => setReason(e.target.value)} />
        </FormField>
      )}
      {decision === 'revision_requested' && (
        <FormField label="Revision Notes">
          <textarea className={`${inp} resize-none`} rows={3} value={notes} onChange={e => setNotes(e.target.value)} placeholder="What needs to be revised?" />
        </FormField>
      )}
      <div className="flex gap-2 pt-1">
        <button type="submit" disabled={saving}
          className={`flex-1 py-2.5 text-white text-sm font-medium rounded-lg disabled:opacity-50 ${decision === 'approved' ? 'bg-green-500 hover:bg-green-600' : decision === 'rejected' ? 'bg-red-500 hover:bg-red-600' : 'bg-yellow-500 hover:bg-yellow-600'}`}>
          {saving ? 'Saving…' : `Confirm ${capFirst(fmt(decision))}`}
        </button>
        <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-gray-200 text-sm text-gray-600 rounded-lg hover:bg-gray-50">Cancel</button>
      </div>
    </form>
  );
}

// ─── Bulk Actions Modal ───────────────────────────────────────────────────────

function BulkActionModal({ selectedIds, onClose, onDone }) {
  const [action,   setAction]   = useState('status');
  const [status,   setStatus]   = useState('inactive');
  const [adjType,  setAdjType]  = useState('pct_discount');
  const [adjValue, setAdjValue] = useState('');
  const [saving,   setSaving]   = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (action === 'status') {
        await catalogService.bulkStatus({ product_ids: selectedIds, status });
        toast.success(`${selectedIds.length} products set to ${status}`);
      } else {
        await catalogService.bulkPrice({ product_ids: selectedIds, adjustment_type: adjType, adjustment_value: parseFloat(adjValue) });
        toast.success(`Pricing updated for ${selectedIds.length} products`);
      }
      onDone(); onClose();
    } catch (err) { toast.error(err.message || 'Failed'); }
    finally { setSaving(false); }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
        <strong>{selectedIds.length} product{selectedIds.length > 1 ? 's' : ''}</strong> selected
      </div>
      <FormField label="Action">
        <div className="flex gap-2">
          <button type="button" onClick={() => setAction('status')} className={`flex-1 py-2 text-sm font-medium rounded-lg border ${action === 'status' ? 'bg-orange-500 text-white border-orange-500' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>Update Status</button>
          <button type="button" onClick={() => setAction('price')}  className={`flex-1 py-2 text-sm font-medium rounded-lg border ${action === 'price'  ? 'bg-orange-500 text-white border-orange-500' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>Update Price</button>
        </div>
      </FormField>
      {action === 'status' && (
        <FormField label="New Status">
          <select className={sel} value={status} onChange={e => setStatus(e.target.value)}>
            {BULK_STATUSES.map(s => <option key={s} value={s}>{capFirst(fmt(s))}</option>)}
          </select>
        </FormField>
      )}
      {action === 'price' && (
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Adjustment Type" col2>
            <select className={sel} value={adjType} onChange={e => setAdjType(e.target.value)}>
              <option value="pct_discount">% Discount off MRP</option>
              <option value="fixed_discount">Fixed Discount (₹)</option>
              <option value="set_price">Set Selling Price (₹)</option>
            </select>
          </FormField>
          <FormField label="Value" required col2>
            <input className={inp} type="number" step="0.01" min="0" value={adjValue} onChange={e => setAdjValue(e.target.value)} placeholder={adjType === 'pct_discount' ? 'e.g. 10 (for 10%)' : '₹ amount'} />
          </FormField>
        </div>
      )}
      <div className="flex gap-2 pt-1">
        <button type="submit" disabled={saving} className="flex-1 py-2.5 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600 disabled:opacity-50">{saving ? 'Applying…' : 'Apply'}</button>
        <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-gray-200 text-sm text-gray-600 rounded-lg hover:bg-gray-50">Cancel</button>
      </div>
    </form>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// DRAWER TABS
// ═══════════════════════════════════════════════════════════════════════════════

function OverviewTab({ product, onStatus, onPricing, onDelete, onSubmitApproval }) {
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!window.confirm('Submit this product for approval?')) return;
    setSubmitting(true);
    try {
      await catalogService.submitForApproval(product._id);
      toast.success('Submitted for approval');
      onSubmitApproval();
    } catch (err) { toast.error(err.message || 'Failed'); }
    finally { setSubmitting(false); }
  };

  const primary = product.media?.find(m => m.is_primary);

  return (
    <div className="space-y-4">
      {primary && (
        <div className="rounded-xl overflow-hidden border border-gray-100 h-44 bg-gray-50">
          <img src={primary.url} alt={product.name} className="w-full h-full object-contain" />
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <button onClick={onStatus}  className="px-3 py-1.5 text-xs font-medium border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50">Update Status</button>
        <button onClick={onPricing} className="px-3 py-1.5 text-xs font-medium border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50">Update Pricing</button>
        {product.status === 'draft' && (
          <button onClick={handleSubmit} disabled={submitting} className="px-3 py-1.5 text-xs font-medium bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50">
            {submitting ? 'Submitting…' : 'Submit for Approval'}
          </button>
        )}
      </div>

      <Section title="Basic Info">
        <DetailRow label="Display ID"   value={<span className="font-mono text-orange-500 text-xs">{product.product_display_id}</span>} />
        <DetailRow label="SKU"          value={<span className="font-mono text-xs">{product.sku}</span>} />
        <DetailRow label="Brand"        value={product.brand_name} />
        <DetailRow label="Category"     value={[product.parent_category_name, product.category_name].filter(Boolean).join(' › ')} />
        <DetailRow label="Listing Type" value={capFirst(fmt(product.listing_type))} />
        <DetailRow label="Status"       value={<Badge variant={STATUS_VARIANTS[product.status] ?? 'gray'}>{capFirst(fmt(product.status))}</Badge>} />
        <DetailRow label="Rating"       value={product.avg_rating ? `${product.avg_rating} ★ (${product.total_reviews} reviews)` : 'No reviews'} />
        <DetailRow label="Total Orders" value={product.total_orders?.toLocaleString() ?? 0} />
      </Section>

      <Section title="Pricing">
        <DetailRow label="MRP"            value={fmtCur(product.mrp)} />
        <DetailRow label="Selling Price"  value={fmtCur(product.selling_price)} />
        <DetailRow label="Discount"       value={product.discount_pct ? `${product.discount_pct}% (${fmtCur(product.discount_amount)})` : '—'} />
        <DetailRow label="Cost Price"     value={product.cost_price ? fmtCur(product.cost_price) : '—'} />
        {product.special_price && <DetailRow label="Special Price" value={fmtCur(product.special_price)} />}
        <DetailRow label="GST"            value={`${product.gst_rate_pct ?? 0}% ${product.gst_inclusive ? '(inclusive)' : '(exclusive)'}`} />
        <DetailRow label="HSN Code"       value={product.hsn_code} />
      </Section>

      <Section title="Physical">
        <DetailRow label="Weight"           value={product.weight_display || (product.weight_grams ? `${product.weight_grams}g` : null)} />
        <DetailRow label="Storage"          value={capFirst(fmt(product.storage_condition))} />
        <DetailRow label="Shelf Life"       value={product.shelf_life_days ? `${product.shelf_life_days} days` : null} />
        <DetailRow label="Packaging"        value={product.packaging_type} />
        <DetailRow label="Barcode (EAN)"    value={product.barcode_ean} />
      </Section>

      <Section title="Classification">
        {[['Featured','is_featured'],['Bestseller','is_bestseller'],['New Arrival','is_new_arrival'],['Organic','is_organic'],['Vegan','is_vegan'],['Vegetarian','is_vegetarian'],['Gluten Free','is_gluten_free']].map(([l, k]) => (
          <div key={k} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
            <span className="text-xs text-gray-500">{l}</span>
            <span className={`text-xs font-semibold ${product[k] ? 'text-green-600' : 'text-gray-300'}`}>{product[k] ? '✓ Yes' : '—'}</span>
          </div>
        ))}
      </Section>

      {(product.country_of_origin || product.manufacturer_name || product.fssai_license_number) && (
        <Section title="Regulatory">
          <DetailRow label="Country of Origin"  value={product.country_of_origin} />
          <DetailRow label="Manufacturer"       value={product.manufacturer_name} />
          <DetailRow label="FSSAI License"      value={product.fssai_license_number} />
        </Section>
      )}

      {product.short_description && (
        <div className="p-3 bg-gray-50 rounded-xl">
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Description</p>
          <p className="text-sm text-gray-600 leading-relaxed">{product.short_description}</p>
        </div>
      )}

      <div className="pt-2">
        <button onClick={onDelete} className="w-full py-2 text-xs font-medium text-red-500 border border-red-200 rounded-lg hover:bg-red-50">Delete Product</button>
      </div>
    </div>
  );
}

function VariantsTab({ product }) {
  const [variants, setVariants] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [modal,    setModal]    = useState(null);
  const [deleting, setDeleting] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await catalogService.listVariants(product._id);
      setVariants(safeArr(res?.data));
    } catch (err) { toast.error(err.message || 'Failed'); }
    finally { setLoading(false); }
  }, [product._id]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (v) => {
    if (!window.confirm(`Remove variant "${v.variant_name}"?`)) return;
    setDeleting(v._id);
    try {
      await catalogService.deleteVariant(product._id, v._id);
      toast.success('Variant removed');
      load();
    } catch (err) { toast.error(err.message || 'Failed'); }
    finally { setDeleting(null); }
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <button onClick={() => setModal({ type: 'add' })} className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500 text-white text-xs font-medium rounded-lg hover:bg-orange-600">
          <Plus size={11} /> Add Variant
        </button>
      </div>
      {loading ? <div className="py-8 text-center text-sm text-gray-400">Loading…</div> :
       variants.length === 0 ? <div className="py-8 text-center text-sm text-gray-400 bg-gray-50 rounded-xl">No variants</div> :
       <div className="space-y-2">
         {variants.map(v => (
           <div key={v._id} className={`border rounded-xl p-3 ${v.is_active ? 'border-gray-100' : 'border-gray-100 opacity-60'}`}>
             <div className="flex items-start justify-between gap-2">
               <div className="flex-1 min-w-0">
                 <div className="flex items-center gap-2">
                   <span className="text-sm font-semibold text-gray-900">{v.variant_name}</span>
                   {v.is_default && <span className="text-[10px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full font-medium">Default</span>}
                   {!v.is_active && <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">Inactive</span>}
                 </div>
                 <p className="text-xs text-gray-400 font-mono mt-0.5">{v.sku}</p>
                 <div className="flex items-center gap-3 mt-1 text-xs text-gray-600">
                   <span className="font-semibold">{fmtCur(v.selling_price)}</span>
                   <span className="text-gray-300">MRP {fmtCur(v.mrp)}</span>
                   <span className="text-gray-400">Stock: {v.stock_quantity}</span>
                 </div>
               </div>
               <div className="flex gap-1 shrink-0">
                 <button onClick={() => setModal({ type: 'edit', variant: v })} className="p-1.5 text-gray-400 hover:text-orange-500"><Edit2 size={12} /></button>
                 <button onClick={() => handleDelete(v)} disabled={deleting === v._id} className="p-1.5 text-gray-400 hover:text-red-500 disabled:opacity-40"><Trash2 size={12} /></button>
               </div>
             </div>
           </div>
         ))}
       </div>
      }
      {modal?.type === 'add'  && <Modal open title="Add Variant"    onClose={() => setModal(null)} width="max-w-sm"><AddVariantModal productId={product._id} onClose={() => setModal(null)} onSaved={load} /></Modal>}
      {modal?.type === 'edit' && <Modal open title="Edit Variant"   onClose={() => setModal(null)} width="max-w-sm"><AddVariantModal productId={product._id} variant={modal.variant} onClose={() => setModal(null)} onSaved={load} /></Modal>}
    </div>
  );
}

function MediaTab({ product }) {
  const [mediaList, setMediaList] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [modal,     setModal]     = useState(null);
  const [deleting,  setDeleting]  = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await catalogService.listMedia(product._id);
      setMediaList(safeArr(res?.data));
    } catch (err) { toast.error(err.message || 'Failed'); }
    finally { setLoading(false); }
  }, [product._id]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (m) => {
    if (!window.confirm('Remove this media item?')) return;
    setDeleting(m._id);
    try {
      await catalogService.deleteMedia(product._id, m._id);
      toast.success('Media removed');
      load();
    } catch (err) { toast.error(err.message || 'Failed'); }
    finally { setDeleting(null); }
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <button onClick={() => setModal({ type: 'add' })} className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500 text-white text-xs font-medium rounded-lg hover:bg-orange-600">
          <Plus size={11} /> Add Media
        </button>
      </div>
      {loading ? <div className="py-8 text-center text-sm text-gray-400">Loading…</div> :
       mediaList.length === 0 ? <div className="py-8 text-center text-sm text-gray-400 bg-gray-50 rounded-xl">No media uploaded</div> :
       <div className="grid grid-cols-3 gap-2">
         {mediaList.map(m => (
           <div key={m._id} className="relative group rounded-xl overflow-hidden border border-gray-100 aspect-square bg-gray-50">
             {m.type === 'image' ? (
               <img src={m.url} alt={m.alt_text} className="w-full h-full object-cover" />
             ) : (
               <div className="flex items-center justify-center w-full h-full">
                 <Image size={24} className="text-gray-300" />
                 <span className="text-xs text-gray-400 mt-1">{m.type}</span>
               </div>
             )}
             {m.is_primary && <span className="absolute top-1 left-1 text-[9px] bg-orange-500 text-white px-1.5 py-0.5 rounded-full font-semibold">Primary</span>}
             <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
               <button onClick={() => setModal({ type: 'edit', media: m })} className="p-1.5 bg-white rounded-lg text-gray-700 hover:text-orange-500"><Edit2 size={12} /></button>
               <button onClick={() => handleDelete(m)} disabled={deleting === m._id} className="p-1.5 bg-white rounded-lg text-gray-700 hover:text-red-500 disabled:opacity-40"><Trash2 size={12} /></button>
             </div>
           </div>
         ))}
       </div>
      }
      {modal?.type === 'add'  && <Modal open title="Add Media"    onClose={() => setModal(null)} width="max-w-sm"><AddMediaModal productId={product._id} onClose={() => setModal(null)} onSaved={load} /></Modal>}
      {modal?.type === 'edit' && <Modal open title="Edit Media"   onClose={() => setModal(null)} width="max-w-sm"><AddMediaModal productId={product._id} mediaItem={modal.media} onClose={() => setModal(null)} onSaved={load} /></Modal>}
    </div>
  );
}

function PricingTab({ product }) {
  const [history,  setHistory]  = useState([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    catalogService.getPricingHistory(product._id)
      .then(res => setHistory(safeArr(res?.data)))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [product._id]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        {[['MRP', fmtCur(product.mrp), 'bg-gray-50'],['Selling Price', fmtCur(product.selling_price), 'bg-orange-50'],['Discount', `${product.discount_pct ?? 0}%`, 'bg-green-50'],['Cost Price', product.cost_price ? fmtCur(product.cost_price) : '—', 'bg-blue-50']].map(([l, v, bg]) => (
          <div key={l} className={`${bg} rounded-xl p-3`}>
            <p className="text-xs text-gray-500 mb-0.5">{l}</p>
            <p className="text-base font-bold text-gray-900">{v}</p>
          </div>
        ))}
      </div>
      <div>
        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Price History</p>
        {loading ? <div className="py-6 text-center text-sm text-gray-400">Loading…</div> :
         history.length === 0 ? <div className="py-6 text-center text-sm text-gray-400 bg-gray-50 rounded-xl">No history</div> :
         <div className="space-y-2">
           {history.map((h, i) => (
             <div key={h._id || i} className="border border-gray-100 rounded-xl p-3">
               <div className="flex items-start justify-between gap-2">
                 <div>
                   <p className="text-sm font-semibold text-gray-900">{fmtCur(h.selling_price)} <span className="text-xs font-normal text-gray-400 line-through ml-1">{fmtCur(h.mrp)}</span></p>
                   <p className="text-xs text-gray-400 mt-0.5">{h.change_reason ? capFirst(fmt(h.change_reason)) : 'Manual update'}</p>
                 </div>
                 <div className="text-right">
                   <p className="text-xs text-gray-400">{fmtDate(h.effective_from)}</p>
                   {h.effective_to && <p className="text-xs text-gray-300">{fmtDate(h.effective_to)}</p>}
                 </div>
               </div>
             </div>
           ))}
         </div>
        }
      </div>
    </div>
  );
}

function TagsAttrsTab({ product, onRefresh }) {
  const [tags,  setTags]  = useState((product.tags  || []).join(', '));
  const [attrs, setAttrs] = useState(product.attributes || []);
  const [newAttrKey, setNewAttrKey] = useState('');
  const [newAttrVal, setNewAttrVal] = useState('');
  const [savingTags,  setSavingTags]  = useState(false);
  const [savingAttrs, setSavingAttrs] = useState(false);

  const saveTags = async () => {
    setSavingTags(true);
    try {
      const tagArr = tags.split(',').map(t => t.trim()).filter(Boolean);
      await catalogService.updateTags(product._id, { tags: tagArr });
      toast.success('Tags updated');
      onRefresh();
    } catch (err) { toast.error(err.message || 'Failed'); }
    finally { setSavingTags(false); }
  };

  const saveAttrs = async () => {
    setSavingAttrs(true);
    try {
      await catalogService.updateAttributes(product._id, { attributes: attrs });
      toast.success('Attributes updated');
      onRefresh();
    } catch (err) { toast.error(err.message || 'Failed'); }
    finally { setSavingAttrs(false); }
  };

  const addAttr = () => {
    if (!newAttrKey || !newAttrVal) return;
    setAttrs(a => [...a, { attribute_key: newAttrKey.trim(), attribute_label: newAttrKey.trim(), attribute_value: newAttrVal.trim() }]);
    setNewAttrKey(''); setNewAttrVal('');
  };

  const removeAttr = (i) => setAttrs(a => a.filter((_, idx) => idx !== i));

  return (
    <div className="space-y-5">
      <div>
        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Tags</p>
        <p className="text-xs text-gray-400 mb-2">Comma-separated list of tags</p>
        <textarea className={`${inp} resize-none`} rows={3} value={tags} onChange={e => setTags(e.target.value)} placeholder="e.g. dairy, milk, fresh, organic" />
        <button onClick={saveTags} disabled={savingTags} className="mt-2 w-full py-2 text-sm font-medium bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50">{savingTags ? 'Saving…' : 'Save Tags'}</button>
      </div>

      <div>
        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Attributes ({attrs.length})</p>
        <div className="space-y-2 mb-3">
          {attrs.map((a, i) => (
            <div key={i} className="flex items-center gap-2 border border-gray-100 rounded-lg px-3 py-2">
              <span className="text-xs font-medium text-gray-600 shrink-0 w-28 truncate">{a.attribute_key}</span>
              <span className="text-xs text-gray-900 flex-1 truncate">{a.attribute_value}</span>
              <button onClick={() => removeAttr(i)} className="p-1 text-gray-300 hover:text-red-500"><X size={12} /></button>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <input className={`${inp} flex-1`} placeholder="Key (e.g. flavour)" value={newAttrKey} onChange={e => setNewAttrKey(e.target.value)} />
          <input className={`${inp} flex-1`} placeholder="Value (e.g. plain)" value={newAttrVal} onChange={e => setNewAttrVal(e.target.value)} />
          <button type="button" onClick={addAttr} className="px-3 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200"><Plus size={14} /></button>
        </div>
        <button onClick={saveAttrs} disabled={savingAttrs} className="mt-2 w-full py-2 text-sm font-medium bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50">{savingAttrs ? 'Saving…' : 'Save Attributes'}</button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PRODUCT DRAWER
// ═══════════════════════════════════════════════════════════════════════════════

function ProductDrawer({ productRow, onClose, onRefreshList }) {
  const [tab,     setTab]     = useState('overview');
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modal,   setModal]   = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await catalogService.getProduct(productRow._id);
      setProduct(res?.data ?? null);
    } catch (err) { toast.error(err.message || 'Failed'); }
    finally { setLoading(false); }
  }, [productRow._id]);

  useEffect(() => { load(); }, [load]);

  const reload = useCallback(() => { load(); onRefreshList(); }, [load, onRefreshList]);

  const TABS = [
    { id:'overview',  label:'Overview',  icon:Eye },
    { id:'variants',  label:'Variants',  icon:List },
    { id:'media',     label:'Media',     icon:Image },
    { id:'pricing',   label:'Pricing',   icon:DollarSign },
    { id:'tags',      label:'Tags & Attrs',icon:Tag },
  ];

  const p = product || productRow;
  const primary = p.media?.find(m => m.is_primary);

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="absolute inset-0 bg-black/20" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white shadow-2xl flex flex-col h-full">
        <div className="px-5 py-4 border-b border-gray-100 shrink-0">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <ProductThumb url={primary?.url} name={p.name} />
              <div className="flex-1 min-w-0">
                <h2 className="text-sm font-bold text-gray-900 truncate">{p.name}</h2>
                <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5 flex-wrap">
                  <span className="font-mono text-orange-500">{p.sku}</span>
                  {p.brand_name && <><span>·</span><span>{p.brand_name}</span></>}
                </div>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  <Badge variant={STATUS_VARIANTS[p.status] ?? 'gray'}>{capFirst(fmt(p.status))}</Badge>
                  <span className="text-xs font-semibold text-gray-900">{fmtCur(p.selling_price)}</span>
                  {p.discount_pct > 0 && <span className="text-xs text-green-600 font-medium">{p.discount_pct}% off</span>}
                </div>
              </div>
            </div>
            <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 shrink-0"><X size={18} /></button>
          </div>
          <div className="flex gap-1 mt-3 overflow-x-auto pb-0.5">
            {TABS.map(t => {
              const Icon = t.icon;
              return (
                <button key={t.id} onClick={() => setTab(t.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors shrink-0 ${tab === t.id ? 'bg-orange-100 text-orange-600' : 'text-gray-500 hover:bg-gray-100'}`}>
                  <Icon size={11} />{t.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {loading ? <div className="py-8 text-center text-sm text-gray-400">Loading…</div> :
           !product ? <div className="py-8 text-center text-sm text-gray-400">Failed to load</div> :
           <>
             {tab === 'overview' && <OverviewTab product={product} onStatus={() => setModal('status')} onPricing={() => setModal('pricing')} onDelete={() => setModal('delete')} onSubmitApproval={reload} />}
             {tab === 'variants' && <VariantsTab product={product} />}
             {tab === 'media'    && <MediaTab    product={product} />}
             {tab === 'pricing'  && <PricingTab  product={product} />}
             {tab === 'tags'     && <TagsAttrsTab product={product} onRefresh={reload} />}
           </>
          }
        </div>
      </div>

      {modal === 'status'  && product && <Modal open title="Update Status"  onClose={() => setModal(null)} width="max-w-sm"><ProductStatusModal product={product} onClose={() => setModal(null)} onSaved={reload} /></Modal>}
      {modal === 'pricing' && product && <Modal open title="Update Pricing" onClose={() => setModal(null)} width="max-w-md"><UpdatePricingModal  product={product} onClose={() => setModal(null)} onSaved={reload} /></Modal>}
      {modal === 'delete'  && product && <Modal open title="Delete Product" onClose={() => setModal(null)} width="max-w-sm"><DeleteProductModal  product={product} onClose={() => setModal(null)} onDeleted={() => { onClose(); onRefreshList(); }} /></Modal>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// CATEGORIES TAB
// ═══════════════════════════════════════════════════════════════════════════════

function CategoriesTab() {
  const [categories, setCategories] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState('');
  const [modal,      setModal]      = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await catalogService.listCategories({ limit: 500, sort_by: 'level' });
      setCategories(safeArr(res?.data?.categories));
    } catch (err) { toast.error(err.message || 'Failed'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (cat) => {
    if (!window.confirm(`Delete category "${cat.name}"?`)) return;
    try {
      await catalogService.deleteCategory(cat._id);
      toast.success('Category deleted');
      load();
    } catch (err) { toast.error(err.message || 'Failed to delete — may have active products or sub-categories'); }
  };

  const filtered = categories.filter(c => !search || c.name.toLowerCase().includes(search.toLowerCase()));

  const LEVEL_COLORS = { 1: 'bg-blue-50 text-blue-700 border-blue-200', 2: 'bg-purple-50 text-purple-700 border-purple-200', 3: 'bg-orange-50 text-orange-700 border-orange-200', 4: 'bg-gray-50 text-gray-600 border-gray-200' };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-orange-400" placeholder="Search categories…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <button onClick={() => setModal({ type: 'create' })} className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600 shrink-0">
          <Plus size={14} /> Add
        </button>
      </div>

      {loading ? <div className="py-12 text-center text-sm text-gray-400">Loading…</div> :
       filtered.length === 0 ? <div className="py-12 text-center text-sm text-gray-400">No categories found</div> :
       <div className="space-y-1.5">
         {filtered.map(cat => (
           <div key={cat._id} className="flex items-center justify-between bg-white border border-gray-100 rounded-xl px-4 py-3 hover:border-orange-200 transition-colors"
             style={{ marginLeft: `${(cat.level - 1) * 20}px` }}>
             <div className="flex items-center gap-3 flex-1 min-w-0">
               {cat.image_url && <img src={cat.image_url} alt={cat.name} className="w-8 h-8 rounded-lg object-cover border border-gray-100 shrink-0" />}
               <div className="min-w-0">
                 <div className="flex items-center gap-2 flex-wrap">
                   <span className="text-sm font-semibold text-gray-900">{cat.name}</span>
                   <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${LEVEL_COLORS[cat.level] || LEVEL_COLORS[4]}`}>L{cat.level}</span>
                   {cat.is_featured && <span className="text-[10px] bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded-full border border-yellow-200">Featured</span>}
                   {!cat.is_active && <Badge variant="gray" size="sm">Inactive</Badge>}
                 </div>
                 <p className="text-xs text-gray-400 font-mono mt-0.5">{cat.category_slug}</p>
               </div>
             </div>
             <div className="flex items-center gap-3 shrink-0">
               <div className="text-right hidden sm:block">
                 <p className="text-xs font-semibold text-gray-700">{cat.active_products ?? 0}</p>
                 <p className="text-[10px] text-gray-400">active</p>
               </div>
               <button onClick={() => setModal({ type: 'edit', category: cat })} className="p-1.5 text-gray-400 hover:text-orange-500"><Edit2 size={13} /></button>
               <button onClick={() => handleDelete(cat)} className="p-1.5 text-gray-400 hover:text-red-500"><Trash2 size={13} /></button>
             </div>
           </div>
         ))}
       </div>
      }

      {modal?.type === 'create' && <Modal open title="New Category"  onClose={() => setModal(null)} width="max-w-md"><CategoryModal categories={categories} onClose={() => setModal(null)} onSaved={load} /></Modal>}
      {modal?.type === 'edit'   && <Modal open title="Edit Category" onClose={() => setModal(null)} width="max-w-md"><CategoryModal category={modal.category} categories={categories} onClose={() => setModal(null)} onSaved={load} /></Modal>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// BRANDS TAB
// ═══════════════════════════════════════════════════════════════════════════════

function BrandsTab() {
  const [brands,  setBrands]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');
  const [page,    setPage]    = useState(1);
  const [total,   setTotal]   = useState(0);
  const [modal,   setModal]   = useState(null);
  const BLIMIT = 24;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await catalogService.listBrands({ page, limit: BLIMIT, search: search || undefined });
      setBrands(safeArr(res?.data?.brands));
      setTotal(res?.data?.pagination?.total ?? 0);
    } catch (err) { toast.error(err.message || 'Failed'); }
    finally { setLoading(false); }
  }, [page, search]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (brand) => {
    if (!window.confirm(`Delete brand "${brand.brand_name}"?`)) return;
    try {
      await catalogService.deleteBrand(brand._id);
      toast.success('Brand deleted');
      load();
    } catch (err) { toast.error(err.message || 'Cannot delete — may have active products'); }
  };

  const pages = Math.ceil(total / BLIMIT) || 1;

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-orange-400" placeholder="Search brands…" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <button onClick={() => setModal({ type: 'create' })} className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600 shrink-0">
          <Plus size={14} /> Add
        </button>
      </div>

      {loading ? <div className="py-12 text-center text-sm text-gray-400">Loading…</div> :
       brands.length === 0 ? <div className="py-12 text-center text-sm text-gray-400">No brands found</div> :
       <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
         {brands.map(brand => (
           <div key={brand._id} className="bg-white border border-gray-100 rounded-xl p-4 hover:border-orange-200 hover:shadow-sm transition-all group">
             <div className="flex items-start justify-between mb-3">
               <div className="w-10 h-10 rounded-xl border border-gray-100 overflow-hidden bg-gray-50 shrink-0">
                 {brand.brand_logo_url ? <img src={brand.brand_logo_url} alt={brand.brand_name} className="w-full h-full object-contain p-1" /> :
                  <div className="w-full h-full flex items-center justify-center text-gray-300"><Award size={18} /></div>}
               </div>
               <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                 <button onClick={() => setModal({ type: 'edit', brand })} className="p-1.5 text-gray-400 hover:text-orange-500"><Edit2 size={12} /></button>
                 <button onClick={() => handleDelete(brand)} className="p-1.5 text-gray-400 hover:text-red-500"><Trash2 size={12} /></button>
               </div>
             </div>
             <p className="text-sm font-bold text-gray-900 truncate">{brand.brand_display_name || brand.brand_name}</p>
             <p className="text-xs text-gray-400 truncate mb-2">{brand.country_of_origin}</p>
             <div className="flex flex-wrap gap-1">
               {!brand.is_active && <Badge variant="gray" size="sm">Inactive</Badge>}
               {brand.is_featured && <Badge variant="yellow" size="sm">Featured</Badge>}
               {brand.is_premium_brand && <Badge variant="purple" size="sm">Premium</Badge>}
               <span className="text-[10px] text-gray-400">{brand.total_products ?? 0} products</span>
             </div>
           </div>
         ))}
       </div>
      }

      {!loading && pages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-400">{(page-1)*BLIMIT+1}–{Math.min(page*BLIMIT, total)} of {total}</span>
          <div className="flex gap-1">
            <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1} className="p-1.5 text-gray-400 hover:text-gray-600 disabled:opacity-30"><ChevronLeft size={14} /></button>
            <button onClick={() => setPage(p => Math.min(pages, p+1))} disabled={page === pages} className="p-1.5 text-gray-400 hover:text-gray-600 disabled:opacity-30"><ChevronRight size={14} /></button>
          </div>
        </div>
      )}

      {modal?.type === 'create' && <Modal open title="New Brand"  onClose={() => setModal(null)} width="max-w-md"><BrandModal onClose={() => setModal(null)} onSaved={load} /></Modal>}
      {modal?.type === 'edit'   && <Modal open title="Edit Brand" onClose={() => setModal(null)} width="max-w-md"><BrandModal brand={modal.brand} onClose={() => setModal(null)} onSaved={load} /></Modal>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// APPROVALS TAB
// ═══════════════════════════════════════════════════════════════════════════════

function ApprovalsTab() {
  const [approvals, setApprovals] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [statusFlt, setStatusFlt] = useState('pending');
  const [page,      setPage]      = useState(1);
  const [total,     setTotal]     = useState(0);
  const [modal,     setModal]     = useState(null);
  const ALIMIT = 20;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await catalogService.listApprovals({ approval_status: statusFlt || undefined, page, limit: ALIMIT });
      setApprovals(safeArr(res?.data?.approvals));
      setTotal(res?.data?.pagination?.total ?? 0);
    } catch (err) { toast.error(err.message || 'Failed'); }
    finally { setLoading(false); }
  }, [statusFlt, page]);

  useEffect(() => { load(); }, [load]);

  const APPROVAL_VARIANTS = { pending: 'yellow', approved: 'green', rejected: 'red', revision_requested: 'orange' };

  const pages = Math.ceil(total / ALIMIT) || 1;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {[['pending','Pending'],['approved','Approved'],['rejected','Rejected'],['','All']].map(([v, l]) => (
            <button key={v} onClick={() => { setStatusFlt(v); setPage(1); }}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${statusFlt === v ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
              {l}
            </button>
          ))}
        </div>
        <button onClick={load} className="ml-auto p-2 border border-gray-200 rounded-lg text-gray-400 hover:bg-gray-50"><RefreshCw size={13} /></button>
      </div>

      {loading ? <div className="py-12 text-center text-sm text-gray-400">Loading…</div> :
       approvals.length === 0 ? (
         <div className="py-16 text-center">
           <CheckSquare size={32} className="text-gray-200 mx-auto mb-2" />
           <p className="text-sm text-gray-400">No {statusFlt} approvals</p>
         </div>
       ) :
       <div className="space-y-2">
         {approvals.map(appr => (
           <div key={appr._id} className="bg-white border border-gray-100 rounded-xl p-4 hover:border-orange-200 transition-colors">
             <div className="flex items-start justify-between gap-3">
               <div className="flex-1 min-w-0">
                 <div className="flex items-center gap-2 flex-wrap mb-1">
                   <span className="text-sm font-bold text-gray-900 truncate">{appr.product_name}</span>
                   <Badge variant={APPROVAL_VARIANTS[appr.approval_status] ?? 'gray'} size="sm">{capFirst(fmt(appr.approval_status))}</Badge>
                 </div>
                 <div className="flex items-center gap-3 text-xs text-gray-400 flex-wrap">
                   <span>MRP {fmtCur(appr.mrp)}</span>
                   <span>SP {fmtCur(appr.selling_price)}</span>
                   <span>Submitted {fmtDate(appr.submitted_at)}</span>
                 </div>
                 {appr.rejection_reason && <p className="text-xs text-red-500 mt-1">{appr.rejection_reason}</p>}
                 {appr.revision_notes   && <p className="text-xs text-orange-500 mt-1">{appr.revision_notes}</p>}
                 <div className="flex gap-2 mt-2 flex-wrap text-[10px]">
                   {Object.entries(appr.checklist || {}).map(([k, v]) => (
                     <span key={k} className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-full border ${v ? 'bg-green-50 text-green-600 border-green-200' : 'bg-gray-50 text-gray-400 border-gray-200'}`}>
                       {v ? '✓' : '○'} {fmt(k)}
                     </span>
                   ))}
                 </div>
               </div>
               {appr.approval_status === 'pending' && (
                 <button onClick={() => setModal(appr)} className="shrink-0 px-3 py-1.5 text-xs font-medium bg-orange-500 text-white rounded-lg hover:bg-orange-600">Review</button>
               )}
             </div>
           </div>
         ))}
       </div>
      }

      {!loading && pages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-400">{(page-1)*ALIMIT+1}–{Math.min(page*ALIMIT, total)} of {total}</span>
          <div className="flex gap-1">
            <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1} className="p-1.5 text-gray-400 hover:text-gray-600 disabled:opacity-30"><ChevronLeft size={14} /></button>
            <button onClick={() => setPage(p => Math.min(pages, p+1))} disabled={page === pages} className="p-1.5 text-gray-400 hover:text-gray-600 disabled:opacity-30"><ChevronRight size={14} /></button>
          </div>
        </div>
      )}

      {modal && <Modal open title="Review Approval" onClose={() => setModal(null)} width="max-w-sm"><ReviewApprovalModal approval={modal} onClose={() => setModal(null)} onSaved={load} /></Modal>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════════

export default function Catalog() {
  const [statsData,   setStatsData]   = useState(null);
  const [products,    setProducts]    = useState([]);
  const [total,       setTotal]       = useState(0);
  const [page,        setPage]        = useState(1);
  const [loading,     setLoading]     = useState(true);
  const [selected,    setSelected]    = useState(null);
  const [checkedIds,  setCheckedIds]  = useState([]);
  const [showCreate,  setShowCreate]  = useState(false);
  const [showBulk,    setShowBulk]    = useState(false);
  const [activeTab,   setActiveTab]   = useState('products');

  const [filters, setFilters] = useState({ search:'', status:'', listing_type:'', storage_condition:'', sort_by:'created_at', sort_order:'desc' });
  const setFilter = (k, v) => { setFilters(f => ({ ...f, [k]: v })); setPage(1); };

  const loadStats = useCallback(async () => {
    try {
      const res = await catalogService.stats();
      setStatsData(res?.data ?? null);
    } catch { /* ignore */ }
  }, []);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: LIMIT, ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== '')) };
      const res = await catalogService.listProducts(params);
      setProducts(safeArr(res?.data?.products));
      setTotal(res?.data?.pagination?.total ?? 0);
    } catch (err) { toast.error(err.message || 'Failed'); }
    finally { setLoading(false); }
  }, [page, filters]);

  useEffect(() => { loadStats(); }, [loadStats]);
  useEffect(() => { if (activeTab === 'products') loadProducts(); }, [loadProducts, activeTab]);

  const pages = Math.ceil(total / LIMIT) || 1;

  const allChecked = products.length > 0 && products.every(p => checkedIds.includes(p._id));
  const toggleAll = () => setCheckedIds(allChecked ? [] : products.map(p => p._id));
  const toggleOne = (id) => setCheckedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const columns = [
    { key:'_id', label:<input type="checkbox" checked={allChecked} onChange={toggleAll} className="rounded" />, render:(v, row) => <input type="checkbox" checked={checkedIds.includes(row._id)} onChange={() => toggleOne(row._id)} onClick={e => e.stopPropagation()} className="rounded" /> },
    { key:'name', label:'Product', render:(v, row) => (
      <div className="flex items-center gap-2.5">
        <ProductThumb url={row.media?.find(m => m.is_primary)?.url} name={row.name} />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate max-w-48">{row.name}</p>
          <p className="text-xs text-gray-400 font-mono">{row.sku}</p>
          <p className="text-xs text-gray-400 truncate">{row.brand_name}</p>
        </div>
      </div>
    )},
    { key:'category_name', label:'Category', render:(v, row) => (
      <div>
        <p className="text-xs font-medium text-gray-700 truncate">{v}</p>
        {row.parent_category_name && <p className="text-xs text-gray-400 truncate">{row.parent_category_name}</p>}
      </div>
    )},
    { key:'selling_price', label:'Price', render:(v, row) => (
      <div>
        <p className="text-sm font-bold text-gray-900">{fmtCur(v)}</p>
        {row.discount_pct > 0 && <p className="text-xs text-green-600 font-medium">{row.discount_pct}% off</p>}
        <p className="text-xs text-gray-400 line-through">{fmtCur(row.mrp)}</p>
      </div>
    )},
    { key:'status', label:'Status', render:(v) => <Badge variant={STATUS_VARIANTS[v] ?? 'gray'}>{capFirst(fmt(v))}</Badge> },
    { key:'avg_rating', label:'Rating', render:(v, row) => v > 0 ? (
      <div className="flex items-center gap-1">
        <Star size={11} className="text-yellow-400 fill-yellow-400" />
        <span className="text-xs font-semibold text-gray-700">{v.toFixed(1)}</span>
        <span className="text-xs text-gray-400">({row.total_reviews})</span>
      </div>
    ) : <span className="text-xs text-gray-300">—</span> },
    { key:'total_orders', label:'Orders', render:(v) => <span className="text-xs font-medium text-gray-700">{v?.toLocaleString() ?? 0}</span> },
  ];

  const MAIN_TABS = [
    { id:'products',   label:'Products',   icon:Package,  count: statsData?.products?.total },
    { id:'categories', label:'Categories', icon:Layers,   count: statsData?.categories },
    { id:'brands',     label:'Brands',     icon:Award,    count: statsData?.brands },
    { id:'approvals',  label:'Approvals',  icon:CheckCircle, count: statsData?.pending_approvals, alert: statsData?.pending_approvals > 0 },
  ];

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        <StatCard title="Total"       value={statsData?.products?.total        ?? '—'} icon={Package}  iconColor="bg-blue-500"   compact />
        <StatCard title="Active"      value={statsData?.products?.active       ?? '—'} icon={CheckCircle} iconColor="bg-green-500" compact />
        <StatCard title="Draft"       value={statsData?.products?.draft        ?? '—'} icon={Edit2}    iconColor="bg-gray-500"   compact />
        <StatCard title="Pending"     value={statsData?.products?.pending_approval ?? '—'} icon={Clock} iconColor="bg-yellow-500" compact />
        <StatCard title="Inactive"    value={statsData?.products?.inactive     ?? '—'} icon={XCircle}  iconColor="bg-red-500"    compact />
        <StatCard title="Discontinued"value={statsData?.products?.discontinued ?? '—'} icon={TrendingUp} iconColor="bg-orange-500" compact />
        <StatCard title="Categories"  value={statsData?.categories             ?? '—'} icon={Layers}   iconColor="bg-purple-500" compact />
        <StatCard title="Brands"      value={statsData?.brands                 ?? '—'} icon={Award}    iconColor="bg-teal-500"   compact />
      </div>

      {/* Tab bar */}
      <div className="bg-white border border-gray-200 rounded-xl p-1 flex gap-1">
        {MAIN_TABS.map(t => {
          const Icon = t.icon;
          return (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors flex-1 justify-center ${activeTab === t.id ? 'bg-orange-500 text-white shadow-sm' : 'text-gray-500 hover:bg-gray-100'}`}>
              <Icon size={14} />{t.label}
              {t.count !== undefined && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeTab === t.id ? 'bg-white/20 text-white' : t.alert ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-500'}`}>{t.count}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Products tab */}
      {activeTab === 'products' && (
        <>
          {/* Toolbar */}
          <div className="bg-white border border-gray-200 rounded-xl p-3">
            <div className="flex flex-col sm:flex-row flex-wrap gap-2">
              <div className="relative flex-1 min-w-48">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-orange-400" placeholder="Search name, SKU, brand…" value={filters.search} onChange={e => setFilter('search', e.target.value)} />
              </div>
              <select className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none bg-white" value={filters.status} onChange={e => setFilter('status', e.target.value)}>
                <option value="">All Status</option>
                {PRODUCT_STATUSES.map(s => <option key={s} value={s}>{capFirst(fmt(s))}</option>)}
              </select>
              <select className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none bg-white" value={filters.listing_type} onChange={e => setFilter('listing_type', e.target.value)}>
                <option value="">All Types</option>
                {LISTING_TYPES.map(t => <option key={t} value={t}>{capFirst(fmt(t))}</option>)}
              </select>
              <select className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none bg-white" value={filters.storage_condition} onChange={e => setFilter('storage_condition', e.target.value)}>
                <option value="">All Storage</option>
                {STORAGE_TYPES.map(s => <option key={s} value={s}>{capFirst(fmt(s))}</option>)}
              </select>
              {checkedIds.length > 0 && (
                <button onClick={() => setShowBulk(true)} className="flex items-center gap-1.5 px-3 py-2 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 shrink-0">
                  <Sliders size={13} /> Bulk ({checkedIds.length})
                </button>
              )}
              <button onClick={loadProducts} className="p-2 border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50"><RefreshCw size={14} /></button>
              <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600 shrink-0">
                <Plus size={14} /> Add Product
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            {loading ? <div className="py-16 text-center text-sm text-gray-400">Loading products…</div> :
             products.length === 0 ? (
               <div className="py-16 text-center">
                 <ShoppingBag size={32} className="text-gray-200 mx-auto mb-2" />
                 <p className="text-sm text-gray-400">No products found</p>
                 <button onClick={() => setShowCreate(true)} className="mt-3 text-sm text-orange-500 hover:underline">Create first product</button>
               </div>
             ) :
             <Table columns={columns} data={products} onRowClick={row => { if (!checkedIds.length) setSelected(row); }} />
            }
          </div>

          {/* Pagination */}
          {!loading && pages > 1 && (
            <div className="flex items-center justify-between bg-white border border-gray-200 rounded-xl px-4 py-3">
              <span className="text-xs text-gray-500">{(page-1)*LIMIT+1}–{Math.min(page*LIMIT, total)} of {total} products</span>
              <div className="flex items-center gap-1">
                <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 disabled:opacity-30"><ChevronLeft size={14} /></button>
                {Array.from({ length: Math.min(pages, 5) }, (_, i) => {
                  const p = pages <= 5 ? i + 1 : page <= 3 ? i + 1 : page >= pages - 2 ? pages - 4 + i : page - 2 + i;
                  return <button key={p} onClick={() => setPage(p)} className={`w-7 h-7 text-xs rounded-lg ${p === page ? 'bg-orange-500 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>{p}</button>;
                })}
                <button onClick={() => setPage(p => Math.min(pages, p+1))} disabled={page === pages} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 disabled:opacity-30"><ChevronRight size={14} /></button>
              </div>
            </div>
          )}
        </>
      )}

      {activeTab === 'categories' && <div className="bg-white border border-gray-200 rounded-xl p-4"><CategoriesTab /></div>}
      {activeTab === 'brands'     && <div className="bg-white border border-gray-200 rounded-xl p-4"><BrandsTab /></div>}
      {activeTab === 'approvals'  && <div className="bg-white border border-gray-200 rounded-xl p-4"><ApprovalsTab /></div>}

      {/* Product drawer */}
      {selected && <ProductDrawer productRow={selected} onClose={() => setSelected(null)} onRefreshList={() => { loadProducts(); loadStats(); }} />}

      {/* Create product */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Add Product" width="max-w-2xl">
        <CreateProductModal onClose={() => setShowCreate(false)} onCreated={() => { loadProducts(); loadStats(); }} />
      </Modal>

      {/* Bulk action */}
      {showBulk && (
        <Modal open title={`Bulk Action (${checkedIds.length})`} onClose={() => setShowBulk(false)} width="max-w-sm">
          <BulkActionModal selectedIds={checkedIds} onClose={() => setShowBulk(false)} onDone={() => { setCheckedIds([]); loadProducts(); }} />
        </Modal>
      )}
    </div>
  );
}
