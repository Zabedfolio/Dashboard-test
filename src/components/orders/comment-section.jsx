'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { formatDate } from '@/lib/orders-utils'

export function CommentSection({ orderId, comments = [] }) {
  const [newComment, setNewComment] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [commentList, setCommentList] = useState(comments)

  const handleAddComment = async () => {
    if (!newComment.trim()) {
      toast.error('Please enter a comment')
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch(`/api/orders/${orderId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comment: newComment.trim() })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to add comment')
      }

      setCommentList([result.data, ...commentList])
      setNewComment('')
      toast.success('Comment added')
    } catch (error) {
      toast.error(error.message || 'Failed to add comment')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Comments</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Textarea
            placeholder="Add a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="min-h-20"
            disabled={isLoading}
          />
          <Button
            onClick={handleAddComment}
            disabled={isLoading || !newComment.trim()}
            className="w-full"
          >
            {isLoading ? 'Adding...' : 'Add Comment'}
          </Button>
        </div>

        {commentList.length === 0 ? (
          <p className="text-sm text-muted-foreground">No comments yet</p>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {commentList.map((comment) => (
              <div key={comment.id} className="border-l-2 border-muted-foreground pl-4 py-2">
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium">
                    {comment.created_by_profile?.name || 'Anonymous'}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatDate(comment.created_at)}
                  </span>
                </div>
                <p className="text-sm mt-1 text-foreground">{comment.comment}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
