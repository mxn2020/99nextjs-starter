import Link from 'next/link'
import { Button } from '@99packages/ui/components/button'
import { Input } from '@99packages/ui/components/input'
import { Plus, Search } from 'lucide-react'

export function NotesHeader() {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Notes
        </h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Create and organize your notes and ideas.
        </p>
      </div>
      
      <div className="flex items-center gap-3 w-full sm:w-auto">
        <div className="relative flex-1 sm:w-80">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search notes..."
            className="pl-10"
            name="search"
          />
        </div>
        
        <Link href="/notes/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Note
          </Button>
        </Link>
      </div>
    </div>
  )
}
