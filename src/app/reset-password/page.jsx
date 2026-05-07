'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function updatePassword(e) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Password updated");
    router.push("/dashboard");
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Reset Password</CardTitle>
          <CardDescription>Set your new password.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={updatePassword} className="space-y-3">
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            <Button className="w-full" disabled={loading}>{loading ? "Updating..." : "Update password"}</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
