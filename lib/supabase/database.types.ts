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
          status?: DedicationStatus;
          updated_at?: string;
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
