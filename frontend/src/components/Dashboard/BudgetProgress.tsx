import { Budget } from "@/types";
import { clsx } from "clsx";

interface BudgetProgressProps {
  budget: Budget;
}

export function BudgetProgress({ budget }: BudgetProgressProps) {
  const percentage = Math.min(budget.percentage_used, 100);

  const barColor = budget.is_over_budget
    ? "bg-gradient-to-r from-red-500 to-red-400"
    : percentage > 80
      ? "bg-gradient-to-r from-amber-500 to-amber-400"
      : "bg-gradient-to-r from-brand-500 to-brand-400";

  return (
    <div className="group py-3 px-4 rounded-xl hover:bg-surface-50 transition-colors duration-200">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div
            className={clsx(
              "w-2 h-2 rounded-full",
              budget.is_over_budget ? "bg-red-500" : percentage > 80 ? "bg-amber-500" : "bg-brand-500"
            )}
          />
          <span className="text-sm font-semibold text-surface-800">{budget.name}</span>
          <span className="text-[11px] font-medium text-surface-400 bg-surface-100 px-2 py-0.5 rounded-full">
            {budget.period}
          </span>
        </div>
        <span
          className={clsx(
            "text-sm font-semibold tabular-nums",
            budget.is_over_budget ? "text-red-600" : "text-surface-700"
          )}
        >
          ${budget.spent.toFixed(0)} / ${budget.amount.toFixed(0)}
        </span>
      </div>

      <div className="h-2 bg-surface-100 rounded-full overflow-hidden">
        <div
          className={clsx("h-full rounded-full transition-all duration-500 ease-out", barColor)}
          style={{ width: `${percentage}%` }}
        />
      </div>

      <div className="flex items-center justify-between mt-1.5">
        <p className="text-[11px] font-medium text-surface-400">
          {budget.percentage_used.toFixed(0)}% used
        </p>
        <p
          className={clsx(
            "text-[11px] font-medium",
            budget.is_over_budget ? "text-red-500" : "text-surface-400"
          )}
        >
          {budget.is_over_budget
            ? `$${Math.abs(budget.remaining).toFixed(0)} over`
            : `$${budget.remaining.toFixed(0)} left`}
        </p>
      </div>
    </div>
  );
}
