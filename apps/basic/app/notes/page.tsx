import { redirect } from 'next/navigation'
import { NotesHeader } from '@/components/notes/notes-header'
import { NotesList } from '@/components/notes/notes-list'
import { NotesFilters } from '@/components/notes/notes-filters'
import { userService } from '@/lib/services'

interface NotesPageProps {
  searchParams: Promise<{ 
    search?: string
    category?: string
    sort?: string
    page?: string
  }>
}

export default async function NotesPage({ searchParams }: NotesPageProps) {
    const params = await searchParams

  const user = await userService.getCurrentUser()
  
  if (!user) {
    redirect('/auth/signin')
  }

  return (
    <div className="space-y-6">
      <NotesHeader />
      
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar with filters */}
        <div className="lg:w-64 flex-shrink-0">
          <NotesFilters />
        </div>
        
        {/* Main content */}
        <div className="flex-1">
          <NotesList searchParams={params} />
        </div>
      </div>
    </div>
  )
}
