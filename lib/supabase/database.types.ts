export type DedicationStatus =
  | "approved"
  | "pending"
  | "published"
  | "rejected";

export type Database = {
  public: {
    Tables: {
      dedications: {
        Row: {
          allow_publishing: boolean;
          artist: string;
          created_at: string;
          id: string;
          instagram: string | null;
          message: string;
          recipient_name: string | null;
          sender_name: string | null;
          song: string;
          spotify_track_id: string | null;
          spotify_url: string | null;
          status: DedicationStatus;
          updated_at: string;
        };
        Insert: {
          allow_publishing?: boolean;
          artist: string;
          created_at?: string;
          id?: string;
          instagram?: string | null;
          message: string;
          recipient_name?: string | null;
          sender_name?: string | null;
          song: string;
          spotify_track_id?: string | null;
          spotify_url?: string | null;
          status?: DedicationStatus;
          updated_at?: string;
        };
        Update: {
          allow_publishing?: boolean;
          artist?: string;
          created_at?: string;
          id?: string;
          instagram?: string | null;
          message?: string;
          recipient_name?: string | null;
          sender_name?: string | null;
          song?: string;
          spotify_track_id?: string | null;
          spotify_url?: string | null;
          status?: DedicationStatus;
          updated_at?: string;
        };
        Relationships: [];
      };
      private_dedications: {
        Row: {
          artist: string;
          created_at: string;
          id: string;
          message: string;
          recipient_name: string;
          sender_name: string | null;
          share_token_hash: string;
          song: string;
          spotify_track_id: string | null;
          spotify_url: string | null;
        };
        Insert: {
          artist: string;
          created_at?: string;
          id?: string;
          message: string;
          recipient_name: string;
          sender_name?: string | null;
          share_token_hash: string;
          song: string;
          spotify_track_id?: string | null;
          spotify_url?: string | null;
        };
        Update: {
          artist?: string;
          created_at?: string;
          id?: string;
          message?: string;
          recipient_name?: string;
          sender_name?: string | null;
          share_token_hash?: string;
          song?: string;
          spotify_track_id?: string | null;
          spotify_url?: string | null;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      dedication_status: DedicationStatus;
    };
    CompositeTypes: Record<string, never>;
  };
};
