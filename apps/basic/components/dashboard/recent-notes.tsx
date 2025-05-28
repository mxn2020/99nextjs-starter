import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@99packages/ui/components/card'
import { Button } from '@99packages/ui/components/button'
import { Badge } from '@99packages/ui/components/badge'
import { getRecentNotes } from '@/lib/queries'
import { formatDistanceToNow } from 'date-fns'
import { FileText, Plus } from 'lucide-react'

export async function RecentNotes() {
  const notes = await getRecentNotes(5)

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Recent Notes</CardTitle>
          <CardDescription>
            Your latest notes and updates
          </CardDescription>
        </div>
        <Link href="/notes/new">
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            New Note
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        {notes && notes.length > 0 ? (
          <div className="space-y-4">
            {notes.map((note) => (
              <div key={note.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <div className="flex-shrink-0">
                  <FileText className="h-5 w-5 text-gray-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <Link href={`/notes/${note.id}`} className="block">
                    <p className="text-sm font-medium text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400">
                      {note.title}
                    </p>
                    {note.content && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 truncate mt-1">
                        {note.content.substring(0, 100)}
                        {note.content.length > 100 && '...'}
                      </p>
                    )}
                  </Link>
                  <div className="flex items-center space-x-2 mt-2">
                    <Badge variant="secondary" className="text-xs">
                      {note.category || 'General'}
                    </Badge>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {formatDistanceToNow(new Date(note.updated_at), { addSuffix: true })}
                    </span>
                  </div>
                </div>
              </div>
            ))}
            <div className="pt-4 border-t">
              <Link href="/notes">
                <Button variant="outline" className="w-full">
                  View All Notes
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="text-center py-6">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
              No notes yet
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Get started by creating your first note.
            </p>
            <Link href="/notes/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Note
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
