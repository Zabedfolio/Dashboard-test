import { Card, CardContent } from "@/components/ui/card";

import { cn } from "@/lib/utils";



const toneMap = {
  primary: "bg-primary/10 text-primary",
  success: "bg-[oklch(0.62_0.18_145_/_0.12)] text-[color:var(--success)]",
  warning: "bg-[oklch(0.78_0.16_75_/_0.18)] text-[color:var(--warning-foreground)]",
  danger: "bg-destructive/10 text-destructive"
};

export function StatCard({
  label,
  value,
  delta,
  icon: Icon,
  tone = "primary"






}) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4 md:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
            <p className="mt-1.5 text-2xl font-semibold tracking-tight truncate">{value}</p>
            {delta &&
            <p className="mt-1 text-xs text-muted-foreground">{delta}</p>
            }
          </div>
          <div className={cn("h-10 w-10 rounded-lg grid place-items-center shrink-0", toneMap[tone])}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>);

}