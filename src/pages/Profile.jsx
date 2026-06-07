import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  User, Shield, Activity, Edit3, Save, X, Eye, EyeOff, Loader2,
  AlertCircle, CheckCircle2, Lock, Trash2, AlertTriangle, Mail,
  Phone, Globe, Calendar, BadgeCheck, Monitor, Building2,
  Briefcase, Key, Clock, RefreshCw, ShieldCheck, LogOut,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import profileService from '../services/profile.service';
import toast from '../lib/toast';

// ── helpers ──────────────────────────────────────────────────────────────────
function assertSuccess(res, fallback) {
  if (res && res.success === false) {
    const err = new Error(res.message ?? fallback);
    err.status = 400;
    throw err;
  }
}
function extractErrorMessage(err, fallback) {
  if (!err) return fallback;
  if (err.message === 'Failed to fetch') return 'Unable to connect to the server.';
  if (err.status >= 500) return 'A server error occurred. Please try again.';
  return err.message ?? fallback;
}
function initials(first, last) {
  return `${first?.[0] ?? ''}${last?.[0] ?? ''}`.toUpperCase() || 'AD';
}
function fmtDate(iso, withTime = true) {
  if (!iso) return '—';
  const opts = { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' };
  if (withTime) Object.assign(opts, { hour: '2-digit', minute: '2-digit', hour12: true });
  return new Date(iso).toLocaleString('en-IN', opts);
}
function pwAgeText(iso) {
  if (!iso) return 'Never changed';
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days === 0) return 'Changed today';
  if (days === 1) return 'Changed yesterday';
  return `Changed ${days} days ago`;
}
function parseDevice(ua) {
  if (!ua) return 'Unknown Device';
  if (/PostmanRuntime/i.test(ua)) return 'Postman API Client';
  if (/iPhone|iPad/i.test(ua)) return 'iOS Browser';
  if (/Android/i.test(ua)) return 'Android Browser';
  if (/Chrome/i.test(ua)) return 'Chrome on Desktop';
  if (/Firefox/i.test(ua)) return 'Firefox on Desktop';
  if (/Safari/i.test(ua)) return 'Safari on Desktop';
  return 'Unknown Device';
}

// ── password rules ────────────────────────────────────────────────────────────
const PW_RULES = [
  { label: 'At least 8 characters',  test: (p) => p.length >= 8 },
  { label: 'One uppercase letter',   test: (p) => /[A-Z]/.test(p) },
  { label: 'One number',             test: (p) => /\d/.test(p) },
  { label: 'One special character',  test: (p) => /[^A-Za-z0-9]/.test(p) },
];
function pwStrength(pw) {
  const n = PW_RULES.filter((r) => r.test(pw)).length;
  if (n <= 1) return { score: 1, label: 'Weak',   color: 'bg-red-500',    text: 'text-red-500' };
  if (n === 2) return { score: 2, label: 'Fair',   color: 'bg-yellow-500', text: 'text-yellow-600' };
  if (n === 3) return { score: 3, label: 'Good',   color: 'bg-blue-500',   text: 'text-blue-600' };
  return             { score: 4, label: 'Strong',  color: 'bg-green-500',  text: 'text-green-600' };
}

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';
const TABS = [
  { id: 'personal', label: 'Personal Info',  icon: User },
  { id: 'security', label: 'Security',       icon: Shield },
  { id: 'activity', label: 'Login Activity', icon: Activity },
];

// ─────────────────────────────────────────────────────────────────────────────
export default function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'personal';

  const [profile, setProfile]           = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadError, setLoadError]       = useState('');

  // edit personal info
  const [editing, setEditing]           = useState(false);
  const [form, setForm]                 = useState({ first_name: '', last_name: '', department: '', designation: '' });
  const [saving, setSaving]             = useState(false);

  // change password
  const [pw, setPw]                     = useState({ current: '', next: '', confirm: '' });
  const [showPw, setShowPw]             = useState({ current: false, next: false, confirm: false });
  const [pwSaving, setPwSaving]         = useState(false);
  const [pwError, setPwError]           = useState('');
  const [pwDone, setPwDone]             = useState(false);

  // delete account
  const [deleteOpen, setDeleteOpen]     = useState(false);
  const [deleteText, setDeleteText]     = useState('');
  const [deleting, setDeleting]         = useState(false);

  useEffect(() => { loadProfile(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const loadProfile = async () => {
    setLoadingProfile(true);
    setLoadError('');
    try {
      if (USE_MOCK) {
        await new Promise((r) => setTimeout(r, 500));
        const dn = user?.display_name ?? 'Admin User';
        const [fn, ...rest] = dn.split(' ');
        const mock = {
          _id: 'adm1', employee_id: 'ZIPKART/ADMIN/0001',
          email: user?.email ?? 'admin@zipkart.in',
          phone_number: '9999999001', country_code: '+91',
          first_name: fn, last_name: rest.join(' ') || '',
          display_name: dn, department: 'Platform Engineering',
          designation: 'CTO', timezone: 'Asia/Kolkata', locale: 'en-IN',
          role_id: 'role_super_admin', role_name: 'Super Administrator',
          role_level: 1, access_level: 'global', data_scope: 'all_dark_stores',
          mfa_enabled: false, account_status: 'active',
          session_timeout_minutes: 30, max_concurrent_sessions: 2,
          onboarding_completed: true,
          password_last_changed_at: new Date(Date.now() - 3 * 86_400_000).toISOString(),
          last_login_at: new Date().toISOString(),
          last_login_ip: '::1', last_login_device: navigator?.userAgent ?? '',
          created_at: new Date(Date.now() - 30 * 86_400_000).toISOString(),
          recent_login_history: [
            { ip_address: '::1', device: navigator?.userAgent ?? '', status: 'success', login_at: new Date().toISOString() },
            { ip_address: '::1', device: 'PostmanRuntime/7.54.0', status: 'success', login_at: new Date(Date.now() - 3_600_000).toISOString() },
            { ip_address: '10.0.0.1', device: navigator?.userAgent ?? '', status: 'failed_password', login_at: new Date(Date.now() - 7_200_000).toISOString() },
          ],
        };
        setProfile(mock);
        setForm({ first_name: mock.first_name, last_name: mock.last_name, department: mock.department, designation: mock.designation });
        return;
      }
      const res = await profileService.getProfile();
      assertSuccess(res, 'Failed to load profile.');
      const admin = res.data.admin;
      setProfile(admin);
      setForm({
        first_name:  admin.first_name  ?? '',
        last_name:   admin.last_name   ?? '',
        department:  admin.department  ?? '',
        designation: admin.designation ?? '',
      });
    } catch (err) {
      const msg = extractErrorMessage(err, 'Failed to load profile.');
      setLoadError(msg);
      toast.error(msg);
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!profile?._id) return;
    setSaving(true);
    try {
      if (USE_MOCK) {
        await new Promise((r) => setTimeout(r, 700));
        setProfile((p) => ({ ...p, ...form, display_name: `${form.first_name} ${form.last_name}`.trim() }));
        setEditing(false);
        toast.success('Profile updated successfully.');
        return;
      }
      const res = await profileService.updateProfile(profile._id, form);
      assertSuccess(res, 'Update failed.');
      await loadProfile();
      setEditing(false);
      toast.success('Profile updated successfully.');
    } catch (err) {
      toast.error(extractErrorMessage(err, 'Failed to update profile.'));
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setForm({ first_name: profile?.first_name ?? '', last_name: profile?.last_name ?? '', department: profile?.department ?? '', designation: profile?.designation ?? '' });
    setEditing(false);
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwError('');
    setPwDone(false);
    if (!pw.current.trim()) { setPwError('Enter your current password.'); return; }
    if (!PW_RULES.every((r) => r.test(pw.next))) { setPwError('New password does not meet all requirements.'); return; }
    if (pw.next !== pw.confirm) { setPwError('Passwords do not match.'); return; }
    setPwSaving(true);
    try {
      if (USE_MOCK) {
        await new Promise((r) => setTimeout(r, 800));
        setPw({ current: '', next: '', confirm: '' });
        setPwDone(true);
        toast.success('Password changed successfully.');
        return;
      }
      const res = await profileService.changePassword(pw.current, pw.next, pw.confirm);
      assertSuccess(res, 'Password change failed.');
      setPw({ current: '', next: '', confirm: '' });
      setPwDone(true);
      toast.success('Password changed successfully.');
    } catch (err) {
      const msg = extractErrorMessage(err, 'Failed to change password.');
      setPwError(msg);
      toast.error(msg);
    } finally {
      setPwSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!profile?._id) return;
    setDeleting(true);
    try {
      if (USE_MOCK) {
        await new Promise((r) => setTimeout(r, 1000));
        toast.success('Account deleted.');
        logout();
        navigate('/auth/login', { replace: true });
        return;
      }
      await profileService.deleteAccount(profile._id);
      toast.success('Account deactivated. Goodbye!');
      logout();
      navigate('/auth/login', { replace: true });
    } catch (err) {
      toast.error(extractErrorMessage(err, 'Failed to delete account.'));
      setDeleting(false);
      setDeleteOpen(false);
    }
  };

  const setTab = (id) => setSearchParams({ tab: id }, { replace: true });

  // ── loading / error ──────────────────────────────────────────────────────
  if (loadingProfile) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="text-center">
          <Loader2 size={28} className="animate-spin text-orange-500 mx-auto mb-3" />
          <p className="text-sm text-gray-500">Loading your profile…</p>
        </div>
      </div>
    );
  }
  if (loadError && !profile) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="text-center max-w-xs">
          <AlertCircle size={28} className="text-red-400 mx-auto mb-3" />
          <p className="text-sm font-semibold text-gray-800 mb-1">Could not load profile</p>
          <p className="text-xs text-gray-400 mb-5">{loadError}</p>
          <button onClick={loadProfile} className="px-4 py-2 bg-orange-500 text-white text-sm font-medium rounded-xl hover:bg-orange-600 transition-colors">
            Retry
          </button>
        </div>
      </div>
    );
  }

  const avatarText = initials(profile?.first_name, profile?.last_name);

  return (
    <div className="max-w-4xl mx-auto space-y-5">

      {/* ── Profile hero card ──────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="flex items-start gap-5">
          {/* Avatar */}
          <div className="w-20 h-20 bg-linear-to-br from-orange-400 to-orange-600 rounded-2xl flex items-center justify-center text-white text-2xl font-extrabold shrink-0 shadow-lg shadow-orange-200">
            {avatarText}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h1 className="text-xl font-bold text-gray-900">{profile?.display_name ?? '—'}</h1>
                <p className="text-sm text-gray-500 mt-0.5">
                  {[profile?.designation, profile?.department].filter(Boolean).join(' · ') || profile?.role_name}
                </p>
                <div className="flex flex-wrap items-center gap-2 mt-2.5">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-orange-50 text-orange-700 text-xs font-semibold rounded-full border border-orange-200">
                    <BadgeCheck size={11} strokeWidth={2.5} /> {profile?.role_name}
                  </span>
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full border ${
                    profile?.account_status === 'active'
                      ? 'bg-green-50 text-green-700 border-green-200'
                      : 'bg-red-50 text-red-700 border-red-200'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${profile?.account_status === 'active' ? 'bg-green-500' : 'bg-red-500'}`} />
                    {profile?.account_status === 'active' ? 'Active' : profile?.account_status}
                  </span>
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full border ${
                    profile?.mfa_enabled
                      ? 'bg-blue-50 text-blue-700 border-blue-200'
                      : 'bg-gray-100 text-gray-500 border-gray-200'
                  }`}>
                    <Shield size={10} /> MFA {profile?.mfa_enabled ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
              </div>

              {/* Meta stats */}
              <div className="hidden sm:grid grid-cols-2 gap-2.5 shrink-0">
                {[
                  { label: 'Employee ID', value: profile?.employee_id ?? '—', mono: true },
                  { label: 'Access Level', value: profile?.access_level ? profile.access_level.charAt(0).toUpperCase() + profile.access_level.slice(1) : '—' },
                  { label: 'Role Level',   value: profile?.role_level != null ? `L${profile.role_level}` : '—' },
                  { label: 'Password',     value: pwAgeText(profile?.password_last_changed_at) },
                ].map(({ label, value, mono }) => (
                  <div key={label} className="bg-gray-50 rounded-xl px-3 py-2 min-w-30">
                    <div className="text-xs text-gray-400">{label}</div>
                    <div className={`text-xs font-bold text-gray-900 mt-0.5 truncate ${mono ? 'font-mono' : ''}`}>{value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Info row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-2 mt-4 pt-4 border-t border-gray-100">
          {[
            { icon: Mail,     value: profile?.email },
            { icon: Phone,    value: profile?.phone_number ? `${profile.country_code} ${profile.phone_number}` : '—' },
            { icon: Globe,    value: profile?.timezone ?? '—' },
            { icon: Calendar, value: profile?.created_at ? `Joined ${fmtDate(profile.created_at, false)}` : '—' },
          ].map(({ icon: Icon, value }) => (
            <div key={value} className="flex items-center gap-2 text-xs text-gray-500 truncate">
              <Icon size={12} className="text-gray-400 shrink-0" />
              <span className="truncate">{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Tabbed card ───────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        {/* Tab bar */}
        <div className="flex border-b border-gray-200 overflow-x-auto">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium whitespace-nowrap transition-colors relative shrink-0 ${
                activeTab === id
                  ? 'text-orange-600 bg-orange-50/60'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              {activeTab === id && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500" />
              )}
              <Icon size={15} />
              {label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6">
          {activeTab === 'personal' && (
            <PersonalInfoTab
              profile={profile}
              form={form} setForm={setForm}
              editing={editing} setEditing={setEditing}
              saving={saving}
              onSave={handleSaveProfile}
              onCancel={handleCancelEdit}
            />
          )}
          {activeTab === 'security' && (
            <SecurityTab
              profile={profile}
              pw={pw} setPw={setPw}
              showPw={showPw} setShowPw={setShowPw}
              pwSaving={pwSaving} pwError={pwError} setPwError={setPwError}
              pwDone={pwDone} setPwDone={setPwDone}
              onChangePassword={handleChangePassword}
              onDeleteClick={() => setDeleteOpen(true)}
            />
          )}
          {activeTab === 'activity' && (
            <LoginActivityTab history={profile?.recent_login_history ?? []} />
          )}
        </div>
      </div>

      {/* ── Delete modal ─────────────────────────────────────────────── */}
      {deleteOpen && (
        <DeleteModal
          displayName={profile?.display_name ?? 'your account'}
          deleteText={deleteText}
          setDeleteText={setDeleteText}
          deleting={deleting}
          onConfirm={handleDeleteAccount}
          onClose={() => { setDeleteOpen(false); setDeleteText(''); }}
        />
      )}
    </div>
  );
}

// ── Personal Info Tab ──────────────────────────────────────────────────────
function PersonalInfoTab({ profile, form, setForm, editing, setEditing, saving, onSave, onCancel }) {
  const readonlyFields = [
    { label: 'Email Address', value: profile?.email, icon: Mail },
    { label: 'Phone Number',  value: profile?.phone_number ? `${profile.country_code} ${profile.phone_number}` : '—', icon: Phone },
    { label: 'Role',          value: profile?.role_name, icon: BadgeCheck },
    { label: 'Role Level',    value: profile?.role_level != null ? `Level ${profile.role_level}` : '—', icon: Shield },
    { label: 'Access Level',  value: profile?.access_level ?? '—', icon: Globe },
    { label: 'Data Scope',    value: profile?.data_scope?.replace(/_/g, ' ') ?? '—', icon: Activity },
    { label: 'Timezone',      value: profile?.timezone ?? '—', icon: Clock },
    { label: 'Locale',        value: profile?.locale ?? '—', icon: Globe },
  ];

  return (
    <div className="space-y-6">
      {/* Editable section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Profile Information</h3>
            <p className="text-xs text-gray-400 mt-0.5">Update your personal details</p>
          </div>
          {!editing ? (
            <button
              onClick={() => setEditing(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Edit3 size={13} /> Edit
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={onCancel}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <X size={13} /> Cancel
              </button>
              <button
                onClick={onSave}
                disabled={saving}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-orange-500 rounded-lg hover:bg-orange-600 disabled:opacity-60 transition-colors"
              >
                {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                {saving ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { key: 'first_name',  label: 'First Name',   icon: User,      placeholder: 'First name' },
            { key: 'last_name',   label: 'Last Name',    icon: User,      placeholder: 'Last name' },
            { key: 'department',  label: 'Department',   icon: Building2, placeholder: 'e.g. Platform Engineering' },
            { key: 'designation', label: 'Designation',  icon: Briefcase, placeholder: 'e.g. CTO' },
          ].map(({ key, label, icon: Icon, placeholder }) => (
            <div key={key}>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">{label}</label>
              <div className="relative">
                <Icon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  value={form[key]}
                  onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                  disabled={!editing}
                  placeholder={placeholder}
                  className={`w-full pl-9 pr-3.5 py-2.5 text-sm rounded-xl border transition-all ${
                    editing
                      ? 'border-gray-200 bg-white focus:border-orange-400 focus:ring-2 focus:ring-orange-100 focus:outline-none'
                      : 'border-gray-100 bg-gray-50 text-gray-600 cursor-default'
                  }`}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-gray-100 pt-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Account Details</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {readonlyFields.map(({ label, value, icon: Icon }) => (
            <div key={label} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
              <div className="w-7 h-7 bg-white rounded-lg border border-gray-200 flex items-center justify-center shrink-0">
                <Icon size={13} className="text-gray-400" />
              </div>
              <div className="min-w-0">
                <div className="text-xs text-gray-400">{label}</div>
                <div className="text-xs font-semibold text-gray-800 truncate capitalize mt-0.5">{value ?? '—'}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Security Tab ───────────────────────────────────────────────────────────
function SecurityTab({ profile, pw, setPw, showPw, setShowPw, pwSaving, pwError, setPwError, pwDone, setPwDone, onChangePassword, onDeleteClick }) {
  const newStr = pw.next ? pwStrength(pw.next) : null;
  const allPassed  = PW_RULES.every((r) => r.test(pw.next));
  const matches    = pw.next === pw.confirm && pw.confirm.length > 0;

  const toggle = (field) => setShowPw((s) => ({ ...s, [field]: !s[field] }));

  return (
    <div className="space-y-8">
      {/* Change password */}
      <div>
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-gray-900">Change Password</h3>
          <p className="text-xs text-gray-400 mt-0.5">{pwAgeText(profile?.password_last_changed_at)}</p>
        </div>

        {pwDone ? (
          <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl">
            <CheckCircle2 size={20} className="text-green-500 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-green-800">Password changed</p>
              <p className="text-xs text-green-600 mt-0.5">Your password has been updated successfully.</p>
            </div>
            <button onClick={() => setPwDone(false)} className="ml-auto text-xs text-green-700 hover:text-green-900 font-medium">
              Change again
            </button>
          </div>
        ) : (
          <form onSubmit={onChangePassword} className="space-y-4 max-w-md">
            {/* Current password */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Current password</label>
              <div className="relative">
                <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input
                  type={showPw.current ? 'text' : 'password'}
                  value={pw.current}
                  onChange={(e) => { setPw((p) => ({ ...p, current: e.target.value })); setPwError(''); setPwDone(false); }}
                  placeholder="Enter current password"
                  required
                  className="w-full pl-9 pr-10 py-2.5 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:border-orange-400 focus:ring-2 focus:ring-orange-100 focus:outline-none transition-all"
                />
                <button type="button" tabIndex={-1} onClick={() => toggle('current')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPw.current ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            {/* New password */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">New password</label>
              <div className="relative">
                <Key size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input
                  type={showPw.next ? 'text' : 'password'}
                  value={pw.next}
                  onChange={(e) => { setPw((p) => ({ ...p, next: e.target.value })); setPwError(''); }}
                  placeholder="Min 8 chars, uppercase, number, special"
                  required
                  className="w-full pl-9 pr-10 py-2.5 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:border-orange-400 focus:ring-2 focus:ring-orange-100 focus:outline-none transition-all"
                />
                <button type="button" tabIndex={-1} onClick={() => toggle('next')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPw.next ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              {/* Strength bar */}
              {pw.next && newStr && (
                <div className="mt-2">
                  <div className="flex gap-1 mb-1.5">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className={`flex-1 h-1.5 rounded-full transition-all ${i <= newStr.score ? newStr.color : 'bg-gray-200'}`} />
                    ))}
                  </div>
                  <div className="flex justify-between items-center">
                    <span className={`text-xs font-semibold ${newStr.text}`}>{newStr.label} password</span>
                    <span className="text-xs text-gray-400">{newStr.score}/4</span>
                  </div>
                </div>
              )}
              {/* Rules */}
              {pw.next && (
                <div className="mt-3 grid grid-cols-2 gap-1.5">
                  {PW_RULES.map((rule) => {
                    const ok = rule.test(pw.next);
                    return (
                      <div key={rule.label} className={`flex items-center gap-1.5 text-xs ${ok ? 'text-green-600' : 'text-gray-400'}`}>
                        <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 ${ok ? 'bg-green-500' : 'bg-gray-200'}`}>
                          {ok && <span className="text-white text-[8px] font-bold">✓</span>}
                        </div>
                        {rule.label}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Confirm password */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Confirm new password</label>
              <div className="relative">
                <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input
                  type={showPw.confirm ? 'text' : 'password'}
                  value={pw.confirm}
                  onChange={(e) => { setPw((p) => ({ ...p, confirm: e.target.value })); setPwError(''); }}
                  placeholder="Re-enter new password"
                  required
                  className={`w-full pl-9 pr-10 py-2.5 text-sm border rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 transition-all ${
                    pw.confirm && !matches ? 'border-red-300 focus:border-red-400 focus:ring-red-100' :
                    pw.confirm &&  matches ? 'border-green-400 focus:border-green-400 focus:ring-green-100' :
                    'border-gray-200 focus:border-orange-400 focus:ring-orange-100'
                  }`}
                />
                <button type="button" tabIndex={-1} onClick={() => toggle('confirm')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPw.confirm ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              {pw.confirm && !matches && <p className="text-xs text-red-500 mt-1">Passwords do not match</p>}
              {pw.confirm &&  matches && (
                <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                  <CheckCircle2 size={11} strokeWidth={2.5} /> Passwords match
                </p>
              )}
            </div>

            {pwError && (
              <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-xl px-3.5 py-3">
                <AlertCircle size={14} className="text-red-500 shrink-0 mt-0.5" />
                <p className="text-xs text-red-700 font-medium">{pwError}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={pwSaving || !pw.current || !allPassed || !matches}
              className="flex items-center gap-2 px-4 py-2.5 bg-orange-500 text-white text-sm font-semibold rounded-xl hover:bg-orange-600 disabled:opacity-60 disabled:cursor-not-allowed transition-all shadow-md shadow-orange-200"
            >
              {pwSaving ? <><Loader2 size={14} className="animate-spin" /> Updating…</> : <><ShieldCheck size={14} /> Update password</>}
            </button>
          </form>
        )}
      </div>

      {/* Session settings info */}
      <div className="border-t border-gray-100 pt-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Session Settings</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[
            { label: 'Session Timeout',    value: `${profile?.session_timeout_minutes ?? 30} minutes` },
            { label: 'Max Sessions',       value: `${profile?.max_concurrent_sessions ?? 2} concurrent` },
            { label: 'Max Login Attempts', value: `${profile?.max_login_attempts ?? 5} attempts` },
            { label: 'Lockout Duration',   value: `${profile?.lockout_duration_minutes ?? 30} minutes` },
            { label: 'MFA Type',           value: profile?.mfa_type?.toUpperCase() ?? 'TOTP' },
            { label: 'IP Whitelist',       value: profile?.ip_whitelist_enabled ? 'Enabled' : 'Disabled' },
          ].map(({ label, value }) => (
            <div key={label} className="p-3 bg-gray-50 rounded-xl border border-gray-100">
              <div className="text-xs text-gray-400">{label}</div>
              <div className="text-xs font-semibold text-gray-800 mt-0.5">{value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Danger zone */}
      <div className="border-t border-gray-100 pt-6">
        <div className="border border-red-200 rounded-2xl overflow-hidden">
          <div className="bg-red-50 px-5 py-3.5 flex items-center gap-2.5">
            <AlertTriangle size={16} className="text-red-500 shrink-0" />
            <div>
              <p className="text-sm font-bold text-red-800">Danger Zone</p>
              <p className="text-xs text-red-600">These actions are irreversible. Proceed with extreme caution.</p>
            </div>
          </div>
          <div className="p-5 flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-gray-900">Delete this account</p>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed max-w-sm">
                Permanently deactivates your admin account. All associated data and sessions will be invalidated immediately. This cannot be undone.
              </p>
            </div>
            <button
              onClick={onDeleteClick}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-red-600 border border-red-300 rounded-xl hover:bg-red-50 transition-colors shrink-0"
            >
              <Trash2 size={14} /> Delete Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Login Activity Tab ─────────────────────────────────────────────────────
function LoginActivityTab({ history }) {
  if (history.length === 0) {
    return (
      <div className="text-center py-16">
        <Activity size={28} className="text-gray-300 mx-auto mb-3" />
        <p className="text-sm text-gray-400">No login activity recorded</p>
      </div>
    );
  }

  const statusConfig = {
    success:          { label: 'Success',       cls: 'bg-green-50 text-green-700 border-green-200' },
    failed_password:  { label: 'Wrong Password', cls: 'bg-red-50   text-red-700   border-red-200' },
    failed_otp:       { label: 'Wrong OTP',      cls: 'bg-red-50   text-red-700   border-red-200' },
    locked:           { label: 'Account Locked', cls: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Recent Login History</h3>
          <p className="text-xs text-gray-400 mt-0.5">Last {history.length} login attempts</p>
        </div>
        <span className="text-xs text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full">{history.length} entries</span>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-gray-50 text-left">
              <th className="px-4 py-3 font-semibold text-gray-500 whitespace-nowrap">#</th>
              <th className="px-4 py-3 font-semibold text-gray-500 whitespace-nowrap">Device</th>
              <th className="px-4 py-3 font-semibold text-gray-500 whitespace-nowrap">IP Address</th>
              <th className="px-4 py-3 font-semibold text-gray-500 whitespace-nowrap">Status</th>
              <th className="px-4 py-3 font-semibold text-gray-500 whitespace-nowrap">Time (IST)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {history.map((entry, i) => {
              const sc = statusConfig[entry.status] ?? { label: entry.status, cls: 'bg-gray-100 text-gray-600 border-gray-200' };
              return (
                <tr key={i} className={`hover:bg-gray-50 transition-colors ${i === 0 ? 'bg-orange-50/40' : ''}`}>
                  <td className="px-4 py-3 text-gray-400 font-mono">{i + 1}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Monitor size={13} className="text-gray-400 shrink-0" />
                      <span className="font-medium text-gray-700">{parseDevice(entry.device)}</span>
                      {i === 0 && <span className="text-[10px] bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded font-semibold">Current</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500 font-mono">{entry.ip_address}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${sc.cls}`}>
                      {sc.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{fmtDate(entry.login_at)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Delete Confirm Modal ───────────────────────────────────────────────────
function DeleteModal({ displayName, deleteText, setDeleteText, deleting, onConfirm, onClose }) {
  const confirmed = deleteText === displayName;
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white rounded-2xl border border-gray-200 shadow-2xl w-full max-w-md p-6 animate-in zoom-in-95">
        {/* Icon */}
        <div className="w-12 h-12 bg-red-50 border border-red-200 rounded-2xl flex items-center justify-center mb-5">
          <Trash2 size={22} className="text-red-500" />
        </div>

        <h2 className="text-lg font-bold text-gray-900">Delete your account?</h2>
        <p className="text-sm text-gray-500 mt-1.5 leading-relaxed">
          This will permanently deactivate <span className="font-semibold text-gray-700">{displayName}'s</span> account.
          All active sessions will be terminated. <strong>This action cannot be undone.</strong>
        </p>

        <div className="bg-red-50 border border-red-200 rounded-xl p-3.5 mt-4 text-xs text-red-700 space-y-1">
          <p>• All active sessions will be invalidated immediately</p>
          <p>• You will be signed out and lose access to the admin portal</p>
          <p>• Account data is soft-deleted and may be retained per data policy</p>
        </div>

        <div className="mt-5">
          <label className="block text-xs font-semibold text-gray-700 mb-2">
            Type <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded text-gray-900">{displayName}</span> to confirm
          </label>
          <input
            type="text"
            value={deleteText}
            onChange={(e) => setDeleteText(e.target.value)}
            placeholder={displayName}
            autoFocus
            className={`w-full px-3.5 py-2.5 text-sm border rounded-xl focus:outline-none focus:ring-2 transition-all ${
              confirmed ? 'border-red-400 focus:ring-red-100 bg-red-50' : 'border-gray-200 focus:border-gray-400 focus:ring-gray-100 bg-gray-50'
            }`}
          />
        </div>

        <div className="flex gap-3 mt-5">
          <button
            onClick={onClose}
            disabled={deleting}
            className="flex-1 py-2.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={!confirmed || deleting}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold text-white bg-red-500 rounded-xl hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {deleting ? <><Loader2 size={14} className="animate-spin" /> Deleting…</> : <><Trash2 size={14} /> Yes, delete account</>}
          </button>
        </div>
      </div>
    </div>
  );
}
