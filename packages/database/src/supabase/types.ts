// Default fallback type for when no Database type is provided
// Apps should pass their own generated Database types to the client functions
export type DefaultDatabase = {
  public: {
    Tables: Record<string, any>;
    Views: Record<string, any>;
    Functions: Record<string, any>;
    Enums: Record<string, any>;
    CompositeTypes: Record<string, any>;
  };
};

// For backward compatibility
export type Database = DefaultDatabase;

// Generic type for server action results with potential errors
export type ActionResult<T = null> =
    | { success: true; data?: T, message?: string }
    | { success: false; error: string , errors?: any | null }
    | { success: false; error: { message: string } , errors?: any | null }
    | { success: false; error: { message: string, code: string } , errors?: any | null }
