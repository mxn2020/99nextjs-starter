import Link from 'next/link'
import { Card, CardContent, CardHeader } from '@99packages/ui/components/card'
import { Button } from '@99packages/ui/components/button'
import { Badge } from '@99packages/ui/components/badge'
import { Note } from '@/lib/types'
import { formatDistanceToNow } from 'date-fns'
import { ArrowLeft, Edit, Star, Calendar, Tag } from 'lucide-react'
import { DeleteNoteButton } from './delete-note-button'

interface NoteViewProps {
  note: Note
}

export function NoteView({ note }: NoteViewProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <Link href="/notes">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Notes
              </Button>
            </Link>
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {note.title}
          </h1>
          
          <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-center space-x-1">
              <Calendar className="h-4 w-4" />
              <span>
                Updated {formatDistanceToNow(new Date(note.updated_at), { addSuffix: true })}
              </span>
            </div>
            
            {note.category && (
              <div className="flex items-center space-x-1">
                <Tag className="h-4 w-4" />
                <Badge variant="secondary">{note.category}</Badge>
              </div>
            )}
            
            {note.is_favorite && (
              <div className="flex items-center space-x-1">
                <Star className="h-4 w-4 text-yellow-500 fill-current" />
                <span>Favorited</span>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Link href={`/notes/${note.id}/edit`}>
            <Button variant="outline">
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </Link>
          <DeleteNoteButton 
            noteId={note.id} 
            noteTitle={note.title} 
            redirectAfterDelete="/notes"
          />
        </div>
      </div>

      {/* Content */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium">Content</h2>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Created {formatDistanceToNow(new Date(note.created_at), { addSuffix: true })}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {note.content ? (
            <div className="prose prose-gray dark:prose-invert max-w-none">
              <div className="whitespace-pre-wrap text-gray-900 dark:text-gray-100">
                {note.content}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <p>This note has no content yet.</p>
              <Link href={`/notes/${note.id}/edit`}>
                <Button variant="outline" className="mt-4">
                  <Edit className="h-4 w-4 mr-2" />
                  Add Content
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Metadata */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-medium">Note Details</h3>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-900 dark:text-white">Created:</span>
              <p className="text-gray-600 dark:text-gray-400">
                {new Date(note.created_at).toLocaleDateString()} at{' '}
                {new Date(note.created_at).toLocaleTimeString()}
              </p>
            </div>
            
            <div>
              <span className="font-medium text-gray-900 dark:text-white">Last Updated:</span>
              <p className="text-gray-600 dark:text-gray-400">
                {new Date(note.updated_at).toLocaleDateString()} at{' '}
                {new Date(note.updated_at).toLocaleTimeString()}
              </p>
            </div>
            
            <div>
              <span className="font-medium text-gray-900 dark:text-white">Category:</span>
              <p className="text-gray-600 dark:text-gray-400">
                {note.category || 'Uncategorized'}
              </p>
            </div>
            
            <div>
              <span className="font-medium text-gray-900 dark:text-white">Status:</span>
              <p className="text-gray-600 dark:text-gray-400">
                {note.is_favorite ? 'Favorited' : 'Regular'} note
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
