export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      groups: {
        Row: {
          id: string
          name: string
          color: string
          created_at: string
          user_id: string
        }
        Insert: {
          id?: string
          name: string
          color: string
          created_at?: string
          user_id?: string
        }
        Update: {
          id?: string
          name?: string
          color?: string
          created_at?: string
          user_id?: string
        }
      }
      locations: {
        Row: {
          id: string
          title: string
          latitude: number
          longitude: number
          description: string | null
          tags: string[]
          group_id: string | null
          created_at: string
          user_id: string
          directus_id: string | null
        }
        Insert: {
          id?: string
          title: string
          latitude: number
          longitude: number
          description?: string | null
          tags?: string[]
          group_id?: string | null
          created_at?: string
          user_id?: string
          directus_id?: string | null
        }
        Update: {
          id?: string
          title?: string
          latitude?: number
          longitude?: number
          description?: string | null
          tags?: string[]
          group_id?: string | null
          created_at?: string
          user_id?: string
          directus_id?: string | null
        }
      }
      imported_locations: {
        Row: {
          id: number
          title: string
          directus_id: string | null
        }
        Insert: {
          id?: number
          title: string
          directus_id?: string | null
        }
        Update: {
          id?: number
          title?: string
          directus_id?: string | null
        }
      }
    }
  }
}
