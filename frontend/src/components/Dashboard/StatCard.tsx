import { clsx } from "clsx";

interface StatCardProps {
  title: string;
  value: string;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon?: React.ReactNode;
}

const iconContainerColors = {
  positive: "bg-emerald-50 text-emerald-600",
  negative: "bg-red-50 text-red-500",
  neutral: "bg-brand-50 text-brand-600",
};

export function StatCard({ title, value, change, changeType = "neutral", icon }: StatCardProps) {
  return (
    <div className="card p-5 group">
      <div className="flex items-start justify-between mb-3">
        <p className="text-[13px] font-medium text-surface-500">{title}</p>
        {icon && (
          <div
            className={clsx(
              "w-9 h-9 rounded-xl flex items-center justify-center transition-transform duration-200 group-hover:scale-110",
              iconContainerColors[changeType]
            )}
          >
            {icon}
          </div>
        )}
      </div>
      <p className="text-[26px] font-bold text-surface-900 tracking-tight">{value}</p>
      {change && (
        <p
          className={clsx(
            "text-xs font-medium mt-1.5",
            changeType === "positive" && "text-emerald-600",
            changeType === "negative" && "text-red-500",
            changeType === "neutral" && "text-surface-500"
          )}
        >
          {change}
        </p>
      )}
    </div>
  );
}
