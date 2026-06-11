import { useState, useEffect, useCallback } from 'react';
import {
  Truck, Search, Plus, RefreshCw, ChevronLeft, ChevronRight, X,
  Star, Shield, FileText, DollarSign, AlertTriangle, Edit2,
  Trash2, CheckCircle, Ban, UserCheck, Activity, Bike,
  CreditCard, TrendingUp, Gift, ShieldAlert, ChevronDown,
} from 'lucide-react';
import Badge from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import StatCard from '../components/ui/StatCard';
import Table from '../components/ui/Table';
import toast from '../lib/toast';
import partnersService from '../services/partners.service';
import storesService   from '../services/stores.service';

// ─── Constants ────────────────────────────────────────────────────────────────
const LIMIT = 20;

const CURRENT_STATUS_VARIANTS = {
  available:           'green',
  on_delivery:         'blue',
  returning_to_store:  'blue',
  on_break:            'yellow',
  offline:             'gray',
  suspended:           'orange',
  blocked:             'red',
};

const ONBOARDING_VARIANTS = {
  active:               'green',
  pending_documents:    'gray',
  documents_submitted:  'blue',
  kyc_in_review:        'blue',
  background_check:     'yellow',
  training:             'yellow',
  rejected:             'red',
};

const KYC_VARIANTS = {
  verified:              'green',
  pending:               'gray',
  submitted:             'blue',
  under_review:          'blue',
  rejected:              'red',
  re_submission_required:'orange',
  expired:               'red',
};

const BG_VARIANTS = {
  cleared:            'green',
  not_initiated:      'gray',
  in_progress:        'blue',
  failed:             'red',
  re_check_required:  'orange',
};

const KYC_DOC_TYPES = [
  'aadhaar_front','aadhaar_back','pan','driving_licence',
  'vehicle_rc','vehicle_insurance','bank_passbook','profile_photo','police_verification',
];
const KYC_DOC_LABELS = {
  aadhaar_front:      'Aadhaar Front',
  aadhaar_back:       'Aadhaar Back',
  pan:                'PAN Card',
  driving_licence:    'Driving Licence',
  vehicle_rc:         'Vehicle RC',
  vehicle_insurance:  'Vehicle Insurance',
  bank_passbook:      'Bank Passbook',
  profile_photo:      'Profile Photo',
  police_verification:'Police Verification',
};

const KYC_DOC_STATUS_VARIANTS = { pending:'gray', under_review:'blue', verified:'green', rejected:'red' };

const VEHICLE_TYPES = ['bicycle','e_bicycle','motorcycle','e_scooter','cargo_cycle'];
const VEHICLE_LABELS = { bicycle:'Bicycle', e_bicycle:'E-Bicycle', motorcycle:'Motorcycle', e_scooter:'E-Scooter', cargo_cycle:'Cargo Cycle' };

const PENALTY_TYPES = ['late_delivery','delivery_refusal','misconduct','damaged_product','fake_delivery_attempt'];
const PENALTY_LABELS = { late_delivery:'Late Delivery', delivery_refusal:'Delivery Refusal', misconduct:'Misconduct', damaged_product:'Damaged Product', fake_delivery_attempt:'Fake Delivery Attempt' };

const INCENTIVE_TYPES = ['per_delivery_bonus','weekly_target_bonus','festival_bonus','referral_bonus','custom'];
const INCENTIVE_TYPE_LABELS = { per_delivery_bonus:'Per Delivery Bonus', weekly_target_bonus:'Weekly Target Bonus', festival_bonus:'Festival Bonus', referral_bonus:'Referral Bonus', custom:'Custom' };

const EARNING_TYPES = ['delivery_earning','incentive','penalty','payout','adjustment','fuel_allowance'];

const ONBOARDING_STATUSES = ['pending_documents','documents_submitted','kyc_in_review','background_check','training','active','rejected'];
const KYC_STATUSES = ['pending','submitted','under_review','verified','rejected','re_submission_required','expired'];
const BG_STATUSES = ['not_initiated','in_progress','cleared','failed','re_check_required'];

const safeArr  = (v) => (Array.isArray(v) ? v : []);
const fmtDate  = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' }) : '—';
const fmtCur   = (n) => typeof n === 'number' ? `₹${n.toLocaleString('en-IN', { minimumFractionDigits:2, maximumFractionDigits:2 })}` : '₹0.00';
const partnerInitials = (p) => p ? `${(p.first_name||p.display_name||'?').charAt(0)}${(p.last_name||'').charAt(0)}`.toUpperCase() : '?';
const partnerName = (p) => p?.display_name || [p?.first_name, p?.last_name].filter(Boolean).join(' ') || '—';
const fmt = (s) => s ? s.replace(/_/g, ' ') : '—';

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

// ═══════════════════════════════════════════════════════════════════════════════
// MODALS
// ═══════════════════════════════════════════════════════════════════════════════

function CreatePartnerModal({ onClose, onCreated }) {
  const [form, setForm] = useState({
    first_name:'', last_name:'', phone:'', country_code:'+91', email:'', alternate_phone:'', gender:'',
    date_of_birth:'', dark_store_id:'',
    city:'', state:'', pincode:'', area:'', flat_no:'', building:'',
    em_name:'', em_phone:'', em_rel:'',
    vehicle_type:'motorcycle', vehicle_reg:'', is_electric: false,
  });
  const [saving,       setSaving]       = useState(false);
  const [stores,       setStores]       = useState([]);
  const [storesLoading,setStoresLoading]= useState(true);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  useEffect(() => {
    storesService.list({ limit: 200, sort_by: 'name', sort_order: 'asc' })
      .then(res => setStores(safeArr(res?.data?.stores)))
      .catch(() => {})
      .finally(() => setStoresLoading(false));
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.first_name || !form.last_name || !form.phone) { toast.error('First name, last name, phone required'); return; }
    setSaving(true);
    try {
      const body = {
        first_name:   form.first_name.trim(),
        last_name:    form.last_name.trim(),
        phone:        form.phone.trim(),
        country_code: form.country_code,
        email:        form.email || undefined,
        alternate_phone: form.alternate_phone || undefined,
        gender:       form.gender || undefined,
        date_of_birth:form.date_of_birth || undefined,
        dark_store_id:form.dark_store_id || undefined,
        current_address: (form.city && form.state && form.pincode) ? {
          city: form.city, state: form.state, pincode: form.pincode,
          area: form.area || undefined, flat_no: form.flat_no || undefined, building: form.building || undefined,
        } : undefined,
        emergency_contact: (form.em_name && form.em_phone) ? {
          name: form.em_name, phone: form.em_phone, relationship: form.em_rel || undefined,
        } : undefined,
        vehicle: form.vehicle_type ? {
          vehicle_type: form.vehicle_type, is_electric: form.is_electric,
          registration_number: form.vehicle_reg || undefined,
        } : undefined,
      };
      await partnersService.create(body);
      toast.success('Partner created');
      onCreated();
      onClose();
    } catch (err) {
      toast.error(err.message || 'Failed to create partner');
    } finally { setSaving(false); }
  };

  return (
    <form onSubmit={submit} className="space-y-5 max-h-[72vh] overflow-y-auto pr-1">
      <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Personal Info</div>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="First Name" required><input className={inp} value={form.first_name} onChange={e => set('first_name', e.target.value)} /></FormField>
        <FormField label="Last Name" required><input className={inp} value={form.last_name} onChange={e => set('last_name', e.target.value)} /></FormField>
        <FormField label="Phone" required><input className={inp} value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+91..." /></FormField>
        <FormField label="Email"><input className={inp} type="email" value={form.email} onChange={e => set('email', e.target.value)} /></FormField>
        <FormField label="Alt. Phone"><input className={inp} value={form.alternate_phone} onChange={e => set('alternate_phone', e.target.value)} /></FormField>
        <FormField label="Gender">
          <select className={sel} value={form.gender} onChange={e => set('gender', e.target.value)}>
            <option value="">Select</option>
            <option value="M">Male</option>
            <option value="F">Female</option>
            <option value="Other">Other</option>
          </select>
        </FormField>
        <FormField label="Date of Birth"><input className={inp} type="date" value={form.date_of_birth} onChange={e => set('date_of_birth', e.target.value)} /></FormField>
        <div className="col-span-2">
          <FormField label="Assign Dark Store">
            <select
              className={sel}
              value={form.dark_store_id}
              onChange={e => set('dark_store_id', e.target.value)}
              disabled={storesLoading}
            >
              <option value="">{storesLoading ? 'Loading stores…' : '— Select a store (optional) —'}</option>
              {stores.map(s => (
                <option key={s._id} value={s._id}>
                  {s.name}{s.city ? ` — ${s.city}` : ''}{s.store_code ? ` (${s.store_code})` : ''}
                </option>
              ))}
            </select>
          </FormField>
        </div>
      </div>

      <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider pt-1">Address</div>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="City" required><input className={inp} value={form.city} onChange={e => set('city', e.target.value)} /></FormField>
        <FormField label="State" required><input className={inp} value={form.state} onChange={e => set('state', e.target.value)} /></FormField>
        <FormField label="Pincode" required><input className={inp} value={form.pincode} onChange={e => set('pincode', e.target.value)} maxLength={6} /></FormField>
        <FormField label="Area"><input className={inp} value={form.area} onChange={e => set('area', e.target.value)} /></FormField>
        <FormField label="Flat / House No."><input className={inp} value={form.flat_no} onChange={e => set('flat_no', e.target.value)} /></FormField>
        <FormField label="Building"><input className={inp} value={form.building} onChange={e => set('building', e.target.value)} /></FormField>
      </div>

      <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider pt-1">Emergency Contact</div>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Name"><input className={inp} value={form.em_name} onChange={e => set('em_name', e.target.value)} /></FormField>
        <FormField label="Phone"><input className={inp} value={form.em_phone} onChange={e => set('em_phone', e.target.value)} /></FormField>
        <div className="col-span-2">
          <FormField label="Relationship"><input className={inp} value={form.em_rel} onChange={e => set('em_rel', e.target.value)} placeholder="e.g. Father" /></FormField>
        </div>
      </div>

      <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider pt-1">Vehicle</div>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Vehicle Type">
          <select className={sel} value={form.vehicle_type} onChange={e => set('vehicle_type', e.target.value)}>
            {VEHICLE_TYPES.map(t => <option key={t} value={t}>{VEHICLE_LABELS[t]}</option>)}
          </select>
        </FormField>
        <FormField label="Registration No."><input className={inp} value={form.vehicle_reg} onChange={e => set('vehicle_reg', e.target.value)} /></FormField>
        <div className="col-span-2 flex items-center gap-2">
          <input type="checkbox" id="is_electric" checked={form.is_electric} onChange={e => set('is_electric', e.target.checked)} className="rounded" />
          <label htmlFor="is_electric" className="text-sm text-gray-600">Electric vehicle</label>
        </div>
      </div>

      <div className="flex gap-2 pt-2 border-t sticky bottom-0 bg-white pb-1">
        <button type="submit" disabled={saving} className="flex-1 py-2.5 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600 disabled:opacity-50">
          {saving ? 'Creating…' : 'Create Partner'}
        </button>
        <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-gray-200 text-sm text-gray-600 rounded-lg hover:bg-gray-50">Cancel</button>
      </div>
    </form>
  );
}

function EditPartnerModal({ partner, onClose, onSaved }) {
  const [form, setForm] = useState({
    first_name:    partner.first_name    ?? '',
    last_name:     partner.last_name     ?? '',
    display_name:  partner.display_name  ?? '',
    email:         partner.email         ?? '',
    alternate_phone:partner.alternate_phone ?? '',
    date_of_birth: partner.date_of_birth ?? '',
    gender:        partner.gender        ?? '',
    profile_photo_url: partner.profile_photo_url ?? '',
    training_completed: partner.training_completed ?? false,
    training_completed_at: partner.training_completed_at ? partner.training_completed_at.slice(0,10) : '',
  });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const body = {};
      if (form.first_name)    body.first_name    = form.first_name.trim();
      if (form.last_name)     body.last_name     = form.last_name.trim();
      if (form.display_name)  body.display_name  = form.display_name.trim();
      if (form.email)         body.email         = form.email.trim();
      if (form.alternate_phone) body.alternate_phone = form.alternate_phone.trim();
      if (form.date_of_birth) body.date_of_birth = form.date_of_birth;
      if (form.gender)        body.gender        = form.gender;
      if (form.profile_photo_url) body.profile_photo_url = form.profile_photo_url.trim();
      body.training_completed    = form.training_completed;
      if (form.training_completed_at) body.training_completed_at = new Date(form.training_completed_at);
      await partnersService.update(partner._id, body);
      toast.success('Partner updated');
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err.message || 'Update failed');
    } finally { setSaving(false); }
  };

  return (
    <form onSubmit={submit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
      <div className="grid grid-cols-2 gap-3">
        <FormField label="First Name"><input className={inp} value={form.first_name} onChange={e => set('first_name', e.target.value)} /></FormField>
        <FormField label="Last Name"><input className={inp} value={form.last_name} onChange={e => set('last_name', e.target.value)} /></FormField>
        <div className="col-span-2">
          <FormField label="Display Name"><input className={inp} value={form.display_name} onChange={e => set('display_name', e.target.value)} /></FormField>
        </div>
        <FormField label="Email"><input className={inp} type="email" value={form.email} onChange={e => set('email', e.target.value)} /></FormField>
        <FormField label="Alt. Phone"><input className={inp} value={form.alternate_phone} onChange={e => set('alternate_phone', e.target.value)} /></FormField>
        <FormField label="Date of Birth"><input className={inp} type="date" value={form.date_of_birth} onChange={e => set('date_of_birth', e.target.value)} /></FormField>
        <FormField label="Gender">
          <select className={sel} value={form.gender} onChange={e => set('gender', e.target.value)}>
            <option value="">Select</option>
            <option value="M">Male</option>
            <option value="F">Female</option>
            <option value="Other">Other</option>
          </select>
        </FormField>
        <div className="col-span-2">
          <FormField label="Profile Photo URL"><input className={inp} value={form.profile_photo_url} onChange={e => set('profile_photo_url', e.target.value)} placeholder="https://..." /></FormField>
        </div>
        <div className="col-span-2 flex items-center gap-2">
          <input type="checkbox" id="tc" checked={form.training_completed} onChange={e => set('training_completed', e.target.checked)} className="rounded" />
          <label htmlFor="tc" className="text-sm text-gray-600">Training Completed</label>
        </div>
        {form.training_completed && (
          <div className="col-span-2">
            <FormField label="Training Completed At"><input className={inp} type="date" value={form.training_completed_at} onChange={e => set('training_completed_at', e.target.value)} /></FormField>
          </div>
        )}
      </div>
      <div className="flex gap-2 pt-2 border-t">
        <button type="submit" disabled={saving} className="flex-1 py-2.5 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600 disabled:opacity-50">{saving ? 'Saving…' : 'Save'}</button>
        <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-gray-200 text-sm text-gray-600 rounded-lg hover:bg-gray-50">Cancel</button>
      </div>
    </form>
  );
}

function StatusModal({ partner, onClose, onSaved }) {
  const isBlocked = partner.is_blocked;
  const isSuspended = partner.current_status === 'suspended';
  const [action, setAction] = useState(isBlocked ? 'unblock' : isSuspended ? 'activate' : 'block');
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);

  const needsReason = ['block','suspend'].includes(action);

  const submit = async (e) => {
    e.preventDefault();
    if (needsReason && !reason.trim()) { toast.error('Reason is required'); return; }
    setSaving(true);
    try {
      await partnersService.updateStatus(partner._id, { action, reason: reason.trim() || undefined });
      toast.success(`Partner ${action}ed`);
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err.message || 'Failed');
    } finally { setSaving(false); }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <FormField label="Action">
        <div className="grid grid-cols-2 gap-2">
          {[['block','Block'],['unblock','Unblock'],['suspend','Suspend'],['activate','Activate']].map(([a, l]) => (
            <button key={a} type="button" onClick={() => setAction(a)}
              className={`py-2 text-sm font-medium rounded-lg border transition-colors ${action === a ? 'bg-orange-500 text-white border-orange-500' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
              {l}
            </button>
          ))}
        </div>
      </FormField>
      {needsReason && (
        <FormField label="Reason" required>
          <textarea className={`${inp} resize-none`} rows={3} value={reason} onChange={e => setReason(e.target.value)} placeholder="Reason for this action" />
        </FormField>
      )}
      <div className="flex gap-2 pt-1">
        <button type="submit" disabled={saving} className={`flex-1 py-2.5 text-white text-sm font-medium rounded-lg disabled:opacity-50 ${['block','suspend'].includes(action) ? 'bg-red-500 hover:bg-red-600' : 'bg-orange-500 hover:bg-orange-600'}`}>
          {saving ? 'Saving…' : `Confirm ${action.charAt(0).toUpperCase() + action.slice(1)}`}
        </button>
        <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-gray-200 text-sm text-gray-600 rounded-lg hover:bg-gray-50">Cancel</button>
      </div>
    </form>
  );
}

function ReassignStoreModal({ partner, onClose, onSaved }) {
  const [storeId, setStoreId] = useState(partner.dark_store_id?._id || partner.dark_store_id || '');
  const [zone, setZone] = useState(partner.assigned_zone || '');
  const [region, setRegion] = useState(partner.assigned_region || '');
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!storeId.trim()) { toast.error('Dark Store ID required'); return; }
    setSaving(true);
    try {
      await partnersService.reassignStore(partner._id, {
        dark_store_id: storeId.trim(),
        assigned_zone: zone || undefined,
        assigned_region: region || undefined,
      });
      toast.success('Partner reassigned');
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err.message || 'Failed');
    } finally { setSaving(false); }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      {partner.dark_store_name && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
          Current: <strong>{partner.dark_store_name}</strong>
        </div>
      )}
      <FormField label="New Dark Store ID" required>
        <input className={inp} value={storeId} onChange={e => setStoreId(e.target.value)} placeholder="MongoDB ObjectId" />
      </FormField>
      <FormField label="Assigned Zone"><input className={inp} value={zone} onChange={e => setZone(e.target.value)} placeholder="e.g. Zone_A_North" /></FormField>
      <FormField label="Assigned Region"><input className={inp} value={region} onChange={e => setRegion(e.target.value)} placeholder="e.g. Delhi NCR" /></FormField>
      <div className="flex gap-2 pt-1">
        <button type="submit" disabled={saving} className="flex-1 py-2.5 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600 disabled:opacity-50">{saving ? 'Saving…' : 'Reassign'}</button>
        <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-gray-200 text-sm text-gray-600 rounded-lg hover:bg-gray-50">Cancel</button>
      </div>
    </form>
  );
}

function KycStatusModal({ partner, onClose, onSaved }) {
  const [status, setStatus] = useState(partner.kyc_status || 'pending');
  const [expiry, setExpiry] = useState(partner.kyc_expiry_date || '');
  const [renewal, setRenewal] = useState(partner.kyc_next_renewal_due || '');
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await partnersService.updateKyc(partner._id, {
        kyc_status: status,
        kyc_expiry_date: expiry || undefined,
        kyc_next_renewal_due: renewal || undefined,
      });
      toast.success('KYC status updated');
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err.message || 'Failed');
    } finally { setSaving(false); }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <FormField label="KYC Status">
        <select className={sel} value={status} onChange={e => setStatus(e.target.value)}>
          {KYC_STATUSES.map(s => <option key={s} value={s}>{fmt(s)}</option>)}
        </select>
      </FormField>
      {status === 'verified' && (
        <>
          <FormField label="KYC Expiry Date"><input className={inp} type="date" value={expiry} onChange={e => setExpiry(e.target.value)} /></FormField>
          <FormField label="Next Renewal Due"><input className={inp} type="date" value={renewal} onChange={e => setRenewal(e.target.value)} /></FormField>
        </>
      )}
      <div className="flex gap-2 pt-1">
        <button type="submit" disabled={saving} className="flex-1 py-2.5 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600 disabled:opacity-50">{saving ? 'Saving…' : 'Update KYC'}</button>
        <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-gray-200 text-sm text-gray-600 rounded-lg hover:bg-gray-50">Cancel</button>
      </div>
    </form>
  );
}

function BgCheckModal({ partner, onClose, onSaved }) {
  const [form, setForm] = useState({
    background_check_status:    partner.background_check_status    || 'not_initiated',
    background_check_agency:    partner.background_check_agency    || '',
    background_check_reference: partner.background_check_reference || '',
    background_check_date:      partner.background_check_date      || '',
    background_check_expiry:    partner.background_check_expiry    || '',
  });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await partnersService.updateBgCheck(partner._id, {
        background_check_status:    form.background_check_status,
        background_check_agency:    form.background_check_agency    || undefined,
        background_check_reference: form.background_check_reference || undefined,
        background_check_date:      form.background_check_date      || undefined,
        background_check_expiry:    form.background_check_expiry    || undefined,
      });
      toast.success('Background check updated');
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err.message || 'Failed');
    } finally { setSaving(false); }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <FormField label="Status">
        <select className={sel} value={form.background_check_status} onChange={e => set('background_check_status', e.target.value)}>
          {BG_STATUSES.map(s => <option key={s} value={s}>{fmt(s)}</option>)}
        </select>
      </FormField>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Agency"><input className={inp} value={form.background_check_agency} onChange={e => set('background_check_agency', e.target.value)} /></FormField>
        <FormField label="Reference No."><input className={inp} value={form.background_check_reference} onChange={e => set('background_check_reference', e.target.value)} /></FormField>
        <FormField label="Check Date"><input className={inp} type="date" value={form.background_check_date} onChange={e => set('background_check_date', e.target.value)} /></FormField>
        <FormField label="Expiry Date"><input className={inp} type="date" value={form.background_check_expiry} onChange={e => set('background_check_expiry', e.target.value)} /></FormField>
      </div>
      <div className="flex gap-2 pt-1">
        <button type="submit" disabled={saving} className="flex-1 py-2.5 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600 disabled:opacity-50">{saving ? 'Saving…' : 'Update'}</button>
        <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-gray-200 text-sm text-gray-600 rounded-lg hover:bg-gray-50">Cancel</button>
      </div>
    </form>
  );
}

function OnboardingModal({ partner, onClose, onSaved }) {
  const [status, setStatus] = useState(partner.onboarding_status || 'pending_documents');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await partnersService.updateOnboarding(partner._id, { onboarding_status: status, notes: notes || undefined });
      toast.success('Onboarding step updated');
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err.message || 'Failed');
    } finally { setSaving(false); }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <FormField label="Onboarding Status">
        <select className={sel} value={status} onChange={e => setStatus(e.target.value)}>
          {ONBOARDING_STATUSES.map(s => <option key={s} value={s}>{fmt(s)}</option>)}
        </select>
      </FormField>
      <FormField label="Notes"><textarea className={`${inp} resize-none`} rows={3} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Optional notes" /></FormField>
      <div className="flex gap-2 pt-1">
        <button type="submit" disabled={saving} className="flex-1 py-2.5 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600 disabled:opacity-50">{saving ? 'Saving…' : 'Update Onboarding'}</button>
        <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-gray-200 text-sm text-gray-600 rounded-lg hover:bg-gray-50">Cancel</button>
      </div>
    </form>
  );
}

function VehicleModal({ partner, onClose, onSaved }) {
  const v = partner.vehicle || {};
  const [form, setForm] = useState({
    vehicle_type:        v.vehicle_type        || 'motorcycle',
    is_electric:         v.is_electric         || false,
    make:                v.make                || '',
    model:               v.model               || '',
    color:               v.color               || '',
    registration_number: v.registration_number || '',
    insurance_number:    v.insurance_number    || '',
    insurance_expiry:    v.insurance_expiry    || '',
    rc_number:           v.rc_number           || '',
    rc_expiry:           v.rc_expiry           || '',
    is_verified:         v.is_verified         || false,
    is_active:           v.is_active           ?? true,
  });
  const [saving, setSaving] = useState(false);
  const set = (k, v2) => setForm(f => ({ ...f, [k]: v2 }));

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const body = Object.fromEntries(Object.entries(form).filter(([, v2]) => v2 !== ''));
      await partnersService.updateVehicle(partner._id, body);
      toast.success('Vehicle updated');
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err.message || 'Failed');
    } finally { setSaving(false); }
  };

  return (
    <form onSubmit={submit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <FormField label="Vehicle Type">
            <select className={sel} value={form.vehicle_type} onChange={e => set('vehicle_type', e.target.value)}>
              {VEHICLE_TYPES.map(t => <option key={t} value={t}>{VEHICLE_LABELS[t]}</option>)}
            </select>
          </FormField>
        </div>
        <FormField label="Make"><input className={inp} value={form.make} onChange={e => set('make', e.target.value)} placeholder="e.g. Honda" /></FormField>
        <FormField label="Model"><input className={inp} value={form.model} onChange={e => set('model', e.target.value)} placeholder="e.g. Activa" /></FormField>
        <FormField label="Color"><input className={inp} value={form.color} onChange={e => set('color', e.target.value)} /></FormField>
        <FormField label="Reg. Number"><input className={inp} value={form.registration_number} onChange={e => set('registration_number', e.target.value)} /></FormField>
        <FormField label="Insurance No."><input className={inp} value={form.insurance_number} onChange={e => set('insurance_number', e.target.value)} /></FormField>
        <FormField label="Insurance Expiry"><input className={inp} type="date" value={form.insurance_expiry} onChange={e => set('insurance_expiry', e.target.value)} /></FormField>
        <FormField label="RC Number"><input className={inp} value={form.rc_number} onChange={e => set('rc_number', e.target.value)} /></FormField>
        <FormField label="RC Expiry"><input className={inp} type="date" value={form.rc_expiry} onChange={e => set('rc_expiry', e.target.value)} /></FormField>
        <div className="col-span-2 flex gap-4">
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input type="checkbox" checked={form.is_electric} onChange={e => set('is_electric', e.target.checked)} /> Electric
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input type="checkbox" checked={form.is_verified} onChange={e => set('is_verified', e.target.checked)} /> Verified
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input type="checkbox" checked={form.is_active} onChange={e => set('is_active', e.target.checked)} /> Active
          </label>
        </div>
      </div>
      <div className="flex gap-2 pt-2 border-t">
        <button type="submit" disabled={saving} className="flex-1 py-2.5 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600 disabled:opacity-50">{saving ? 'Saving…' : 'Save Vehicle'}</button>
        <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-gray-200 text-sm text-gray-600 rounded-lg hover:bg-gray-50">Cancel</button>
      </div>
    </form>
  );
}

function BankModal({ partner, onClose, onSaved }) {
  const b = partner.bank_account || {};
  const [form, setForm] = useState({
    account_holder_name:   b.account_holder_name   || '',
    bank_name:             b.bank_name             || '',
    account_number_masked: b.account_number_masked || '',
    ifsc_code:             b.ifsc_code             || '',
    account_type:          b.account_type          || 'savings',
    upi_id:                b.upi_id                || '',
    is_verified:           b.is_verified           || false,
  });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await partnersService.updateBankAccount(partner._id, form);
      toast.success('Bank account updated');
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
          <FormField label="Account Holder Name"><input className={inp} value={form.account_holder_name} onChange={e => set('account_holder_name', e.target.value)} /></FormField>
        </div>
        <FormField label="Bank Name"><input className={inp} value={form.bank_name} onChange={e => set('bank_name', e.target.value)} /></FormField>
        <FormField label="Account No. (masked)"><input className={inp} value={form.account_number_masked} onChange={e => set('account_number_masked', e.target.value)} placeholder="XXXX1234" /></FormField>
        <FormField label="IFSC Code"><input className={inp} value={form.ifsc_code} onChange={e => set('ifsc_code', e.target.value)} /></FormField>
        <FormField label="Account Type">
          <select className={sel} value={form.account_type} onChange={e => set('account_type', e.target.value)}>
            <option value="savings">Savings</option>
            <option value="current">Current</option>
          </select>
        </FormField>
        <div className="col-span-2">
          <FormField label="UPI ID"><input className={inp} value={form.upi_id} onChange={e => set('upi_id', e.target.value)} placeholder="user@bank" /></FormField>
        </div>
        <div className="col-span-2 flex items-center gap-2">
          <input type="checkbox" id="bv" checked={form.is_verified} onChange={e => set('is_verified', e.target.checked)} className="rounded" />
          <label htmlFor="bv" className="text-sm text-gray-600">Account Verified</label>
        </div>
      </div>
      <div className="flex gap-2 pt-2 border-t">
        <button type="submit" disabled={saving} className="flex-1 py-2.5 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600 disabled:opacity-50">{saving ? 'Saving…' : 'Save'}</button>
        <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-gray-200 text-sm text-gray-600 rounded-lg hover:bg-gray-50">Cancel</button>
      </div>
    </form>
  );
}

function CommissionModal({ partner, onClose, onSaved }) {
  const c = partner.commission_config || {};
  const [form, setForm] = useState({
    base_per_delivery_inr:        c.base_per_delivery_inr        ?? 30,
    per_km_incentive_inr:         c.per_km_incentive_inr         ?? 3,
    surge_multiplier:             c.surge_multiplier             ?? 1.5,
    peak_hour_bonus_inr:          c.peak_hour_bonus_inr          ?? 10,
    monthly_target_deliveries:    c.monthly_target_deliveries    ?? 600,
    target_achievement_bonus_inr: c.target_achievement_bonus_inr ?? 2000,
    fuel_allowance_daily_inr:     c.fuel_allowance_daily_inr     ?? 0,
    platform_fee_pct:             c.platform_fee_pct             ?? 0,
    payout_frequency:             c.payout_frequency             || 'weekly',
    payout_day:                   c.payout_day                   || 'tuesday',
  });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await partnersService.updateCommission(partner._id, {
        ...form,
        base_per_delivery_inr:        parseFloat(form.base_per_delivery_inr),
        per_km_incentive_inr:         parseFloat(form.per_km_incentive_inr),
        surge_multiplier:             parseFloat(form.surge_multiplier),
        peak_hour_bonus_inr:          parseFloat(form.peak_hour_bonus_inr),
        monthly_target_deliveries:    parseInt(form.monthly_target_deliveries),
        target_achievement_bonus_inr: parseFloat(form.target_achievement_bonus_inr),
        fuel_allowance_daily_inr:     parseFloat(form.fuel_allowance_daily_inr),
        platform_fee_pct:             parseFloat(form.platform_fee_pct),
      });
      toast.success('Commission config updated');
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
          ['base_per_delivery_inr','Base per Delivery (₹)'],
          ['per_km_incentive_inr','Per km Incentive (₹)'],
          ['surge_multiplier','Surge Multiplier'],
          ['peak_hour_bonus_inr','Peak Hour Bonus (₹)'],
          ['monthly_target_deliveries','Monthly Target (deliveries)'],
          ['target_achievement_bonus_inr','Target Bonus (₹)'],
          ['fuel_allowance_daily_inr','Fuel Allowance/day (₹)'],
          ['platform_fee_pct','Platform Fee (%)'],
        ].map(([k, l]) => (
          <FormField key={k} label={l}>
            <input className={inp} type="number" step="0.01" value={form[k]} onChange={e => set(k, e.target.value)} />
          </FormField>
        ))}
        <FormField label="Payout Frequency">
          <select className={sel} value={form.payout_frequency} onChange={e => set('payout_frequency', e.target.value)}>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="biweekly">Bi-weekly</option>
          </select>
        </FormField>
        <FormField label="Payout Day"><input className={inp} value={form.payout_day} onChange={e => set('payout_day', e.target.value)} placeholder="e.g. tuesday" /></FormField>
      </div>
      <div className="flex gap-2 pt-2 border-t">
        <button type="submit" disabled={saving} className="flex-1 py-2.5 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600 disabled:opacity-50">{saving ? 'Saving…' : 'Save Commission'}</button>
        <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-gray-200 text-sm text-gray-600 rounded-lg hover:bg-gray-50">Cancel</button>
      </div>
    </form>
  );
}

function AddKycDocModal({ partner, doc, onClose, onSaved }) {
  const isEdit = !!doc;
  const [form, setForm] = useState({
    document_type: doc?.document_type || 'aadhaar_front',
    document_url:  doc?.document_url  || '',
    expiry_date:   doc?.expiry_date   || '',
    status:        doc?.status        || 'under_review',
    rejection_reason: doc?.rejection_reason || '',
  });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    if (!isEdit && (!form.document_type || !form.document_url)) { toast.error('Type and URL required'); return; }
    setSaving(true);
    try {
      if (isEdit) {
        await partnersService.updateKycDoc(partner._id, doc._id, {
          status: form.status,
          rejection_reason: form.rejection_reason || undefined,
          expiry_date: form.expiry_date || undefined,
        });
        toast.success('Document updated');
      } else {
        await partnersService.addKycDoc(partner._id, {
          document_type: form.document_type,
          document_url:  form.document_url.trim(),
          expiry_date:   form.expiry_date || undefined,
        });
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
      {!isEdit && (
        <FormField label="Document Type" required>
          <select className={sel} value={form.document_type} onChange={e => set('document_type', e.target.value)}>
            {KYC_DOC_TYPES.map(t => <option key={t} value={t}>{KYC_DOC_LABELS[t]}</option>)}
          </select>
        </FormField>
      )}
      {!isEdit && (
        <FormField label="Document URL" required>
          <input className={inp} type="url" value={form.document_url} onChange={e => set('document_url', e.target.value)} placeholder="https://..." />
        </FormField>
      )}
      {isEdit && (
        <FormField label="Status">
          <select className={sel} value={form.status} onChange={e => set('status', e.target.value)}>
            {['pending','under_review','verified','rejected'].map(s => <option key={s} value={s}>{fmt(s)}</option>)}
          </select>
        </FormField>
      )}
      {isEdit && form.status === 'rejected' && (
        <FormField label="Rejection Reason">
          <textarea className={`${inp} resize-none`} rows={2} value={form.rejection_reason} onChange={e => set('rejection_reason', e.target.value)} />
        </FormField>
      )}
      <FormField label="Expiry Date">
        <input className={inp} type="date" value={form.expiry_date} onChange={e => set('expiry_date', e.target.value)} />
      </FormField>
      <div className="flex gap-2 pt-1">
        <button type="submit" disabled={saving} className="flex-1 py-2.5 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600 disabled:opacity-50">{saving ? 'Saving…' : isEdit ? 'Update' : 'Add Document'}</button>
        <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-gray-200 text-sm text-gray-600 rounded-lg hover:bg-gray-50">Cancel</button>
      </div>
    </form>
  );
}

function AddPenaltyModal({ partner, onClose, onSaved }) {
  const [form, setForm] = useState({ penalty_type:'late_delivery', amount:'', reason:'', reference_id:'' });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.reason || !form.amount) { toast.error('Amount and reason required'); return; }
    setSaving(true);
    try {
      await partnersService.addPenalty(partner._id, {
        penalty_type: form.penalty_type,
        amount: parseFloat(form.amount),
        reason: form.reason.trim(),
        reference_id: form.reference_id || undefined,
      });
      toast.success('Penalty added');
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err.message || 'Failed');
    } finally { setSaving(false); }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <FormField label="Penalty Type">
        <select className={sel} value={form.penalty_type} onChange={e => set('penalty_type', e.target.value)}>
          {PENALTY_TYPES.map(t => <option key={t} value={t}>{PENALTY_LABELS[t]}</option>)}
        </select>
      </FormField>
      <FormField label="Amount (₹)" required>
        <input className={inp} type="number" step="0.01" min="0" value={form.amount} onChange={e => set('amount', e.target.value)} />
      </FormField>
      <FormField label="Reason" required>
        <textarea className={`${inp} resize-none`} rows={3} value={form.reason} onChange={e => set('reason', e.target.value)} />
      </FormField>
      <FormField label="Reference ID">
        <input className={inp} value={form.reference_id} onChange={e => set('reference_id', e.target.value)} placeholder="Order ID etc." />
      </FormField>
      <div className="flex gap-2 pt-1">
        <button type="submit" disabled={saving} className="flex-1 py-2.5 bg-red-500 text-white text-sm font-medium rounded-lg hover:bg-red-600 disabled:opacity-50">{saving ? 'Saving…' : 'Add Penalty'}</button>
        <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-gray-200 text-sm text-gray-600 rounded-lg hover:bg-gray-50">Cancel</button>
      </div>
    </form>
  );
}

function AddIncentiveModal({ partner, onClose, onSaved }) {
  const [form, setForm] = useState({ name:'', type:'per_delivery_bonus', amount_per_delivery:'', flat_amount:'', valid_from:'', valid_to:'' });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.type || !form.valid_from || !form.valid_to) { toast.error('Name, type, valid dates required'); return; }
    setSaving(true);
    try {
      await partnersService.addIncentive(partner._id, {
        name: form.name.trim(),
        type: form.type,
        amount_per_delivery: parseFloat(form.amount_per_delivery) || 0,
        flat_amount:         parseFloat(form.flat_amount)         || 0,
        valid_from: form.valid_from,
        valid_to:   form.valid_to,
      });
      toast.success('Incentive added');
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err.message || 'Failed');
    } finally { setSaving(false); }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <FormField label="Incentive Name" required>
        <input className={inp} value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Diwali Bonus" />
      </FormField>
      <FormField label="Type">
        <select className={sel} value={form.type} onChange={e => set('type', e.target.value)}>
          {INCENTIVE_TYPES.map(t => <option key={t} value={t}>{INCENTIVE_TYPE_LABELS[t]}</option>)}
        </select>
      </FormField>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Per Delivery (₹)"><input className={inp} type="number" step="0.01" min="0" value={form.amount_per_delivery} onChange={e => set('amount_per_delivery', e.target.value)} /></FormField>
        <FormField label="Flat Amount (₹)"><input className={inp} type="number" step="0.01" min="0" value={form.flat_amount} onChange={e => set('flat_amount', e.target.value)} /></FormField>
        <FormField label="Valid From" required><input className={inp} type="date" value={form.valid_from} onChange={e => set('valid_from', e.target.value)} /></FormField>
        <FormField label="Valid To" required><input className={inp} type="date" value={form.valid_to} onChange={e => set('valid_to', e.target.value)} /></FormField>
      </div>
      <div className="flex gap-2 pt-1">
        <button type="submit" disabled={saving} className="flex-1 py-2.5 bg-green-500 text-white text-sm font-medium rounded-lg hover:bg-green-600 disabled:opacity-50">{saving ? 'Saving…' : 'Add Incentive'}</button>
        <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-gray-200 text-sm text-gray-600 rounded-lg hover:bg-gray-50">Cancel</button>
      </div>
    </form>
  );
}

function PayoutModal({ partner, pendingAmount, onClose, onSaved }) {
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) { toast.error('Enter a valid amount'); return; }
    if (amt > pendingAmount) { toast.error(`Exceeds pending balance ${fmtCur(pendingAmount)}`); return; }
    setSaving(true);
    try {
      const res = await partnersService.triggerPayout(partner._id, { amount: amt, notes: notes.trim() || undefined });
      toast.success(`Payout of ${fmtCur(amt)} processed`);
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err.message || 'Payout failed');
    } finally { setSaving(false); }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
        <p className="text-xs text-green-600 mb-0.5">Pending Balance</p>
        <p className="text-xl font-bold text-green-700">{fmtCur(pendingAmount)}</p>
      </div>
      <FormField label="Payout Amount (₹)" required>
        <input className={inp} type="number" step="0.01" min="0.01" value={amount} onChange={e => setAmount(e.target.value)} placeholder={`Max ${fmtCur(pendingAmount)}`} />
      </FormField>
      <FormField label="Notes">
        <input className={inp} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Optional note" />
      </FormField>
      <div className="flex gap-2 pt-1">
        <button type="submit" disabled={saving} className="flex-1 py-2.5 bg-green-500 text-white text-sm font-medium rounded-lg hover:bg-green-600 disabled:opacity-50">{saving ? 'Processing…' : 'Process Payout'}</button>
        <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-gray-200 text-sm text-gray-600 rounded-lg hover:bg-gray-50">Cancel</button>
      </div>
    </form>
  );
}

function AddEarningModal({ partner, onClose, onSaved }) {
  const [form, setForm] = useState({ type:'adjustment', amount:'', description:'', reference_id:'' });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.type || !form.amount || !form.description) { toast.error('Type, amount, description required'); return; }
    setSaving(true);
    try {
      await partnersService.addEarningRecord(partner._id, {
        type: form.type,
        amount: parseFloat(form.amount),
        description: form.description.trim(),
        reference_id: form.reference_id || undefined,
      });
      toast.success('Earning record added');
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err.message || 'Failed');
    } finally { setSaving(false); }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <FormField label="Type">
        <select className={sel} value={form.type} onChange={e => set('type', e.target.value)}>
          {EARNING_TYPES.map(t => <option key={t} value={t}>{fmt(t)}</option>)}
        </select>
      </FormField>
      <FormField label="Amount (₹ — negative for debit)" required>
        <input className={inp} type="number" step="0.01" value={form.amount} onChange={e => set('amount', e.target.value)} />
      </FormField>
      <FormField label="Description" required>
        <textarea className={`${inp} resize-none`} rows={2} value={form.description} onChange={e => set('description', e.target.value)} />
      </FormField>
      <FormField label="Reference ID">
        <input className={inp} value={form.reference_id} onChange={e => set('reference_id', e.target.value)} />
      </FormField>
      <div className="flex gap-2 pt-1">
        <button type="submit" disabled={saving} className="flex-1 py-2.5 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600 disabled:opacity-50">{saving ? 'Saving…' : 'Add Record'}</button>
        <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-gray-200 text-sm text-gray-600 rounded-lg hover:bg-gray-50">Cancel</button>
      </div>
    </form>
  );
}

function DeletePartnerModal({ partner, onClose, onDeleted }) {
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await partnersService.deletePartner(partner._id, { reason: reason.trim() || 'Deleted by admin' });
      toast.success('Partner deleted');
      onDeleted();
      onClose();
    } catch (err) {
      toast.error(err.message || 'Failed');
    } finally { setSaving(false); }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
        <AlertTriangle size={18} className="text-red-500 shrink-0 mt-0.5" />
        <p className="text-sm text-red-700">This permanently soft-deletes <strong>{partnerName(partner)}</strong> and force-logs out all sessions. Cannot be undone. Partners on an active delivery cannot be deleted.</p>
      </div>
      <FormField label="Reason">
        <input className={inp} value={reason} onChange={e => setReason(e.target.value)} placeholder="Reason for deletion" />
      </FormField>
      <div className="flex gap-2 pt-1">
        <button type="submit" disabled={saving} className="flex-1 py-2.5 bg-red-500 text-white text-sm font-medium rounded-lg hover:bg-red-600 disabled:opacity-50">{saving ? 'Deleting…' : 'Delete Partner'}</button>
        <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-gray-200 text-sm text-gray-600 rounded-lg hover:bg-gray-50">Cancel</button>
      </div>
    </form>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// DRAWER TABS
// ═══════════════════════════════════════════════════════════════════════════════

function ProfileTab({ partner, onEdit, onStatus, onReassign }) {
  const addr = partner.current_address;
  const em   = partner.emergency_contact;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <button onClick={onEdit}     className="px-3 py-1.5 text-xs font-medium border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors">Edit Profile</button>
        <button onClick={onStatus}   className="px-3 py-1.5 text-xs font-medium border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors">Block / Suspend</button>
        <button onClick={onReassign} className="px-3 py-1.5 text-xs font-medium border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors">Reassign Store</button>
      </div>

      <Section title="Personal">
        <DetailRow label="Partner Code"    value={<span className="font-mono text-orange-600">{partner.partner_code}</span>} />
        <DetailRow label="Display ID"      value={partner.partner_display_id} />
        <DetailRow label="Phone"           value={partner.phone} />
        <DetailRow label="Alt. Phone"      value={partner.alternate_phone} />
        <DetailRow label="Email"           value={partner.email} />
        <DetailRow label="Gender"          value={partner.gender} />
        <DetailRow label="Date of Birth"   value={fmtDate(partner.date_of_birth)} />
        <DetailRow label="Joined"          value={fmtDate(partner.created_at)} />
        <DetailRow label="Last Active"     value={fmtDate(partner.last_active_at)} />
      </Section>

      <Section title="Assigned Store">
        <DetailRow label="Store"           value={partner.dark_store_name || 'Not assigned'} />
        <DetailRow label="Zone"            value={partner.assigned_zone} />
        <DetailRow label="Region"          value={partner.assigned_region} />
      </Section>

      <Section title="Training">
        <DetailRow label="Training Done"   value={partner.training_completed ? 'Yes' : 'No'} />
        <DetailRow label="Completed At"    value={fmtDate(partner.training_completed_at)} />
      </Section>

      {addr && (
        <Section title="Address">
          <DetailRow label="City"     value={addr.city} />
          <DetailRow label="State"    value={addr.state} />
          <DetailRow label="Pincode"  value={addr.pincode} />
          <DetailRow label="Area"     value={addr.area} />
          <DetailRow label="Building" value={[addr.flat_no, addr.building].filter(Boolean).join(', ')} />
        </Section>
      )}

      {em && (
        <Section title="Emergency Contact">
          <DetailRow label="Name"         value={em.name} />
          <DetailRow label="Phone"        value={em.phone} />
          <DetailRow label="Relationship" value={em.relationship} />
        </Section>
      )}

      {partner.is_blocked && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-xs font-semibold text-red-600">BLOCKED</p>
          <p className="text-sm text-red-600 mt-0.5">{partner.block_reason}</p>
          <p className="text-xs text-red-400 mt-0.5">Blocked {fmtDate(partner.blocked_at)}</p>
        </div>
      )}
    </div>
  );
}

function VehicleBankTab({ partner, onVehicle, onBank, onCommission }) {
  const v = partner.vehicle || {};
  const b = partner.bank_account || {};
  const c = partner.commission_config || {};

  return (
    <div className="space-y-4">
      <Section title="Vehicle">
        <div className="flex items-center justify-between py-2.5">
          <span className="text-xs text-gray-500">Details</span>
          <button onClick={onVehicle} className="text-xs text-orange-500 hover:text-orange-600 font-medium">Edit</button>
        </div>
        <DetailRow label="Type"          value={VEHICLE_LABELS[v.vehicle_type] ?? v.vehicle_type} />
        <DetailRow label="Electric"      value={v.is_electric ? 'Yes' : 'No'} />
        <DetailRow label="Make / Model"  value={[v.make, v.model].filter(Boolean).join(' ')} />
        <DetailRow label="Color"         value={v.color} />
        <DetailRow label="Reg. Number"   value={v.registration_number} />
        <DetailRow label="Insurance No." value={v.insurance_number} />
        <DetailRow label="Ins. Expiry"   value={fmtDate(v.insurance_expiry)} />
        <DetailRow label="RC Number"     value={v.rc_number} />
        <DetailRow label="RC Expiry"     value={fmtDate(v.rc_expiry)} />
        <DetailRow label="Verified"      value={v.is_verified ? '✓ Yes' : 'No'} />
      </Section>

      <Section title="Bank Account">
        <div className="flex items-center justify-between py-2.5">
          <span className="text-xs text-gray-500">Details</span>
          <button onClick={onBank} className="text-xs text-orange-500 hover:text-orange-600 font-medium">Edit</button>
        </div>
        <DetailRow label="Holder"        value={b.account_holder_name} />
        <DetailRow label="Bank"          value={b.bank_name} />
        <DetailRow label="Account No."   value={b.account_number_masked} />
        <DetailRow label="IFSC"          value={b.ifsc_code} />
        <DetailRow label="Type"          value={b.account_type} />
        <DetailRow label="UPI ID"        value={b.upi_id} />
        <DetailRow label="Verified"      value={b.is_verified ? '✓ Yes' : 'No'} />
      </Section>

      <Section title="Commission Config">
        <div className="flex items-center justify-between py-2.5">
          <span className="text-xs text-gray-500">Configuration</span>
          <button onClick={onCommission} className="text-xs text-orange-500 hover:text-orange-600 font-medium">Edit</button>
        </div>
        <DetailRow label="Base/Delivery"     value={c.base_per_delivery_inr  != null ? fmtCur(c.base_per_delivery_inr) : undefined} />
        <DetailRow label="Per km"            value={c.per_km_incentive_inr   != null ? fmtCur(c.per_km_incentive_inr) : undefined} />
        <DetailRow label="Surge Mult."       value={c.surge_multiplier       != null ? `${c.surge_multiplier}x` : undefined} />
        <DetailRow label="Peak Hour Bonus"   value={c.peak_hour_bonus_inr    != null ? fmtCur(c.peak_hour_bonus_inr) : undefined} />
        <DetailRow label="Monthly Target"    value={c.monthly_target_deliveries != null ? `${c.monthly_target_deliveries} deliveries` : undefined} />
        <DetailRow label="Target Bonus"      value={c.target_achievement_bonus_inr != null ? fmtCur(c.target_achievement_bonus_inr) : undefined} />
        <DetailRow label="Fuel/day"          value={c.fuel_allowance_daily_inr != null ? fmtCur(c.fuel_allowance_daily_inr) : undefined} />
        <DetailRow label="Platform Fee"      value={c.platform_fee_pct       != null ? `${c.platform_fee_pct}%` : undefined} />
        <DetailRow label="Payout Frequency"  value={c.payout_frequency} />
        <DetailRow label="Payout Day"        value={c.payout_day} />
      </Section>
    </div>
  );
}

function KycDocsTab({ partner, onUpdateKyc, onBgCheck, onOnboarding, onRefresh }) {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await partnersService.listKycDocs(partner._id);
      setDocs(safeArr(res?.data));
    } catch (err) {
      toast.error(err.message || 'Failed to load KYC docs');
    } finally { setLoading(false); }
  }, [partner._id]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (doc) => {
    if (!window.confirm(`Remove ${KYC_DOC_LABELS[doc.document_type]}?`)) return;
    setDeleting(doc._id);
    try {
      await partnersService.deleteKycDoc(partner._id, doc._id);
      toast.success('Document removed');
      load();
    } catch (err) {
      toast.error(err.message || 'Failed');
    } finally { setDeleting(null); }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <button onClick={onUpdateKyc} className="px-3 py-1.5 text-xs font-medium border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50">Update KYC Status</button>
        <button onClick={onBgCheck}   className="px-3 py-1.5 text-xs font-medium border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50">Background Check</button>
        <button onClick={onOnboarding}className="px-3 py-1.5 text-xs font-medium border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50">Onboarding Step</button>
      </div>

      <Section title="KYC">
        <DetailRow label="KYC Status"        value={<Badge variant={KYC_VARIANTS[partner.kyc_status] ?? 'gray'}>{fmt(partner.kyc_status)}</Badge>} />
        <DetailRow label="KYC Verified"      value={fmtDate(partner.kyc_verified_at)} />
        <DetailRow label="KYC Expiry"        value={fmtDate(partner.kyc_expiry_date)} />
        <DetailRow label="Next Renewal"      value={fmtDate(partner.kyc_next_renewal_due)} />
      </Section>

      <Section title="Background Check">
        <DetailRow label="Status"    value={<Badge variant={BG_VARIANTS[partner.background_check_status] ?? 'gray'}>{fmt(partner.background_check_status)}</Badge>} />
        <DetailRow label="Agency"    value={partner.background_check_agency} />
        <DetailRow label="Reference" value={partner.background_check_reference} />
        <DetailRow label="Date"      value={fmtDate(partner.background_check_date)} />
        <DetailRow label="Expiry"    value={fmtDate(partner.background_check_expiry)} />
      </Section>

      <Section title="Onboarding">
        <DetailRow label="Status"      value={<Badge variant={ONBOARDING_VARIANTS[partner.onboarding_status] ?? 'gray'}>{fmt(partner.onboarding_status)}</Badge>} />
        <DetailRow label="Joined"      value={fmtDate(partner.onboarding_date)} />
        <DetailRow label="Completed"   value={fmtDate(partner.onboarding_completed_at)} />
      </Section>

      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">KYC Documents ({docs.length})</span>
          <button onClick={() => setModal({ type:'add' })} className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500 text-white text-xs font-medium rounded-lg hover:bg-orange-600">
            <Plus size={11} /> Add
          </button>
        </div>

        {loading ? <div className="text-center py-6 text-sm text-gray-400">Loading…</div> :
         docs.length === 0 ? <div className="text-center py-6 text-sm text-gray-400">No documents uploaded</div> :
         <div className="space-y-2">
           {docs.map(doc => (
             <div key={doc._id} className="border border-gray-100 rounded-lg p-3">
               <div className="flex items-start justify-between gap-2">
                 <div className="flex-1 min-w-0">
                   <div className="flex items-center gap-2 mb-1">
                     <span className="text-sm font-medium text-gray-900">{KYC_DOC_LABELS[doc.document_type] ?? doc.document_type}</span>
                     <Badge variant={KYC_DOC_STATUS_VARIANTS[doc.status] ?? 'gray'} size="sm">{fmt(doc.status)}</Badge>
                   </div>
                   {doc.expiry_date && <p className="text-xs text-gray-400">Expires: {fmtDate(doc.expiry_date)}</p>}
                   {doc.rejection_reason && <p className="text-xs text-red-500 mt-0.5">{doc.rejection_reason}</p>}
                   {doc.document_url && <a href={doc.document_url} target="_blank" rel="noreferrer" className="text-xs text-blue-500 hover:underline block truncate">{doc.document_url}</a>}
                 </div>
                 <div className="flex gap-1 shrink-0">
                   <button onClick={() => setModal({ type:'edit', doc })} className="p-1.5 text-gray-400 hover:text-orange-500"><Edit2 size={12} /></button>
                   <button onClick={() => handleDelete(doc)} disabled={deleting === doc._id} className="p-1.5 text-gray-400 hover:text-red-500 disabled:opacity-40"><Trash2 size={12} /></button>
                 </div>
               </div>
             </div>
           ))}
         </div>
        }
      </div>

      {modal?.type === 'add'  && <Modal open title="Add KYC Document" onClose={() => setModal(null)} width="max-w-sm"><AddKycDocModal partner={partner} onClose={() => setModal(null)} onSaved={load} /></Modal>}
      {modal?.type === 'edit' && <Modal open title="Update Document" onClose={() => setModal(null)} width="max-w-sm"><AddKycDocModal partner={partner} doc={modal.doc} onClose={() => setModal(null)} onSaved={load} /></Modal>}
    </div>
  );
}

function EarningsTab({ partner }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [earningPage, setEarningPage] = useState(1);
  const ELIMIT = 10;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await partnersService.getEarnings(partner._id, { page: earningPage, limit: ELIMIT });
      setData(res?.data ?? null);
    } catch (err) {
      toast.error(err.message || 'Failed to load earnings');
    } finally { setLoading(false); }
  }, [partner._id, earningPage]);

  useEffect(() => { load(); }, [load]);

  if (loading && !data) return <div className="py-8 text-center text-sm text-gray-400">Loading…</div>;

  const summary = data?.earnings_summary || {};
  const today   = data?.performance_today || {};
  const records = safeArr(data?.records);
  const pagination = data?.pagination;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <button onClick={() => setModal('payout')} className="px-3 py-1.5 text-xs font-medium bg-green-500 text-white rounded-lg hover:bg-green-600">Process Payout</button>
        <button onClick={() => setModal('record')} className="px-3 py-1.5 text-xs font-medium border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50">Add Record</button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {[
          ['Pending Payout',     summary.pending_payout_amount,    true,  'bg-green-50 border-green-200 text-green-700'],
          ['This Week Net',      summary.current_week_net,         true,  'bg-blue-50 border-blue-200 text-blue-700'],
          ['Today Deliveries',   today.total_deliveries,           false, 'bg-gray-50 border-gray-200 text-gray-700'],
          ['Today Net Earnings', today.net_earnings_today,         true,  'bg-orange-50 border-orange-200 text-orange-700'],
        ].map(([label, val, isCur, cls]) => (
          <div key={label} className={`border rounded-lg p-3 ${cls}`}>
            <p className="text-xs opacity-70 mb-0.5">{label}</p>
            <p className="text-lg font-bold">{val != null ? (isCur ? fmtCur(val) : val) : '—'}</p>
          </div>
        ))}
      </div>

      <div>
        <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Transaction History</div>
        {records.length === 0 ? (
          <div className="text-center py-6 text-sm text-gray-400">No records</div>
        ) : (
          <div className="space-y-2">
            {records.map(r => (
              <div key={r._id} className="flex items-start justify-between py-2 border-b border-gray-100 last:border-0 gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${r.amount >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{fmt(r.type)}</span>
                  </div>
                  <p className="text-xs text-gray-600 mt-0.5 line-clamp-1">{r.description}</p>
                  <p className="text-xs text-gray-400">{fmtDate(r.created_at)}</p>
                </div>
                <span className={`text-sm font-bold shrink-0 ${r.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {r.amount >= 0 ? '+' : ''}{fmtCur(r.amount)}
                </span>
              </div>
            ))}
          </div>
        )}
        {pagination && pagination.pages > 1 && (
          <div className="flex items-center justify-between mt-3">
            <span className="text-xs text-gray-400">{pagination.page}/{pagination.pages}</span>
            <div className="flex gap-1">
              <button onClick={() => setEarningPage(p => Math.max(1, p-1))} disabled={earningPage === 1} className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"><ChevronLeft size={14} /></button>
              <button onClick={() => setEarningPage(p => Math.min(pagination.pages, p+1))} disabled={earningPage === pagination.pages} className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"><ChevronRight size={14} /></button>
            </div>
          </div>
        )}
      </div>

      {modal === 'payout' && <Modal open title="Process Payout" onClose={() => setModal(null)} width="max-w-sm"><PayoutModal partner={partner} pendingAmount={summary.pending_payout_amount ?? 0} onClose={() => setModal(null)} onSaved={load} /></Modal>}
      {modal === 'record' && <Modal open title="Add Earning Record" onClose={() => setModal(null)} width="max-w-sm"><AddEarningModal partner={partner} onClose={() => setModal(null)} onSaved={load} /></Modal>}
    </div>
  );
}

function PenaltiesTab({ partner }) {
  const [penalties, setPenalties] = useState([]);
  const [incentives, setIncentives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [waiving, setWaiving] = useState(null);
  const [deletingInc, setDeletingInc] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [pRes, iRes] = await Promise.all([
        partnersService.listPenalties(partner._id),
        partnersService.listIncentives(partner._id),
      ]);
      setPenalties(safeArr(pRes?.data));
      setIncentives(safeArr(iRes?.data));
    } catch (err) {
      toast.error(err.message || 'Failed');
    } finally { setLoading(false); }
  }, [partner._id]);

  useEffect(() => { load(); }, [load]);

  const handleWaive = async (p) => {
    const reason = window.prompt('Waive reason:');
    if (!reason) return;
    setWaiving(p._id);
    try {
      await partnersService.waivePenalty(partner._id, p._id, { reason });
      toast.success('Penalty waived');
      load();
    } catch (err) {
      toast.error(err.message || 'Failed');
    } finally { setWaiving(null); }
  };

  const handleDeleteIncentive = async (inc) => {
    if (!window.confirm(`Remove incentive "${inc.name}"?`)) return;
    setDeletingInc(inc._id);
    try {
      await partnersService.deleteIncentive(partner._id, inc._id);
      toast.success('Incentive removed');
      load();
    } catch (err) {
      toast.error(err.message || 'Failed');
    } finally { setDeletingInc(null); }
  };

  if (loading) return <div className="py-8 text-center text-sm text-gray-400">Loading…</div>;

  return (
    <div className="space-y-5">
      {/* Penalties */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Penalties ({penalties.length})</span>
          <button onClick={() => setModal('penalty')} className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500 text-white text-xs font-medium rounded-lg hover:bg-red-600">
            <Plus size={11} /> Add
          </button>
        </div>
        {penalties.length === 0 ? <div className="text-center py-4 text-sm text-gray-400 bg-gray-50 rounded-lg">No penalties</div> :
          <div className="space-y-2">
            {penalties.map(p => (
              <div key={p._id} className={`border rounded-lg p-3 ${p.is_waived ? 'border-gray-100 opacity-60' : 'border-red-100'}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-medium text-red-700 bg-red-50 px-1.5 py-0.5 rounded">{PENALTY_LABELS[p.penalty_type] ?? p.penalty_type}</span>
                      {p.is_waived && <span className="text-xs text-gray-400 line-through">Waived</span>}
                    </div>
                    <p className="text-sm font-bold text-red-600">-{fmtCur(p.amount)}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{p.reason}</p>
                    <p className="text-xs text-gray-400">{fmtDate(p.created_at)}</p>
                  </div>
                  {!p.is_waived && (
                    <button onClick={() => handleWaive(p)} disabled={waiving === p._id} className="text-xs px-2 py-1 border border-gray-200 text-gray-500 rounded-lg hover:bg-gray-50 disabled:opacity-40 shrink-0">Waive</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        }
      </div>

      {/* Incentives */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Incentives ({incentives.length})</span>
          <button onClick={() => setModal('incentive')} className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500 text-white text-xs font-medium rounded-lg hover:bg-green-600">
            <Plus size={11} /> Add
          </button>
        </div>
        {incentives.length === 0 ? <div className="text-center py-4 text-sm text-gray-400 bg-gray-50 rounded-lg">No incentives</div> :
          <div className="space-y-2">
            {incentives.map(inc => (
              <div key={inc._id} className={`border rounded-lg p-3 ${inc.is_active ? 'border-green-100' : 'border-gray-100 opacity-60'}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm font-medium text-gray-900 truncate">{inc.name}</span>
                      {!inc.is_active && <span className="text-xs text-gray-400">Inactive</span>}
                    </div>
                    <span className="text-xs text-green-700 bg-green-50 px-1.5 py-0.5 rounded">{INCENTIVE_TYPE_LABELS[inc.type] ?? inc.type}</span>
                    {inc.amount_per_delivery > 0 && <p className="text-xs text-gray-500 mt-0.5">+{fmtCur(inc.amount_per_delivery)}/delivery</p>}
                    {inc.flat_amount > 0 && <p className="text-xs text-gray-500 mt-0.5">Flat +{fmtCur(inc.flat_amount)}</p>}
                    <p className="text-xs text-gray-400 mt-0.5">{fmtDate(inc.valid_from)} – {fmtDate(inc.valid_to)}</p>
                  </div>
                  <button onClick={() => handleDeleteIncentive(inc)} disabled={deletingInc === inc._id} className="p-1.5 text-gray-400 hover:text-red-500 disabled:opacity-40 shrink-0">
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        }
      </div>

      {modal === 'penalty'  && <Modal open title="Add Penalty"   onClose={() => setModal(null)} width="max-w-sm"><AddPenaltyModal  partner={partner} onClose={() => setModal(null)} onSaved={load} /></Modal>}
      {modal === 'incentive'&& <Modal open title="Add Incentive" onClose={() => setModal(null)} width="max-w-sm"><AddIncentiveModal partner={partner} onClose={() => setModal(null)} onSaved={load} /></Modal>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PARTNER DRAWER
// ═══════════════════════════════════════════════════════════════════════════════

function PartnerDrawer({ partnerRow, onClose, onRefreshList }) {
  const [tab, setTab] = useState('profile');
  const [partner, setPartner] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);

  const loadPartner = useCallback(async () => {
    setLoading(true);
    try {
      const res = await partnersService.getById(partnerRow._id);
      setPartner(res?.data ?? null);
    } catch (err) {
      toast.error(err.message || 'Failed to load partner');
    } finally { setLoading(false); }
  }, [partnerRow._id]);

  useEffect(() => { loadPartner(); }, [loadPartner]);

  const reload = useCallback(() => { loadPartner(); onRefreshList(); }, [loadPartner, onRefreshList]);

  const TABS = [
    { id:'profile',    label:'Profile',   icon:UserCheck },
    { id:'vehicle',    label:'Vehicle',   icon:Bike },
    { id:'kyc',        label:'KYC',       icon:FileText },
    { id:'earnings',   label:'Earnings',  icon:DollarSign },
    { id:'penalties',  label:'P & I',     icon:TrendingUp },
  ];

  const p = partner || partnerRow;

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="absolute inset-0 bg-black/20" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white shadow-2xl flex flex-col h-full">
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-100 shrink-0">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold shrink-0">
                {partnerInitials(partnerRow)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-sm font-bold text-gray-900 truncate">{partnerName(p)}</h2>
                  <Badge variant={CURRENT_STATUS_VARIANTS[p.current_status] ?? 'gray'} dot>{fmt(p.current_status)}</Badge>
                  {p.is_blocked && <Badge variant="red">Blocked</Badge>}
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5 flex-wrap">
                  {p.partner_code && <span className="font-mono text-orange-500">{p.partner_code}</span>}
                  {p.phone && <><span>·</span><span>{p.phone}</span></>}
                  {p.dark_store_name && <><span>·</span><span>{p.dark_store_name}</span></>}
                </div>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <Badge variant={ONBOARDING_VARIANTS[p.onboarding_status] ?? 'gray'} size="sm">{fmt(p.onboarding_status)}</Badge>
                  <Badge variant={KYC_VARIANTS[p.kyc_status] ?? 'gray'} size="sm">KYC: {fmt(p.kyc_status)}</Badge>
                </div>
              </div>
            </div>
            <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 shrink-0 mt-0.5"><X size={18} /></button>
          </div>

          <div className="flex gap-1 mt-3 overflow-x-auto">
            {TABS.map(t => {
              const Icon = t.icon;
              return (
                <button key={t.id} onClick={() => setTab(t.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors shrink-0 ${tab === t.id ? 'bg-orange-100 text-orange-600' : 'text-gray-500 hover:bg-gray-100'}`}>
                  <Icon size={12} />{t.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {loading ? (
            <div className="py-8 text-center text-sm text-gray-400">Loading partner details…</div>
          ) : !partner ? (
            <div className="py-8 text-center text-sm text-gray-400">Failed to load</div>
          ) : (
            <>
              {tab === 'profile'   && <ProfileTab    partner={partner} onEdit={() => setModal('edit')} onStatus={() => setModal('status')} onReassign={() => setModal('reassign')} />}
              {tab === 'vehicle'   && <VehicleBankTab partner={partner} onVehicle={() => setModal('vehicle')} onBank={() => setModal('bank')} onCommission={() => setModal('commission')} />}
              {tab === 'kyc'       && <KycDocsTab    partner={partner} onUpdateKyc={() => setModal('kyc')} onBgCheck={() => setModal('bgcheck')} onOnboarding={() => setModal('onboarding')} onRefresh={reload} />}
              {tab === 'earnings'  && <EarningsTab   partner={partner} />}
              {tab === 'penalties' && <PenaltiesTab  partner={partner} />}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-gray-100 shrink-0">
          <button onClick={() => setModal('delete')} className="w-full py-2 text-xs font-medium text-red-500 border border-red-200 rounded-lg hover:bg-red-50 transition-colors">
            Delete Partner
          </button>
        </div>
      </div>

      {/* Modals */}
      {modal === 'edit'       && partner && <Modal open title="Edit Partner"          onClose={() => setModal(null)} width="max-w-md"><EditPartnerModal   partner={partner} onClose={() => setModal(null)} onSaved={reload} /></Modal>}
      {modal === 'status'     && partner && <Modal open title="Update Status"         onClose={() => setModal(null)} width="max-w-sm"><StatusModal         partner={partner} onClose={() => setModal(null)} onSaved={reload} /></Modal>}
      {modal === 'reassign'   && partner && <Modal open title="Reassign Store"        onClose={() => setModal(null)} width="max-w-sm"><ReassignStoreModal  partner={partner} onClose={() => setModal(null)} onSaved={reload} /></Modal>}
      {modal === 'kyc'        && partner && <Modal open title="Update KYC Status"     onClose={() => setModal(null)} width="max-w-sm"><KycStatusModal      partner={partner} onClose={() => setModal(null)} onSaved={reload} /></Modal>}
      {modal === 'bgcheck'    && partner && <Modal open title="Background Check"      onClose={() => setModal(null)} width="max-w-sm"><BgCheckModal        partner={partner} onClose={() => setModal(null)} onSaved={reload} /></Modal>}
      {modal === 'onboarding' && partner && <Modal open title="Onboarding Step"       onClose={() => setModal(null)} width="max-w-sm"><OnboardingModal     partner={partner} onClose={() => setModal(null)} onSaved={reload} /></Modal>}
      {modal === 'vehicle'    && partner && <Modal open title="Update Vehicle"        onClose={() => setModal(null)} width="max-w-md"><VehicleModal        partner={partner} onClose={() => setModal(null)} onSaved={reload} /></Modal>}
      {modal === 'bank'       && partner && <Modal open title="Bank Account"          onClose={() => setModal(null)} width="max-w-sm"><BankModal           partner={partner} onClose={() => setModal(null)} onSaved={reload} /></Modal>}
      {modal === 'commission' && partner && <Modal open title="Commission Config"     onClose={() => setModal(null)} width="max-w-sm"><CommissionModal     partner={partner} onClose={() => setModal(null)} onSaved={reload} /></Modal>}
      {modal === 'delete'     && partner && <Modal open title="Delete Partner"        onClose={() => setModal(null)} width="max-w-sm"><DeletePartnerModal  partner={partner} onClose={() => setModal(null)} onDeleted={() => { onClose(); onRefreshList(); }} /></Modal>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════════

export default function Partners() {
  const [statsData,   setStatsData]   = useState(null);
  const [partners,    setPartners]    = useState([]);
  const [total,       setTotal]       = useState(0);
  const [page,        setPage]        = useState(1);
  const [loading,     setLoading]     = useState(true);
  const [selected,    setSelected]    = useState(null);
  const [showCreate,  setShowCreate]  = useState(false);

  const [filters, setFilters] = useState({
    search:'', current_status:'', onboarding_status:'', kyc_status:'', city:'',
    sort_by:'created_at', sort_order:'desc',
  });

  const setFilter = (k, v) => { setFilters(f => ({ ...f, [k]: v })); setPage(1); };

  const loadStats = useCallback(async () => {
    try {
      const res = await partnersService.stats();
      setStatsData(res?.data ?? null);
    } catch { /* silently ignore */ }
  }, []);

  const loadPartners = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: LIMIT, ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== '')) };
      const res = await partnersService.list(params);
      setPartners(safeArr(res?.data?.partners));
      setTotal(res?.data?.pagination?.total ?? 0);
    } catch (err) {
      toast.error(err.message || 'Failed to load partners');
    } finally { setLoading(false); }
  }, [page, filters]);

  useEffect(() => { loadStats(); }, [loadStats]);
  useEffect(() => { loadPartners(); }, [loadPartners]);

  const pages = Math.ceil(total / LIMIT) || 1;

  const columns = [
    { key: 'display_name', label: 'Partner', render: (v, row) => (
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold shrink-0">
          {partnerInitials(row)}
        </div>
        <div className="min-w-0">
          <div className="font-medium text-sm text-gray-900 truncate">{partnerName(row)}</div>
          <div className="text-xs text-gray-400 font-mono">{row.partner_display_id || row.partner_code}</div>
          <div className="text-xs text-gray-400">{row.phone}</div>
        </div>
      </div>
    )},
    { key: 'dark_store_name', label: 'Store', render: (v) => <span className="text-sm text-gray-600 truncate">{v || '—'}</span> },
    { key: 'current_status', label: 'Status', render: (v, row) => (
      <div className="space-y-1">
        <Badge variant={CURRENT_STATUS_VARIANTS[v] ?? 'gray'} dot>{fmt(v)}</Badge>
        {row.is_blocked && <Badge variant="red" size="sm">Blocked</Badge>}
      </div>
    )},
    { key: 'onboarding_status', label: 'Onboarding', render: (v) => <Badge variant={ONBOARDING_VARIANTS[v] ?? 'gray'} size="sm">{fmt(v)}</Badge> },
    { key: 'kyc_status', label: 'KYC', render: (v) => <Badge variant={KYC_VARIANTS[v] ?? 'gray'} size="sm">{fmt(v)}</Badge> },
    { key: 'performance_today', label: 'Today', render: (v) => (
      <div className="text-xs">
        <div className="font-medium text-gray-800">{v?.total_deliveries ?? 0} deliveries</div>
        <div className="text-gray-400">{fmtCur(v?.net_earnings_today ?? 0)}</div>
      </div>
    )},
    { key: 'created_at', label: 'Joined', render: (v) => <span className="text-xs text-gray-400">{fmtDate(v)}</span> },
  ];

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        <StatCard title="Total"      value={statsData?.total ?? '—'}                              icon={Truck}       iconColor="bg-blue-500"   compact />
        <StatCard title="Active"     value={statsData?.by_status?.active ?? '—'}                  icon={CheckCircle} iconColor="bg-green-500"  compact />
        <StatCard title="Blocked"    value={statsData?.by_status?.blocked ?? '—'}                 icon={Ban}         iconColor="bg-red-500"    compact />
        <StatCard title="Pending"    value={statsData?.by_status?.pending_onboarding ?? '—'}      icon={FileText}    iconColor="bg-yellow-500" compact />
        <StatCard title="Available"  value={statsData?.realtime?.available ?? '—'}                icon={Activity}    iconColor="bg-teal-500"   compact />
        <StatCard title="On Delivery"value={statsData?.realtime?.on_delivery ?? '—'}              icon={Truck}       iconColor="bg-orange-500" compact />
        <StatCard title="KYC Review" value={statsData?.pending_actions?.kyc_review ?? '—'}        icon={Shield}      iconColor="bg-purple-500" compact />
      </div>

      {/* Toolbar */}
      <div className="bg-white border border-gray-200 rounded-xl p-3">
        <div className="flex flex-col sm:flex-row flex-wrap gap-2">
          <div className="relative flex-1 min-w-48">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-orange-400"
              placeholder="Search name, phone, code…"
              value={filters.search}
              onChange={e => setFilter('search', e.target.value)}
            />
          </div>
          <select className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none bg-white" value={filters.current_status} onChange={e => setFilter('current_status', e.target.value)}>
            <option value="">All Status</option>
            {['available','on_delivery','on_break','offline','suspended','blocked'].map(s => <option key={s} value={s}>{fmt(s)}</option>)}
          </select>
          <select className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none bg-white" value={filters.onboarding_status} onChange={e => setFilter('onboarding_status', e.target.value)}>
            <option value="">All Onboarding</option>
            {ONBOARDING_STATUSES.map(s => <option key={s} value={s}>{fmt(s)}</option>)}
          </select>
          <select className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none bg-white" value={filters.kyc_status} onChange={e => setFilter('kyc_status', e.target.value)}>
            <option value="">All KYC</option>
            {KYC_STATUSES.map(s => <option key={s} value={s}>{fmt(s)}</option>)}
          </select>
          <input
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-orange-400 w-32"
            placeholder="City…"
            value={filters.city}
            onChange={e => setFilter('city', e.target.value)}
          />
          <button onClick={loadPartners} className="p-2 border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 transition-colors">
            <RefreshCw size={14} />
          </button>
          <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600 transition-colors shrink-0">
            <Plus size={14} /> Add Partner
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-sm text-gray-400">Loading partners…</div>
        ) : partners.length === 0 ? (
          <div className="py-16 text-center">
            <Truck size={32} className="text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500">No partners found</p>
            <button onClick={() => setShowCreate(true)} className="mt-3 text-sm text-orange-500 hover:underline">Add the first partner</button>
          </div>
        ) : (
          <Table columns={columns} data={partners} onRowClick={setSelected} />
        )}
      </div>

      {/* Pagination */}
      {!loading && pages > 1 && (
        <div className="flex items-center justify-between bg-white border border-gray-200 rounded-xl px-4 py-3">
          <span className="text-xs text-gray-500">
            {(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, total)} of {total} partners
          </span>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 disabled:opacity-30">
              <ChevronLeft size={14} />
            </button>
            {Array.from({ length: Math.min(pages, 5) }, (_, i) => {
              const p = pages <= 5 ? i + 1 : page <= 3 ? i + 1 : page >= pages - 2 ? pages - 4 + i : page - 2 + i;
              return <button key={p} onClick={() => setPage(p)} className={`w-7 h-7 text-xs rounded-lg ${p === page ? 'bg-orange-500 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>{p}</button>;
            })}
            <button onClick={() => setPage(p => Math.min(pages, p+1))} disabled={page === pages} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 disabled:opacity-30">
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Detail drawer */}
      {selected && (
        <PartnerDrawer
          partnerRow={selected}
          onClose={() => setSelected(null)}
          onRefreshList={loadPartners}
        />
      )}

      {/* Create modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Add Delivery Partner" width="max-w-2xl">
        <CreatePartnerModal onClose={() => setShowCreate(false)} onCreated={() => { loadPartners(); loadStats(); }} />
      </Modal>
    </div>
  );
}
