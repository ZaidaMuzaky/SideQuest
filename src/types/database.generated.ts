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
      categories: {
        Row: {
          created_at: string
          id: number
          is_enabled: boolean
          name_key: string
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: number
          is_enabled?: boolean
          name_key: string
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: number
          is_enabled?: boolean
          name_key?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      locations: {
        Row: {
          address: string | null
          area_code: string
          availability_json: Json | null
          created_at: string
          external_map_url: string | null
          id: string
          is_enabled: boolean
          latitude: number | null
          longitude: number | null
          name: string
          timezone: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          area_code: string
          availability_json?: Json | null
          created_at?: string
          external_map_url?: string | null
          id?: string
          is_enabled?: boolean
          latitude?: number | null
          longitude?: number | null
          name: string
          timezone: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          area_code?: string
          availability_json?: Json | null
          created_at?: string
          external_map_url?: string | null
          id?: string
          is_enabled?: boolean
          latitude?: number | null
          longitude?: number | null
          name?: string
          timezone?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_path: string | null
          created_at: string
          display_name: string
          onboarding_completed_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_path?: string | null
          created_at?: string
          display_name: string
          onboarding_completed_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_path?: string | null
          created_at?: string
          display_name?: string
          onboarding_completed_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      quest_completions: {
        Row: {
          completed_at: string
          id: string
          idempotency_key: string
          level_after: number
          level_before: number
          proof_id: string
          quest_instance_id: string
          user_id: string
          xp_awarded: number
        }
        Insert: {
          completed_at?: string
          id?: string
          idempotency_key: string
          level_after: number
          level_before: number
          proof_id: string
          quest_instance_id: string
          user_id: string
          xp_awarded: number
        }
        Update: {
          completed_at?: string
          id?: string
          idempotency_key?: string
          level_after?: number
          level_before?: number
          proof_id?: string
          quest_instance_id?: string
          user_id?: string
          xp_awarded?: number
        }
        Relationships: [
          {
            foreignKeyName: "quest_completions_instance_fk"
            columns: ["quest_instance_id", "user_id"]
            isOneToOne: false
            referencedRelation: "quest_instances"
            referencedColumns: ["id", "user_id"]
          },
          {
            foreignKeyName: "quest_completions_proof_fk"
            columns: ["proof_id", "quest_instance_id", "user_id"]
            isOneToOne: false
            referencedRelation: "quest_proofs"
            referencedColumns: ["id", "quest_instance_id", "user_id"]
          },
          {
            foreignKeyName: "quest_completions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      quest_instances: {
        Row: {
          abandoned_at: string | null
          accepted_at: string | null
          base_xp: number
          candidate_expires_at: string | null
          category_id: number
          completed_at: string | null
          created_at: string
          expired_at: string | null
          id: string
          location_id: string | null
          search_id: string
          snapshot: Json
          snapshot_version: number
          status: Database["public"]["Enums"]["quest_status"]
          status_reason: string | null
          template_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          abandoned_at?: string | null
          accepted_at?: string | null
          base_xp: number
          candidate_expires_at?: string | null
          category_id: number
          completed_at?: string | null
          created_at?: string
          expired_at?: string | null
          id?: string
          location_id?: string | null
          search_id: string
          snapshot: Json
          snapshot_version?: number
          status: Database["public"]["Enums"]["quest_status"]
          status_reason?: string | null
          template_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          abandoned_at?: string | null
          accepted_at?: string | null
          base_xp?: number
          candidate_expires_at?: string | null
          category_id?: number
          completed_at?: string | null
          created_at?: string
          expired_at?: string | null
          id?: string
          location_id?: string | null
          search_id?: string
          snapshot?: Json
          snapshot_version?: number
          status?: Database["public"]["Enums"]["quest_status"]
          status_reason?: string | null
          template_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quest_instances_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quest_instances_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "approved_quest_catalog"
            referencedColumns: ["location_id"]
          },
          {
            foreignKeyName: "quest_instances_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quest_instances_search_owner_fk"
            columns: ["search_id", "user_id"]
            isOneToOne: false
            referencedRelation: "quest_searches"
            referencedColumns: ["id", "user_id"]
          },
          {
            foreignKeyName: "quest_instances_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "approved_quest_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quest_instances_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "quest_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quest_instances_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      quest_proofs: {
        Row: {
          byte_size: number
          created_at: string
          id: string
          mime_type: string
          note: string | null
          quest_instance_id: string
          status: string
          storage_path: string
          updated_at: string
          user_id: string
        }
        Insert: {
          byte_size: number
          created_at?: string
          id?: string
          mime_type: string
          note?: string | null
          quest_instance_id: string
          status?: string
          storage_path: string
          updated_at?: string
          user_id: string
        }
        Update: {
          byte_size?: number
          created_at?: string
          id?: string
          mime_type?: string
          note?: string | null
          quest_instance_id?: string
          status?: string
          storage_path?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quest_proofs_instance_owner_fk"
            columns: ["quest_instance_id", "user_id"]
            isOneToOne: false
            referencedRelation: "quest_instances"
            referencedColumns: ["id", "user_id"]
          },
          {
            foreignKeyName: "quest_proofs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      quest_searches: {
        Row: {
          area_code: string | null
          budget_filter: string
          created_at: string
          distance_filter: string
          expires_at: string
          id: string
          matching_cell: string | null
          mood_filter: string
          result_reason: string | null
          time_filter: string
          user_id: string
        }
        Insert: {
          area_code?: string | null
          budget_filter: string
          created_at?: string
          distance_filter: string
          expires_at: string
          id?: string
          matching_cell?: string | null
          mood_filter: string
          result_reason?: string | null
          time_filter: string
          user_id: string
        }
        Update: {
          area_code?: string | null
          budget_filter?: string
          created_at?: string
          distance_filter?: string
          expires_at?: string
          id?: string
          matching_cell?: string | null
          mood_filter?: string
          result_reason?: string | null
          time_filter?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quest_searches_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      quest_templates: {
        Row: {
          area_codes: string[] | null
          availability_json: Json | null
          base_xp: number
          category_id: number
          created_at: string
          currency_code: string
          description: string
          difficulty: Database["public"]["Enums"]["difficulty"]
          disabled_at: string | null
          duration_max: number
          duration_min: number
          enabled_at: string | null
          estimated_cost_max: number
          estimated_cost_min: number
          id: string
          instructions: Json
          location_id: string | null
          location_mode: Database["public"]["Enums"]["location_mode"]
          moderation_status: string
          physical_demand: string
          priority: number
          safety_notes: string
          template_family_id: string
          title: string
          updated_at: string
          version: number
        }
        Insert: {
          area_codes?: string[] | null
          availability_json?: Json | null
          base_xp: number
          category_id: number
          created_at?: string
          currency_code: string
          description: string
          difficulty: Database["public"]["Enums"]["difficulty"]
          disabled_at?: string | null
          duration_max: number
          duration_min: number
          enabled_at?: string | null
          estimated_cost_max?: number
          estimated_cost_min?: number
          id?: string
          instructions: Json
          location_id?: string | null
          location_mode: Database["public"]["Enums"]["location_mode"]
          moderation_status: string
          physical_demand: string
          priority?: number
          safety_notes: string
          template_family_id: string
          title: string
          updated_at?: string
          version: number
        }
        Update: {
          area_codes?: string[] | null
          availability_json?: Json | null
          base_xp?: number
          category_id?: number
          created_at?: string
          currency_code?: string
          description?: string
          difficulty?: Database["public"]["Enums"]["difficulty"]
          disabled_at?: string | null
          duration_max?: number
          duration_min?: number
          enabled_at?: string | null
          estimated_cost_max?: number
          estimated_cost_min?: number
          id?: string
          instructions?: Json
          location_id?: string | null
          location_mode?: Database["public"]["Enums"]["location_mode"]
          moderation_status?: string
          physical_demand?: string
          priority?: number
          safety_notes?: string
          template_family_id?: string
          title?: string
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "quest_templates_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quest_templates_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "approved_quest_catalog"
            referencedColumns: ["location_id"]
          },
          {
            foreignKeyName: "quest_templates_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_preferences: {
        Row: {
          created_at: string
          default_budget: string
          default_distance: string
          default_mood: string
          default_time: string
          theme: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          default_budget: string
          default_distance: string
          default_mood: string
          default_time: string
          theme?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          default_budget?: string
          default_distance?: string
          default_mood?: string
          default_time?: string
          theme?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_progress: {
        Row: {
          completed_count: number
          level: number
          lifetime_xp: number
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_count?: number
          level?: number
          lifetime_xp?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_count?: number
          level?: number
          lifetime_xp?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      xp_ledger: {
        Row: {
          amount: number
          created_at: string
          id: string
          quest_completion_id: string
          reason: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          quest_completion_id: string
          reason: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          quest_completion_id?: string
          reason?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "xp_ledger_completion_fk"
            columns: ["quest_completion_id", "user_id", "amount"]
            isOneToOne: false
            referencedRelation: "quest_completions"
            referencedColumns: ["id", "user_id", "xp_awarded"]
          },
          {
            foreignKeyName: "xp_ledger_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
    }
    Views: {
      approved_quest_catalog: {
        Row: {
          area_codes: string[] | null
          availability_json: Json | null
          base_xp: number | null
          category_name_key: string | null
          category_slug: string | null
          currency_code: string | null
          description: string | null
          difficulty: Database["public"]["Enums"]["difficulty"] | null
          duration_max: number | null
          duration_min: number | null
          estimated_cost_max: number | null
          estimated_cost_min: number | null
          external_map_url: string | null
          id: string | null
          instructions: Json | null
          location_address: string | null
          location_area_code: string | null
          location_availability_json: Json | null
          location_id: string | null
          location_latitude: number | null
          location_longitude: number | null
          location_mode: Database["public"]["Enums"]["location_mode"] | null
          location_name: string | null
          location_timezone: string | null
          physical_demand: string | null
          safety_notes: string | null
          template_family_id: string | null
          title: string | null
          version: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      difficulty: "easy" | "medium" | "hard"
      location_mode: "none" | "area" | "place"
      quest_status:
        | "candidate"
        | "active"
        | "rerolled"
        | "completed"
        | "abandoned"
        | "expired"
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
      difficulty: ["easy", "medium", "hard"],
      location_mode: ["none", "area", "place"],
      quest_status: [
        "candidate",
        "active",
        "rerolled",
        "completed",
        "abandoned",
        "expired",
      ],
    },
  },
} as const
