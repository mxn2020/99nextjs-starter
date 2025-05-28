import { redirect } from 'next/navigation'
import { NoteForm } from '@/components/notes/note-form'
import { userService } from '@/lib/services'

export default async function NewNotePage() {
  const user = await userService.getCurrentUser()
  
  if (!user) {
    redirect('/auth/signin')
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Create New Note
        </h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Write and organize your thoughts.
        </p>
      </div>
      
      <NoteForm />
    </div>
  )
}
