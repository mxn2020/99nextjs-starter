'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@99packages/ui/components/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@99packages/ui/components/alert-dialog'
import { DropdownMenuItem } from '@99packages/ui/components/dropdown-menu'
import { notesMutations } from '@/lib/mutations'
import { Trash2 } from 'lucide-react'

interface DeleteNoteButtonProps {
  noteId: string
  noteTitle: string
  redirectAfterDelete?: string
  className?: string
  variant?: 'button' | 'dropdown'
}

export function DeleteNoteButton({ 
  noteId, 
  noteTitle, 
  redirectAfterDelete,
  className,
  variant = 'button'
}: DeleteNoteButtonProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleDelete = async () => {
    setLoading(true)
    try {
      const result = await notesMutations.deleteNote(noteId)
      
      if (result.success) {
        if (redirectAfterDelete) {
          router.push(redirectAfterDelete)
        } else {
          router.refresh()
        }
      } else {
        console.error('Error deleting note:', result.error)
      }
    } catch (error) {
      console.error('Error deleting note:', error)
      // You could add a toast notification here
    } finally {
      setLoading(false)
      setOpen(false)
    }
  }

  const trigger = variant === 'dropdown' ? (
    <DropdownMenuItem
      className="text-red-600 focus:text-red-600 cursor-pointer"
      onSelect={(e) => {
        e.preventDefault()
        setOpen(true)
      }}
    >
      <Trash2 className="h-4 w-4 mr-2" />
      Delete
    </DropdownMenuItem>
  ) : (
    <Button variant="destructive" className={className}>
      <Trash2 className="h-4 w-4 mr-2" />
      Delete
    </Button>
  )

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        {trigger}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Note</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete "{noteTitle}"? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={loading}
            className="bg-red-600 hover:bg-red-700"
          >
            {loading ? 'Deleting...' : 'Delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
