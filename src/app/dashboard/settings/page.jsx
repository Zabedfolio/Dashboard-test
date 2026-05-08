'use client';

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

export default function SettingsPage() {
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({
    businessName: "Hatkhola & Lakum",
    owner: "Business Owner",
    phone: "+880 1700-000000",
    currency: "BDT (৳)",
    lowStockAlerts: true,
    autoInvoiceNumbers: true,
    printReceipt: true,
  });

  const handleInputChange = (field, value) => {
    setSettings((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSaveChanges = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save settings");
      }

      toast.success("Settings saved successfully");
    } catch (error) {
      toast.error(error.message || "Failed to save settings");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid gap-4 max-w-3xl">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Business Profile</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          <div>
            <label className="text-xs text-muted-foreground">Business Name</label>
            <Input
              value={settings.businessName}
              onChange={(e) => handleInputChange("businessName", e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Owner</label>
            <Input
              value={settings.owner}
              onChange={(e) => handleInputChange("owner", e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Phone</label>
            <Input
              value={settings.phone}
              onChange={(e) => handleInputChange("phone", e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Currency</label>
            <Input
              value={settings.currency}
              onChange={(e) => handleInputChange("currency", e.target.value)}
            />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Preferences</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">Low stock alerts</p>
              <p className="text-xs text-muted-foreground truncate">Notify when variant stock ≤ 10</p>
            </div>
            <Switch
              checked={settings.lowStockAlerts}
              onCheckedChange={(checked) => handleInputChange("lowStockAlerts", checked)}
              className="shrink-0"
            />
          </div>
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">Auto-generate invoice numbers</p>
              <p className="text-xs text-muted-foreground truncate">Sequential numbering</p>
            </div>
            <Switch
              checked={settings.autoInvoiceNumbers}
              onCheckedChange={(checked) => handleInputChange("autoInvoiceNumbers", checked)}
              className="shrink-0"
            />
          </div>
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">Print receipt after sale</p>
              <p className="text-xs text-muted-foreground truncate">Open print dialog</p>
            </div>
            <Switch
              checked={settings.printReceipt}
              onCheckedChange={(checked) => handleInputChange("printReceipt", checked)}
              className="shrink-0"
            />
          </div>
        </CardContent>
      </Card>
      <div className="flex justify-end">
        <Button onClick={handleSaveChanges} disabled={loading}>
          {loading ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}
