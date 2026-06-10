import { useState, useEffect, useCallback } from 'react';
import {
  Store, MapPin, Clock, Zap, AlertTriangle, FileText, Wrench,
  Plus, Search, RefreshCw, ChevronLeft, ChevronRight, X,
  Edit2, Trash2, Power, UserCheck, Package, BarChart2,
  ShieldAlert, CheckCircle, Settings, Activity, List,
} from 'lucide-react';
import Badge from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import StatCard from '../components/ui/StatCard';
import toast from '../lib/toast';
import storesService from '../services/stores.service';

// ─── Constants ────────────────────────────────────────────────────────────────
const LIMIT = 20;

const STATUS_VARIANTS = {
  active:             'green',
  inactive:           'gray',
  under_maintenance:  'yellow',
  temporarily_closed: 'orange',
  permanently_closed: 'red',
  setup_in_progress:  'blue',
};

const STATUS_LABELS = {
  active:             'Active',
  inactive:           'Inactive',
  under_maintenance:  'Maintenance',
  temporarily_closed: 'Temp Closed',
  permanently_closed: 'Perm Closed',
  setup_in_progress:  'Setup',
};

const STORE_TYPES = ['dark_store', 'fulfillment_hub', 'micro_dark_store'];
const STORE_TYPE_LABELS = {
  dark_store:       'Dark Store',
  fulfillment_hub:  'Fulfillment Hub',
  micro_dark_store: 'Micro Dark Store',
};

const OWN_TYPES = ['owned', 'leased', 'partner_operated'];
const OWN_LABELS = {
  owned:            'Owned',
  leased:           'Leased',
  partner_operated: 'Partner Operated',
};

const DOC_TYPES = [
  'fssai_license', 'gstin_certificate', 'shop_act_license',
  'trade_license', 'fire_noc', 'lease_agreement', 'electricity_bill',
];
const DOC_TYPE_LABELS = {
  fssai_license:      'FSSAI License',
  gstin_certificate:  'GSTIN Certificate',
  shop_act_license:   'Shop Act License',
  trade_license:      'Trade License',
  fire_noc:           'Fire NOC',
  lease_agreement:    'Lease Agreement',
  electricity_bill:   'Electricity Bill',
};

const DOC_STATUS_VARIANTS = {
  valid:          'green',
  expiring_soon:  'yellow',
  expired:        'red',
  not_uploaded:   'gray',
  under_review:   'blue',
};

const EQUIP_TYPES = [
  'refrigerator', 'deep_freezer', 'conveyor_belt', 'barcode_scanner',
  'label_printer', 'weighing_scale', 'cctv_camera', 'ups_battery',
  'fire_extinguisher', 'first_aid_kit',
];
const EQUIP_TYPE_LABELS = {
  refrigerator:     'Refrigerator',
  deep_freezer:     'Deep Freezer',
  conveyor_belt:    'Conveyor Belt',
  barcode_scanner:  'Barcode Scanner',
  label_printer:    'Label Printer',
  weighing_scale:   'Weighing Scale',
  cctv_camera:      'CCTV Camera',
  ups_battery:      'UPS Battery',
  fire_extinguisher:'Fire Extinguisher',
  first_aid_kit:    'First Aid Kit',
};

const EQUIP_STATUS_VARIANTS = {
  operational:      'green',
  under_maintenance:'yellow',
  faulty:           'red',
  decommissioned:   'gray',
};

const VALID_STATUSES = ['active', 'inactive', 'under_maintenance', 'temporarily_closed', 'setup_in_progress'];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const safeArr  = (v) => (Array.isArray(v) ? v : []);
const fmtDate  = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const fmtNum   = (n) => typeof n === 'number' ? n.toLocaleString('en-IN') : '—';

const loadColor = (pct) => {
  if (pct >= 85) return { bar: 'bg-red-500',    badge: 'bg-red-100 text-red-700' };
  if (pct >= 65) return { bar: 'bg-yellow-500', badge: 'bg-yellow-100 text-yellow-700' };
  return            { bar: 'bg-green-500',  badge: 'bg-green-100 text-green-700' };
};

const addressLine = (a) => {
  if (!a) return '—';
  return [a.area, a.city, a.state, a.pincode].filter(Boolean).join(', ');
};

// ─── Shared UI ────────────────────────────────────────────────────────────────
const inp = 'w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-orange-400';
const sel = 'w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-orange-400 bg-white';

function FormField({ label, required, children }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div>
      <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">{title}</div>
      <div className="bg-gray-50 rounded-lg px-4 divide-y divide-gray-100">{children}</div>
    </div>
  );
}

function DetailRow({ label, value }) {
  return (
    <div className="flex items-start justify-between py-2.5 gap-3">
      <span className="text-xs text-gray-500 shrink-0 mt-0.5">{label}</span>
      <span className="text-sm font-medium text-gray-900 text-right break-all">{value ?? '—'}</span>
    </div>
  );
}

function ActionBtn({ onClick, color = 'gray', children }) {
  const colors = {
    orange: 'bg-orange-500 hover:bg-orange-600 text-white',
    red:    'bg-red-500 hover:bg-red-600 text-white',
    gray:   'border border-gray-200 text-gray-600 hover:bg-gray-50',
    green:  'bg-green-500 hover:bg-green-600 text-white',
  };
  return (
    <button onClick={onClick} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${colors[color]}`}>
      {children}
    </button>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MODALS
// ═══════════════════════════════════════════════════════════════════════════════

function CreateStoreModal({ onClose, onCreated }) {
  const [form, setForm] = useState({
    store_name: '', store_type: 'dark_store', ownership_type: 'leased', status: 'setup_in_progress',
    city: '', state: '', pincode: '', area: '', street: '', building_name: '', landmark: '', district: '', state_code: '',
    latitude: '', longitude: '', delivery_radius_km: '3', geofence_radius_meters: '200',
    gstin: '', pan: '', fssai_license_number: '', fssai_license_expiry: '', shop_act_license_number: '',
    area_sq_ft: '', storage_capacity_units: '',
  });
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.store_name || !form.ownership_type || !form.city || !form.state || !form.pincode || !form.latitude || !form.longitude || !form.gstin) {
      toast.error('Fill all required fields');
      return;
    }
    setSaving(true);
    try {
      const body = {
        store_name:   form.store_name.trim(),
        store_type:   form.store_type,
        ownership_type: form.ownership_type,
        status:       form.status,
        address: {
          building_name: form.building_name || undefined,
          street:        form.street || undefined,
          landmark:      form.landmark || undefined,
          area:          form.area || undefined,
          city:          form.city.trim(),
          district:      form.district || undefined,
          state:         form.state.trim(),
          state_code:    form.state_code || undefined,
          pincode:       form.pincode.trim(),
        },
        latitude:                  parseFloat(form.latitude),
        longitude:                 parseFloat(form.longitude),
        delivery_radius_km:        parseFloat(form.delivery_radius_km) || 3,
        geofence_radius_meters:    parseInt(form.geofence_radius_meters) || 200,
        gstin:                     form.gstin.trim(),
        pan:                       form.pan || undefined,
        fssai_license_number:      form.fssai_license_number || undefined,
        fssai_license_expiry:      form.fssai_license_expiry || undefined,
        shop_act_license_number:   form.shop_act_license_number || undefined,
        area_sq_ft:                form.area_sq_ft ? parseFloat(form.area_sq_ft) : undefined,
        storage_capacity_units:    form.storage_capacity_units ? parseInt(form.storage_capacity_units) : undefined,
      };
      await storesService.create(body);
      toast.success('Dark store created');
      onCreated();
      onClose();
    } catch (err) {
      toast.error(err.message || 'Failed to create store');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-5 max-h-[70vh] overflow-y-auto pr-1">
      <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Basic Info</div>
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <FormField label="Store Name" required>
            <input className={inp} value={form.store_name} onChange={e => set('store_name', e.target.value)} placeholder="e.g. Zipkart - Noida Sector 62" />
          </FormField>
        </div>
        <FormField label="Store Type">
          <select className={sel} value={form.store_type} onChange={e => set('store_type', e.target.value)}>
            {STORE_TYPES.map(t => <option key={t} value={t}>{STORE_TYPE_LABELS[t]}</option>)}
          </select>
        </FormField>
        <FormField label="Ownership" required>
          <select className={sel} value={form.ownership_type} onChange={e => set('ownership_type', e.target.value)}>
            {OWN_TYPES.map(t => <option key={t} value={t}>{OWN_LABELS[t]}</option>)}
          </select>
        </FormField>
        <FormField label="Initial Status">
          <select className={sel} value={form.status} onChange={e => set('status', e.target.value)}>
            {VALID_STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
          </select>
        </FormField>
      </div>

      <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider pt-1">Address</div>
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <FormField label="Building / Plot No.">
            <input className={inp} value={form.building_name} onChange={e => set('building_name', e.target.value)} placeholder="e.g. Ground Floor, Plot 45" />
          </FormField>
        </div>
        <FormField label="Street">
          <input className={inp} value={form.street} onChange={e => set('street', e.target.value)} placeholder="Street / Block" />
        </FormField>
        <FormField label="Landmark">
          <input className={inp} value={form.landmark} onChange={e => set('landmark', e.target.value)} placeholder="Near..." />
        </FormField>
        <FormField label="Area">
          <input className={inp} value={form.area} onChange={e => set('area', e.target.value)} placeholder="Area / Locality" />
        </FormField>
        <FormField label="City" required>
          <input className={inp} value={form.city} onChange={e => set('city', e.target.value)} placeholder="e.g. Noida" />
        </FormField>
        <FormField label="District">
          <input className={inp} value={form.district} onChange={e => set('district', e.target.value)} placeholder="e.g. Gautam Buddha Nagar" />
        </FormField>
        <FormField label="State" required>
          <input className={inp} value={form.state} onChange={e => set('state', e.target.value)} placeholder="e.g. Uttar Pradesh" />
        </FormField>
        <FormField label="State Code">
          <input className={inp} value={form.state_code} onChange={e => set('state_code', e.target.value)} placeholder="e.g. UP" />
        </FormField>
        <FormField label="Pincode" required>
          <input className={inp} value={form.pincode} onChange={e => set('pincode', e.target.value)} placeholder="6-digit pincode" maxLength={6} />
        </FormField>
        <FormField label="Latitude" required>
          <input className={inp} type="number" step="any" value={form.latitude} onChange={e => set('latitude', e.target.value)} placeholder="e.g. 28.6139" />
        </FormField>
        <FormField label="Longitude" required>
          <input className={inp} type="number" step="any" value={form.longitude} onChange={e => set('longitude', e.target.value)} placeholder="e.g. 77.2090" />
        </FormField>
        <FormField label="Delivery Radius (km)">
          <input className={inp} type="number" step="0.1" value={form.delivery_radius_km} onChange={e => set('delivery_radius_km', e.target.value)} />
        </FormField>
        <FormField label="Geofence Radius (m)">
          <input className={inp} type="number" value={form.geofence_radius_meters} onChange={e => set('geofence_radius_meters', e.target.value)} />
        </FormField>
      </div>

      <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider pt-1">Legal & Compliance</div>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="GSTIN" required>
          <input className={inp} value={form.gstin} onChange={e => set('gstin', e.target.value)} placeholder="15-digit GSTIN" maxLength={15} />
        </FormField>
        <FormField label="PAN">
          <input className={inp} value={form.pan} onChange={e => set('pan', e.target.value)} placeholder="10-digit PAN" maxLength={10} />
        </FormField>
        <FormField label="FSSAI License No.">
          <input className={inp} value={form.fssai_license_number} onChange={e => set('fssai_license_number', e.target.value)} />
        </FormField>
        <FormField label="FSSAI Expiry">
          <input className={inp} type="date" value={form.fssai_license_expiry} onChange={e => set('fssai_license_expiry', e.target.value)} />
        </FormField>
        <FormField label="Shop Act License No.">
          <input className={inp} value={form.shop_act_license_number} onChange={e => set('shop_act_license_number', e.target.value)} />
        </FormField>
      </div>

      <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider pt-1">Capacity</div>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Area (sq ft)">
          <input className={inp} type="number" value={form.area_sq_ft} onChange={e => set('area_sq_ft', e.target.value)} />
        </FormField>
        <FormField label="Storage Units">
          <input className={inp} type="number" value={form.storage_capacity_units} onChange={e => set('storage_capacity_units', e.target.value)} />
        </FormField>
      </div>

      <div className="flex gap-2 pt-2 border-t sticky bottom-0 bg-white pb-1">
        <button type="submit" disabled={saving} className="flex-1 py-2.5 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50">
          {saving ? 'Creating…' : 'Create Store'}
        </button>
        <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-gray-200 text-sm text-gray-600 rounded-lg hover:bg-gray-50 transition-colors">
          Cancel
        </button>
      </div>
    </form>
  );
}

function EditStoreModal({ store, onClose, onSaved }) {
  const [form, setForm] = useState({
    store_name:             store.store_name ?? '',
    store_type:             store.store_type ?? 'dark_store',
    ownership_type:         store.ownership_type ?? 'leased',
    delivery_radius_km:     store.delivery_radius_km ?? '',
    geofence_radius_meters: store.geofence_radius_meters ?? '',
    area_sq_ft:             store.area_sq_ft ?? '',
    storage_capacity_units: store.storage_capacity_units ?? '',
    pan:                    store.pan ?? '',
    fssai_license_number:   store.fssai_license_number ?? '',
    fssai_license_expiry:   store.fssai_license_expiry ?? '',
    shop_act_license_number:store.shop_act_license_number ?? '',
    staff_count:            store.staff_count ?? '',
    pickers_count:          store.pickers_count ?? '',
    packers_count:          store.packers_count ?? '',
    ops_staff_count:        store.ops_staff_count ?? '',
  });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const body = {};
      if (form.store_name)             body.store_name             = form.store_name.trim();
      if (form.store_type)             body.store_type             = form.store_type;
      if (form.ownership_type)         body.ownership_type         = form.ownership_type;
      if (form.delivery_radius_km)     body.delivery_radius_km     = parseFloat(form.delivery_radius_km);
      if (form.geofence_radius_meters) body.geofence_radius_meters = parseInt(form.geofence_radius_meters);
      if (form.area_sq_ft)             body.area_sq_ft             = parseFloat(form.area_sq_ft);
      if (form.storage_capacity_units) body.storage_capacity_units = parseInt(form.storage_capacity_units);
      if (form.pan)                    body.pan                    = form.pan.trim();
      if (form.fssai_license_number)   body.fssai_license_number   = form.fssai_license_number.trim();
      if (form.fssai_license_expiry)   body.fssai_license_expiry   = form.fssai_license_expiry;
      if (form.shop_act_license_number)body.shop_act_license_number= form.shop_act_license_number.trim();
      if (form.staff_count !== '')     body.staff_count            = parseInt(form.staff_count);
      if (form.pickers_count !== '')   body.pickers_count          = parseInt(form.pickers_count);
      if (form.packers_count !== '')   body.packers_count          = parseInt(form.packers_count);
      if (form.ops_staff_count !== '') body.ops_staff_count        = parseInt(form.ops_staff_count);

      await storesService.update(store._id, body);
      toast.success('Store updated');
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <FormField label="Store Name">
            <input className={inp} value={form.store_name} onChange={e => set('store_name', e.target.value)} />
          </FormField>
        </div>
        <FormField label="Store Type">
          <select className={sel} value={form.store_type} onChange={e => set('store_type', e.target.value)}>
            {STORE_TYPES.map(t => <option key={t} value={t}>{STORE_TYPE_LABELS[t]}</option>)}
          </select>
        </FormField>
        <FormField label="Ownership">
          <select className={sel} value={form.ownership_type} onChange={e => set('ownership_type', e.target.value)}>
            {OWN_TYPES.map(t => <option key={t} value={t}>{OWN_LABELS[t]}</option>)}
          </select>
        </FormField>
        <FormField label="Delivery Radius (km)">
          <input className={inp} type="number" step="0.1" value={form.delivery_radius_km} onChange={e => set('delivery_radius_km', e.target.value)} />
        </FormField>
        <FormField label="Geofence (m)">
          <input className={inp} type="number" value={form.geofence_radius_meters} onChange={e => set('geofence_radius_meters', e.target.value)} />
        </FormField>
        <FormField label="Area (sq ft)">
          <input className={inp} type="number" value={form.area_sq_ft} onChange={e => set('area_sq_ft', e.target.value)} />
        </FormField>
        <FormField label="Storage Units">
          <input className={inp} type="number" value={form.storage_capacity_units} onChange={e => set('storage_capacity_units', e.target.value)} />
        </FormField>
        <FormField label="PAN">
          <input className={inp} value={form.pan} onChange={e => set('pan', e.target.value)} maxLength={10} />
        </FormField>
        <FormField label="FSSAI License No.">
          <input className={inp} value={form.fssai_license_number} onChange={e => set('fssai_license_number', e.target.value)} />
        </FormField>
        <FormField label="FSSAI Expiry">
          <input className={inp} type="date" value={form.fssai_license_expiry} onChange={e => set('fssai_license_expiry', e.target.value)} />
        </FormField>
        <FormField label="Shop Act License">
          <input className={inp} value={form.shop_act_license_number} onChange={e => set('shop_act_license_number', e.target.value)} />
        </FormField>
      </div>
      <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Staff Counts</div>
      <div className="grid grid-cols-2 gap-3">
        {[['staff_count','Total Staff'],['pickers_count','Pickers'],['packers_count','Packers'],['ops_staff_count','Ops Staff']].map(([k, l]) => (
          <FormField key={k} label={l}>
            <input className={inp} type="number" value={form[k]} onChange={e => set(k, e.target.value)} />
          </FormField>
        ))}
      </div>
      <div className="flex gap-2 pt-2 border-t">
        <button type="submit" disabled={saving} className="flex-1 py-2.5 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600 disabled:opacity-50">
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
        <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-gray-200 text-sm text-gray-600 rounded-lg hover:bg-gray-50">Cancel</button>
      </div>
    </form>
  );
}

function UpdateStatusModal({ store, onClose, onSaved }) {
  const [status, setStatus] = useState(store.status);
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await storesService.updateStatus(store._id, { status, reason: reason || undefined });
      toast.success(`Status updated to ${STATUS_LABELS[status]}`);
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err.message || 'Failed to update status');
    } finally { setSaving(false); }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <FormField label="New Status" required>
        <select className={sel} value={status} onChange={e => setStatus(e.target.value)}>
          {VALID_STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
        </select>
      </FormField>
      <FormField label="Reason (optional)">
        <input className={inp} value={reason} onChange={e => setReason(e.target.value)} placeholder="Reason for status change" />
      </FormField>
      <div className="flex gap-2 pt-1">
        <button type="submit" disabled={saving} className="flex-1 py-2.5 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600 disabled:opacity-50">
          {saving ? 'Updating…' : 'Update Status'}
        </button>
        <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-gray-200 text-sm text-gray-600 rounded-lg hover:bg-gray-50">Cancel</button>
      </div>
    </form>
  );
}

function EmergencyShutdownModal({ store, onClose, onSaved }) {
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!reason.trim()) { toast.error('Reason is required'); return; }
    setSaving(true);
    try {
      await storesService.emergencyShutdown(store._id, { reason: reason.trim() });
      toast.success('Emergency shutdown activated');
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err.message || 'Failed');
    } finally { setSaving(false); }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
        <ShieldAlert size={18} className="text-red-500 mt-0.5 shrink-0" />
        <p className="text-sm text-red-700">This will immediately close the store and halt all operations. This action requires a valid reason.</p>
      </div>
      <FormField label="Reason" required>
        <textarea className={`${inp} resize-none`} rows={3} value={reason} onChange={e => setReason(e.target.value)} placeholder="e.g. Fire alarm triggered — evacuating staff" />
      </FormField>
      <div className="flex gap-2 pt-1">
        <button type="submit" disabled={saving} className="flex-1 py-2.5 bg-red-500 text-white text-sm font-medium rounded-lg hover:bg-red-600 disabled:opacity-50">
          {saving ? 'Shutting down…' : 'Confirm Emergency Shutdown'}
        </button>
        <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-gray-200 text-sm text-gray-600 rounded-lg hover:bg-gray-50">Cancel</button>
      </div>
    </form>
  );
}

function AssignManagerModal({ store, onClose, onSaved }) {
  const [managerId, setManagerId] = useState(store.manager_id ?? '');
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await storesService.assignManager(store._id, { manager_id: managerId.trim() || null });
      toast.success(managerId.trim() ? 'Manager assigned' : 'Manager removed');
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err.message || 'Failed');
    } finally { setSaving(false); }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      {store.manager_name && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
          Current: <strong>{store.manager_name}</strong> — {store.manager_phone}
        </div>
      )}
      <FormField label="Admin User ID (leave blank to remove)">
        <input className={inp} value={managerId} onChange={e => setManagerId(e.target.value)} placeholder="Admin ObjectId" />
      </FormField>
      <div className="flex gap-2 pt-1">
        <button type="submit" disabled={saving} className="flex-1 py-2.5 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600 disabled:opacity-50">
          {saving ? 'Saving…' : 'Save'}
        </button>
        <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-gray-200 text-sm text-gray-600 rounded-lg hover:bg-gray-50">Cancel</button>
      </div>
    </form>
  );
}

function ManagePincodesModal({ store, onClose, onSaved }) {
  const [action, setAction] = useState('add');
  const [pincodesText, setPincodesText] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    const pincodes = pincodesText.split(/[\s,]+/).map(p => p.trim()).filter(Boolean);
    if (!pincodes.length) { toast.error('Enter at least one pincode'); return; }
    setSaving(true);
    try {
      await storesService.updatePincodes(store._id, { action, pincodes });
      toast.success('Pincodes updated');
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err.message || 'Failed');
    } finally { setSaving(false); }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="p-3 bg-gray-50 rounded-lg">
        <p className="text-xs text-gray-500 mb-1">Current pincodes ({safeArr(store.pincodes_served).length})</p>
        <p className="text-sm font-mono text-gray-700 break-all">
          {safeArr(store.pincodes_served).join(', ') || 'None'}
        </p>
      </div>
      <FormField label="Action">
        <div className="flex gap-2">
          {['add','remove','replace'].map(a => (
            <button key={a} type="button" onClick={() => setAction(a)}
              className={`flex-1 py-1.5 text-xs font-medium rounded-lg border transition-colors ${action === a ? 'bg-orange-500 text-white border-orange-500' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
              {a.charAt(0).toUpperCase() + a.slice(1)}
            </button>
          ))}
        </div>
      </FormField>
      <FormField label="Pincodes (comma or space separated)" required>
        <textarea className={`${inp} resize-none`} rows={3} value={pincodesText} onChange={e => setPincodesText(e.target.value)} placeholder="201301, 201304, 201306" />
      </FormField>
      <div className="flex gap-2 pt-1">
        <button type="submit" disabled={saving} className="flex-1 py-2.5 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600 disabled:opacity-50">
          {saving ? 'Saving…' : 'Update Pincodes'}
        </button>
        <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-gray-200 text-sm text-gray-600 rounded-lg hover:bg-gray-50">Cancel</button>
      </div>
    </form>
  );
}

function ManageZonesModal({ store, onClose, onSaved }) {
  const [action, setAction] = useState('add');
  const [zonesText, setZonesText] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    const zones = zonesText.split(/[\n,]+/).map(z => z.trim()).filter(Boolean);
    if (!zones.length) { toast.error('Enter at least one zone'); return; }
    setSaving(true);
    try {
      await storesService.updateZones(store._id, { action, zones });
      toast.success('Delivery zones updated');
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err.message || 'Failed');
    } finally { setSaving(false); }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="p-3 bg-gray-50 rounded-lg">
        <p className="text-xs text-gray-500 mb-1">Current zones ({safeArr(store.active_delivery_zones).length})</p>
        <div className="flex flex-wrap gap-1">
          {safeArr(store.active_delivery_zones).length
            ? safeArr(store.active_delivery_zones).map(z => (
                <span key={z} className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full">{z}</span>
              ))
            : <span className="text-sm text-gray-500">None</span>}
        </div>
      </div>
      <FormField label="Action">
        <div className="flex gap-2">
          {['add','remove','replace'].map(a => (
            <button key={a} type="button" onClick={() => setAction(a)}
              className={`flex-1 py-1.5 text-xs font-medium rounded-lg border transition-colors ${action === a ? 'bg-orange-500 text-white border-orange-500' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
              {a.charAt(0).toUpperCase() + a.slice(1)}
            </button>
          ))}
        </div>
      </FormField>
      <FormField label="Zones (one per line or comma separated)" required>
        <textarea className={`${inp} resize-none`} rows={4} value={zonesText} onChange={e => setZonesText(e.target.value)} placeholder="Zone_A_North_Noida_1&#10;Zone_A_North_Noida_2" />
      </FormField>
      <div className="flex gap-2 pt-1">
        <button type="submit" disabled={saving} className="flex-1 py-2.5 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600 disabled:opacity-50">
          {saving ? 'Saving…' : 'Update Zones'}
        </button>
        <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-gray-200 text-sm text-gray-600 rounded-lg hover:bg-gray-50">Cancel</button>
      </div>
    </form>
  );
}

function SlaConfigModal({ store, onClose, onSaved }) {
  const sla = store.sla_config || {};
  const [form, setForm] = useState({
    target_delivery_minutes:  sla.target_delivery_minutes  ?? 12,
    max_delivery_minutes:     sla.max_delivery_minutes     ?? 20,
    picking_sla_minutes:      sla.picking_sla_minutes      ?? 5,
    packing_sla_minutes:      sla.packing_sla_minutes      ?? 2,
    last_mile_sla_minutes:    sla.last_mile_sla_minutes    ?? 8,
    surge_multiplier_max:     sla.surge_multiplier_max     ?? 1.5,
    surge_delivery_fee_max:   sla.surge_delivery_fee_max   ?? 40,
  });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const body = Object.fromEntries(Object.entries(form).map(([k, v]) => [k, parseFloat(v)]));
      await storesService.updateSla(store._id, body);
      toast.success('SLA config updated');
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err.message || 'Failed');
    } finally { setSaving(false); }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        {[
          ['target_delivery_minutes', 'Target Delivery (min)'],
          ['max_delivery_minutes',    'Max Delivery (min)'],
          ['picking_sla_minutes',     'Picking SLA (min)'],
          ['packing_sla_minutes',     'Packing SLA (min)'],
          ['last_mile_sla_minutes',   'Last Mile SLA (min)'],
          ['surge_multiplier_max',    'Surge Multiplier Max'],
          ['surge_delivery_fee_max',  'Surge Fee Max (₹)'],
        ].map(([k, l]) => (
          <FormField key={k} label={l}>
            <input className={inp} type="number" step="0.1" value={form[k]} onChange={e => set(k, e.target.value)} />
          </FormField>
        ))}
      </div>
      <div className="flex gap-2 pt-2 border-t">
        <button type="submit" disabled={saving} className="flex-1 py-2.5 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600 disabled:opacity-50">
          {saving ? 'Saving…' : 'Save SLA Config'}
        </button>
        <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-gray-200 text-sm text-gray-600 rounded-lg hover:bg-gray-50">Cancel</button>
      </div>
    </form>
  );
}

function CapacityModal({ store, onClose, onSaved }) {
  const cap = store.capacity_config || {};
  const [form, setForm] = useState({
    daily_order_capacity:          cap.daily_order_capacity          ?? 1000,
    peak_hour_capacity_per_hour:   cap.peak_hour_capacity_per_hour   ?? 200,
    concurrent_pickers_max:        cap.concurrent_pickers_max        ?? 10,
    auto_throttle_at_capacity_pct: cap.auto_throttle_at_capacity_pct ?? 90,
    cod_enabled:                   cap.cod_enabled                   ?? true,
    cod_max_per_order:             cap.cod_max_per_order             ?? 2000,
  });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await storesService.updateCapacity(store._id, {
        daily_order_capacity:          parseInt(form.daily_order_capacity),
        peak_hour_capacity_per_hour:   parseInt(form.peak_hour_capacity_per_hour),
        concurrent_pickers_max:        parseInt(form.concurrent_pickers_max),
        auto_throttle_at_capacity_pct: parseFloat(form.auto_throttle_at_capacity_pct),
        cod_enabled:                   form.cod_enabled,
        cod_max_per_order:             parseInt(form.cod_max_per_order),
      });
      toast.success('Capacity config updated');
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err.message || 'Failed');
    } finally { setSaving(false); }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        {[
          ['daily_order_capacity',          'Daily Order Capacity'],
          ['peak_hour_capacity_per_hour',   'Peak Hour Capacity/hr'],
          ['concurrent_pickers_max',        'Max Concurrent Pickers'],
          ['auto_throttle_at_capacity_pct', 'Auto Throttle at (%)'],
          ['cod_max_per_order',             'COD Max per Order (₹)'],
        ].map(([k, l]) => (
          <FormField key={k} label={l}>
            <input className={inp} type="number" value={form[k]} onChange={e => set(k, e.target.value)} />
          </FormField>
        ))}
        <FormField label="COD Enabled">
          <select className={sel} value={form.cod_enabled ? 'true' : 'false'} onChange={e => set('cod_enabled', e.target.value === 'true')}>
            <option value="true">Enabled</option>
            <option value="false">Disabled</option>
          </select>
        </FormField>
      </div>
      <div className="flex gap-2 pt-2 border-t">
        <button type="submit" disabled={saving} className="flex-1 py-2.5 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600 disabled:opacity-50">
          {saving ? 'Saving…' : 'Save Capacity Config'}
        </button>
        <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-gray-200 text-sm text-gray-600 rounded-lg hover:bg-gray-50">Cancel</button>
      </div>
    </form>
  );
}

function HoursModal({ store, onClose, onSaved }) {
  const oh = store.operational_hours || {};
  const [form, setForm] = useState({
    is_24x7:         oh.is_24x7         ?? false,
    weekday_open:    oh.weekday?.open   ?? '06:00',
    weekday_close:   oh.weekday?.close  ?? '23:59',
    weekend_open:    oh.weekend?.open   ?? '06:00',
    weekend_close:   oh.weekend?.close  ?? '23:59',
    holiday_open:    oh.holidays?.open  ?? '08:00',
    holiday_close:   oh.holidays?.close ?? '22:00',
    timezone:        oh.timezone        ?? 'Asia/Kolkata',
  });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await storesService.updateHours(store._id, {
        is_24x7:  form.is_24x7,
        weekday:  { open: form.weekday_open,  close: form.weekday_close },
        weekend:  { open: form.weekend_open,  close: form.weekend_close },
        holidays: { open: form.holiday_open,  close: form.holiday_close },
        timezone: form.timezone,
      });
      toast.success('Operating hours updated');
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err.message || 'Failed');
    } finally { setSaving(false); }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <FormField label="24x7 Operations">
        <select className={sel} value={form.is_24x7 ? 'true' : 'false'} onChange={e => set('is_24x7', e.target.value === 'true')}>
          <option value="false">No (use schedule below)</option>
          <option value="true">Yes — Always Open</option>
        </select>
      </FormField>
      {!form.is_24x7 && (
        <>
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">Weekday Hours</div>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Open"><input className={inp} type="time" value={form.weekday_open}  onChange={e => set('weekday_open', e.target.value)} /></FormField>
            <FormField label="Close"><input className={inp} type="time" value={form.weekday_close} onChange={e => set('weekday_close', e.target.value)} /></FormField>
          </div>
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">Weekend Hours</div>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Open"><input className={inp} type="time" value={form.weekend_open}  onChange={e => set('weekend_open', e.target.value)} /></FormField>
            <FormField label="Close"><input className={inp} type="time" value={form.weekend_close} onChange={e => set('weekend_close', e.target.value)} /></FormField>
          </div>
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">Holiday Hours</div>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Open"><input className={inp} type="time" value={form.holiday_open}  onChange={e => set('holiday_open', e.target.value)} /></FormField>
            <FormField label="Close"><input className={inp} type="time" value={form.holiday_close} onChange={e => set('holiday_close', e.target.value)} /></FormField>
          </div>
        </>
      )}
      <FormField label="Timezone">
        <input className={inp} value={form.timezone} onChange={e => set('timezone', e.target.value)} />
      </FormField>
      <div className="flex gap-2 pt-2 border-t">
        <button type="submit" disabled={saving} className="flex-1 py-2.5 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600 disabled:opacity-50">
          {saving ? 'Saving…' : 'Save Hours'}
        </button>
        <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-gray-200 text-sm text-gray-600 rounded-lg hover:bg-gray-50">Cancel</button>
      </div>
    </form>
  );
}

function AddDocumentModal({ store, doc, onClose, onSaved }) {
  const isEdit = !!doc;
  const [form, setForm] = useState({
    document_type:   doc?.document_type   ?? 'fssai_license',
    document_number: doc?.document_number ?? '',
    document_url:    doc?.document_url    ?? '',
    issued_date:     doc?.issued_date     ?? '',
    expiry_date:     doc?.expiry_date     ?? '',
    notes:           doc?.notes          ?? '',
  });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.document_type) { toast.error('Document type required'); return; }
    setSaving(true);
    try {
      const body = {
        document_type:   form.document_type,
        document_number: form.document_number || undefined,
        document_url:    form.document_url    || undefined,
        issued_date:     form.issued_date     || undefined,
        expiry_date:     form.expiry_date     || undefined,
        notes:           form.notes           || undefined,
      };
      if (isEdit) {
        await storesService.updateDocument(store._id, doc._id, body);
        toast.success('Document updated');
      } else {
        await storesService.addDocument(store._id, body);
        toast.success('Document added');
      }
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err.message || 'Failed');
    } finally { setSaving(false); }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <FormField label="Document Type" required>
        <select className={sel} value={form.document_type} onChange={e => set('document_type', e.target.value)} disabled={isEdit}>
          {DOC_TYPES.map(t => <option key={t} value={t}>{DOC_TYPE_LABELS[t]}</option>)}
        </select>
      </FormField>
      <FormField label="Document Number">
        <input className={inp} value={form.document_number} onChange={e => set('document_number', e.target.value)} />
      </FormField>
      <FormField label="Document URL">
        <input className={inp} type="url" value={form.document_url} onChange={e => set('document_url', e.target.value)} placeholder="https://..." />
      </FormField>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Issued Date"><input className={inp} type="date" value={form.issued_date} onChange={e => set('issued_date', e.target.value)} /></FormField>
        <FormField label="Expiry Date"><input className={inp} type="date" value={form.expiry_date} onChange={e => set('expiry_date', e.target.value)} /></FormField>
      </div>
      <FormField label="Notes">
        <textarea className={`${inp} resize-none`} rows={2} value={form.notes} onChange={e => set('notes', e.target.value)} />
      </FormField>
      <div className="flex gap-2 pt-1">
        <button type="submit" disabled={saving} className="flex-1 py-2.5 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600 disabled:opacity-50">
          {saving ? 'Saving…' : isEdit ? 'Update Document' : 'Add Document'}
        </button>
        <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-gray-200 text-sm text-gray-600 rounded-lg hover:bg-gray-50">Cancel</button>
      </div>
    </form>
  );
}

function AddEquipmentModal({ store, equip, onClose, onSaved }) {
  const isEdit = !!equip;
  const [form, setForm] = useState({
    type:             equip?.type             ?? 'refrigerator',
    brand:            equip?.brand            ?? '',
    model:            equip?.model            ?? '',
    serial_number:    equip?.serial_number    ?? '',
    quantity:         equip?.quantity         ?? 1,
    status:           equip?.status           ?? 'operational',
    last_serviced_at: equip?.last_serviced_at ? equip.last_serviced_at.slice(0, 10) : '',
    next_service_due: equip?.next_service_due ? equip.next_service_due.slice(0, 10) : '',
    notes:            equip?.notes            ?? '',
  });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const body = {
        type:             form.type,
        brand:            form.brand            || undefined,
        model:            form.model            || undefined,
        serial_number:    form.serial_number    || undefined,
        quantity:         parseInt(form.quantity) || 1,
        status:           form.status,
        last_serviced_at: form.last_serviced_at || undefined,
        next_service_due: form.next_service_due || undefined,
        notes:            form.notes            || undefined,
      };
      if (isEdit) {
        await storesService.updateEquipment(store._id, equip._id, body);
        toast.success('Equipment updated');
      } else {
        await storesService.addEquipment(store._id, body);
        toast.success('Equipment added');
      }
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err.message || 'Failed');
    } finally { setSaving(false); }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <FormField label="Equipment Type" required>
            <select className={sel} value={form.type} onChange={e => set('type', e.target.value)} disabled={isEdit}>
              {EQUIP_TYPES.map(t => <option key={t} value={t}>{EQUIP_TYPE_LABELS[t]}</option>)}
            </select>
          </FormField>
        </div>
        <FormField label="Brand"><input className={inp} value={form.brand} onChange={e => set('brand', e.target.value)} /></FormField>
        <FormField label="Model"><input className={inp} value={form.model} onChange={e => set('model', e.target.value)} /></FormField>
        <FormField label="Serial Number"><input className={inp} value={form.serial_number} onChange={e => set('serial_number', e.target.value)} /></FormField>
        <FormField label="Quantity"><input className={inp} type="number" min="1" value={form.quantity} onChange={e => set('quantity', e.target.value)} /></FormField>
        <div className="col-span-2">
          <FormField label="Status">
            <select className={sel} value={form.status} onChange={e => set('status', e.target.value)}>
              {['operational','under_maintenance','faulty','decommissioned'].map(s => (
                <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
              ))}
            </select>
          </FormField>
        </div>
        <FormField label="Last Serviced"><input className={inp} type="date" value={form.last_serviced_at} onChange={e => set('last_serviced_at', e.target.value)} /></FormField>
        <FormField label="Next Service Due"><input className={inp} type="date" value={form.next_service_due} onChange={e => set('next_service_due', e.target.value)} /></FormField>
        <div className="col-span-2">
          <FormField label="Notes"><textarea className={`${inp} resize-none`} rows={2} value={form.notes} onChange={e => set('notes', e.target.value)} /></FormField>
        </div>
      </div>
      <div className="flex gap-2 pt-1">
        <button type="submit" disabled={saving} className="flex-1 py-2.5 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600 disabled:opacity-50">
          {saving ? 'Saving…' : isEdit ? 'Update Equipment' : 'Add Equipment'}
        </button>
        <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-gray-200 text-sm text-gray-600 rounded-lg hover:bg-gray-50">Cancel</button>
      </div>
    </form>
  );
}

function DeleteStoreModal({ store, onClose, onDeleted }) {
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await storesService.deleteStore(store._id, { reason: reason.trim() || 'Deleted by admin' });
      toast.success('Store permanently closed');
      onDeleted();
      onClose();
    } catch (err) {
      toast.error(err.message || 'Failed to delete store');
    } finally { setSaving(false); }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
        <AlertTriangle size={18} className="text-red-500 mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-semibold text-red-700">Permanently Close Store</p>
          <p className="text-sm text-red-600 mt-0.5">This soft-deletes <strong>{store.store_name}</strong>. The store cannot be recovered. Active stores cannot be deleted — set status to Inactive first.</p>
        </div>
      </div>
      <FormField label="Reason">
        <input className={inp} value={reason} onChange={e => setReason(e.target.value)} placeholder="e.g. Lease not renewed" />
      </FormField>
      <div className="flex gap-2 pt-1">
        <button type="submit" disabled={saving} className="flex-1 py-2.5 bg-red-500 text-white text-sm font-medium rounded-lg hover:bg-red-600 disabled:opacity-50">
          {saving ? 'Deleting…' : 'Permanently Close'}
        </button>
        <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-gray-200 text-sm text-gray-600 rounded-lg hover:bg-gray-50">Cancel</button>
      </div>
    </form>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// DRAWER TAB COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

function OverviewTab({ store, onEdit, onStatus, onEmergency, onManager, onPincodes, onZones, onSla, onCapacity, onHours }) {
  const sla = store.sla_config || {};
  const cap = store.capacity_config || {};
  const oh  = store.operational_hours || {};

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <ActionBtn onClick={onEdit} color="orange">Edit Details</ActionBtn>
        <ActionBtn onClick={onStatus} color="gray">Change Status</ActionBtn>
        <ActionBtn onClick={onManager} color="gray">Assign Manager</ActionBtn>
        <ActionBtn onClick={onEmergency} color="red">Emergency Shutdown</ActionBtn>
      </div>

      <Section title="Store Info">
        <DetailRow label="Code"           value={<span className="font-mono text-orange-600">{store.store_code}</span>} />
        <DetailRow label="Type"           value={STORE_TYPE_LABELS[store.store_type] ?? store.store_type} />
        <DetailRow label="Ownership"      value={OWN_LABELS[store.ownership_type] ?? store.ownership_type} />
        <DetailRow label="GSTIN"          value={store.gstin} />
        <DetailRow label="PAN"            value={store.pan} />
        <DetailRow label="Area"           value={store.area_sq_ft ? `${fmtNum(store.area_sq_ft)} sq ft` : undefined} />
        <DetailRow label="Created"        value={fmtDate(store.created_at)} />
      </Section>

      <Section title="Location">
        <DetailRow label="Address"        value={addressLine(store.address)} />
        <DetailRow label="Full Address"   value={[store.address?.building_name, store.address?.street, store.address?.landmark].filter(Boolean).join(', ') || undefined} />
        <DetailRow label="Coordinates"    value={store.latitude && store.longitude ? `${store.latitude}, ${store.longitude}` : undefined} />
        <DetailRow label="Delivery Radius" value={store.delivery_radius_km ? `${store.delivery_radius_km} km` : undefined} />
        <DetailRow label="Geofence"       value={store.geofence_radius_meters ? `${store.geofence_radius_meters} m` : undefined} />
      </Section>

      <Section title="Pincodes & Zones">
        <div className="py-2.5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-500">Pincodes served ({safeArr(store.pincodes_served).length})</span>
            <button onClick={onPincodes} className="text-xs text-orange-500 hover:text-orange-600 font-medium">Manage</button>
          </div>
          <div className="flex flex-wrap gap-1">
            {safeArr(store.pincodes_served).length
              ? safeArr(store.pincodes_served).map(p => <span key={p} className="bg-gray-100 text-gray-700 text-xs px-2 py-0.5 rounded font-mono">{p}</span>)
              : <span className="text-xs text-gray-400">None configured</span>}
          </div>
        </div>
        <div className="py-2.5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-500">Delivery zones ({safeArr(store.active_delivery_zones).length})</span>
            <button onClick={onZones} className="text-xs text-orange-500 hover:text-orange-600 font-medium">Manage</button>
          </div>
          <div className="flex flex-wrap gap-1">
            {safeArr(store.active_delivery_zones).length
              ? safeArr(store.active_delivery_zones).map(z => <span key={z} className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded">{z}</span>)
              : <span className="text-xs text-gray-400">None configured</span>}
          </div>
        </div>
      </Section>

      <Section title="Manager & Staff">
        <DetailRow label="Manager"        value={store.manager_name || 'Not assigned'} />
        <DetailRow label="Manager Phone"  value={store.manager_phone} />
        <DetailRow label="Manager Email"  value={store.manager_email} />
        <DetailRow label="Total Staff"    value={store.staff_count !== undefined ? `${store.staff_count}` : undefined} />
        <DetailRow label="Pickers"        value={store.pickers_count !== undefined ? `${store.pickers_count}` : undefined} />
        <DetailRow label="Packers"        value={store.packers_count !== undefined ? `${store.packers_count}` : undefined} />
        <DetailRow label="Ops Staff"      value={store.ops_staff_count !== undefined ? `${store.ops_staff_count}` : undefined} />
      </Section>

      <Section title="SLA Config">
        <div className="flex items-center justify-between py-2.5">
          <span className="text-xs text-gray-500">Configuration</span>
          <button onClick={onSla} className="text-xs text-orange-500 hover:text-orange-600 font-medium">Edit</button>
        </div>
        <DetailRow label="Target Delivery" value={sla.target_delivery_minutes ? `${sla.target_delivery_minutes} min` : undefined} />
        <DetailRow label="Max Delivery"    value={sla.max_delivery_minutes    ? `${sla.max_delivery_minutes} min` : undefined} />
        <DetailRow label="Picking SLA"     value={sla.picking_sla_minutes     ? `${sla.picking_sla_minutes} min` : undefined} />
        <DetailRow label="Packing SLA"     value={sla.packing_sla_minutes     ? `${sla.packing_sla_minutes} min` : undefined} />
        <DetailRow label="Last Mile SLA"   value={sla.last_mile_sla_minutes   ? `${sla.last_mile_sla_minutes} min` : undefined} />
        <DetailRow label="Surge Max"       value={sla.surge_multiplier_max    ? `${sla.surge_multiplier_max}x` : undefined} />
        <DetailRow label="Surge Fee Max"   value={sla.surge_delivery_fee_max  ? `₹${sla.surge_delivery_fee_max}` : undefined} />
      </Section>

      <Section title="Capacity Config">
        <div className="flex items-center justify-between py-2.5">
          <span className="text-xs text-gray-500">Configuration</span>
          <button onClick={onCapacity} className="text-xs text-orange-500 hover:text-orange-600 font-medium">Edit</button>
        </div>
        <DetailRow label="Daily Capacity"  value={cap.daily_order_capacity           ? fmtNum(cap.daily_order_capacity) + ' orders' : undefined} />
        <DetailRow label="Peak Capacity"   value={cap.peak_hour_capacity_per_hour    ? `${cap.peak_hour_capacity_per_hour}/hr` : undefined} />
        <DetailRow label="Max Pickers"     value={cap.concurrent_pickers_max         ? `${cap.concurrent_pickers_max}` : undefined} />
        <DetailRow label="Auto Throttle"   value={cap.auto_throttle_at_capacity_pct  ? `${cap.auto_throttle_at_capacity_pct}%` : undefined} />
        <DetailRow label="COD Enabled"     value={cap.cod_enabled !== undefined ? (cap.cod_enabled ? 'Yes' : 'No') : undefined} />
        <DetailRow label="COD Max"         value={cap.cod_max_per_order              ? `₹${fmtNum(cap.cod_max_per_order)}` : undefined} />
      </Section>

      <Section title="Operating Hours">
        <div className="flex items-center justify-between py-2.5">
          <span className="text-xs text-gray-500">Schedule</span>
          <button onClick={onHours} className="text-xs text-orange-500 hover:text-orange-600 font-medium">Edit</button>
        </div>
        <DetailRow label="24x7"      value={oh.is_24x7 !== undefined ? (oh.is_24x7 ? 'Yes' : 'No') : undefined} />
        {!oh.is_24x7 && (
          <>
            <DetailRow label="Weekday"   value={oh.weekday  ? `${oh.weekday.open} – ${oh.weekday.close}` : undefined} />
            <DetailRow label="Weekend"   value={oh.weekend  ? `${oh.weekend.open} – ${oh.weekend.close}` : undefined} />
            <DetailRow label="Holidays"  value={oh.holidays ? `${oh.holidays.open} – ${oh.holidays.close}` : undefined} />
          </>
        )}
        <DetailRow label="Timezone"  value={oh.timezone} />
      </Section>

      {store.fssai_license_number && (
        <Section title="Licenses">
          <DetailRow label="FSSAI No."       value={store.fssai_license_number} />
          <DetailRow label="FSSAI Expiry"    value={fmtDate(store.fssai_license_expiry)} />
          <DetailRow label="Shop Act No."    value={store.shop_act_license_number} />
        </Section>
      )}
    </div>
  );
}

function DocumentsTab({ store, onRefresh }) {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await storesService.listDocuments(store._id);
      setDocs(safeArr(res?.data?.documents));
    } catch (err) {
      toast.error(err.message || 'Failed to load documents');
    } finally { setLoading(false); }
  }, [store._id]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (doc) => {
    if (!window.confirm(`Remove ${DOC_TYPE_LABELS[doc.document_type]}?`)) return;
    setDeleting(doc._id);
    try {
      await storesService.deleteDocument(store._id, doc._id);
      toast.success('Document removed');
      load();
    } catch (err) {
      toast.error(err.message || 'Failed');
    } finally { setDeleting(null); }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500">{docs.length} document{docs.length !== 1 ? 's' : ''}</span>
        <button onClick={() => setModal({ type: 'add' })} className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500 text-white text-xs font-medium rounded-lg hover:bg-orange-600 transition-colors">
          <Plus size={12} /> Add Document
        </button>
      </div>

      {loading ? (
        <div className="py-8 text-center text-sm text-gray-400">Loading…</div>
      ) : docs.length === 0 ? (
        <div className="py-8 text-center text-sm text-gray-400">No documents uploaded</div>
      ) : (
        <div className="space-y-2">
          {docs.map(doc => (
            <div key={doc._id} className="border border-gray-100 rounded-lg p-3 hover:border-gray-200 transition-colors">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-gray-900 truncate">{DOC_TYPE_LABELS[doc.document_type]}</span>
                    <Badge variant={DOC_STATUS_VARIANTS[doc.status] ?? 'gray'} size="sm">{doc.status?.replace(/_/g, ' ')}</Badge>
                  </div>
                  {doc.document_number && <p className="text-xs text-gray-500 font-mono">{doc.document_number}</p>}
                  <div className="flex gap-3 mt-1 text-xs text-gray-400">
                    {doc.issued_date && <span>Issued: {fmtDate(doc.issued_date)}</span>}
                    {doc.expiry_date && <span>Expires: {fmtDate(doc.expiry_date)}</span>}
                  </div>
                  {doc.notes && <p className="text-xs text-gray-400 mt-0.5 italic">{doc.notes}</p>}
                  {doc.document_url && (
                    <a href={doc.document_url} target="_blank" rel="noreferrer" className="text-xs text-blue-500 hover:underline mt-0.5 block truncate">View Document</a>
                  )}
                </div>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => setModal({ type: 'edit', doc })} className="p-1.5 text-gray-400 hover:text-orange-500 transition-colors">
                    <Edit2 size={13} />
                  </button>
                  <button onClick={() => handleDelete(doc)} disabled={deleting === doc._id} className="p-1.5 text-gray-400 hover:text-red-500 transition-colors disabled:opacity-40">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal?.type === 'add' && (
        <Modal open title="Add Document" onClose={() => setModal(null)} width="max-w-md">
          <AddDocumentModal store={store} onClose={() => setModal(null)} onSaved={load} />
        </Modal>
      )}
      {modal?.type === 'edit' && (
        <Modal open title="Update Document" onClose={() => setModal(null)} width="max-w-md">
          <AddDocumentModal store={store} doc={modal.doc} onClose={() => setModal(null)} onSaved={load} />
        </Modal>
      )}
    </div>
  );
}

function EquipmentTab({ store }) {
  const [equips, setEquips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [decommissioning, setDecommissioning] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await storesService.listEquipment(store._id);
      setEquips(safeArr(res?.data?.equipment));
    } catch (err) {
      toast.error(err.message || 'Failed to load equipment');
    } finally { setLoading(false); }
  }, [store._id]);

  useEffect(() => { load(); }, [load]);

  const handleDecommission = async (eq) => {
    if (!window.confirm(`Decommission ${EQUIP_TYPE_LABELS[eq.type]}?`)) return;
    setDecommissioning(eq._id);
    try {
      await storesService.decommission(store._id, eq._id);
      toast.success('Equipment decommissioned');
      load();
    } catch (err) {
      toast.error(err.message || 'Failed');
    } finally { setDecommissioning(null); }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500">{equips.length} equipment item{equips.length !== 1 ? 's' : ''}</span>
        <button onClick={() => setModal({ type: 'add' })} className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500 text-white text-xs font-medium rounded-lg hover:bg-orange-600 transition-colors">
          <Plus size={12} /> Add Equipment
        </button>
      </div>

      {loading ? (
        <div className="py-8 text-center text-sm text-gray-400">Loading…</div>
      ) : equips.length === 0 ? (
        <div className="py-8 text-center text-sm text-gray-400">No equipment registered</div>
      ) : (
        <div className="space-y-2">
          {equips.map(eq => (
            <div key={eq._id} className="border border-gray-100 rounded-lg p-3 hover:border-gray-200 transition-colors">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-gray-900">{EQUIP_TYPE_LABELS[eq.type]}</span>
                    <Badge variant={EQUIP_STATUS_VARIANTS[eq.status] ?? 'gray'} size="sm">{eq.status?.replace(/_/g, ' ')}</Badge>
                    <span className="text-xs text-gray-400">×{eq.quantity}</span>
                  </div>
                  {(eq.brand || eq.model) && <p className="text-xs text-gray-500">{[eq.brand, eq.model].filter(Boolean).join(' — ')}</p>}
                  {eq.serial_number && <p className="text-xs text-gray-400 font-mono">{eq.serial_number}</p>}
                  <div className="flex gap-3 mt-1 text-xs text-gray-400">
                    {eq.last_serviced_at && <span>Serviced: {fmtDate(eq.last_serviced_at)}</span>}
                    {eq.next_service_due && <span>Due: {fmtDate(eq.next_service_due)}</span>}
                  </div>
                  {eq.notes && <p className="text-xs text-gray-400 mt-0.5 italic">{eq.notes}</p>}
                </div>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => setModal({ type: 'edit', eq })} className="p-1.5 text-gray-400 hover:text-orange-500 transition-colors">
                    <Edit2 size={13} />
                  </button>
                  {eq.status !== 'decommissioned' && (
                    <button onClick={() => handleDecommission(eq)} disabled={decommissioning === eq._id} className="p-1.5 text-gray-400 hover:text-red-500 transition-colors disabled:opacity-40">
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal?.type === 'add' && (
        <Modal open title="Add Equipment" onClose={() => setModal(null)} width="max-w-md">
          <AddEquipmentModal store={store} onClose={() => setModal(null)} onSaved={load} />
        </Modal>
      )}
      {modal?.type === 'edit' && (
        <Modal open title="Update Equipment" onClose={() => setModal(null)} width="max-w-md">
          <AddEquipmentModal store={store} equip={modal.eq} onClose={() => setModal(null)} onSaved={load} />
        </Modal>
      )}
    </div>
  );
}

function PerformanceTab({ store }) {
  const [perf, setPerf] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await storesService.getPerformance(store._id);
        setPerf(res?.data?.performance ?? null);
      } catch (err) {
        toast.error(err.message || 'Failed to load performance');
      } finally { setLoading(false); }
    })();
  }, [store._id]);

  if (loading) return <div className="py-8 text-center text-sm text-gray-400">Loading…</div>;
  if (!perf)   return <div className="py-8 text-center text-sm text-gray-400">No performance data</div>;

  const util = perf.current_capacity_utilization_pct ?? 0;
  const colors = loadColor(util);

  return (
    <div className="space-y-4">
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-gray-700">Capacity Utilization</span>
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${colors.badge}`}>{util}%</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all ${colors.bar}`} style={{ width: `${Math.min(util, 100)}%` }} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {[
          ['Active Orders',       perf.current_active_orders,              ''],
          ['Delivered Today',     perf.orders_delivered_today,             ''],
          ['Avg Processing',      perf.avg_order_processing_time_minutes,  'min'],
          ['Avg Delivery',        perf.avg_delivery_time_minutes,          'min'],
          ['SLA Breaches Today',  perf.sla_breach_count_today,             ''],
          ['SLA Breach Rate',     perf.sla_breach_rate_pct !== undefined ? `${perf.sla_breach_rate_pct}%` : '—', ''],
          ['Partners Online',     perf.partner_online_count,               ''],
          ['Orders/Partner',      perf.orders_per_partner,                 ''],
        ].map(([label, val, unit]) => (
          <div key={label} className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-500 mb-0.5">{label}</p>
            <p className="text-lg font-bold text-gray-900">
              {val !== undefined && val !== null ? `${val}${unit ? ' ' + unit : ''}` : '—'}
            </p>
          </div>
        ))}
      </div>

      {perf.snapshot_date && (
        <p className="text-xs text-gray-400 text-center">Snapshot: {fmtDate(perf.snapshot_date)}</p>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// STORE DETAIL DRAWER
// ═══════════════════════════════════════════════════════════════════════════════

function StoreDrawer({ store, onClose, onRefreshList }) {
  const [tab, setTab] = useState('overview');
  const [storeData, setStoreData] = useState(store);
  const [modal, setModal] = useState(null);

  const reloadStore = useCallback(async () => {
    try {
      const res = await storesService.getById(store._id);
      const fresh = res?.data?.store;
      if (fresh) {
        setStoreData(fresh);
        onRefreshList();
      }
    } catch { /* silently ignore */ }
  }, [store._id, onRefreshList]);

  const TABS = [
    { id: 'overview',   label: 'Overview',  icon: List },
    { id: 'documents',  label: 'Docs',      icon: FileText },
    { id: 'equipment',  label: 'Equipment', icon: Wrench },
    { id: 'performance',label: 'Live',      icon: Activity },
  ];

  const util = storeData.performance_today?.current_capacity_utilization_pct ?? 0;
  const lc   = loadColor(util);

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="absolute inset-0 bg-black/20" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white shadow-2xl flex flex-col h-full">
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-100 shrink-0">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-bold text-gray-900 truncate">{storeData.store_name}</h2>
                <Badge variant={STATUS_VARIANTS[storeData.status] ?? 'gray'}>
                  {STATUS_LABELS[storeData.status] ?? storeData.status}
                </Badge>
                {storeData.performance_today?.current_capacity_utilization_pct !== undefined && (
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${lc.badge}`}>{util}% load</span>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                <span className="font-mono text-orange-500">{storeData.store_code}</span>
                <span>·</span>
                <MapPin size={10} />
                <span>{storeData.address?.city}</span>
                {storeData.manager_name && <><span>·</span><span>{storeData.manager_name}</span></>}
              </div>
            </div>
            <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 shrink-0 mt-0.5">
              <X size={18} />
            </button>
          </div>

          {/* Tab bar */}
          <div className="flex gap-1 mt-3">
            {TABS.map(t => {
              const Icon = t.icon;
              return (
                <button key={t.id} onClick={() => setTab(t.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${tab === t.id ? 'bg-orange-100 text-orange-600' : 'text-gray-500 hover:bg-gray-100'}`}>
                  <Icon size={12} />{t.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {tab === 'overview' && (
            <OverviewTab
              store={storeData}
              onEdit={()      => setModal('edit')}
              onStatus={()    => setModal('status')}
              onEmergency={() => setModal('emergency')}
              onManager={()   => setModal('manager')}
              onPincodes={()  => setModal('pincodes')}
              onZones={()     => setModal('zones')}
              onSla={()       => setModal('sla')}
              onCapacity={()  => setModal('capacity')}
              onHours={()     => setModal('hours')}
            />
          )}
          {tab === 'documents'   && <DocumentsTab   store={storeData} onRefresh={reloadStore} />}
          {tab === 'equipment'   && <EquipmentTab   store={storeData} />}
          {tab === 'performance' && <PerformanceTab store={storeData} />}
        </div>

        {/* Danger zone footer */}
        <div className="px-5 py-3 border-t border-gray-100 shrink-0">
          <button onClick={() => setModal('delete')} className="w-full py-2 text-xs font-medium text-red-500 border border-red-200 rounded-lg hover:bg-red-50 transition-colors">
            Permanently Close Store
          </button>
        </div>
      </div>

      {/* Modals triggered from drawer */}
      {modal === 'edit' && (
        <Modal open title="Edit Store Details" onClose={() => setModal(null)} width="max-w-lg">
          <EditStoreModal store={storeData} onClose={() => setModal(null)} onSaved={reloadStore} />
        </Modal>
      )}
      {modal === 'status' && (
        <Modal open title="Change Store Status" onClose={() => setModal(null)} width="max-w-sm">
          <UpdateStatusModal store={storeData} onClose={() => setModal(null)} onSaved={reloadStore} />
        </Modal>
      )}
      {modal === 'emergency' && (
        <Modal open title="Emergency Shutdown" onClose={() => setModal(null)} width="max-w-sm">
          <EmergencyShutdownModal store={storeData} onClose={() => setModal(null)} onSaved={reloadStore} />
        </Modal>
      )}
      {modal === 'manager' && (
        <Modal open title="Assign Manager" onClose={() => setModal(null)} width="max-w-sm">
          <AssignManagerModal store={storeData} onClose={() => setModal(null)} onSaved={reloadStore} />
        </Modal>
      )}
      {modal === 'pincodes' && (
        <Modal open title="Manage Pincodes" onClose={() => setModal(null)} width="max-w-sm">
          <ManagePincodesModal store={storeData} onClose={() => setModal(null)} onSaved={reloadStore} />
        </Modal>
      )}
      {modal === 'zones' && (
        <Modal open title="Manage Delivery Zones" onClose={() => setModal(null)} width="max-w-sm">
          <ManageZonesModal store={storeData} onClose={() => setModal(null)} onSaved={reloadStore} />
        </Modal>
      )}
      {modal === 'sla' && (
        <Modal open title="SLA Configuration" onClose={() => setModal(null)} width="max-w-sm">
          <SlaConfigModal store={storeData} onClose={() => setModal(null)} onSaved={reloadStore} />
        </Modal>
      )}
      {modal === 'capacity' && (
        <Modal open title="Capacity Configuration" onClose={() => setModal(null)} width="max-w-sm">
          <CapacityModal store={storeData} onClose={() => setModal(null)} onSaved={reloadStore} />
        </Modal>
      )}
      {modal === 'hours' && (
        <Modal open title="Operating Hours" onClose={() => setModal(null)} width="max-w-sm">
          <HoursModal store={storeData} onClose={() => setModal(null)} onSaved={reloadStore} />
        </Modal>
      )}
      {modal === 'delete' && (
        <Modal open title="Close Store" onClose={() => setModal(null)} width="max-w-sm">
          <DeleteStoreModal store={storeData} onClose={() => setModal(null)} onDeleted={() => { onClose(); onRefreshList(); }} />
        </Modal>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// STORE CARD
// ═══════════════════════════════════════════════════════════════════════════════

function StoreCard({ store, onClick }) {
  const util = store.performance_today?.current_capacity_utilization_pct ?? 0;
  const lc   = loadColor(util);

  return (
    <div onClick={onClick} className="bg-white rounded-xl border border-gray-200 p-4 cursor-pointer hover:border-orange-300 hover:shadow-sm transition-all">
      <div className="flex items-start justify-between mb-3 gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-bold text-gray-900 truncate">{store.store_name}</h3>
            <Badge variant={STATUS_VARIANTS[store.status] ?? 'gray'} dot>
              {STATUS_LABELS[store.status] ?? store.status}
            </Badge>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-400 mt-0.5">
            <span className="font-mono text-orange-500 shrink-0">{store.store_code}</span>
            <span>·</span>
            <MapPin size={10} className="shrink-0" />
            <span className="truncate">{store.address?.city}</span>
            {store.store_type && <><span>·</span><span className="hidden sm:block">{STORE_TYPE_LABELS[store.store_type]}</span></>}
          </div>
        </div>
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full shrink-0 ${lc.badge}`}>{util}%</span>
      </div>

      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mb-3">
        <div className={`h-full rounded-full transition-all ${lc.bar}`} style={{ width: `${Math.min(util, 100)}%` }} />
      </div>

      <div className="grid grid-cols-3 gap-2 text-xs">
        <div className="bg-gray-50 rounded-lg p-2">
          <p className="text-gray-400 mb-0.5">Orders/day</p>
          <p className="font-bold text-gray-900">{store.capacity_config?.daily_order_capacity ? fmtNum(store.capacity_config.daily_order_capacity) : '—'}</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-2">
          <p className="text-gray-400 mb-0.5">Target</p>
          <p className="font-bold text-gray-900">{store.sla_config?.target_delivery_minutes ? `${store.sla_config.target_delivery_minutes} min` : '—'}</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-2">
          <p className="text-gray-400 mb-0.5">Staff</p>
          <p className="font-bold text-gray-900">{store.staff_count ?? '—'}</p>
        </div>
      </div>

      {store.manager_name && (
        <div className="mt-2 flex items-center gap-1 text-xs text-gray-400">
          <UserCheck size={11} />
          <span>{store.manager_name}</span>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════════

export default function DarkStores() {
  const [statsData,  setStatsData]  = useState(null);
  const [stores,     setStores]     = useState([]);
  const [total,      setTotal]      = useState(0);
  const [page,       setPage]       = useState(1);
  const [loading,    setLoading]    = useState(true);
  const [selected,   setSelected]   = useState(null);
  const [showCreate, setShowCreate] = useState(false);

  const [filters, setFilters] = useState({
    search: '', status: '', store_type: '', ownership_type: '', city: '',
    sort_by: 'created_at', sort_order: 'desc',
  });

  const setFilter = (k, v) => { setFilters(f => ({ ...f, [k]: v })); setPage(1); };

  const loadStats = useCallback(async () => {
    try {
      const res = await storesService.stats();
      setStatsData(res?.data ?? null);
    } catch { /* silently ignore */ }
  }, []);

  const loadStores = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: LIMIT, ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== '')) };
      const res = await storesService.list(params);
      setStores(safeArr(res?.data?.stores));
      setTotal(res?.data?.pagination?.total ?? 0);
    } catch (err) {
      toast.error(err.message || 'Failed to load stores');
    } finally { setLoading(false); }
  }, [page, filters]);

  useEffect(() => { loadStats(); }, [loadStats]);
  useEffect(() => { loadStores(); }, [loadStores]);

  const pages = Math.ceil(total / LIMIT) || 1;

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <StatCard title="Total Stores"     value={statsData?.total ?? '—'}                                    icon={Store}       iconColor="bg-blue-500"   compact />
        <StatCard title="Active"           value={statsData?.by_status?.active ?? '—'}                        icon={CheckCircle} iconColor="bg-green-500"  compact />
        <StatCard title="Maintenance"      value={statsData?.by_status?.under_maintenance ?? '—'}             icon={Wrench}      iconColor="bg-yellow-500" compact />
        <StatCard title="Closed"          value={statsData?.by_status?.closed ?? '—'}                         icon={Power}       iconColor="bg-red-500"    compact />
        <StatCard title="Expired Docs"     value={statsData?.stores_with_expired_docs ?? '—'}                 icon={FileText}    iconColor="bg-orange-500" compact />
      </div>

      {/* Toolbar */}
      <div className="bg-white border border-gray-200 rounded-xl p-3">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-orange-400"
              placeholder="Search by name, code, city, pincode…"
              value={filters.search}
              onChange={e => setFilter('search', e.target.value)}
            />
          </div>
          <select className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-orange-400 bg-white" value={filters.status} onChange={e => setFilter('status', e.target.value)}>
            <option value="">All Status</option>
            {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          <select className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-orange-400 bg-white" value={filters.store_type} onChange={e => setFilter('store_type', e.target.value)}>
            <option value="">All Types</option>
            {STORE_TYPES.map(t => <option key={t} value={t}>{STORE_TYPE_LABELS[t]}</option>)}
          </select>
          <select className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-orange-400 bg-white" value={filters.ownership_type} onChange={e => setFilter('ownership_type', e.target.value)}>
            <option value="">All Ownership</option>
            {OWN_TYPES.map(t => <option key={t} value={t}>{OWN_LABELS[t]}</option>)}
          </select>
          <button onClick={loadStores} className="p-2 border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 transition-colors">
            <RefreshCw size={14} />
          </button>
          <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600 transition-colors shrink-0">
            <Plus size={14} /> Add Store
          </button>
        </div>
      </div>

      {/* Store grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-2/3 mb-2" />
              <div className="h-3 bg-gray-100 rounded w-1/2 mb-3" />
              <div className="h-1.5 bg-gray-100 rounded mb-3" />
              <div className="grid grid-cols-3 gap-2">
                {[1,2,3].map(n => <div key={n} className="h-10 bg-gray-100 rounded-lg" />)}
              </div>
            </div>
          ))}
        </div>
      ) : stores.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 py-16 text-center">
          <Store size={32} className="text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-500">No dark stores found</p>
          <button onClick={() => setShowCreate(true)} className="mt-3 text-sm text-orange-500 hover:underline">Create the first one</button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {stores.map(store => (
              <StoreCard key={store._id} store={store} onClick={() => setSelected(store)} />
            ))}
          </div>

          {/* Pagination */}
          {pages > 1 && (
            <div className="flex items-center justify-between bg-white border border-gray-200 rounded-xl px-4 py-3">
              <span className="text-xs text-gray-500">
                {(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, total)} of {total} stores
              </span>
              <div className="flex items-center gap-1">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 disabled:opacity-30">
                  <ChevronLeft size={14} />
                </button>
                {Array.from({ length: Math.min(pages, 5) }, (_, i) => {
                  const p = pages <= 5 ? i + 1 : page <= 3 ? i + 1 : page >= pages - 2 ? pages - 4 + i : page - 2 + i;
                  return (
                    <button key={p} onClick={() => setPage(p)} className={`w-7 h-7 text-xs rounded-lg ${p === page ? 'bg-orange-500 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>{p}</button>
                  );
                })}
                <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 disabled:opacity-30">
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Detail drawer */}
      {selected && (
        <StoreDrawer
          store={selected}
          onClose={() => setSelected(null)}
          onRefreshList={loadStores}
        />
      )}

      {/* Create modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create Dark Store" width="max-w-2xl">
        <CreateStoreModal onClose={() => setShowCreate(false)} onCreated={() => { loadStores(); loadStats(); }} />
      </Modal>
    </div>
  );
}
