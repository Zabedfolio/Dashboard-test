'use client';

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  async function sendReset(e) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Password reset email sent.");
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Forgot Password</CardTitle>
          <CardDescription>Enter your account email.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={sendReset} className="space-y-3">
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <Button className="w-full" disabled={loading}>{loading ? "Sending..." : "Send reset link"}</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
