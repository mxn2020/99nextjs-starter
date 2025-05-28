'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@99packages/ui/components/card'
import { Button } from '@99packages/ui/components/button'
import { Input } from '@99packages/ui/components/input'
import { Label } from '@99packages/ui/components/label'
import { Textarea } from '@99packages/ui/components/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@99packages/ui/components/select'
import { Switch } from '@99packages/ui/components/switch'
import { notesMutations } from '@/lib/mutations'
import { Note } from '@/lib/types'
import { Save, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface NoteFormProps {
  note?: Note
  isEditing?: boolean
}

const categories = [
  'General',
  'Work',
  'Personal',
  'Ideas',
  'Tasks',
  'Projects',
]

export function NoteForm({ note, isEditing = false }: NoteFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    title: note?.title || '',
    content: note?.content || '',
    category: note?.category || 'General',
    is_favorite: note?.is_favorite || false,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      if (isEditing && note) {
        await notesMutations.updateNote(note.id, formData)
        router.push(`/notes/${note.id}`)
      } else {
        const result = await notesMutations.createNote(formData)
        if (result.success && result.data) {
          router.push(`/notes/${result.data.id}`)
        } else {
          setError(result.error || 'Failed to create note')
          return
        }
      }
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'An error occurred while saving the note')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              {isEditing ? 'Edit Note' : 'Create New Note'}
            </CardTitle>
            <Link href={isEditing ? `/notes/${note?.id}` : '/notes'}>
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
              {error}
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              placeholder="Enter note title..."
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select value={formData.category} onValueChange={(value) => handleChange('category', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="favorite">Mark as Favorite</Label>
              <div className="flex items-center space-x-2">
                <Switch
                  id="favorite"
                  checked={formData.is_favorite}
                  onCheckedChange={(checked) => handleChange('is_favorite', checked)}
                />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {formData.is_favorite ? 'Favorited' : 'Not favorited'}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Content</Label>
            <Textarea
              id="content"
              value={formData.content}
              onChange={(e) => handleChange('content', e.target.value)}
              placeholder="Write your note content here..."
              rows={12}
              className="resize-none"
            />
          </div>

          <div className="flex justify-end space-x-3">
            <Link href={isEditing ? `/notes/${note?.id}` : '/notes'}>
              <Button variant="outline" type="button">
                Cancel
              </Button>
            </Link>
            <Button type="submit" disabled={loading || !formData.title.trim()}>
              {loading ? (
                'Saving...'
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {isEditing ? 'Update Note' : 'Create Note'}
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  )
}
