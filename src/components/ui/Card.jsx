export default function Card({ children, className = '', title, action }) {
  return (
    <div className={`bg-white rounded-xl border border-gray-200 ${className}`}>
      {title && (
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
          {action}
        </div>
      )}
      {children}
    </div>
  );
}
