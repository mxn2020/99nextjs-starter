import Link from 'next/link'
import { Card, CardContent } from '@99packages/ui/components/card'
import { Badge } from '@99packages/ui/components/badge'
import { Button } from '@99packages/ui/components/button'
import { getUserNotes, getCurrentUser } from '@/lib/queries'
import { formatDistanceToNow } from 'date-fns'
import { FileText, Plus, MoreHorizontal } from 'lucide-react'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@99packages/ui/components/dropdown-menu'
import { DeleteNoteButton } from './delete-note-button'
import { redirect } from 'next/navigation'

interface NotesListProps {
  searchParams: { 
    search?: string
    category?: string
    sort?: string
    page?: string
  }
}

export async function NotesList({ searchParams }: NotesListProps) {
  // Get current user
  const currentUser = await getCurrentUser()
  
  if (!currentUser) {
    redirect('/auth/signin')
  }

  // Call getUserNotes with the correct parameters
  const notesResponse = await getUserNotes(
    currentUser.id,
    {
      search: searchParams.search,
      category: searchParams.category === 'All' ? undefined : searchParams.category,
    },
    {
      sort: { 
        field: (searchParams.sort && searchParams.sort.includes('_')) ? searchParams.sort.split('_')[0] || 'updated_at' : 'updated_at',
        direction: (searchParams.sort && searchParams.sort.includes('desc')) ? 'desc' : 'asc'
      },
      page: Number(searchParams.page) || 1,
      limit: 20,
    }
  )

  // Handle the paginated response structure
  const notes = notesResponse?.data || []

  if (!notes || notes.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <FileText className="h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No notes found
          </h3>
          <p className="text-gray-500 dark:text-gray-400 text-center mb-6 max-w-sm">
            {searchParams.search 
              ? `No notes match your search for "${searchParams.search}"`
              : "You haven't created any notes yet. Create your first note to get started."
            }
          </p>
          <Link href="/notes/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Note
            </Button>
          </Link>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4">
        {notes.map((note) => (
          <Card key={note.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <Link href={`/notes/${note.id}`} className="block group">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {note.title}
                    </h3>
                    {note.content && (
                      <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 line-clamp-3">
                        {note.content.substring(0, 200)}
                        {note.content.length > 200 && '...'}
                      </p>
                    )}
                  </Link>
                  
                  <div className="flex items-center space-x-3 mt-4">
                    {note.category && (
                      <Badge variant="secondary" className="text-xs">
                        {note.category}
                      </Badge>
                    )}
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      Updated {formatDistanceToNow(new Date(note.updated_at), { addSuffix: true })}
                    </span>
                    {note.is_favorite && (
                      <Badge variant="outline" className="text-xs">
                        Favorite
                      </Badge>
                    )}
                  </div>
                </div>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href={`/notes/${note.id}/edit`}>
                        Edit
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href={`/notes/${note.id}`}>
                        View
                      </Link>
                    </DropdownMenuItem>
                    <DeleteNoteButton 
                      noteId={note.id} 
                      noteTitle={note.title} 
                      variant="dropdown"
                    />
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {/* Pagination would go here if needed */}
      {notes.length === 20 && (
        <div className="flex justify-center mt-8">
          <Button variant="outline">
            Load More
          </Button>
        </div>
      )}
    </div>
  )
}
