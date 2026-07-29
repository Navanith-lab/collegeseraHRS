ALTER TYPE public.lead_status ADD VALUE IF NOT EXISTS 'proposal_sent';
ALTER TYPE public.lead_status ADD VALUE IF NOT EXISTS 'negotiation';
ALTER TYPE public.lead_status ADD VALUE IF NOT EXISTS 'won';
ALTER TYPE public.lead_status ADD VALUE IF NOT EXISTS 'lost';