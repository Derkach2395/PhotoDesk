export type Client = { id: number; name: string; email?: string | null; phone?: string | null; notes?: string | null; created_at?: string }
export type Booking = { id: number; title: string; session_type: string; location?: string | null; starts_at: string; duration_minutes: number; price: number; deposit: number; status: string; notes?: string | null; client_id: number; client_name?: string }
export type Dashboard = { clients_count: number; bookings_count: number; upcoming_count: number; revenue: number; outstanding: number; monthly_revenue: { month: number; amount: number }[] }
