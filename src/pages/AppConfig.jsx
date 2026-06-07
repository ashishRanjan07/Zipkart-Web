import { useState } from 'react';
import { Settings, Save, ToggleLeft, ToggleRight } from 'lucide-react';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import StatCard from '../components/ui/StatCard';
import { appConfigs } from '../data/mockData';

export default function AppConfig() {
  const [configs, setConfigs] = useState(appConfigs);
  const [editingKey, setEditingKey] = useState(null);
  const [editValue, setEditValue] = useState('');

  const startEdit = (config) => {
    setEditingKey(config.key);
    setEditValue(typeof config.value === 'object' ? JSON.stringify(config.value) : String(config.value));
  };

  const saveEdit = (key) => {
    setConfigs(prev => prev.map(c => {
      if (c.key !== key) return c;
      let parsed = editValue;
      try { parsed = JSON.parse(editValue); } catch {}
      return { ...c, value: parsed, updatedAt: new Date().toISOString().slice(0, 10) };
    }));
    setEditingKey(null);
  };

  const toggleActive = (key) => {
    setConfigs(prev => prev.map(c => c.key === key ? { ...c, isActive: !c.isActive } : c));
  };

  const formatValue = (v) => {
    if (typeof v === 'boolean') return v ? 'true' : 'false';
    if (typeof v === 'object') return JSON.stringify(v);
    return String(v);
  };

  const valueType = (v) => {
    if (typeof v === 'boolean') return 'boolean';
    if (typeof v === 'number') return 'number';
    if (typeof v === 'object') return 'json';
    return 'string';
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <StatCard title="Total Configs" value={configs.length} icon={Settings} iconColor="bg-blue-500" compact />
        <StatCard title="Active" value={configs.filter(c=>c.isActive).length} icon={Settings} iconColor="bg-green-500" compact />
        <StatCard title="Boolean Flags" value={configs.filter(c=>typeof c.value === 'boolean').length} icon={Settings} iconColor="bg-orange-500" compact />
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3 flex items-start gap-3 text-sm">
        <span className="text-yellow-500 text-base">⚠️</span>
        <div>
          <div className="font-semibold text-yellow-800">Remote Configuration</div>
          <div className="text-yellow-700 text-xs mt-0.5">Changes here are reflected in the app in real-time. Boolean flags affect all active users. Edit carefully.</div>
        </div>
      </div>

      <Card title="App Configuration Keys">
        <div className="divide-y divide-gray-100">
          {configs.map(config => (
            <div key={config.key} className="px-5 py-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-mono text-sm font-bold text-gray-900">{config.key}</span>
                    <Badge variant={valueType(config.value) === 'boolean' ? 'purple' : valueType(config.value) === 'json' ? 'blue' : 'gray'}>
                      {valueType(config.value)}
                    </Badge>
                    {!config.isActive && <Badge variant="gray">disabled</Badge>}
                  </div>
                  <div className="text-xs text-gray-400 mb-2">{config.description} · Updated {config.updatedAt}</div>

                  {editingKey === config.key ? (
                    <div className="flex items-center gap-2">
                      <input
                        value={editValue}
                        onChange={e => setEditValue(e.target.value)}
                        className="flex-1 border border-orange-300 rounded-lg px-3 py-1.5 text-sm font-mono focus:outline-none focus:border-orange-500 bg-orange-50"
                        autoFocus
                        onKeyDown={e => { if (e.key === 'Enter') saveEdit(config.key); if (e.key === 'Escape') setEditingKey(null); }}
                      />
                      <button onClick={() => saveEdit(config.key)} className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500 text-white text-xs font-medium rounded-lg hover:bg-orange-600">
                        <Save size={12} /> Save
                      </button>
                      <button onClick={() => setEditingKey(null)} className="px-3 py-1.5 text-xs text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50">
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => startEdit(config)}
                      className="inline-flex items-center gap-2 cursor-pointer group"
                    >
                      {typeof config.value === 'boolean' ? (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => { e.stopPropagation(); toggleActive(config.key); }}
                            className={`relative w-10 h-5 rounded-full transition-colors ${config.value ? 'bg-orange-500' : 'bg-gray-300'}`}
                          >
                            <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${config.value ? 'left-5' : 'left-0.5'}`} />
                          </button>
                          <span className={`text-sm font-semibold ${config.value ? 'text-orange-600' : 'text-gray-400'}`}>
                            {config.value ? 'true' : 'false'}
                          </span>
                        </div>
                      ) : (
                        <code className="text-sm font-mono bg-gray-50 px-2 py-1 rounded border border-gray-200 group-hover:border-orange-300 group-hover:bg-orange-50 transition-colors">
                          {formatValue(config.value)}
                        </code>
                      )}
                      <span className="text-xs text-gray-400 group-hover:text-orange-500 transition-colors">click to edit</span>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => toggleActive(config.key)}
                  className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded transition-colors ${config.isActive ? 'text-green-600 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-50'}`}
                >
                  {config.isActive ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                  {config.isActive ? 'Active' : 'Disabled'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
