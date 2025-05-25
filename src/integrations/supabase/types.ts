export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      account_websites: {
        Row: {
          account_id: string | null
          created_at: string | null
          id: string
          iframe_content: string | null
          is_active: boolean | null
          updated_at: string | null
          website_title: string | null
          website_url: string
        }
        Insert: {
          account_id?: string | null
          created_at?: string | null
          id?: string
          iframe_content?: string | null
          is_active?: boolean | null
          updated_at?: string | null
          website_title?: string | null
          website_url: string
        }
        Update: {
          account_id?: string | null
          created_at?: string | null
          id?: string
          iframe_content?: string | null
          is_active?: boolean | null
          updated_at?: string | null
          website_title?: string | null
          website_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "account_websites_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      accounts: {
        Row: {
          activation_end_date: string | null
          activation_start_date: string | null
          created_at: string | null
          created_by: string | null
          database_name: string
          email: string
          id: string
          is_subscription_active: boolean | null
          name: string
          password_hash: string
          status: Database["public"]["Enums"]["account_status"] | null
          updated_at: string | null
        }
        Insert: {
          activation_end_date?: string | null
          activation_start_date?: string | null
          created_at?: string | null
          created_by?: string | null
          database_name: string
          email: string
          id?: string
          is_subscription_active?: boolean | null
          name: string
          password_hash: string
          status?: Database["public"]["Enums"]["account_status"] | null
          updated_at?: string | null
        }
        Update: {
          activation_end_date?: string | null
          activation_start_date?: string | null
          created_at?: string | null
          created_by?: string | null
          database_name?: string
          email?: string
          id?: string
          is_subscription_active?: boolean | null
          name?: string
          password_hash?: string
          status?: Database["public"]["Enums"]["account_status"] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      break_timers: {
        Row: {
          account_id: string
          created_at: string
          end_time: string
          id: string
          is_active: boolean
          position: string
          start_time: string
          title: string
          updated_at: string
        }
        Insert: {
          account_id: string
          created_at?: string
          end_time: string
          id?: string
          is_active?: boolean
          position?: string
          start_time: string
          title: string
          updated_at?: string
        }
        Update: {
          account_id?: string
          created_at?: string
          end_time?: string
          id?: string
          is_active?: boolean
          position?: string
          start_time?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "break_timers_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          account_id: string
          created_at: string
          display_duration: number
          id: string
          image_url: string | null
          is_active: boolean
          message: string | null
          position: string
          title: string
          updated_at: string
        }
        Insert: {
          account_id: string
          created_at?: string
          display_duration?: number
          id?: string
          image_url?: string | null
          is_active?: boolean
          message?: string | null
          position?: string
          title: string
          updated_at?: string
        }
        Update: {
          account_id?: string
          created_at?: string
          display_duration?: number
          id?: string
          image_url?: string | null
          is_active?: boolean
          message?: string | null
          position?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_notifications_account"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      renewal_notifications: {
        Row: {
          account_id: string
          created_at: string
          id: string
          notification_type: string
          sent_at: string
        }
        Insert: {
          account_id: string
          created_at?: string
          id?: string
          notification_type: string
          sent_at?: string
        }
        Update: {
          account_id?: string
          created_at?: string
          id?: string
          notification_type?: string
          sent_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "renewal_notifications_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          account_id: string | null
          created_at: string | null
          id: string
          role: string
          user_id: string | null
        }
        Insert: {
          account_id?: string | null
          created_at?: string | null
          id?: string
          role: string
          user_id?: string | null
        }
        Update: {
          account_id?: string | null
          created_at?: string | null
          id?: string
          role?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_current_user_super_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_super_admin: {
        Args: { user_id: string }
        Returns: boolean
      }
      user_owns_account: {
        Args: { user_id: string; account_id: string }
        Returns: boolean
      }
    }
    Enums: {
      account_status: "active" | "suspended" | "pending"
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
  public: {
    Enums: {
      account_status: ["active", "suspended", "pending"],
    },
  },
} as const
