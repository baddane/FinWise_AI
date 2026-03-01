import { Budget } from "@/types";
import { clsx } from "clsx";

interface BudgetProgressProps {
  budget: Budget;
}

export function BudgetProgress({ budget }: BudgetProgressProps) {
  const percentage = Math.min(budget.percentage_used, 100);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-gray-700">{budget.name}</span>
        <span className={clsx("font-medium", budget.is_over_budget ? "text-red-600" : "text-gray-600")}>
          ${budget.spent.toFixed(2)} / ${budget.amount.toFixed(2)}
        </span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={clsx(
            "h-full rounded-full transition-all",
            budget.is_over_budget ? "bg-red-500" : percentage > 80 ? "bg-yellow-500" : "bg-green-500"
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <p className="text-xs text-gray-500">
        {budget.is_over_budget
          ? `$${Math.abs(budget.remaining).toFixed(2)} over budget`
          : `$${budget.remaining.toFixed(2)} remaining`}
      </p>
    </div>
  );
}
