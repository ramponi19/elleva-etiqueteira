export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string;
          name: string;
          slug: string;
          plan: "starter" | "pro" | "enterprise";
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          subscription_status: string | null;
          trial_ends_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["organizations"]["Row"],
          "id" | "created_at" | "updated_at"
        >;
        Update: Partial<Database["public"]["Tables"]["organizations"]["Insert"]>;
      };
      profiles: {
        Row: {
          id: string;
          org_id: string | null;
          full_name: string | null;
          avatar_url: string | null;
          role: "owner" | "admin" | "member" | "viewer";
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["profiles"]["Row"],
          "created_at" | "updated_at"
        >;
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
      };
      label_templates: {
        Row: {
          id: string;
          org_id: string;
          created_by: string | null;
          name: string;
          description: string | null;
          width_mm: number;
          height_mm: number;
          format: "zpl" | "pdf" | "png";
          content: string;
          variables: Json;
          version: number;
          is_archived: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["label_templates"]["Row"],
          "id" | "created_at" | "updated_at"
        >;
        Update: Partial<
          Database["public"]["Tables"]["label_templates"]["Insert"]
        >;
      };
      printers: {
        Row: {
          id: string;
          org_id: string;
          name: string;
          model: string | null;
          serial_number: string | null;
          ip_address: string | null;
          dpi: number | null;
          status: "online" | "offline" | "error" | "busy";
          last_seen_at: string | null;
          location: string | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["printers"]["Row"],
          "id" | "created_at" | "updated_at"
        >;
        Update: Partial<Database["public"]["Tables"]["printers"]["Insert"]>;
      };
      print_jobs: {
        Row: {
          id: string;
          org_id: string;
          template_id: string;
          printer_id: string | null;
          requested_by: string | null;
          status: "queued" | "processing" | "completed" | "failed" | "cancelled";
          quantity: number;
          variables_data: Json;
          error_message: string | null;
          started_at: string | null;
          completed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["print_jobs"]["Row"],
          "id" | "created_at" | "updated_at"
        >;
        Update: Partial<Database["public"]["Tables"]["print_jobs"]["Insert"]>;
      };
    };
    Views: Record<string, never>;
    Functions: {
      my_org_id: {
        Args: Record<string, never>;
        Returns: string;
      };
    };
    Enums: Record<string, never>;
  };
};
