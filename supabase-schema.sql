-- Create custom types (only if they don't exist)
DO $$ BEGIN
    CREATE TYPE user_status AS ENUM ('finding', 'chatting');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create users table (only if it doesn't exist)
CREATE TABLE IF NOT EXISTS users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    status user_status DEFAULT 'finding',
    chat_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create chats table (only if it doesn't exist)
CREATE TABLE IF NOT EXISTS chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
);

-- Create messages table (only if it doesn't exist)
CREATE TABLE IF NOT EXISTS messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    chat_id UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create pair_history table to prevent re-pairing users (only if it doesn't exist)
CREATE TABLE IF NOT EXISTS pair_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user1_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    user2_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user1_id, user2_id)
);

-- Add foreign key constraint to users table (only if it doesn't exist)
DO $$ BEGIN
    ALTER TABLE users ADD CONSTRAINT fk_users_chat_id FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE SET NULL;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create indexes for better performance (only if they don't exist)
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_chat_id ON users(chat_id);
CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_pair_history_user1 ON pair_history(user1_id);
CREATE INDEX IF NOT EXISTS idx_pair_history_user2 ON pair_history(user2_id);
CREATE INDEX IF NOT EXISTS idx_pair_history_users ON pair_history(user1_id, user2_id);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE pair_history ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate them
DROP POLICY IF EXISTS "Users can view all users" ON users;
DROP POLICY IF EXISTS "Users can insert themselves" ON users;
DROP POLICY IF EXISTS "Users can update themselves" ON users;
DROP POLICY IF EXISTS "Users can delete themselves" ON users;

DROP POLICY IF EXISTS "Users can view all chats" ON chats;
DROP POLICY IF EXISTS "Users can insert chats" ON chats;
DROP POLICY IF EXISTS "Users can delete chats" ON chats;

DROP POLICY IF EXISTS "Users can view all messages" ON messages;
DROP POLICY IF EXISTS "Users can insert messages" ON messages;
DROP POLICY IF EXISTS "Users can delete messages" ON messages;

-- Create policies for users table
CREATE POLICY "Users can view all users" ON users FOR SELECT USING (true);
CREATE POLICY "Users can insert themselves" ON users FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update themselves" ON users FOR UPDATE USING (true);
CREATE POLICY "Users can delete themselves" ON users FOR DELETE USING (true);

-- Create policies for chats table
CREATE POLICY "Users can view all chats" ON chats FOR SELECT USING (true);
CREATE POLICY "Users can insert chats" ON chats FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can delete chats" ON chats FOR DELETE USING (true);

-- Create policies for messages table
CREATE POLICY "Users can view all messages" ON messages FOR SELECT USING (true);
CREATE POLICY "Users can insert messages" ON messages FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can delete messages" ON messages FOR DELETE USING (true);

-- Create policies for pair_history table
CREATE POLICY "Users can view all pair history" ON pair_history FOR SELECT USING (true);
CREATE POLICY "Users can insert pair history" ON pair_history FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can delete pair history" ON pair_history FOR DELETE USING (true);

-- Enable realtime for all tables
ALTER PUBLICATION supabase_realtime ADD TABLE users;
ALTER PUBLICATION supabase_realtime ADD TABLE chats;
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE pair_history;

-- Create function to normalize user pairs (always store as least, greatest)
CREATE OR REPLACE FUNCTION normalize_user_pair()
RETURNS TRIGGER AS $$
BEGIN
    -- Ensure user1_id is always the smaller UUID and user2_id is the larger UUID
    IF NEW.user1_id > NEW.user2_id THEN
        NEW.user1_id := NEW.user2_id;
        NEW.user2_id := NEW.user1_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to normalize user pairs before insert
DROP TRIGGER IF EXISTS normalize_user_pair_trigger ON pair_history;
CREATE TRIGGER normalize_user_pair_trigger
    BEFORE INSERT ON pair_history
    FOR EACH ROW
    EXECUTE FUNCTION normalize_user_pair();

-- Drop existing function and trigger if they exist
DROP TRIGGER IF EXISTS chat_deletion_trigger ON chats;
DROP FUNCTION IF EXISTS handle_chat_deletion();

-- Create function to automatically update user status when chat is deleted
CREATE OR REPLACE FUNCTION handle_chat_deletion()
RETURNS TRIGGER AS $$
BEGIN
    -- Update all users in the deleted chat to 'finding' status
    UPDATE users 
    SET status = 'finding', chat_id = NULL 
    WHERE chat_id = OLD.id;
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for chat deletion
CREATE TRIGGER chat_deletion_trigger
    AFTER DELETE ON chats
    FOR EACH ROW
    EXECUTE FUNCTION handle_chat_deletion();
