'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle } from 'lucide-react';

export default function ModeratorPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Moderator Panel</h1>
        <p className="text-muted-foreground mt-2">Review and manage content and user activities</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Moderation Queue */}
        <Card>
          <CardHeader>
            <CardTitle>Pending Reviews</CardTitle>
            <CardDescription>Items awaiting moderation</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">No items pending review</p>
            </div>
          </CardContent>
        </Card>

        {/* Activity Log */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>User activity log</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">No activities to display</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Role Information */}
      <Card>
        <CardHeader>
          <CardTitle>Your Role</CardTitle>
          <CardDescription>Moderator permissions and responsibilities</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Badge className="mt-1">✓</Badge>
              <div>
                <p className="font-medium">Review Content</p>
                <p className="text-sm text-muted-foreground">Review user-submitted content and approve or reject</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Badge className="mt-1">✓</Badge>
              <div>
                <p className="font-medium">Monitor Activity</p>
                <p className="text-sm text-muted-foreground">View user activities and identify potential issues</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Badge className="mt-1">✓</Badge>
              <div>
                <p className="font-medium">Generate Reports</p>
                <p className="text-sm text-muted-foreground">Create moderation reports for admin review</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
