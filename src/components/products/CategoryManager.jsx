'use client'

import { useState } from 'react'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { Plus, Edit, Trash2, Check, X, Tag } from 'lucide-react'
import { toast } from 'sonner'
import { createCategory, updateCategory, deleteCategory } from '@/lib/categories'

export function CategoryManager({ categories = [], onRefresh }) {
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [newName, setNewName] = useState('')
  const [newParent, setNewParent] = useState('none')
  
  const [editName, setEditName] = useState('')
  const [editParent, setEditParent] = useState('none')

  const handleAdd = async () => {
    if (!newName) return
    try {
      await createCategory({ name: newName, parent_id: newParent === 'none' ? null : newParent })
      toast.success('Category added')
      setNewName('')
      setNewParent('none')
      setIsAdding(false)
      onRefresh()
    } catch (error) {
      toast.error(error.message)
    }
  }

  const handleUpdate = async (id) => {
    try {
      await updateCategory(id, { name: editName, parent_id: editParent === 'none' ? null : editParent })
      toast.success('Category updated')
      setEditingId(null)
      onRefresh()
    } catch (error) {
      toast.error(error.message)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this category?')) return
    try {
      await deleteCategory(id)
      toast.success('Category deleted')
      onRefresh()
    } catch (error) {
      toast.error(error.message)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Tag className="w-5 h-5 text-primary" />
          Product Categories
        </h3>
        {!isAdding && (
          <Button size="sm" onClick={() => setIsAdding(true)}>
            <Plus className="w-4 h-4 mr-2" /> Add Category
          </Button>
        )}
      </div>

      {isAdding && (
        <div className="flex flex-col md:flex-row gap-3 p-4 bg-muted/30 rounded-xl border border-border/40">
          <Input 
            placeholder="Category Name" 
            value={newName} 
            onChange={(e) => setNewName(e.target.value)}
            className="flex-1"
          />
          <Select value={newParent} onValueChange={setNewParent}>
            <SelectTrigger className="w-full md:w-[200px]">
              <SelectValue placeholder="Parent Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No Parent</SelectItem>
              {categories.filter(c => !c.parent_id).map(c => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex gap-2">
            <Button onClick={handleAdd}>Save</Button>
            <Button variant="ghost" onClick={() => setIsAdding(false)}>Cancel</Button>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-border/40 bg-card/20 overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Parent Category</TableHead>
              <TableHead className="text-center">Products</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.map((cat) => (
              <TableRow key={cat.id} className="hover:bg-muted/20">
                <TableCell>
                  {editingId === cat.id ? (
                    <Input 
                      value={editName} 
                      onChange={(e) => setEditName(e.target.value)} 
                      className="h-8"
                    />
                  ) : (
                    <span className={`font-medium ${cat.parent_id ? 'pl-4 text-muted-foreground' : ''}`}>
                      {cat.parent_id && '└ '} {cat.name}
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  {editingId === cat.id ? (
                    <Select value={editParent} onValueChange={setEditParent}>
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No Parent</SelectItem>
                        {categories.filter(c => !c.parent_id && c.id !== cat.id).map(c => (
                          <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <span className="text-sm text-muted-foreground">{cat.parent_name || '-'}</span>
                  )}
                </TableCell>
                <TableCell className="text-center">
                  <span className="text-xs font-bold bg-muted px-2 py-1 rounded-full">
                    {cat.product_count}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  {editingId === cat.id ? (
                    <div className="flex justify-end gap-1">
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-green-500" onClick={() => handleUpdate(cat.id)}>
                        <Check className="w-4 h-4" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500" onClick={() => setEditingId(null)}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex justify-end gap-1">
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-8 w-8" 
                        onClick={() => {
                          setEditingId(cat.id)
                          setEditName(cat.name)
                          setEditParent(cat.parent_id || 'none')
                        }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-8 w-8 text-red-500" 
                        onClick={() => handleDelete(cat.id)}
                        disabled={cat.product_count > 0}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
