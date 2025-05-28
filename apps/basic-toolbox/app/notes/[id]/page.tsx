import { redirect, notFound } from 'next/navigation'
import { NoteView } from '@/components/notes/note-view'
import { getNoteById } from '@/lib/queries'
import { userService } from '@/lib/services'

interface NotePageProps {
  params: Promise<{ id: string }>
}

export default async function NotePage({ params }: NotePageProps) {
  const { id } = await params

  if (!id) {
    notFound()
  }
  
  const user = await userService.getCurrentUser()
  
  if (!user) {
    redirect('/auth/signin')
  }

  const note = await getNoteById(id)

  if (!note) {
    notFound()
  }

  return (
    <div className="max-w-4xl mx-auto">
      <NoteView note={note} />
    </div>
  )
}
