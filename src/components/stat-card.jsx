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
            <p className="text-[10px] sm:text-xs uppercase tracking-wider font-bold text-muted-foreground/70">{label}</p>
            <p className="mt-0.5 text-lg sm:text-2xl font-black tracking-tight truncate">{value}</p>
            {delta &&
            <p className="text-[9px] sm:text-xs text-muted-foreground font-medium">{delta}</p>
            }
          </div>
          <div className={cn("h-10 w-10 rounded-lg grid place-items-center shrink-0", toneMap[tone])}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>);

}