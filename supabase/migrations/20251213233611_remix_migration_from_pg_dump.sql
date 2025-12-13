CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "plpgsql" WITH SCHEMA "pg_catalog";
CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";
--
-- PostgreSQL database dump
--


-- Dumped from database version 17.6
-- Dumped by pg_dump version 18.1

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--



--
-- Name: app_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.app_role AS ENUM (
    'farmer',
    'agronomist'
);


--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  new_unique_id TEXT;
  new_farm_id UUID;
BEGIN
  -- Generate unique ID (format: CG-10001, CG-10002, etc.)
  new_unique_id := 'CG-' || LPAD(nextval('user_id_sequence')::TEXT, 5, '0');
  
  -- Insert profile with unique_id
  INSERT INTO public.profiles (id, email, full_name, role, unique_id)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'farmer'),
    new_unique_id
  );
  
  -- Insert user role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (
    NEW.id,
    COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'farmer')
  );
  
  -- Auto-create a farm for the user
  INSERT INTO public.farms (farmer_id, farm_name, location)
  VALUES (
    NEW.id,
    'My Farm',
    COALESCE(NEW.raw_user_meta_data->>'farm_location', 'Not specified')
  );
  
  RETURN NEW;
END;
$$;


--
-- Name: has_role(uuid, public.app_role); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.has_role(_user_id uuid, _role public.app_role) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


SET default_table_access_method = heap;

--
-- Name: agronomist_contacts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.agronomist_contacts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    farm_id uuid NOT NULL,
    contacted_at timestamp with time zone DEFAULT now() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: alerts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.alerts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    farm_id uuid NOT NULL,
    alert_type text NOT NULL,
    severity text NOT NULL,
    message text NOT NULL,
    is_read boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    type text DEFAULT 'system'::text,
    priority integer DEFAULT 3,
    CONSTRAINT alerts_severity_check CHECK ((severity = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text, 'critical'::text])))
);


--
-- Name: analysis_reports; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.analysis_reports (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    farm_id uuid NOT NULL,
    scan_type text NOT NULL,
    image_url text NOT NULL,
    bounding_boxes jsonb,
    infestation_level text,
    pest_types jsonb,
    confidence_score numeric(5,2),
    analyzed_at timestamp with time zone DEFAULT now() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    media_type text DEFAULT 'image'::text,
    analyzed_media text,
    CONSTRAINT analysis_reports_media_type_check CHECK ((media_type = ANY (ARRAY['image'::text, 'video'::text]))),
    CONSTRAINT analysis_reports_scan_type_check CHECK ((scan_type = ANY (ARRAY['spot_check'::text, 'drone_flight'::text, 'live_scan'::text])))
);


--
-- Name: farms; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.farms (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    farmer_id uuid NOT NULL,
    farm_name text NOT NULL,
    location text NOT NULL,
    size_hectares numeric(10,2),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: market_price_submissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.market_price_submissions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    submitted_by uuid NOT NULL,
    crop_name text NOT NULL,
    price_per_kg numeric(10,2) NOT NULL,
    CONSTRAINT market_price_submissions_price_per_kg_check CHECK ((price_per_kg > (0)::numeric)),
    CONSTRAINT valid_crop_name CHECK ((crop_name = ANY (ARRAY['Maize'::text, 'Rice (Local)'::text, 'Cassava'::text, 'Yam'::text, 'Sorghum'::text, 'Millet'::text, 'Cowpea (Beans)'::text, 'Groundnut'::text])))
);


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id uuid NOT NULL,
    email text NOT NULL,
    full_name text,
    role public.app_role DEFAULT 'farmer'::public.app_role NOT NULL,
    farm_location text,
    phone text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    unique_id text,
    avatar_url text
);


--
-- Name: sensor_data; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sensor_data (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    farm_id uuid NOT NULL,
    soil_moisture numeric(5,2),
    temperature numeric(5,2),
    humidity numeric(5,2),
    light_intensity numeric(8,2),
    recorded_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: user_id_sequence; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.user_id_sequence
    START WITH 10001
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    role public.app_role NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: agronomist_contacts agronomist_contacts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agronomist_contacts
    ADD CONSTRAINT agronomist_contacts_pkey PRIMARY KEY (id);


--
-- Name: alerts alerts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.alerts
    ADD CONSTRAINT alerts_pkey PRIMARY KEY (id);


--
-- Name: analysis_reports analysis_reports_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.analysis_reports
    ADD CONSTRAINT analysis_reports_pkey PRIMARY KEY (id);


--
-- Name: farms farms_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.farms
    ADD CONSTRAINT farms_pkey PRIMARY KEY (id);


--
-- Name: market_price_submissions market_price_submissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.market_price_submissions
    ADD CONSTRAINT market_price_submissions_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_unique_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_unique_id_key UNIQUE (unique_id);


--
-- Name: sensor_data sensor_data_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sensor_data
    ADD CONSTRAINT sensor_data_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_user_id_role_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role);


--
-- Name: idx_alerts_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_alerts_created_at ON public.alerts USING btree (created_at DESC);


--
-- Name: idx_alerts_is_read; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_alerts_is_read ON public.alerts USING btree (is_read);


--
-- Name: idx_analysis_reports_media_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_analysis_reports_media_type ON public.analysis_reports USING btree (media_type);


--
-- Name: idx_market_prices_crop_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_market_prices_crop_date ON public.market_price_submissions USING btree (crop_name, created_at DESC);


--
-- Name: farms update_farms_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_farms_updated_at BEFORE UPDATE ON public.farms FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: profiles update_profiles_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: alerts alerts_farm_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.alerts
    ADD CONSTRAINT alerts_farm_id_fkey FOREIGN KEY (farm_id) REFERENCES public.farms(id) ON DELETE CASCADE;


--
-- Name: analysis_reports analysis_reports_farm_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.analysis_reports
    ADD CONSTRAINT analysis_reports_farm_id_fkey FOREIGN KEY (farm_id) REFERENCES public.farms(id) ON DELETE CASCADE;


--
-- Name: farms farms_farmer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.farms
    ADD CONSTRAINT farms_farmer_id_fkey FOREIGN KEY (farmer_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: market_price_submissions market_price_submissions_submitted_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.market_price_submissions
    ADD CONSTRAINT market_price_submissions_submitted_by_fkey FOREIGN KEY (submitted_by) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: profiles profiles_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: sensor_data sensor_data_farm_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sensor_data
    ADD CONSTRAINT sensor_data_farm_id_fkey FOREIGN KEY (farm_id) REFERENCES public.farms(id) ON DELETE CASCADE;


--
-- Name: user_roles user_roles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: alerts Agronomists can view all alerts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Agronomists can view all alerts" ON public.alerts FOR SELECT USING (public.has_role(auth.uid(), 'agronomist'::public.app_role));


--
-- Name: analysis_reports Agronomists can view all analysis reports; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Agronomists can view all analysis reports" ON public.analysis_reports FOR SELECT USING (public.has_role(auth.uid(), 'agronomist'::public.app_role));


--
-- Name: farms Agronomists can view all farms; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Agronomists can view all farms" ON public.farms FOR SELECT USING (public.has_role(auth.uid(), 'agronomist'::public.app_role));


--
-- Name: profiles Agronomists can view all profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Agronomists can view all profiles" ON public.profiles FOR SELECT USING (public.has_role(auth.uid(), 'agronomist'::public.app_role));


--
-- Name: user_roles Agronomists can view all roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Agronomists can view all roles" ON public.user_roles FOR SELECT USING (public.has_role(auth.uid(), 'agronomist'::public.app_role));


--
-- Name: sensor_data Agronomists can view all sensor data; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Agronomists can view all sensor data" ON public.sensor_data FOR SELECT USING (public.has_role(auth.uid(), 'agronomist'::public.app_role));


--
-- Name: alerts Deny anonymous access to alerts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Deny anonymous access to alerts" ON public.alerts FOR SELECT TO anon USING (false);


--
-- Name: analysis_reports Deny anonymous access to analysis_reports; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Deny anonymous access to analysis_reports" ON public.analysis_reports FOR SELECT TO anon USING (false);


--
-- Name: farms Deny anonymous access to farms; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Deny anonymous access to farms" ON public.farms FOR SELECT TO anon USING (false);


--
-- Name: market_price_submissions Deny anonymous access to market_price_submissions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Deny anonymous access to market_price_submissions" ON public.market_price_submissions FOR SELECT USING (false);


--
-- Name: profiles Deny anonymous access to profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Deny anonymous access to profiles" ON public.profiles FOR SELECT TO anon USING (false);


--
-- Name: sensor_data Deny anonymous access to sensor_data; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Deny anonymous access to sensor_data" ON public.sensor_data FOR SELECT TO anon USING (false);


--
-- Name: user_roles Deny anonymous access to user_roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Deny anonymous access to user_roles" ON public.user_roles FOR SELECT TO anon USING (false);


--
-- Name: analysis_reports Farmers can insert own analysis reports; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Farmers can insert own analysis reports" ON public.analysis_reports FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.farms
  WHERE ((farms.id = analysis_reports.farm_id) AND (farms.farmer_id = auth.uid())))));


--
-- Name: farms Farmers can insert own farms; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Farmers can insert own farms" ON public.farms FOR INSERT WITH CHECK ((auth.uid() = farmer_id));


--
-- Name: sensor_data Farmers can insert own sensor data; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Farmers can insert own sensor data" ON public.sensor_data FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.farms
  WHERE ((farms.id = sensor_data.farm_id) AND (farms.farmer_id = auth.uid())))));


--
-- Name: alerts Farmers can update own alerts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Farmers can update own alerts" ON public.alerts FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM public.farms
  WHERE ((farms.id = alerts.farm_id) AND (farms.farmer_id = auth.uid())))));


--
-- Name: farms Farmers can update own farms; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Farmers can update own farms" ON public.farms FOR UPDATE USING ((auth.uid() = farmer_id));


--
-- Name: alerts Farmers can view own alerts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Farmers can view own alerts" ON public.alerts FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.farms
  WHERE ((farms.id = alerts.farm_id) AND (farms.farmer_id = auth.uid())))));


--
-- Name: analysis_reports Farmers can view own analysis reports; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Farmers can view own analysis reports" ON public.analysis_reports FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.farms
  WHERE ((farms.id = analysis_reports.farm_id) AND (farms.farmer_id = auth.uid())))));


--
-- Name: farms Farmers can view own farms; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Farmers can view own farms" ON public.farms FOR SELECT USING ((auth.uid() = farmer_id));


--
-- Name: sensor_data Farmers can view own sensor data; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Farmers can view own sensor data" ON public.sensor_data FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.farms
  WHERE ((farms.id = sensor_data.farm_id) AND (farms.farmer_id = auth.uid())))));


--
-- Name: agronomist_contacts Users can create their own contacts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own contacts" ON public.agronomist_contacts FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: market_price_submissions Users can submit their own prices; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can submit their own prices" ON public.market_price_submissions FOR INSERT TO authenticated WITH CHECK ((auth.uid() = submitted_by));


--
-- Name: profiles Users can update own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING ((auth.uid() = id));


--
-- Name: market_price_submissions Users can view all price submissions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view all price submissions" ON public.market_price_submissions FOR SELECT TO authenticated USING (true);


--
-- Name: profiles Users can view own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING ((auth.uid() = id));


--
-- Name: user_roles Users can view own roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: agronomist_contacts Users can view their own contacts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own contacts" ON public.agronomist_contacts FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: agronomist_contacts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.agronomist_contacts ENABLE ROW LEVEL SECURITY;

--
-- Name: alerts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;

--
-- Name: analysis_reports; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.analysis_reports ENABLE ROW LEVEL SECURITY;

--
-- Name: farms; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.farms ENABLE ROW LEVEL SECURITY;

--
-- Name: market_price_submissions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.market_price_submissions ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: sensor_data; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.sensor_data ENABLE ROW LEVEL SECURITY;

--
-- Name: user_roles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--


