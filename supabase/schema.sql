-- ============================================================================
-- GAMERVERSE STUDIOS | ESQUEMA MAESTRO DE BASE DE DATOS (SUPABASE / POSTGRESQL)
-- Arquitectura: Telegram Mini App, Economía de Tickets, Bote Semanal USDT y Anti-Cheat
-- ============================================================================

-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ----------------------------------------------------------------------------
-- 1. TABLA: USERS (Jugadores identificados por Telegram ID)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.users (
    id BIGINT PRIMARY KEY, -- Telegram User ID (ej: 582910394)
    username TEXT,
    first_name TEXT,
    tickets INTEGER NOT NULL DEFAULT 3 CHECK (tickets >= 0),
    total_coins INTEGER NOT NULL DEFAULT 0 CHECK (total_coins >= 0),
    wallet_address TEXT, -- Dirección TON o Binance Pay ID para recibir premios
    referred_by BIGINT REFERENCES public.users(id) ON DELETE SET NULL,
    referral_count INTEGER NOT NULL DEFAULT 0,
    last_daily_claim TIMESTAMPTZ,
    is_banned BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices de búsqueda rápida
CREATE INDEX IF NOT EXISTS idx_users_username ON public.users(username);
CREATE INDEX IF NOT EXISTS idx_users_referred_by ON public.users(referred_by);

-- ----------------------------------------------------------------------------
-- 2. TABLA: JACKPOTS (Bote Semanal Dinámico en USDT)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.jackpots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    week_identifier TEXT UNIQUE NOT NULL, -- Ej: '2026-W46'
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ NOT NULL, -- Domingo 23:59:59 UTC
    seed_amount NUMERIC(10, 2) NOT NULL DEFAULT 10.00, -- Base inicial garantizada por la LLC
    dynamic_pool NUMERIC(10, 2) NOT NULL DEFAULT 10.00, -- Crece en tiempo real con anuncios
    is_active BOOLEAN NOT NULL DEFAULT true,
    winner_1_id BIGINT REFERENCES public.users(id),
    winner_2_id BIGINT REFERENCES public.users(id),
    winner_3_id BIGINT REFERENCES public.users(id),
    payout_tx_hash TEXT, -- Hash en blockchain TON / Binance Pay del pago ejecutado
    payout_status TEXT NOT NULL DEFAULT 'active' CHECK (payout_status IN ('active', 'calculating', 'paid')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- 3. TABLA: GAME_SCORES (Registro de partidas y blindaje Anti-Cheat)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.game_scores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id BIGINT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    game_id TEXT NOT NULL CHECK (game_id IN ('astronaut_runner', 'save_the_astronaut', 'arrow_escape')),
    score INTEGER NOT NULL CHECK (score >= 0), -- Metros en runner o puntos
    coins INTEGER NOT NULL DEFAULT 0,
    duration_ms INTEGER NOT NULL,
    frames_rendered INTEGER NOT NULL,
    client_hash TEXT NOT NULL,
    is_valid BOOLEAN NOT NULL DEFAULT true, -- Marcado falso si falla verificación de física
    flagged_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_scores_user_game ON public.game_scores(user_id, game_id, score DESC);
CREATE INDEX IF NOT EXISTS idx_scores_created ON public.game_scores(created_at DESC);

-- ----------------------------------------------------------------------------
-- 4. PROCEDIMIENTOS ALMACENADOS ATÓMICOS (RPC)
-- ----------------------------------------------------------------------------

-- A. Consumo de Ticket (1 Ticket por partida)
CREATE OR REPLACE FUNCTION public.consume_ticket(p_user_id BIGINT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_tickets INTEGER;
BEGIN
    SELECT tickets INTO v_tickets FROM public.users WHERE id = p_user_id;

    IF v_tickets IS NULL THEN
        RAISE EXCEPTION 'Usuario no encontrado';
    END IF;

    IF v_tickets < 1 THEN
        RETURN jsonb_build_object('success', false, 'message', 'Sin tickets disponibles', 'tickets', 0);
    END IF;

    UPDATE public.users 
    SET tickets = tickets - 1, updated_at = now() 
    WHERE id = p_user_id
    RETURNING tickets INTO v_tickets;

    RETURN jsonb_build_object('success', true, 'tickets', v_tickets);
END;
$$;

-- B. Recarga por Anuncio Adsgram (+1 Ticket y suma al Bote Dinámico)
CREATE OR REPLACE FUNCTION public.reward_ad_watched(p_user_id BIGINT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_tickets INTEGER;
    v_new_bote NUMERIC(10, 2);
    v_ad_bote_fraction NUMERIC(10, 4) := 0.0012; -- Fracción que alimenta el bote por anuncio
BEGIN
    -- Sumar 1 ticket al usuario
    UPDATE public.users
    SET tickets = tickets + 1, updated_at = now()
    WHERE id = p_user_id
    RETURNING tickets INTO v_tickets;

    -- Incrementar el bote activo de la semana
    UPDATE public.jackpots
    SET dynamic_pool = dynamic_pool + v_ad_bote_fraction
    WHERE is_active = true
    RETURNING dynamic_pool INTO v_new_bote;

    RETURN jsonb_build_object(
        'success', true, 
        'tickets', v_tickets, 
        'current_jackpot', v_new_bote
    );
END;
$$;

-- C. Procesar Referido (+3 Tickets al padrino, +3 al invitado)
CREATE OR REPLACE FUNCTION public.register_referral(p_new_id BIGINT, p_referrer_id BIGINT, p_username TEXT, p_first_name TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Evitar autorreferidos
    IF p_new_id = p_referrer_id THEN
        RETURN jsonb_build_object('success', false, 'message', 'Auto-referido no permitido');
    END IF;

    -- Registrar o actualizar el nuevo usuario con bono
    INSERT INTO public.users (id, username, first_name, tickets, referred_by)
    VALUES (p_new_id, p_username, p_first_name, 6, p_referrer_id) -- 3 base + 3 bono referido
    ON CONFLICT (id) DO UPDATE 
    SET username = EXCLUDED.username, first_name = EXCLUDED.first_name;

    -- Premiar al usuario que invitó
    UPDATE public.users
    SET tickets = tickets + 3, referral_count = referral_count + 1, updated_at = now()
    WHERE id = p_referrer_id;

    RETURN jsonb_build_object('success', true, 'message', 'Bono de referidos acreditado (+3 tickets a ambos)');
END;
$$;

-- D. Envío de Puntuación con Validación Anti-Cheat
CREATE OR REPLACE FUNCTION public.submit_match_score(
    p_user_id BIGINT,
    p_game_id TEXT,
    p_score INTEGER,
    p_coins INTEGER,
    p_duration_ms INTEGER,
    p_frames INTEGER,
    p_hash TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_max_possible_score INTEGER;
    v_is_valid BOOLEAN := true;
    v_flag_reason TEXT := NULL;
BEGIN
    -- Verificación de velocidad máxima teórica en AstronautRunner:
    -- 1 metro cada ~100ms. Récord humano máximo con turbos: 1 metro cada 80ms.
    IF p_game_id = 'astronaut_runner' THEN
        v_max_possible_score := (p_duration_ms / 75) + 50;
        IF p_score > v_max_possible_score THEN
            v_is_valid := false;
            v_flag_reason := 'Velocidad de avance humanamente imposible (ratio distancia/tiempo anómalo)';
        END IF;
    END IF;

    -- Duración mínima de partida razonable (> 5 segundos)
    IF p_duration_ms < 5000 AND p_score > 100 THEN
        v_is_valid := false;
        v_flag_reason := 'Duración de partida inconsistente con la puntuación';
    END IF;

    -- Insertar registro de la partida
    INSERT INTO public.game_scores (
        user_id, game_id, score, coins, duration_ms, frames_rendered, client_hash, is_valid, flagged_reason
    ) VALUES (
        p_user_id, p_game_id, p_score, p_coins, p_duration_ms, p_frames, p_hash, v_is_valid, v_flag_reason
    );

    -- Si es válida, sumar monedas al perfil del usuario
    IF v_is_valid THEN
        UPDATE public.users
        SET total_coins = total_coins + p_coins, updated_at = now()
        WHERE id = p_user_id;
    END IF;

    RETURN jsonb_build_object(
        'success', v_is_valid,
        'score', p_score,
        'flagged', NOT v_is_valid,
        'reason', v_flag_reason
    );
END;
$$;

-- ----------------------------------------------------------------------------
-- 5. VISTA: LEADERBOARD SEMANAL EN VIVO
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW public.weekly_leaderboard AS
SELECT 
    ROW_NUMBER() OVER (ORDER BY MAX(gs.score) DESC) AS rank,
    u.id AS user_id,
    COALESCE(u.username, u.first_name, 'Astronauta') AS display_name,
    MAX(gs.score) AS high_score,
    COUNT(gs.id) AS matches_played,
    MAX(gs.created_at) AS achieved_at
FROM public.game_scores gs
JOIN public.users u ON gs.user_id = u.id
JOIN public.jackpots j ON j.is_active = true
WHERE gs.created_at >= j.start_date 
  AND gs.created_at <= j.end_date
  AND gs.is_valid = true
GROUP BY u.id, u.username, u.first_name;

-- ----------------------------------------------------------------------------
-- 6. SEGURIDAD RLS (Row Level Security)
-- ----------------------------------------------------------------------------
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jackpots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_scores ENABLE ROW LEVEL SECURITY;

-- Lectura pública para Leaderboard y Bote
DROP POLICY IF EXISTS "Lectura pública de jackpots" ON public.jackpots;
CREATE POLICY "Lectura pública de jackpots" ON public.jackpots FOR SELECT USING (true);
DROP POLICY IF EXISTS "Lectura pública de ranking" ON public.game_scores;
CREATE POLICY "Lectura pública de ranking" ON public.game_scores FOR SELECT USING (is_valid = true);
DROP POLICY IF EXISTS "Lectura del propio perfil" ON public.users;
CREATE POLICY "Lectura del propio perfil" ON public.users FOR SELECT USING (true);

-- ----------------------------------------------------------------------------
-- 7. SEMILLA INICIAL: Bote Semanal Activo (si no existe ninguno activo)
-- ----------------------------------------------------------------------------
INSERT INTO public.jackpots (week_identifier, start_date, end_date, seed_amount, dynamic_pool, is_active)
SELECT
    to_char(now() AT TIME ZONE 'UTC', 'IYYY-"W"IW'),
    date_trunc('week', now() AT TIME ZONE 'UTC'),
    date_trunc('week', now() AT TIME ZONE 'UTC') + interval '7 days' - interval '1 second',
    10.00,
    10.00,
    true
WHERE NOT EXISTS (SELECT 1 FROM public.jackpots WHERE is_active = true);
