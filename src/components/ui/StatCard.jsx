import { TrendingUp, TrendingDown } from 'lucide-react';

export default function StatCard({ title, value, sub, trend, trendLabel, icon: Icon, iconColor = 'bg-orange-500', compact = false }) {
  const isPositive = trend >= 0;

  return (
    <div className={`bg-white rounded-xl border border-gray-200 ${compact ? 'p-4' : 'p-5'}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide truncate">{title}</p>
          <p className={`font-bold text-gray-900 mt-1 ${compact ? 'text-xl' : 'text-2xl'}`}>{value}</p>
          {sub && <p className="text-xs text-gray-500 mt-0.5 truncate">{sub}</p>}
          {trend !== undefined && (
            <div className={`flex items-center gap-1 mt-1.5 text-xs font-medium ${isPositive ? 'text-green-600' : 'text-red-500'}`}>
              {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              {isPositive ? '+' : ''}{trend}% {trendLabel ?? ''}
            </div>
          )}
        </div>
        {Icon && (
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${iconColor}`}>
            <Icon size={18} className="text-white" />
          </div>
        )}
      </div>
    </div>
  );
}
