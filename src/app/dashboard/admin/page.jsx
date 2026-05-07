'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Loader2, Search } from 'lucide-react';

export default function AdminPage() {
  const [users, setUsers] = useState([]);
  const [searchEmail, setSearchEmail] = useState('');
  const [roleEmail, setRoleEmail] = useState('');
  const [roleToAssign, setRoleToAssign] = useState('user');
  const [loading, setLoading] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [updating, setUpdating] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const supabase = createClient();

  useEffect(() => {
    fetchCurrentUser();
    fetchUsers();
  }, []);

  const fetchCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUser(user);
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchEmail) params.set('email', searchEmail);
      const response = await fetch(`/api/admin/users?${params.toString()}`, { cache: 'no-store' });
      const payload = await response.json();

      if (!response.ok) throw new Error(payload.error || 'Failed to fetch users');
      setUsers(payload.users || []);
    } catch (error) {
      toast.error('Failed to fetch users: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchUsers();
  };

  const updateUserRole = async (userId, newRole) => {
    setUpdating(userId);
    try {
      const user = users.find((entry) => entry.id === userId);
      if (!user?.email) throw new Error('User email is missing');
      const response = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email, role: newRole }),
      });
      const payload = await response.json();

      if (!response.ok) throw new Error(payload.error || 'Failed to update role');
      
      toast.success('User role updated successfully');
      fetchUsers();
    } catch (error) {
      toast.error('Failed to update role: ' + error.message);
    } finally {
      setUpdating(null);
    }
  };

  const assignRoleByEmail = async (e) => {
    e.preventDefault();
    setAssigning(true);
    try {
      const response = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: roleEmail, role: roleToAssign }),
      });
      const payload = await response.json();

      if (!response.ok) throw new Error(payload.error || 'Failed to assign role');

      toast.success(`Role updated to ${roleToAssign}`);
      setRoleEmail('');
      fetchUsers();
    } catch (error) {
      toast.error('Failed to assign role: ' + error.message);
    } finally {
      setAssigning(false);
    }
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'admin':
        return 'destructive';
      case 'moderator':
        return 'secondary';
      default:
        return 'default';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Admin Panel</h1>
        <p className="text-muted-foreground mt-2">Manage users and roles in the system</p>
      </div>

      {/* Search and Filter Section */}
      <Card>
        <CardHeader>
          <CardTitle>Search Users</CardTitle>
          <CardDescription>Find users by email address</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="flex-1">
              <Input
                placeholder="Search by email..."
                value={searchEmail}
                onChange={(e) => setSearchEmail(e.target.value)}
              />
            </div>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  Search
                </>
              )}
            </Button>
            {searchEmail && (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setSearchEmail('');
                  setUsers([]);
                }}
              >
                Clear
              </Button>
            )}
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Assign Role by Email</CardTitle>
          <CardDescription>Grant or revoke access without browsing the user table</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={assignRoleByEmail} className="grid gap-3 md:grid-cols-[1fr_180px_auto]">
            <div>
              <Label htmlFor="role-email" className="sr-only">Email</Label>
              <Input
                id="role-email"
                type="email"
                placeholder="user@example.com"
                value={roleEmail}
                onChange={(e) => setRoleEmail(e.target.value)}
                required
              />
            </div>
            <Select value={roleToAssign} onValueChange={setRoleToAssign}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="moderator">Moderator</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
            <Button type="submit" disabled={assigning}>
              {assigning ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                'Assign Role'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Users Table Section */}
      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
          <CardDescription>
            {users.length > 0 ? `Showing ${users.length} user${users.length !== 1 ? 's' : ''}` : 'Search to view users'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {users.length > 0 ? (
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.email}</TableCell>
                      <TableCell>{user.name || '-'}</TableCell>
                      <TableCell>
                        <Badge variant={getRoleBadgeColor(user.role)}>
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(user.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        {user.id === currentUser?.id ? (
                          <span className="text-sm text-muted-foreground">You</span>
                        ) : (
                          <Select
                            value={user.role}
                            onValueChange={(newRole) => updateUserRole(user.id, newRole)}
                            disabled={updating === user.id}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="user">User</SelectItem>
                              <SelectItem value="moderator">Moderator</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No users found. Search to get started.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Role Reference */}
      <Card>
        <CardHeader>
          <CardTitle>Role Reference</CardTitle>
          <CardDescription>Understanding user roles in the system</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <Badge className="mb-2">admin</Badge>
                <p className="text-sm text-muted-foreground">
                  Full system access. Can manage users, roles, and all features.
                </p>
              </div>
              <div>
                <Badge variant="secondary" className="mb-2">moderator</Badge>
                <p className="text-sm text-muted-foreground">
                  Limited access to moderate content and user activities.
                </p>
              </div>
              <div>
                <Badge variant="default" className="mb-2">user</Badge>
                <p className="text-sm text-muted-foreground">
                  Basic access to dashboard and personal features.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
