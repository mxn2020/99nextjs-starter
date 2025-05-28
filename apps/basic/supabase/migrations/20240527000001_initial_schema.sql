-- Create profiles table (extends auth.users)
CREATE TABLE public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  bio TEXT,
  website TEXT,
  location TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create policies for users table
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON public.users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update all profiles" ON public.users
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create accounts table
CREATE TABLE public.accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('personal', 'team', 'family', 'enterprise')),
  description TEXT,
  owner_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS for accounts
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;

-- Create policies for accounts table
CREATE POLICY "Users can view own accounts" ON public.accounts
  FOR SELECT USING (owner_id = auth.uid());

CREATE POLICY "Users can create accounts" ON public.accounts
  FOR INSERT WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can update own accounts" ON public.accounts
  FOR UPDATE USING (owner_id = auth.uid());

CREATE POLICY "Users can delete own accounts" ON public.accounts
  FOR DELETE USING (owner_id = auth.uid());

CREATE POLICY "Admins can view all accounts" ON public.accounts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create user_accounts junction table for team memberships
CREATE TABLE public.user_accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  account_id UUID REFERENCES public.accounts(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('member', 'admin', 'owner')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(user_id, account_id)
);

-- Enable RLS for user_accounts
ALTER TABLE public.user_accounts ENABLE ROW LEVEL SECURITY;

-- Create policies for user_accounts table
CREATE POLICY "Users can view own memberships" ON public.user_accounts
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Account owners can manage memberships" ON public.user_accounts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.accounts
      WHERE id = account_id AND owner_id = auth.uid()
    )
  );

-- Create notes table
CREATE TABLE public.notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT,
  is_favorite BOOLEAN DEFAULT false NOT NULL,
  content TEXT,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  account_id UUID REFERENCES public.accounts(id) ON DELETE CASCADE,
  is_public BOOLEAN DEFAULT false NOT NULL,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS for notes
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

-- Create policies for notes table
CREATE POLICY "Users can view own notes" ON public.notes
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can view public notes" ON public.notes
  FOR SELECT USING (is_public = true);

CREATE POLICY "Users can create notes" ON public.notes
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own notes" ON public.notes
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own notes" ON public.notes
  FOR DELETE USING (user_id = auth.uid());

CREATE POLICY "Account members can view account notes" ON public.notes
  FOR SELECT USING (
    account_id IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM public.user_accounts
      WHERE user_id = auth.uid() AND account_id = notes.account_id
    )
  );

CREATE POLICY "Admins can view all notes" ON public.notes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email)
  );
  
  -- Create a personal account for the new user
  INSERT INTO public.accounts (name, type, owner_id)
  VALUES (
    COALESCE(NEW.raw_user_meta_data->>'name', 'Personal') || '''s Account',
    'personal',
    NEW.id
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user registration
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.accounts
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.user_accounts
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.notes
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Create indexes for better performance
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_role ON public.users(role);
CREATE INDEX idx_accounts_owner_id ON public.accounts(owner_id);
CREATE INDEX idx_accounts_type ON public.accounts(type);
CREATE INDEX idx_user_accounts_user_id ON public.user_accounts(user_id);
CREATE INDEX idx_user_accounts_account_id ON public.user_accounts(account_id);
CREATE INDEX idx_notes_user_id ON public.notes(user_id);
CREATE INDEX idx_notes_account_id ON public.notes(account_id);
CREATE INDEX idx_notes_is_public ON public.notes(is_public);
CREATE INDEX idx_notes_created_at ON public.notes(created_at);
CREATE INDEX idx_notes_tags ON public.notes USING GIN(tags);

-- Add full-text search for notes
ALTER TABLE public.notes ADD COLUMN search_vector tsvector;

CREATE INDEX idx_notes_search ON public.notes USING GIN(search_vector);

-- Create function to update search vector
CREATE OR REPLACE FUNCTION public.update_notes_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := to_tsvector('english', COALESCE(NEW.title, '') || ' ' || COALESCE(NEW.content, ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for search vector
CREATE TRIGGER update_notes_search_vector
  BEFORE INSERT OR UPDATE ON public.notes
  FOR EACH ROW EXECUTE FUNCTION public.update_notes_search_vector();
