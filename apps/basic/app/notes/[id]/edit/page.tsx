import { redirect, notFound } from 'next/navigation'
import { NoteForm } from '@/components/notes/note-form'
import { getNoteById } from '@/lib/queries'
import { userService } from '@/lib/services'

interface EditNotePageProps {
  params: Promise<{ id: string }>
}

export default async function EditNotePage({ params }: EditNotePageProps) {
  const { id } = await params
  const user = await userService.getCurrentUser()
  
  if (!user) {
    redirect('/auth/signin')
  }

  const note = await getNoteById(id)

  if (!note) {
    notFound()
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Edit Note
        </h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Make changes to your note.
        </p>
      </div>
      
      <NoteForm note={note} isEditing={true} />
    </div>
  )
}
