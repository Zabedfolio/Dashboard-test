'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

export default function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [setupError, setSetupError] = useState('');
  const supabase = createClient();

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);

      if (user) {
        const { data: profileData, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error?.code === 'PGRST205') {
          setSetupError('Supabase setup is incomplete: public.profiles table is missing.');
          setProfile({
            id: user.id,
            email: user.email,
            name: user.user_metadata?.name || user.user_metadata?.full_name || '',
            role: user.email?.toLowerCase() === (process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL || 'admin@example.com').toLowerCase() ? 'admin' : 'user',
            created_at: user.created_at,
          });
          return;
        }
        if (error) throw error;
        setProfile(profileData);
        setName(profileData?.name || '');
      }
    } catch (error) {
      toast.error('Failed to load profile: ' + error.message);
    }
  };

  const updateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ name })
        .eq('id', currentUser.id);

      if (error) throw error;
      
      setProfile({ ...profile, name });
      setEditing(false);
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error('Failed to update profile: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  if (!profile || !currentUser) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold">Profile</h1>
        <p className="text-muted-foreground mt-2">Manage your account information</p>
      </div>

      {/* Profile Information */}
      {setupError && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="text-yellow-900">Database Setup Required</CardTitle>
            <CardDescription className="text-yellow-800">
              Run supabase/rbac.sql in the Supabase SQL editor to enable saved profiles and roles.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
          <CardDescription>Your personal account details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Email */}
          <div>
            <Label className="text-sm text-muted-foreground">Email Address</Label>
            <p className="text-lg font-medium mt-1">{currentUser.email}</p>
            <p className="text-sm text-muted-foreground mt-1">Your email cannot be changed</p>
          </div>

          {/* Role */}
          <div>
            <Label className="text-sm text-muted-foreground">Role</Label>
            <div className="mt-1">
              <Badge variant={profile.role === 'admin' ? 'destructive' : profile.role === 'moderator' ? 'secondary' : 'default'}>
                {profile.role}
              </Badge>
            </div>
          </div>

          {/* Name */}
          {editing ? (
            <form onSubmit={updateProfile} className="space-y-3">
              <div>
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your full name"
                  disabled={loading}
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={loading}>
                  {loading ? 'Saving...' : 'Save'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setEditing(false);
                    setName(profile?.name || '');
                  }}
                  disabled={loading}
                >
                  Cancel
                </Button>
              </div>
            </form>
          ) : (
            <div>
              <Label className="text-sm text-muted-foreground">Full Name</Label>
              <p className="text-lg font-medium mt-1">{profile.name || 'Not set'}</p>
              <Button
                variant="outline"
                onClick={() => setEditing(true)}
                className="mt-3"
              >
                Edit
              </Button>
            </div>
          )}

          {/* Account Created */}
          <div>
            <Label className="text-sm text-muted-foreground">Account Created</Label>
            <p className="text-lg font-medium mt-1">
              {new Date(profile.created_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Security Section */}
      <Card>
        <CardHeader>
          <CardTitle>Security</CardTitle>
          <CardDescription>Manage your account security</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button variant="outline" className="w-full">
            Change Password
          </Button>
          <Button
            variant="destructive"
            className="w-full"
            onClick={handleSignOut}
          >
            Sign Out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
