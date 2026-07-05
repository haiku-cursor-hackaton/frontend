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
      api_keys: {
        Row: {
          business_id: string | null;
          created_at: string;
          id: string;
          key_hash: string;
          key_prefix: string | null;
          key_type: string;
          label: string | null;
          last_used_at: string | null;
          profile_id: string | null;
          revoked_at: string | null;
          scopes: Json;
          status: string;
          updated_at: string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      businesses: {
        Row: {
          category: string | null;
          created_at: string;
          description: string | null;
          encrypted_ucp_api_key: string | null;
          id: string;
          name: string;
          owner_id: string;
          status: string;
          ucp_base_url: string | null;
          ucp_capabilities: Json;
          updated_at: string;
          well_known_url: string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      checkout_sessions: {
        Row: {
          business_id: string;
          created_at: string;
          currency: string;
          expires_at: string | null;
          external_checkout_id: string | null;
          id: string;
          profile_id: string;
          snapshot: Json;
          status: string;
          total_minor: number;
          updated_at: string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      merchant_domains: {
        Row: {
          business_id: string;
          created_at: string;
          domain: string;
          id: string;
          updated_at: string;
          verified: boolean;
          verified_at: string | null;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      orders: {
        Row: {
          business_id: string;
          checkout_session_id: string | null;
          created_at: string;
          currency: string;
          external_order_id: string | null;
          id: string;
          permalink_url: string | null;
          profile_id: string;
          snapshot: Json;
          status: string;
          total_minor: number;
          updated_at: string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      payments: {
        Row: {
          amount_minor: number;
          checkout_session_id: string | null;
          created_at: string;
          currency: string;
          handler_id: string | null;
          id: string;
          idempotency_key_hash: string | null;
          order_id: string | null;
          status: string;
          updated_at: string;
          wallet_id: string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      profiles: {
        Row: {
          account_type: string;
          country: string | null;
          created_at: string;
          full_name: string | null;
          id: string;
          updated_at: string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      usage_events: {
        Row: {
          api_key_id: string | null;
          business_id: string | null;
          capability: string | null;
          checkout_session_id: string | null;
          client_name: string | null;
          created_at: string;
          error_code: string | null;
          id: number;
          is_purchase: boolean;
          latency_ms: number | null;
          operation: string;
          order_id: string | null;
          product_ref: string | null;
          profile_id: string | null;
          request_id: string | null;
          revenue_minor: number;
          status: string;
          transport: string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      wallets: {
        Row: {
          available_minor: number;
          created_at: string;
          currency: string;
          id: string;
          profile_id: string;
          reserved_minor: number;
          updated_at: string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

type DefaultSchema = Database["public"];

export type Tables<T extends keyof DefaultSchema["Tables"]> =
  DefaultSchema["Tables"][T]["Row"];
