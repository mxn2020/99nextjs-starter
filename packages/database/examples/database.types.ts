// Example usage in your Next.js app
// Save this as: types/supabase.ts in your app

// Generate this file using:
// npx supabase gen types typescript --project-id "your-project-id" > types/supabase.ts

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      // Add your other tables here...
    }
    Views: {
      // Add your views here...
    }
    Functions: {
      // Add your functions here...
    }
    Enums: {
      // Add your enums here...
    }
    CompositeTypes: {
      // Add your composite types here...
    }
  }
}
