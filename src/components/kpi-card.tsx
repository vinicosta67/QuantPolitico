import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ArrowUp, ArrowDown } from "lucide-react";
import type { Kpi } from "@/lib/types";

export function KpiCard({ kpi }: { kpi: Kpi }) {
  const isIncrease = kpi.changeType === "increase";
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{kpi.label}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{kpi.value}</div>
        <p className="text-xs text-muted-foreground">{kpi.description}</p>
        {kpi.change && (
          <div className="mt-2 flex items-center gap-1 text-xs">
            <span
              className={cn(
                "flex items-center gap-1",
                isIncrease ? "text-green-600" : "text-red-600"
              )}
            >
              {isIncrease ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
              {kpi.change}
            </span>
            <span className="text-muted-foreground">desde o último mês</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
