const StatCard = ({ title, value, icon: Icon, gradient, onClick, isSelected }) => (
  <div
    className={`${gradient} rounded-xl p-6 text-white shadow-lg ${onClick ? 'cursor-pointer hover:scale-105 transition-transform' : ''} ${isSelected ? 'ring-4 ring-white ring-offset-2 scale-105' : ''}`}
    onClick={onClick}
  >
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium opacity-90">{title}</p>
        <p className="text-3xl font-bold mt-1">{value}</p>
      </div>
      <Icon className="w-12 h-12 opacity-80" />
    </div>
  </div>
);

export default StatCard;
