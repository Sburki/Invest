export type RiskProfile = 'defensive' | 'balanced' | 'offensive';

export type Opportunity = {
  id: string;
  symbol: string;
  name: string;
  sector: string;
  price: number | null;
  day_change: number | null;
  quality_score: number;
  momentum_score: number;
  valuation_score: number;
  stability_score: number;
  growth_score: number;
  total_score: number;
  risk_level: 'low' | 'medium' | 'high';
  thesis: string;
  updated_at: string;
};

export type WatchlistItem = {
  id: string;
  user_id: string;
  symbol: string;
  created_at: string;
};

export type AlertItem = {
  id: string;
  user_id: string;
  symbol: string;
  alert_type: string;
  threshold: number | null;
  is_active: boolean;
  created_at: string;
  last_triggered_at?: string | null;
};

export type AlertEvent = {
  id: string;
  alert_id: string;
  user_id: string;
  symbol: string;
  alert_type: string;
  threshold: number | null;
  actual_value: number | null;
  message: string;
  delivered_at?: string | null;
  delivery_provider?: string | null;
  delivery_message_id?: string | null;
  triggered_at: string;
};

export type Profile = {
  id: string;
  email: string;
  notify_email?: string | null;
  email_alerts_enabled?: boolean;
  risk_profile: RiskProfile;
  investment_horizon: string;
};
