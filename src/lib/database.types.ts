export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          operationName?: string
          query?: string
          variables?: Json
          extensions?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      user_activity_logs: {
        Row: {
          activity_type: Database["public"]["Enums"]["activity_log_type"]
          actor_id: string | null
          created_at: string
          description: string | null
          details: Json | null
          id: number
          ip_address: string | null
          target_resource_id: string | null
          target_resource_type: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          activity_type: Database["public"]["Enums"]["activity_log_type"]
          actor_id?: string | null
          created_at?: string
          description?: string | null
          details?: Json | null
          id?: number
          ip_address?: string | null
          target_resource_id?: string | null
          target_resource_type?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          activity_type?: Database["public"]["Enums"]["activity_log_type"]
          actor_id?: string | null
          created_at?: string
          description?: string | null
          details?: Json | null
          id?: number
          ip_address?: string | null
          target_resource_id?: string | null
          target_resource_type?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_activity_logs_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_activity_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          onboarding_completed: boolean
          onboarding_step: number
          preferences: Json | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id: string
          onboarding_completed?: boolean
          onboarding_step?: number
          preferences?: Json | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          onboarding_completed?: boolean
          onboarding_step?: number
          preferences?: Json | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_own_profile: {
        Args: { user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      activity_log_type:
        | "USER_LOGIN"
        | "USER_LOGOUT"
        | "USER_SIGNUP"
        | "USER_PROFILE_UPDATE"
        | "USER_PASSWORD_RESET_REQUEST"
        | "USER_PASSWORD_UPDATE"
        | "ADMIN_USER_CREATE"
        | "ADMIN_USER_UPDATE"
        | "ADMIN_USER_DELETE"
        | "ADMIN_USER_SUSPEND"
        | "ADMIN_USER_UNSUSPEND"
        | "ADMIN_USER_EMAIL_VERIFY_MANUAL"
        | "ADMIN_USER_RESEND_VERIFICATION"
        | "ADMIN_SYSTEM_SETTINGS_UPDATE"
        | "GENERAL_ADMIN_ACTION"
        | "GENERAL_USER_ACTION"
        | "USER_OAUTH_LINK"
        | "USER_OAUTH_UNLINK"
        | "USER_DATA_EXPORT_REQUEST"
        | "USER_ACCOUNT_DELETE"
      user_role: "user" | "admin"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      activity_log_type: [
        "USER_LOGIN",
        "USER_LOGOUT",
        "USER_SIGNUP",
        "USER_PROFILE_UPDATE",
        "USER_PASSWORD_RESET_REQUEST",
        "USER_PASSWORD_UPDATE",
        "ADMIN_USER_CREATE",
        "ADMIN_USER_UPDATE",
        "ADMIN_USER_DELETE",
        "ADMIN_USER_SUSPEND",
        "ADMIN_USER_UNSUSPEND",
        "ADMIN_USER_EMAIL_VERIFY_MANUAL",
        "ADMIN_USER_RESEND_VERIFICATION",
        "ADMIN_SYSTEM_SETTINGS_UPDATE",
        "GENERAL_ADMIN_ACTION",
        "GENERAL_USER_ACTION",
        "USER_OAUTH_LINK",
        "USER_OAUTH_UNLINK",
        "USER_DATA_EXPORT_REQUEST",
        "USER_ACCOUNT_DELETE",
      ],
      user_role: ["user", "admin"],
    },
  },
} as const

