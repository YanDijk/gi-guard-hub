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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      attendances: {
        Row: {
          attended_on: string
          class_id: string | null
          created_at: string
          id: string
          student_id: string
        }
        Insert: {
          attended_on?: string
          class_id?: string | null
          created_at?: string
          id?: string
          student_id: string
        }
        Update: {
          attended_on?: string
          class_id?: string | null
          created_at?: string
          id?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendances_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendances_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      classes: {
        Row: {
          capacity: number
          created_at: string
          day_of_week: number
          duration_min: number
          id: string
          level: string
          name: string
          start_time: string
        }
        Insert: {
          capacity?: number
          created_at?: string
          day_of_week: number
          duration_min?: number
          id?: string
          level?: string
          name: string
          start_time: string
        }
        Update: {
          capacity?: number
          created_at?: string
          day_of_week?: number
          duration_min?: number
          id?: string
          level?: string
          name?: string
          start_time?: string
        }
        Relationships: []
      }
      graduations: {
        Row: {
          ceremony_date: string
          created_at: string
          from_belt: Database["public"]["Enums"]["belt"]
          from_stripes: number
          id: string
          notes: string | null
          student_id: string
          to_belt: Database["public"]["Enums"]["belt"]
          to_stripes: number
        }
        Insert: {
          ceremony_date: string
          created_at?: string
          from_belt: Database["public"]["Enums"]["belt"]
          from_stripes?: number
          id?: string
          notes?: string | null
          student_id: string
          to_belt: Database["public"]["Enums"]["belt"]
          to_stripes?: number
        }
        Update: {
          ceremony_date?: string
          created_at?: string
          from_belt?: Database["public"]["Enums"]["belt"]
          from_stripes?: number
          id?: string
          notes?: string | null
          student_id?: string
          to_belt?: Database["public"]["Enums"]["belt"]
          to_stripes?: number
        }
        Relationships: [
          {
            foreignKeyName: "graduations_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          due_date: string
          id: string
          method: string | null
          notes: string | null
          paid_at: string | null
          reference_month: string
          student_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          due_date: string
          id?: string
          method?: string | null
          notes?: string | null
          paid_at?: string | null
          reference_month: string
          student_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          due_date?: string
          id?: string
          method?: string | null
          notes?: string | null
          paid_at?: string | null
          reference_month?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          active: boolean
          avatar_url: string | null
          belt: Database["public"]["Enums"]["belt"]
          birth_date: string | null
          created_at: string
          due_day: number
          full_name: string
          id: string
          monthly_fee: number
          phone: string | null
          stripes: number
          updated_at: string
          weight_kg: number | null
        }
        Insert: {
          active?: boolean
          avatar_url?: string | null
          belt?: Database["public"]["Enums"]["belt"]
          birth_date?: string | null
          created_at?: string
          due_day?: number
          full_name?: string
          id: string
          monthly_fee?: number
          phone?: string | null
          stripes?: number
          updated_at?: string
          weight_kg?: number | null
        }
        Update: {
          active?: boolean
          avatar_url?: string | null
          belt?: Database["public"]["Enums"]["belt"]
          birth_date?: string | null
          created_at?: string
          due_day?: number
          full_name?: string
          id?: string
          monthly_fee?: number
          phone?: string | null
          stripes?: number
          updated_at?: string
          weight_kg?: number | null
        }
        Relationships: []
      }
      tournament_signups: {
        Row: {
          created_at: string
          id: string
          status: Database["public"]["Enums"]["signup_status"]
          student_id: string
          tournament_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          status?: Database["public"]["Enums"]["signup_status"]
          student_id: string
          tournament_id: string
        }
        Update: {
          created_at?: string
          id?: string
          status?: Database["public"]["Enums"]["signup_status"]
          student_id?: string
          tournament_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tournament_signups_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tournament_signups_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      tournaments: {
        Row: {
          city: string | null
          created_at: string
          event_date: string
          id: string
          name: string
          notes: string | null
          registration_url: string | null
        }
        Insert: {
          city?: string | null
          created_at?: string
          event_date: string
          id?: string
          name: string
          notes?: string | null
          registration_url?: string | null
        }
        Update: {
          city?: string | null
          created_at?: string
          event_date?: string
          id?: string
          name?: string
          notes?: string | null
          registration_url?: string | null
        }
        Relationships: []
      }
      training_photos: {
        Row: {
          caption: string | null
          created_at: string
          id: string
          photo_path: string
          taken_on: string
          uploaded_by: string | null
        }
        Insert: {
          caption?: string | null
          created_at?: string
          id?: string
          photo_path: string
          taken_on?: string
          uploaded_by?: string | null
        }
        Update: {
          caption?: string | null
          created_at?: string
          id?: string
          photo_path?: string
          taken_on?: string
          uploaded_by?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      claim_professor: { Args: never; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "professor" | "aluno"
      belt:
        | "branca"
        | "azul"
        | "roxa"
        | "marrom"
        | "preta"
        | "coral"
        | "vermelha"
      signup_status: "recomendado" | "convocado" | "inscrito"
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
      app_role: ["professor", "aluno"],
      belt: ["branca", "azul", "roxa", "marrom", "preta", "coral", "vermelha"],
      signup_status: ["recomendado", "convocado", "inscrito"],
    },
  },
} as const
