import { useState, useEffect, useCallback } from 'react';
import {
  Users as UsersIcon, UserCheck, Search, Plus, RefreshCw,
  ChevronLeft, ChevronRight, Wallet, Shield, TrendingUp,
  Phone, Mail, LogOut, Trash2, CreditCard, Ban, Activity,
  ShieldAlert, ShieldCheck, X, Edit2, Crown, Minus, Clock,
  CheckCircle, AlertTriangle,
} from 'lucide-react';
import Badge from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import StatCard from '../components/ui/StatCard';
import Table from '../components/ui/Table';
import toast from '../lib/toast';
import usersService from '../services/users.service';

// ─── Constants ────────────────────────────────────────────────────────────────
const LIMIT = 20;

const STATUS_VARIANTS = {
  active: 'green',
  suspended: 'red',
  permanently_banned: 'red',
  deleted: 'gray',
  pending_verification: 'yellow',
};

const TIER_VARIANTS = {
  bronze: 'orange',
  silver: 'gray',
  gold: 'yellow',
  platinum: 'blue',
  vip: 'purple',
};

const FRAUD_FLAGS_ALL = [
  'multiple_chargebacks', 'suspicious_referral_pattern',
  'coupon_abuse', 'fake_account', 'payment_fraud', 'suspicious_location',
];

const ABUSE_FLAGS_ALL = ['coupon_abuse', 'promo_abuse', 'review_abuse', 'returns_abuse'];

const CREDIT_SOURCES = ['admin_credit', 'cashback', 'refund', 'promotional_credit', 'adjustment'];
const DEBIT_SOURCES  = ['admin_debit', 'adjustment'];

const safeArr = (v) => (Array.isArray(v) ? v : []);

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const fmtDateTime = (d) =>
  d ? new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—';
const fmtCurrency = (n) =>
  typeof n === 'number' ? `₹${n.toFixed(2)}` : '₹0.00';
const customerName = (u) => {
  if (!u) return 'Unknown';
  const full = [u.first_name, u.last_name].filter(Boolean).join(' ');
  return u.display_name || full || u.phone_number || 'Unknown';
};
const initials = (u) => {
  if (!u) return '?';
  if (u.first_name) return `${u.first_name.charAt(0)}${(u.last_name || '').charAt(0)}`.toUpperCase();
  return (u.phone_number || '?').charAt(0).toUpperCase();
};

// ─── Shared UI pieces ─────────────────────────────────────────────────────────
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
    <div className="flex items-center justify-between py-2.5">
      <span className="text-xs text-gray-500 shrink-0">{label}</span>
      <span className="text-sm font-medium text-gray-900 text-right ml-3">{value ?? '—'}</span>
    </div>
  );
}

function Toggle({ checked, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative w-10 h-5 rounded-full transition-colors shrink-0 ${checked ? 'bg-green-500' : 'bg-gray-300'}`}
    >
      <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${checked ? 'translate-x-5' : ''}`} />
    </button>
  );
}

// ─── Tab: Overview ────────────────────────────────────────────────────────────
function OverviewTab({ customer: c, onAction }) {
  return (
    <div className="p-6 space-y-5">
      {/* Quick Actions */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => onAction('updateStatus')}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <Edit2 size={12} /> Change Status
        </button>
        <button
          onClick={() => onAction('updateTier')}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <Crown size={12} /> Change Tier
        </button>
        <button
          onClick={() => onAction('deleteCustomer')}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors ml-auto"
        >
          <Trash2 size={12} /> Delete
        </button>
      </div>

      {/* Suspension banner */}
      {(c.account_status === 'suspended' || c.account_status === 'permanently_banned') && c.suspension_reason && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
          <div className="font-medium mb-0.5">
            {c.account_status === 'permanently_banned' ? 'Permanently Banned' : 'Suspended'}
          </div>
          <div className="text-xs">{c.suspension_reason}</div>
          {c.suspended_at && <div className="text-xs text-red-400 mt-1">Since {fmtDateTime(c.suspended_at)}</div>}
        </div>
      )}

      <Section title="Contact & Identity">
        <DetailRow
          label="Phone"
          value={
            <span className="flex items-center gap-1.5">
              <span className="font-mono">{c.phone_number}</span>
              {c.is_phone_verified
                ? <Badge variant="green">Verified</Badge>
                : <Badge variant="yellow">Unverified</Badge>}
            </span>
          }
        />
        <DetailRow
          label="Email"
          value={
            c.email
              ? <span className="flex items-center gap-1.5">
                  {c.email}
                  {c.is_email_verified ? <Badge variant="green">Verified</Badge> : <Badge variant="yellow">Unverified</Badge>}
                </span>
              : '—'
          }
        />
        <DetailRow label="Full Name" value={[c.first_name, c.last_name].filter(Boolean).join(' ') || '—'} />
        <DetailRow label="Date of Birth" value={fmtDate(c.date_of_birth)} />
        <DetailRow label="Gender" value={c.gender || '—'} />
        <DetailRow label="Language" value={c.language_preference || '—'} />
      </Section>

      <Section title="Account">
        <DetailRow
          label="Status"
          value={<Badge variant={STATUS_VARIANTS[c.account_status] ?? 'gray'} dot>{c.account_status?.replace(/_/g, ' ')}</Badge>}
        />
        <DetailRow
          label="Tier"
          value={<Badge variant={TIER_VARIANTS[c.user_tier] ?? 'gray'}>{c.user_tier?.toUpperCase()}</Badge>}
        />
        <DetailRow label="Signup Channel" value={c.signup_channel || '—'} />
        <DetailRow label="Member Since" value={fmtDate(c.created_at)} />
        <DetailRow label="Last Login" value={fmtDateTime(c.last_login_at)} />
        <DetailRow label="KYC Status" value={c.kyc_status || '—'} />
      </Section>

      <Section title="Referrals">
        <DetailRow label="Referral Code" value={<span className="font-mono text-purple-600">{c.referral_code || '—'}</span>} />
        <DetailRow label="Total Referrals Made" value={c.total_referrals_made ?? 0} />
        <DetailRow label="Successful Referrals" value={c.successful_referrals ?? 0} />
        <DetailRow label="Rewards Earned" value={fmtCurrency(c.referral_reward_earned)} />
      </Section>

      <Section title="Order Activity">
        <DetailRow label="Total Orders" value={c.total_orders ?? 0} />
        <DetailRow label="Delivered" value={c.total_orders_delivered ?? 0} />
        <DetailRow label="Cancelled" value={c.total_orders_cancelled ?? 0} />
        <DetailRow label="Total Spent (Lifetime)" value={fmtCurrency(c.total_spent_lifetime)} />
        <DetailRow label="Avg Order Value" value={fmtCurrency(c.average_order_value)} />
        <DetailRow label="First Order" value={fmtDate(c.first_order_at)} />
        <DetailRow label="Last Order" value={fmtDate(c.last_order_at)} />
        <DetailRow label="High Value Customer" value={c.is_high_value_user ? <Badge variant="purple">Yes</Badge> : 'No'} />
      </Section>
    </div>
  );
}

// ─── Tab: Wallet ──────────────────────────────────────────────────────────────
function WalletTab({ customer: c, transactions, txnTotal, onAction }) {
  return (
    <div className="p-6 space-y-5">
      {/* Balance card */}
      <div className="bg-linear-to-br from-orange-500 to-orange-600 rounded-xl p-5 text-white">
        <div className="flex items-start justify-between mb-3">
          <div className="text-sm font-medium opacity-80">Wallet Balance</div>
          <div className="flex gap-1.5 flex-wrap justify-end">
            {!c.is_wallet_enabled && <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">Disabled</span>}
            {c.wallet_blocked && <span className="text-xs bg-red-700/60 px-2 py-0.5 rounded-full">Blocked</span>}
            {c.is_wallet_enabled && !c.wallet_blocked && <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">Active</span>}
          </div>
        </div>
        <div className="text-3xl font-bold">{fmtCurrency(c.wallet_balance)}</div>
        <div className="flex gap-4 mt-2 text-xs opacity-70">
          <span>Lifetime In: {fmtCurrency(c.wallet_lifetime_credited)}</span>
          <span>Lifetime Out: {fmtCurrency(c.wallet_lifetime_used)}</span>
        </div>
        {c.wallet_blocked && c.wallet_blocked_reason && (
          <div className="mt-2 text-xs bg-red-900/30 rounded px-2 py-1.5">
            Blocked reason: {c.wallet_blocked_reason}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => onAction('creditWallet')}
          disabled={!c.is_wallet_enabled || c.wallet_blocked}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-green-50 text-green-700 border border-green-200 rounded-lg hover:bg-green-100 disabled:opacity-40 transition-colors"
        >
          <Plus size={12} /> Credit
        </button>
        <button
          onClick={() => onAction('debitWallet')}
          disabled={!c.is_wallet_enabled}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-red-50 text-red-700 border border-red-200 rounded-lg hover:bg-red-100 disabled:opacity-40 transition-colors"
        >
          <Minus size={12} /> Debit
        </button>
        <button
          onClick={() => onAction('blockWallet')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border rounded-lg transition-colors ${
            c.wallet_blocked
              ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
              : 'bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100'
          }`}
        >
          {c.wallet_blocked ? <><CheckCircle size={12} /> Unblock Wallet</> : <><Ban size={12} /> Block Wallet</>}
        </button>
      </div>

      {/* Transactions */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm font-semibold text-gray-800">Recent Transactions</div>
          {txnTotal > 0 && <span className="text-xs text-gray-400">{txnTotal} total</span>}
        </div>
        {transactions.length === 0 ? (
          <div className="text-sm text-gray-400 text-center py-10 border border-dashed border-gray-200 rounded-lg">
            No transactions yet
          </div>
        ) : (
          <div className="space-y-2">
            {transactions.map((txn) => (
              <div key={txn._id} className="flex items-center justify-between px-3 py-2.5 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-gray-800 truncate">{txn.description}</div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    {txn.source?.replace(/_/g, ' ')} • {fmtDateTime(txn.created_at)}
                    {txn.reference_id && <span> • Ref: {txn.reference_id}</span>}
                  </div>
                </div>
                <div className="text-right ml-3 shrink-0">
                  <div className={`text-sm font-semibold ${txn.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                    {txn.type === 'credit' ? '+' : '−'}{fmtCurrency(txn.amount)}
                  </div>
                  <div className="text-xs text-gray-400">Bal: {fmtCurrency(txn.balance_after)}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Tab: Sessions ────────────────────────────────────────────────────────────
function SessionsTab({ sessions, onRevokeAll, saving }) {
  const [confirming, setConfirming] = useState(false);

  const doRevoke = () => {
    setConfirming(false);
    onRevokeAll();
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="font-semibold text-gray-800">Active Sessions</div>
          <div className="text-xs text-gray-400 mt-0.5">{sessions.length} session{sessions.length !== 1 ? 's' : ''}</div>
        </div>
        {sessions.length > 0 && (
          <div className="flex items-center gap-2">
            {confirming ? (
              <>
                <span className="text-xs text-red-600 font-medium">Confirm force logout?</span>
                <button onClick={doRevoke} disabled={saving} className="px-2.5 py-1 text-xs font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-40">Yes, Logout</button>
                <button onClick={() => setConfirming(false)} className="px-2.5 py-1 text-xs border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
              </>
            ) : (
              <button
                onClick={() => setConfirming(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-red-50 text-red-700 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
              >
                <LogOut size={12} /> Force Logout All
              </button>
            )}
          </div>
        )}
      </div>

      {sessions.length === 0 ? (
        <div className="text-sm text-gray-400 text-center py-14 border border-dashed border-gray-200 rounded-lg">
          No active sessions
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map((s) => (
            <div key={s._id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-medium text-sm text-gray-800">
                    {s.device_name || `${s.device_platform || 'Unknown'} Device`}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    {[s.device_os, s.device_platform, s.app_version && `v${s.app_version}`].filter(Boolean).join(' • ')}
                  </div>
                  {s.ip_address && <div className="text-xs text-gray-400 mt-0.5">IP: {s.ip_address}</div>}
                </div>
                <div className="text-right shrink-0">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${s.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                    {s.status}
                  </span>
                  {s.login_method && <div className="text-xs text-gray-400 mt-1">{s.login_method}</div>}
                </div>
              </div>
              <div className="flex gap-4 mt-2 text-xs text-gray-400">
                <span>Created: {fmtDateTime(s.created_at)}</span>
                {s.last_activity_at && <span>Last active: {fmtDateTime(s.last_activity_at)}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Tab: Risk & COD ──────────────────────────────────────────────────────────
function RiskTab({ customer: c, onAction }) {
  const riskPct = Math.round((c.fraud_risk_score ?? 0) * 100);
  const riskColor = riskPct > 60 ? 'text-red-600' : riskPct > 30 ? 'text-yellow-600' : 'text-green-600';

  return (
    <div className="p-6 space-y-5">
      {/* Fraud status card */}
      <div className={`rounded-xl p-5 border ${c.is_fraud_flagged ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {c.is_fraud_flagged
              ? <ShieldAlert size={20} className="text-red-600" />
              : <ShieldCheck size={20} className="text-green-600" />}
            <span className={`font-semibold text-sm ${c.is_fraud_flagged ? 'text-red-700' : 'text-green-700'}`}>
              {c.is_fraud_flagged ? 'Fraud Flagged' : 'Clean Account'}
            </span>
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-500 mb-0.5">Risk Score</div>
            <div className={`text-2xl font-bold ${riskColor}`}>{riskPct}%</div>
          </div>
        </div>
        {safeArr(c.fraud_flags).length > 0 && (
          <div className="mb-2">
            <div className="text-xs text-gray-500 mb-1">Fraud Flags</div>
            <div className="flex flex-wrap gap-1.5">
              {c.fraud_flags.map((f) => <Badge key={f} variant="red">{f.replace(/_/g, ' ')}</Badge>)}
            </div>
          </div>
        )}
        {safeArr(c.abuse_flags).length > 0 && (
          <div>
            <div className="text-xs text-gray-500 mb-1">Abuse Flags</div>
            <div className="flex flex-wrap gap-1.5">
              {c.abuse_flags.map((f) => <Badge key={f} variant="yellow">{f.replace(/_/g, ' ')}</Badge>)}
            </div>
          </div>
        )}
        {c.fraud_reviewed_at && (
          <div className="text-xs text-gray-400 mt-2">Reviewed: {fmtDateTime(c.fraud_reviewed_at)}</div>
        )}
      </div>

      <button
        onClick={() => onAction('updateFraud')}
        className="w-full py-2 text-sm font-medium border border-gray-200 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2 transition-colors"
      >
        <Shield size={14} />
        {c.is_fraud_flagged ? 'Update / Clear Fraud Flag' : 'Flag as Fraud'}
      </button>

      {/* COD settings */}
      <Section title="COD Settings">
        <DetailRow label="COD Allowed" value={c.cod_allowed ? <Badge variant="green">Yes</Badge> : <Badge variant="red">No</Badge>} />
        <DetailRow label="COD Blocked" value={c.cod_blocked ? <Badge variant="red" dot>Blocked</Badge> : <Badge variant="green">Not Blocked</Badge>} />
        <DetailRow label="COD Limit Per Order" value={fmtCurrency(c.cod_limit_per_order)} />
        {c.cod_blocked_reason && <DetailRow label="Block Reason" value={c.cod_blocked_reason} />}
      </Section>

      <button
        onClick={() => onAction('updateCod')}
        className="w-full py-2 text-sm font-medium border border-gray-200 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2 transition-colors"
      >
        <CreditCard size={14} /> Update COD Settings
      </button>
    </div>
  );
}

// ─── Modal: Create Customer ───────────────────────────────────────────────────
function CreateCustomerModal({ onClose, onSubmit, saving }) {
  const [form, setForm] = useState({
    phone_number: '', country_code: '+91',
    first_name: '', last_name: '',
    email: '', signup_channel: 'offline',
  });
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <Modal open onClose={onClose} title="Add New Customer" width="max-w-md">
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <FormField label="Code">
            <input value={form.country_code} onChange={(e) => set('country_code', e.target.value)} className={inp} placeholder="+91" />
          </FormField>
          <div className="col-span-2">
            <FormField label="Phone Number" required>
              <input value={form.phone_number} onChange={(e) => set('phone_number', e.target.value)} className={inp} placeholder="9876543210" />
            </FormField>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="First Name">
            <input value={form.first_name} onChange={(e) => set('first_name', e.target.value)} className={inp} />
          </FormField>
          <FormField label="Last Name">
            <input value={form.last_name} onChange={(e) => set('last_name', e.target.value)} className={inp} />
          </FormField>
        </div>
        <FormField label="Email">
          <input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} className={inp} placeholder="customer@example.com" />
        </FormField>
        <FormField label="Signup Channel">
          <select value={form.signup_channel} onChange={(e) => set('signup_channel', e.target.value)} className={sel}>
            {['offline', 'organic', 'referral', 'google', 'facebook', 'instagram', 'influencer'].map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </FormField>
        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="flex-1 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
          <button
            onClick={() => onSubmit(form)}
            disabled={!form.phone_number || saving}
            className="flex-1 py-2 text-sm font-medium bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-40"
          >
            {saving ? 'Creating…' : 'Create Customer'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Modal: Update Status ─────────────────────────────────────────────────────
function UpdateStatusModal({ customer: c, onClose, onSubmit, saving }) {
  const [status, setStatus] = useState(c.account_status || 'active');
  const [reason, setReason] = useState('');
  const needsReason = ['suspended', 'permanently_banned'].includes(status);
  const valid = !needsReason || reason.trim();

  return (
    <Modal open onClose={onClose} title="Change Account Status" width="max-w-sm">
      <div className="space-y-4">
        <FormField label="New Status" required>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className={sel}>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="permanently_banned">Permanently Banned</option>
          </select>
        </FormField>
        {needsReason && (
          <FormField label="Reason" required>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className={`${inp} h-20 resize-none`}
              placeholder="Reason for suspension / ban…"
            />
          </FormField>
        )}
        {status !== c.account_status && (
          <div className={`text-xs p-3 rounded-lg ${status === 'active' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
            {status === 'active'
              ? '✓ Customer will be re-activated and can log in again.'
              : `⚠ All active sessions will be revoked immediately.`}
          </div>
        )}
        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="flex-1 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
          <button
            onClick={() => onSubmit({ status, reason: reason || undefined })}
            disabled={!valid || saving}
            className="flex-1 py-2 text-sm font-medium bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-40"
          >
            {saving ? 'Saving…' : 'Update Status'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Modal: Update Tier ───────────────────────────────────────────────────────
function UpdateTierModal({ customer: c, onClose, onSubmit, saving }) {
  const [tier, setTier] = useState(c.user_tier || 'bronze');
  const [expiry, setExpiry] = useState('');

  return (
    <Modal open onClose={onClose} title="Change Customer Tier" width="max-w-sm">
      <div className="space-y-4">
        <FormField label="Tier" required>
          <select value={tier} onChange={(e) => setTier(e.target.value)} className={sel}>
            {['bronze', 'silver', 'gold', 'platinum', 'vip'].map((t) => (
              <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
            ))}
          </select>
        </FormField>
        <FormField label="Tier Expiry (optional)">
          <input type="datetime-local" value={expiry} onChange={(e) => setExpiry(e.target.value)} className={inp} />
        </FormField>
        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="flex-1 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
          <button
            onClick={() => onSubmit({ user_tier: tier, tier_expiry_at: expiry || undefined })}
            disabled={saving}
            className="flex-1 py-2 text-sm font-medium bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-40"
          >
            {saving ? 'Saving…' : 'Update Tier'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Modal: Credit / Debit Wallet ─────────────────────────────────────────────
function WalletTxnModal({ type, customer: c, onClose, onSubmit, saving }) {
  const isCredit = type === 'credit';
  const [form, setForm] = useState({
    amount: '',
    description: '',
    source: isCredit ? 'admin_credit' : 'admin_debit',
    reference_id: '',
  });
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const valid = form.amount && Number(form.amount) > 0 && form.description.trim();

  return (
    <Modal open onClose={onClose} title={isCredit ? 'Credit Wallet' : 'Debit Wallet'} width="max-w-md">
      <div className="space-y-4">
        <div className={`text-sm p-3 rounded-lg border ${isCredit ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
          Current balance: <strong>{fmtCurrency(c.wallet_balance)}</strong>
        </div>
        <FormField label="Amount (₹)" required>
          <input
            type="number" min="0.01" step="0.01"
            value={form.amount}
            onChange={(e) => set('amount', e.target.value)}
            className={inp}
            placeholder="0.00"
          />
        </FormField>
        <FormField label="Description" required>
          <textarea
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
            className={`${inp} h-20 resize-none`}
            placeholder={isCredit ? 'e.g. Goodwill credit for delayed delivery' : 'e.g. Recovery of wrongly credited cashback'}
          />
        </FormField>
        <FormField label="Source">
          <select value={form.source} onChange={(e) => set('source', e.target.value)} className={sel}>
            {(isCredit ? CREDIT_SOURCES : DEBIT_SOURCES).map((s) => (
              <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
            ))}
          </select>
        </FormField>
        <FormField label="Reference ID (optional)">
          <input value={form.reference_id} onChange={(e) => set('reference_id', e.target.value)} className={inp} placeholder="e.g. TICKET-9021" />
        </FormField>
        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="flex-1 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
          <button
            onClick={() => onSubmit({
              amount: Number(form.amount),
              description: form.description,
              source: form.source,
              reference_id: form.reference_id || undefined,
            })}
            disabled={!valid || saving}
            className={`flex-1 py-2 text-sm font-medium text-white rounded-lg disabled:opacity-40 ${isCredit ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
          >
            {saving ? 'Processing…' : `${isCredit ? 'Credit' : 'Debit'} ₹${form.amount || '0'}`}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Modal: Block / Unblock Wallet ────────────────────────────────────────────
function BlockWalletModal({ customer: c, onClose, onSubmit, saving }) {
  const blocking = !c.wallet_blocked;
  const [reason, setReason] = useState('');
  const valid = !blocking || reason.trim();

  return (
    <Modal open onClose={onClose} title={blocking ? 'Block Wallet' : 'Unblock Wallet'} width="max-w-sm">
      <div className="space-y-4">
        {blocking ? (
          <FormField label="Block Reason" required>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className={`${inp} h-20 resize-none`}
              placeholder="e.g. Suspicious wallet top-up pattern under investigation"
            />
          </FormField>
        ) : (
          <div className="text-sm text-gray-600 p-3 bg-gray-50 rounded-lg">
            This will restore wallet access for the customer.
            {c.wallet_blocked_reason && (
              <div className="text-xs text-gray-400 mt-1">Current reason: {c.wallet_blocked_reason}</div>
            )}
          </div>
        )}
        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="flex-1 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
          <button
            onClick={() => onSubmit({ blocked: blocking, reason: reason || undefined })}
            disabled={!valid || saving}
            className={`flex-1 py-2 text-sm font-medium text-white rounded-lg disabled:opacity-40 ${blocking ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-green-600 hover:bg-green-700'}`}
          >
            {saving ? 'Saving…' : (blocking ? 'Block Wallet' : 'Unblock Wallet')}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Modal: Update Fraud ──────────────────────────────────────────────────────
function UpdateFraudModal({ customer: c, onClose, onSubmit, saving }) {
  const [form, setForm] = useState({
    is_fraud_flagged: c.is_fraud_flagged ?? false,
    fraud_flags: safeArr(c.fraud_flags),
    fraud_risk_score: String(c.fraud_risk_score ?? 0),
    abuse_flags: safeArr(c.abuse_flags),
  });

  const toggleFlag = (key, val) =>
    setForm((f) => ({
      ...f,
      [key]: f[key].includes(val) ? f[key].filter((x) => x !== val) : [...f[key], val],
    }));

  return (
    <Modal open onClose={onClose} title="Update Fraud Status" width="max-w-md">
      <div className="space-y-4">
        <FormField label="Fraud Status" required>
          <div className="flex gap-4">
            {[
              { val: true,  label: 'Flag as Fraud',  color: 'text-red-600' },
              { val: false, label: 'Mark as Clean',  color: 'text-green-600' },
            ].map(({ val, label, color }) => (
              <label key={String(val)} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  checked={form.is_fraud_flagged === val}
                  onChange={() => setForm((f) => ({ ...f, is_fraud_flagged: val }))}
                />
                <span className={`text-sm font-medium ${color}`}>{label}</span>
              </label>
            ))}
          </div>
        </FormField>

        <FormField label="Fraud Risk Score (0.0 – 1.0)">
          <input
            type="number" min="0" max="1" step="0.01"
            value={form.fraud_risk_score}
            onChange={(e) => setForm((f) => ({ ...f, fraud_risk_score: e.target.value }))}
            className={inp}
          />
        </FormField>

        <FormField label="Fraud Flags">
          <div className="flex flex-wrap gap-1.5 mt-1">
            {FRAUD_FLAGS_ALL.map((flag) => (
              <button
                key={flag} type="button"
                onClick={() => toggleFlag('fraud_flags', flag)}
                className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                  form.fraud_flags.includes(flag)
                    ? 'bg-red-100 text-red-700 border-red-300'
                    : 'bg-gray-100 text-gray-600 border-gray-200 hover:border-gray-300'
                }`}
              >
                {flag.replace(/_/g, ' ')}
              </button>
            ))}
          </div>
        </FormField>

        <FormField label="Abuse Flags">
          <div className="flex flex-wrap gap-1.5 mt-1">
            {ABUSE_FLAGS_ALL.map((flag) => (
              <button
                key={flag} type="button"
                onClick={() => toggleFlag('abuse_flags', flag)}
                className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                  form.abuse_flags.includes(flag)
                    ? 'bg-yellow-100 text-yellow-700 border-yellow-300'
                    : 'bg-gray-100 text-gray-600 border-gray-200 hover:border-gray-300'
                }`}
              >
                {flag.replace(/_/g, ' ')}
              </button>
            ))}
          </div>
        </FormField>

        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="flex-1 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
          <button
            onClick={() => onSubmit({ ...form, fraud_risk_score: Number(form.fraud_risk_score) || 0 })}
            disabled={saving}
            className="flex-1 py-2 text-sm font-medium bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-40"
          >
            {saving ? 'Saving…' : 'Update Fraud Status'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Modal: Update COD ────────────────────────────────────────────────────────
function UpdateCodModal({ customer: c, onClose, onSubmit, saving }) {
  const [form, setForm] = useState({
    cod_allowed: c.cod_allowed ?? true,
    cod_limit_per_order: String(c.cod_limit_per_order ?? 2000),
    cod_blocked: c.cod_blocked ?? false,
    cod_blocked_reason: c.cod_blocked_reason || '',
  });
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <Modal open onClose={onClose} title="Update COD Settings" width="max-w-sm">
      <div className="space-y-4">
        <div className="flex items-center justify-between py-1">
          <span className="text-sm text-gray-700 font-medium">COD Allowed</span>
          <Toggle checked={form.cod_allowed} onChange={(v) => set('cod_allowed', v)} />
        </div>
        <FormField label="COD Limit Per Order (₹)">
          <input
            type="number" min="0"
            value={form.cod_limit_per_order}
            onChange={(e) => set('cod_limit_per_order', e.target.value)}
            className={inp}
          />
        </FormField>
        <div className="flex items-center justify-between py-1">
          <span className="text-sm text-gray-700 font-medium">Block COD</span>
          <Toggle checked={form.cod_blocked} onChange={(v) => set('cod_blocked', v)} />
        </div>
        {form.cod_blocked && (
          <FormField label="Block Reason">
            <input
              value={form.cod_blocked_reason}
              onChange={(e) => set('cod_blocked_reason', e.target.value)}
              className={inp}
              placeholder="e.g. Repeated non-payment on COD orders"
            />
          </FormField>
        )}
        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="flex-1 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
          <button
            onClick={() => onSubmit({
              cod_allowed: form.cod_allowed,
              cod_limit_per_order: Number(form.cod_limit_per_order),
              cod_blocked: form.cod_blocked,
              cod_blocked_reason: form.cod_blocked ? (form.cod_blocked_reason || undefined) : undefined,
            })}
            disabled={saving}
            className="flex-1 py-2 text-sm font-medium bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-40"
          >
            {saving ? 'Saving…' : 'Update COD'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Modal: Delete Customer ───────────────────────────────────────────────────
function DeleteCustomerModal({ customer: c, onClose, onSubmit, saving }) {
  const [typed, setTyped] = useState('');

  return (
    <Modal open onClose={onClose} title="Delete Customer" width="max-w-sm">
      <div className="space-y-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
          <strong>Warning:</strong> This soft-deletes the account and revokes all active sessions. The data is retained for 30 days.
        </div>
        <div className="text-sm text-gray-600">
          Type <span className="font-mono font-semibold">{c.phone_number}</span> to confirm.
        </div>
        <input
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          className={inp}
          placeholder={c.phone_number}
        />
        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="flex-1 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
          <button
            onClick={onSubmit}
            disabled={typed !== c.phone_number || saving}
            className="flex-1 py-2 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-40"
          >
            {saving ? 'Deleting…' : 'Delete Customer'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Users() {
  const [statsData, setStatsData]   = useState(null);
  const [customers, setCustomers]   = useState([]);
  const [total, setTotal]           = useState(0);
  const [page, setPage]             = useState(1);
  const [loading, setLoading]       = useState(false);
  const [filters, setFilters]       = useState({
    search: '', account_status: '', user_tier: '', is_fraud_flagged: '', is_high_value_user: '',
    sort_by: 'created_at', sort_order: 'desc',
  });

  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [detailTab, setDetailTab]               = useState('overview');
  const [walletTxns, setWalletTxns]             = useState([]);
  const [walletTxnTotal, setWalletTxnTotal]     = useState(0);
  const [sessions, setSessions]                 = useState([]);
  const [modal, setModal]                       = useState(null);
  const [saving, setSaving]                     = useState(false);

  // ── Fetch stats ──────────────────────────────────────────────────────────
  const fetchStats = useCallback(async () => {
    try {
      const res = await usersService.stats();
      setStatsData(res?.data);
    } catch { /* non-critical */ }
  }, []);

  // ── Fetch list ───────────────────────────────────────────────────────────
  const fetchCustomers = useCallback(async (pg = 1) => {
    setLoading(true);
    try {
      const params = { page: pg, limit: LIMIT, sort_by: filters.sort_by, sort_order: filters.sort_order };
      if (filters.search)           params.search           = filters.search;
      if (filters.account_status)   params.account_status   = filters.account_status;
      if (filters.user_tier)        params.user_tier        = filters.user_tier;
      if (filters.is_fraud_flagged) params.is_fraud_flagged = filters.is_fraud_flagged;
      if (filters.is_high_value_user) params.is_high_value_user = filters.is_high_value_user;

      const res = await usersService.list(params);
      setCustomers(safeArr(res?.data?.users));
      setTotal(res?.data?.pagination?.total ?? 0);
    } catch (err) {
      toast.error(err.message ?? 'Failed to load customers');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // ── Open customer detail ──────────────────────────────────────────────────
  const openCustomer = async (row) => {
    try {
      const res = await usersService.getById(row._id);
      setSelectedCustomer(res?.data?.user ?? null);
      setDetailTab('overview');
      setWalletTxns([]);
      setSessions([]);
    } catch (err) {
      toast.error(err.message ?? 'Failed to load customer');
    }
  };

  // ── Reload selected customer after actions ────────────────────────────────
  const reloadCustomer = async () => {
    if (!selectedCustomer?._id) return;
    try {
      const res = await usersService.getById(selectedCustomer._id);
      setSelectedCustomer(res?.data?.user ?? null);
    } catch { /* ignore */ }
    fetchStats();
    fetchCustomers(page);
  };

  // ── Fetch wallet transactions on tab switch ───────────────────────────────
  const fetchWalletTxns = useCallback(async () => {
    if (!selectedCustomer?._id) return;
    try {
      const res = await usersService.getWalletTransactions(selectedCustomer._id, { page: 1, limit: 30 });
      setWalletTxns(safeArr(res?.data?.transactions));
      setWalletTxnTotal(res?.data?.pagination?.total ?? 0);
    } catch { /* ignore */ }
  }, [selectedCustomer?._id]);

  // ── Fetch sessions on tab switch ──────────────────────────────────────────
  const fetchSessions = useCallback(async () => {
    if (!selectedCustomer?._id) return;
    try {
      const res = await usersService.getSessions(selectedCustomer._id);
      setSessions(safeArr(res?.data?.sessions));
    } catch { /* ignore */ }
  }, [selectedCustomer?._id]);

  // ── Effects ───────────────────────────────────────────────────────────────
  useEffect(() => { fetchStats(); }, [fetchStats]);

  useEffect(() => {
    setPage(1);
    fetchCustomers(1);
  }, [filters.search, filters.account_status, filters.user_tier, filters.is_fraud_flagged, filters.is_high_value_user]);

  useEffect(() => {
    if (detailTab === 'wallet')   fetchWalletTxns();
    if (detailTab === 'sessions') fetchSessions();
  }, [detailTab, selectedCustomer?._id]);

  // ── Action handlers ───────────────────────────────────────────────────────
  const handleCreateCustomer = async (form) => {
    setSaving(true);
    try {
      await usersService.create(form);
      toast.success('Customer created successfully');
      setModal(null);
      fetchStats();
      fetchCustomers(1);
      setPage(1);
    } catch (err) {
      toast.error(err.message ?? 'Failed to create customer');
    } finally { setSaving(false); }
  };

  const handleUpdateStatus = async (form) => {
    setSaving(true);
    try {
      await usersService.updateStatus(selectedCustomer._id, form);
      toast.success('Account status updated');
      setModal(null);
      reloadCustomer();
    } catch (err) {
      toast.error(err.message ?? 'Failed to update status');
    } finally { setSaving(false); }
  };

  const handleUpdateTier = async (form) => {
    setSaving(true);
    try {
      await usersService.updateTier(selectedCustomer._id, form);
      toast.success('Tier updated');
      setModal(null);
      reloadCustomer();
    } catch (err) {
      toast.error(err.message ?? 'Failed to update tier');
    } finally { setSaving(false); }
  };

  const handleCreditWallet = async (form) => {
    setSaving(true);
    try {
      await usersService.creditWallet(selectedCustomer._id, form);
      toast.success(`Wallet credited with ${fmtCurrency(form.amount)}`);
      setModal(null);
      reloadCustomer();
      fetchWalletTxns();
    } catch (err) {
      toast.error(err.message ?? 'Failed to credit wallet');
    } finally { setSaving(false); }
  };

  const handleDebitWallet = async (form) => {
    setSaving(true);
    try {
      await usersService.debitWallet(selectedCustomer._id, form);
      toast.success(`Wallet debited by ${fmtCurrency(form.amount)}`);
      setModal(null);
      reloadCustomer();
      fetchWalletTxns();
    } catch (err) {
      toast.error(err.message ?? 'Failed to debit wallet');
    } finally { setSaving(false); }
  };

  const handleBlockWallet = async ({ blocked, reason }) => {
    setSaving(true);
    try {
      await usersService.blockWallet(selectedCustomer._id, { blocked, reason });
      toast.success(`Wallet ${blocked ? 'blocked' : 'unblocked'} successfully`);
      setModal(null);
      reloadCustomer();
    } catch (err) {
      toast.error(err.message ?? 'Failed to update wallet');
    } finally { setSaving(false); }
  };

  const handleRevokeAllSessions = async () => {
    setSaving(true);
    try {
      const res = await usersService.revokeAllSessions(selectedCustomer._id);
      toast.success(`${res?.data?.revoked_count ?? 0} session(s) revoked`);
      fetchSessions();
    } catch (err) {
      toast.error(err.message ?? 'Failed to revoke sessions');
    } finally { setSaving(false); }
  };

  const handleUpdateFraud = async (form) => {
    setSaving(true);
    try {
      await usersService.updateFraud(selectedCustomer._id, form);
      toast.success('Fraud status updated');
      setModal(null);
      reloadCustomer();
    } catch (err) {
      toast.error(err.message ?? 'Failed to update fraud status');
    } finally { setSaving(false); }
  };

  const handleUpdateCod = async (form) => {
    setSaving(true);
    try {
      await usersService.updateCod(selectedCustomer._id, form);
      toast.success('COD settings updated');
      setModal(null);
      reloadCustomer();
    } catch (err) {
      toast.error(err.message ?? 'Failed to update COD settings');
    } finally { setSaving(false); }
  };

  const handleDeleteCustomer = async () => {
    setSaving(true);
    try {
      await usersService.deleteCustomer(selectedCustomer._id, { reason: 'Deleted by admin' });
      toast.success('Customer deleted successfully');
      setModal(null);
      setSelectedCustomer(null);
      fetchStats();
      fetchCustomers(page);
    } catch (err) {
      toast.error(err.message ?? 'Failed to delete customer');
    } finally { setSaving(false); }
  };

  const clearFilters = () =>
    setFilters({ search: '', account_status: '', user_tier: '', is_fraud_flagged: '', is_high_value_user: '', sort_by: 'created_at', sort_order: 'desc' });

  const hasFilters = filters.search || filters.account_status || filters.user_tier || filters.is_fraud_flagged || filters.is_high_value_user;
  const totalPages = Math.ceil(total / LIMIT);
  const sd = statsData;

  // ── Table columns ─────────────────────────────────────────────────────────
  const columns = [
    {
      key: 'first_name',
      label: 'Customer',
      render: (_, row) => (
        <div className="flex items-center gap-2.5">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${row.is_fraud_flagged ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'}`}>
            {initials(row)}
          </div>
          <div>
            <div className="font-medium text-gray-900 text-sm">{customerName(row)}</div>
            <div className="text-xs text-gray-400 font-mono">{row.phone_number}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'email',
      label: 'Email',
      render: (v) => <span className="text-xs text-gray-500">{v || '—'}</span>,
    },
    {
      key: 'account_status',
      label: 'Status',
      render: (v) => <Badge variant={STATUS_VARIANTS[v] ?? 'gray'} dot>{v?.replace(/_/g, ' ')}</Badge>,
    },
    {
      key: 'user_tier',
      label: 'Tier',
      render: (v) => <Badge variant={TIER_VARIANTS[v] ?? 'gray'}>{v?.toUpperCase()}</Badge>,
    },
    {
      key: 'wallet_balance',
      label: 'Wallet',
      render: (v) => <span className="font-semibold text-sm">{fmtCurrency(v)}</span>,
    },
    {
      key: 'total_orders',
      label: 'Orders',
      render: (v) => <span className="text-sm font-medium text-gray-700">{v ?? 0}</span>,
    },
    {
      key: 'is_fraud_flagged',
      label: 'Risk',
      render: (v) => v
        ? <Badge variant="red" dot>Flagged</Badge>
        : <Badge variant="green" dot>Clean</Badge>,
    },
    {
      key: 'last_login_at',
      label: 'Last Active',
      render: (v) => <span className="text-xs text-gray-400">{fmtDate(v)}</span>,
    },
  ];

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard title="Total Customers"  value={sd?.total               ?? '—'} icon={UsersIcon}   iconColor="bg-blue-500"   compact />
        <StatCard title="Active"           value={sd?.by_status?.active   ?? '—'} icon={UserCheck}   iconColor="bg-green-500"  compact />
        <StatCard title="Fraud Flagged"    value={sd?.fraud_flagged       ?? '—'} icon={ShieldAlert} iconColor="bg-red-500"    compact />
        <StatCard title="New Today"        value={sd?.new_today           ?? '—'} icon={TrendingUp}  iconColor="bg-orange-500" compact />
      </div>

      {/* Customer List */}
      <div className="bg-white rounded-xl border border-gray-200">

        {/* Toolbar */}
        <div className="px-5 py-4 border-b border-gray-100 space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative flex-1 min-w-50 max-w-xs">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={filters.search}
                onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-orange-400"
                placeholder="Search name, phone, email…"
              />
            </div>

            {/* Status filter */}
            <select
              value={filters.account_status}
              onChange={(e) => setFilters((f) => ({ ...f, account_status: e.target.value }))}
              className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-orange-400 bg-white"
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="permanently_banned">Permanently Banned</option>
              <option value="pending_verification">Pending Verification</option>
            </select>

            {/* Tier filter */}
            <select
              value={filters.user_tier}
              onChange={(e) => setFilters((f) => ({ ...f, user_tier: e.target.value }))}
              className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-orange-400 bg-white"
            >
              <option value="">All Tiers</option>
              {['bronze', 'silver', 'gold', 'platinum', 'vip'].map((t) => (
                <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
              ))}
            </select>

            {/* Risk filter */}
            <select
              value={filters.is_fraud_flagged}
              onChange={(e) => setFilters((f) => ({ ...f, is_fraud_flagged: e.target.value }))}
              className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-orange-400 bg-white"
            >
              <option value="">All Risk Levels</option>
              <option value="true">Fraud Flagged</option>
              <option value="false">Clean</option>
            </select>

            <div className="ml-auto flex items-center gap-2">
              <button
                onClick={() => fetchCustomers(page)}
                title="Refresh"
                className="p-2 text-gray-400 hover:text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              </button>
              <button
                onClick={() => setModal({ type: 'createCustomer' })}
                className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600 transition-colors"
              >
                <Plus size={14} /> Add Customer
              </button>
            </div>
          </div>

          {/* Filter summary */}
          <div className="flex items-center gap-2 text-xs text-gray-400 flex-wrap">
            <span>{loading ? 'Loading…' : `${total} customer${total !== 1 ? 's' : ''} found`}</span>
            {hasFilters && (
              <button onClick={clearFilters} className="text-orange-500 hover:underline ml-1">Clear filters</button>
            )}
          </div>
        </div>

        {/* Table */}
        <Table columns={columns} data={customers} onRowClick={openCustomer} emptyMessage="No customers found. Try adjusting your filters." />

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between">
            <span className="text-xs text-gray-400">Page {page} of {totalPages}</span>
            <div className="flex items-center gap-1.5">
              <button
                disabled={page <= 1}
                onClick={() => { const p = page - 1; setPage(p); fetchCustomers(p); }}
                className="p-1.5 border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors"
              >
                <ChevronLeft size={14} />
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => { const p = page + 1; setPage(p); fetchCustomers(p); }}
                className="p-1.5 border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Customer Detail Drawer ── */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-40 flex justify-end">
          <div className="absolute inset-0 bg-black/30" onClick={() => setSelectedCustomer(null)} />
          <div className="relative w-full max-w-2xl bg-white shadow-2xl flex flex-col">

            {/* Drawer header */}
            <div className="flex items-start gap-4 px-6 py-5 border-b border-gray-200 bg-gray-50 shrink-0">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold shrink-0 ${selectedCustomer.is_fraud_flagged ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'}`}>
                {initials(selectedCustomer)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="font-semibold text-gray-900 text-base">{customerName(selectedCustomer)}</h2>
                  <Badge variant={STATUS_VARIANTS[selectedCustomer.account_status] ?? 'gray'} dot>
                    {selectedCustomer.account_status?.replace(/_/g, ' ')}
                  </Badge>
                  <Badge variant={TIER_VARIANTS[selectedCustomer.user_tier] ?? 'gray'}>
                    {selectedCustomer.user_tier?.toUpperCase()}
                  </Badge>
                  {selectedCustomer.is_fraud_flagged && <Badge variant="red" dot>Fraud Flagged</Badge>}
                  {selectedCustomer.is_high_value_user && <Badge variant="purple">High Value</Badge>}
                </div>
                <div className="flex items-center gap-4 mt-1 text-sm text-gray-500 flex-wrap">
                  <span className="flex items-center gap-1"><Phone size={12} /> <span className="font-mono">{selectedCustomer.phone_number}</span></span>
                  {selectedCustomer.email && <span className="flex items-center gap-1"><Mail size={12} /> {selectedCustomer.email}</span>}
                </div>
              </div>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-lg transition-colors shrink-0"
              >
                <X size={18} />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200 px-6 bg-white shrink-0 overflow-x-auto">
              {[
                { id: 'overview',  label: 'Overview',  Icon: Activity  },
                { id: 'wallet',    label: 'Wallet',    Icon: Wallet    },
                { id: 'sessions',  label: 'Sessions',  Icon: Clock     },
                { id: 'risk',      label: 'Risk & COD', Icon: Shield   },
              ].map(({ id, label, Icon }) => (
                <button
                  key={id}
                  onClick={() => setDetailTab(id)}
                  className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                    detailTab === id
                      ? 'border-orange-500 text-orange-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Icon size={13} /> {label}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="flex-1 overflow-y-auto">
              {detailTab === 'overview' && (
                <OverviewTab customer={selectedCustomer} onAction={(type) => setModal({ type })} />
              )}
              {detailTab === 'wallet' && (
                <WalletTab
                  customer={selectedCustomer}
                  transactions={walletTxns}
                  txnTotal={walletTxnTotal}
                  onAction={(type) => setModal({ type })}
                />
              )}
              {detailTab === 'sessions' && (
                <SessionsTab sessions={sessions} onRevokeAll={handleRevokeAllSessions} saving={saving} />
              )}
              {detailTab === 'risk' && (
                <RiskTab customer={selectedCustomer} onAction={(type) => setModal({ type })} />
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Modals ── */}
      {modal?.type === 'createCustomer' && (
        <CreateCustomerModal onClose={() => setModal(null)} onSubmit={handleCreateCustomer} saving={saving} />
      )}
      {modal?.type === 'updateStatus' && selectedCustomer && (
        <UpdateStatusModal customer={selectedCustomer} onClose={() => setModal(null)} onSubmit={handleUpdateStatus} saving={saving} />
      )}
      {modal?.type === 'updateTier' && selectedCustomer && (
        <UpdateTierModal customer={selectedCustomer} onClose={() => setModal(null)} onSubmit={handleUpdateTier} saving={saving} />
      )}
      {modal?.type === 'creditWallet' && selectedCustomer && (
        <WalletTxnModal type="credit" customer={selectedCustomer} onClose={() => setModal(null)} onSubmit={handleCreditWallet} saving={saving} />
      )}
      {modal?.type === 'debitWallet' && selectedCustomer && (
        <WalletTxnModal type="debit" customer={selectedCustomer} onClose={() => setModal(null)} onSubmit={handleDebitWallet} saving={saving} />
      )}
      {modal?.type === 'blockWallet' && selectedCustomer && (
        <BlockWalletModal customer={selectedCustomer} onClose={() => setModal(null)} onSubmit={handleBlockWallet} saving={saving} />
      )}
      {modal?.type === 'updateFraud' && selectedCustomer && (
        <UpdateFraudModal customer={selectedCustomer} onClose={() => setModal(null)} onSubmit={handleUpdateFraud} saving={saving} />
      )}
      {modal?.type === 'updateCod' && selectedCustomer && (
        <UpdateCodModal customer={selectedCustomer} onClose={() => setModal(null)} onSubmit={handleUpdateCod} saving={saving} />
      )}
      {modal?.type === 'deleteCustomer' && selectedCustomer && (
        <DeleteCustomerModal customer={selectedCustomer} onClose={() => setModal(null)} onSubmit={handleDeleteCustomer} saving={saving} />
      )}
    </div>
  );
}
