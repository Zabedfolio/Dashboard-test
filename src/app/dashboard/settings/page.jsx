import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

export default function SettingsPage() {
  return (
    <div className="grid gap-4 max-w-3xl">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Business Profile</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          <div>
            <label className="text-xs text-muted-foreground">Business Name</label>
            <Input defaultValue="Hatkhola & Lakum" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Owner</label>
            <Input defaultValue="Business Owner" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Phone</label>
            <Input defaultValue="+880 1700-000000" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Currency</label>
            <Input defaultValue="BDT (৳)" />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Preferences</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            ["Low stock alerts", "Notify when variant stock ≤ 10"],
            ["Auto-generate invoice numbers", "Sequential numbering"],
            ["Print receipt after sale", "Open print dialog"],
          ].map(([title, description]) => (
            <div key={title} className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{title}</p>
                <p className="text-xs text-muted-foreground">{description}</p>
              </div>
              <Switch defaultChecked />
            </div>
          ))}
        </CardContent>
      </Card>
      <div className="flex justify-end">
        <Button>Save Changes</Button>
      </div>
    </div>
  );
}
