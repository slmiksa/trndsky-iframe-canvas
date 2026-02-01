export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      account_slideshows: {
        Row: {
          account_id: string
          created_at: string
          id: string
          images: string[]
          interval_seconds: number
          is_active: boolean
          media_type: string | null
          title: string
          updated_at: string
          video_urls: string[] | null
        }
        Insert: {
          account_id: string
          created_at?: string
          id?: string
          images?: string[]
          interval_seconds?: number
          is_active?: boolean
          media_type?: string | null
          title: string
          updated_at?: string
          video_urls?: string[] | null
        }
        Update: {
          account_id?: string
          created_at?: string
          id?: string
          images?: string[]
          interval_seconds?: number
          is_active?: boolean
          media_type?: string | null
          title?: string
          updated_at?: string
          video_urls?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "account_slideshows_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
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
          rotation_interval: number | null
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
          rotation_interval?: number | null
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
          rotation_interval?: number | null
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
          is_active: boolean | null
          position: string | null
          start_time: string
          title: string
          updated_at: string
        }
        Insert: {
          account_id: string
          created_at?: string
          end_time: string
          id?: string
          is_active?: boolean | null
          position?: string | null
          start_time: string
          title: string
          updated_at?: string
        }
        Update: {
          account_id?: string
          created_at?: string
          end_time?: string
          id?: string
          is_active?: boolean | null
          position?: string | null
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
      gallery_images: {
        Row: {
          account_id: string
          created_at: string
          description: string | null
          display_order: number | null
          id: string
          image_url: string
          is_active: boolean | null
          title: string | null
          updated_at: string
        }
        Insert: {
          account_id: string
          created_at?: string
          description?: string | null
          display_order?: number | null
          id?: string
          image_url: string
          is_active?: boolean | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          account_id?: string
          created_at?: string
          description?: string | null
          display_order?: number | null
          id?: string
          image_url?: string
          is_active?: boolean | null
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "gallery_images_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      news_ticker: {
        Row: {
          account_id: string
          background_color: string | null
          content: string | null
          created_at: string
          display_order: number | null
          id: string
          is_active: boolean | null
          text_color: string | null
          title: string
          updated_at: string
        }
        Insert: {
          account_id: string
          background_color?: string | null
          content?: string | null
          created_at?: string
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          text_color?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          account_id?: string
          background_color?: string | null
          content?: string | null
          created_at?: string
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          text_color?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "news_ticker_account_id_fkey"
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
          display_duration: number | null
          id: string
          image_url: string | null
          is_active: boolean | null
          message: string | null
          position: string | null
          title: string
          updated_at: string
        }
        Insert: {
          account_id: string
          created_at?: string
          display_duration?: number | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          message?: string | null
          position?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          account_id?: string
          created_at?: string
          display_duration?: number | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          message?: string | null
          position?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_account_id_fkey"
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
          sent_at: string | null
        }
        Insert: {
          account_id: string
          created_at?: string
          id?: string
          notification_type: string
          sent_at?: string | null
        }
        Update: {
          account_id?: string
          created_at?: string
          id?: string
          notification_type?: string
          sent_at?: string | null
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
      subscription_requests: {
        Row: {
          company_name: string
          created_at: string
          email: string
          full_name: string
          id: string
          phone: string
          status: string
          updated_at: string
        }
        Insert: {
          company_name: string
          created_at?: string
          email: string
          full_name: string
          id?: string
          phone: string
          status?: string
          updated_at?: string
        }
        Update: {
          company_name?: string
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          phone?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      super_admins: {
        Row: {
          created_at: string | null
          id: string
          password_hash: string
          username: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          password_hash: string
          username: string
        }
        Update: {
          created_at?: string | null
          id?: string
          password_hash?: string
          username?: string
        }
        Relationships: []
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
      create_slideshow_bypass_rls: {
        Args: {
          p_account_id: string
          p_images: string[]
          p_interval_seconds?: number
          p_title: string
        }
        Returns: string
      }
      get_active_slideshows_for_account: {
        Args: { p_account_id: string }
        Returns: {
          account_id: string
          created_at: string
          id: string
          images: string[]
          interval_seconds: number
          is_active: boolean
          media_type: string | null
          title: string
          updated_at: string
          video_urls: string[] | null
        }[]
        SetofOptions: {
          from: "*"
          to: "account_slideshows"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_all_slideshows_for_account: {
        Args: { p_account_id: string }
        Returns: {
          account_id: string
          created_at: string
          id: string
          images: string[]
          interval_seconds: number
          is_active: boolean
          media_type: string | null
          title: string
          updated_at: string
          video_urls: string[] | null
        }[]
        SetofOptions: {
          from: "*"
          to: "account_slideshows"
          isOneToOne: false
          isSetofReturn: true
        }
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

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
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
