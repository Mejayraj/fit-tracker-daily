
-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  calorie_goal INTEGER NOT NULL DEFAULT 2200,
  protein_goal INTEGER NOT NULL DEFAULT 150,
  carb_goal INTEGER NOT NULL DEFAULT 250,
  fat_goal INTEGER NOT NULL DEFAULT 70,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile select" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "own profile insert" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Workouts
CREATE TABLE public.workouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exercise_type TEXT NOT NULL,
  exercise_name TEXT NOT NULL,
  sets INTEGER,
  reps INTEGER,
  weight NUMERIC,
  duration_minutes INTEGER,
  calories_burned INTEGER NOT NULL DEFAULT 0,
  logged_at DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.workouts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own workouts select" ON public.workouts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own workouts insert" ON public.workouts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own workouts update" ON public.workouts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own workouts delete" ON public.workouts FOR DELETE USING (auth.uid() = user_id);
CREATE INDEX workouts_user_date_idx ON public.workouts(user_id, logged_at DESC);

-- Food logs
CREATE TABLE public.food_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  food_name TEXT NOT NULL,
  meal_type TEXT NOT NULL DEFAULT 'snack',
  portion_grams NUMERIC NOT NULL DEFAULT 100,
  calories INTEGER NOT NULL DEFAULT 0,
  protein NUMERIC NOT NULL DEFAULT 0,
  carbs NUMERIC NOT NULL DEFAULT 0,
  fat NUMERIC NOT NULL DEFAULT 0,
  logged_at DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.food_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own foods select" ON public.food_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own foods insert" ON public.food_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own foods update" ON public.food_logs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own foods delete" ON public.food_logs FOR DELETE USING (auth.uid() = user_id);
CREATE INDEX food_logs_user_date_idx ON public.food_logs(user_id, logged_at DESC);

-- Weight logs
CREATE TABLE public.weight_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  weight_kg NUMERIC NOT NULL,
  logged_at DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, logged_at)
);
ALTER TABLE public.weight_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own weight select" ON public.weight_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own weight insert" ON public.weight_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own weight update" ON public.weight_logs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own weight delete" ON public.weight_logs FOR DELETE USING (auth.uid() = user_id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
