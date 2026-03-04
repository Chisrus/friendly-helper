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
      conditions_ideales: {
        Row: {
          culture: string
          humidite_max: number
          humidite_min: number
          id: string
          temp_max: number
          temp_min: number
        }
        Insert: {
          culture: string
          humidite_max: number
          humidite_min: number
          id?: string
          temp_max: number
          temp_min: number
        }
        Update: {
          culture?: string
          humidite_max?: number
          humidite_min?: number
          id?: string
          temp_max?: number
          temp_min?: number
        }
        Relationships: []
      }
      inscriptions_agriculteurs: {
        Row: {
          besoin_financement: number
          capacite_champs: string
          contact: string
          created_at: string
          email: string | null
          en_activite: boolean
          id: string
          nom: string
          prenom: string
          type_culture: string
        }
        Insert: {
          besoin_financement?: number
          capacite_champs: string
          contact: string
          created_at?: string
          email?: string | null
          en_activite?: boolean
          id?: string
          nom: string
          prenom: string
          type_culture: string
        }
        Update: {
          besoin_financement?: number
          capacite_champs?: string
          contact?: string
          created_at?: string
          email?: string | null
          en_activite?: boolean
          id?: string
          nom?: string
          prenom?: string
          type_culture?: string
        }
        Relationships: []
      }
      inscriptions_investisseurs: {
        Row: {
          capacite_financement: number
          contact: string
          created_at: string
          email: string | null
          id: string
          nom: string
          prenom: string
        }
        Insert: {
          capacite_financement?: number
          contact: string
          created_at?: string
          email?: string | null
          id?: string
          nom: string
          prenom: string
        }
        Update: {
          capacite_financement?: number
          contact?: string
          created_at?: string
          email?: string | null
          id?: string
          nom?: string
          prenom?: string
        }
        Relationships: []
      }
      investissements: {
        Row: {
          created_at: string
          id: string
          methode_paiement: string
          montant: number
          projet_id: string
          statut: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          methode_paiement: string
          montant: number
          projet_id: string
          statut?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          methode_paiement?: string
          montant?: number
          projet_id?: string
          statut?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "investissements_projet_id_fkey"
            columns: ["projet_id"]
            isOneToOne: false
            referencedRelation: "projets"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          id: string
          nom_complet: string | null
          telephone: string | null
          updated_at: string
          ville: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          id: string
          nom_complet?: string | null
          telephone?: string | null
          updated_at?: string
          ville?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          id?: string
          nom_complet?: string | null
          telephone?: string | null
          updated_at?: string
          ville?: string | null
        }
        Relationships: []
      }
      projets: {
        Row: {
          couleur_tag: string | null
          created_at: string
          culture: string
          description: string | null
          financement_actuel: number
          humidite: number
          id: string
          image_url: string | null
          localisation: string
          montant_besoin: number
          rendement_estime: number
          statut: string
          temperature: number
          titre: string
          updated_at: string
        }
        Insert: {
          couleur_tag?: string | null
          created_at?: string
          culture: string
          description?: string | null
          financement_actuel?: number
          humidite?: number
          id?: string
          image_url?: string | null
          localisation: string
          montant_besoin?: number
          rendement_estime?: number
          statut?: string
          temperature?: number
          titre: string
          updated_at?: string
        }
        Update: {
          couleur_tag?: string | null
          created_at?: string
          culture?: string
          description?: string | null
          financement_actuel?: number
          humidite?: number
          id?: string
          image_url?: string | null
          localisation?: string
          montant_besoin?: number
          rendement_estime?: number
          statut?: string
          temperature?: number
          titre?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
