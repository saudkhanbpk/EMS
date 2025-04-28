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
      users: {
        Row: {
          id: string
          full_name?: string
          email?: string
          role?: string
          created_at?: string
          // Add other user fields as needed
        }
        Insert: {
          id?: string
          full_name?: string
          email?: string
          role?: string
          created_at?: string
          // Add other user fields as needed
        }
        Update: {
          id?: string
          full_name?: string
          email?: string
          role?: string
          created_at?: string
          // Add other user fields as needed
        }
      }
      tasks_of_projects: {
        Row: {
          id: string
          title: string
          description?: string
          status: 'todo' | 'inProgress' | 'review' | 'done'
          score: number
          priority?: string
          project_id: string
          created_at: string
          action_date?: string
          deadline?: string
          imageurl?: string
          devops?: Json
          // Add other task fields as needed
        }
        Insert: {
          id?: string
          title: string
          description?: string
          status?: 'todo' | 'inProgress' | 'review' | 'done'
          score?: number
          priority?: string
          project_id: string
          created_at?: string
          action_date?: string
          deadline?: string
          imageurl?: string
          devops?: Json
        }
        Update: {
          id?: string
          title?: string
          description?: string
          status?: 'todo' | 'inProgress' | 'review' | 'done'
          score?: number
          priority?: string
          project_id?: string
          created_at?: string
          action_date?: string
          deadline?: string
          imageurl?: string
          devops?: Json
        }
      }
      projects: {
        Row: {
          id: string
          name: string
          description?: string
          created_at: string
          created_by: string
          devops?: Json
          // Add other project fields as needed
        }
        Insert: {
          id?: string
          name: string
          description?: string
          created_at?: string
          created_by: string
          devops?: Json
        }
        Update: {
          id?: string
          name?: string
          description?: string
          created_at?: string
          created_by?: string
          devops?: Json
        }
      }
      comments: {
        Row: {
          comment_id: string
          task_id: string
          user_id: string
          comment_text: string
          created_at: string
        }
        Insert: {
          comment_id?: string
          task_id: string
          user_id: string
          comment_text: string
          created_at?: string
        }
        Update: {
          comment_id?: string
          task_id?: string
          user_id?: string
          comment_text?: string
          created_at?: string
        }
      }
      // Add other tables as needed
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
  }
}
