# TalkShuffle - Random Chat App

A modern OmeTV-like random chat application built with Next.js 14 and Supabase Realtime.

## 🚀 Features

- **Real-time Random Chat**: Connect with random people worldwide
- **Instant Matchmaking**: Smart pairing system for one-on-one conversations
- **Message Filtering**: Built-in content moderation for inappropriate language
- **Modern UI**: Beautiful orange-themed design with TailwindCSS
- **Responsive Design**: Works perfectly on desktop and mobile
- **Real-time Updates**: Live chat using Supabase WebSocket connections

## 🛠 Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, TailwindCSS
- **UI Components**: shadcn/ui
- **Backend**: Supabase (PostgreSQL + Realtime)
- **Styling**: TailwindCSS with custom orange theme
- **Icons**: Lucide React

## 📋 Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account and project

## 🚀 Quick Start

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd talkshuffle
npm install
```

### 2. Set up Supabase

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Get your project URL and anon key from Settings > API
3. Copy your service role key (for admin operations)

### 3. Environment Variables

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

### 4. Database Setup

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `supabase-schema.sql`
4. Run the SQL script to create all tables and functions

### 5. Run the Application

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🗄 Database Schema

### Tables

- **users**: User accounts with status and chat assignment
- **chats**: Chat sessions between two users
- **messages**: Individual messages within chats

### Key Features

- **User Status**: `finding` or `chatting`
- **Automatic Cleanup**: Triggers handle user/chat cleanup
- **Real-time Subscriptions**: WebSocket connections for live updates
- **Content Filtering**: Messages are filtered before storage

## 🔄 How It Works

1. **Landing Page**: User enters username and starts matchmaking
2. **Matchmaking**: System finds available users and creates chat
3. **Real-time Chat**: Users can send messages with instant delivery
4. **Next/Leave**: Users can find new partners or leave entirely
5. **Auto-cleanup**: System handles disconnections and page refreshes

## 🎨 Customization

### Colors
The app uses an orange theme. To change colors, modify the Tailwind classes:
- Primary: `orange-500`, `orange-600`
- Background: `orange-50`, `orange-100`
- Accents: `orange-200`, `orange-300`

### Message Filtering
Edit `src/lib/filter.ts` to modify the banned words list and filtering logic.

## 🚨 Important Notes

- **Page Refresh**: Users are automatically cleaned up on refresh
- **Disconnections**: Partners are reset to "finding" when someone leaves
- **Content Moderation**: Inappropriate messages are blocked with `***`
- **One-to-One Only**: Users can never be in multiple chats simultaneously

## 🔧 Development

### Project Structure

```
src/
├── app/                 # Next.js app router
├── components/          # React components
│   ├── ui/             # shadcn/ui components
│   ├── ChatBox.tsx     # Main chat interface
│   └── FindingScreen.tsx # Matchmaking screen
├── lib/                 # Utility libraries
│   ├── supabase.ts     # Supabase client
│   ├── types.ts        # TypeScript types
│   ├── user.ts         # User management
│   ├── chat.ts         # Chat operations
│   ├── matchmaking.ts  # Matchmaking logic
│   └── filter.ts       # Content filtering
└── app/globals.css     # Global styles
```

### Key Components

- **Home Page**: Landing page with username modal
- **FindingScreen**: Shows while waiting for a match
- **ChatBox**: Main chat interface with real-time messaging
- **Services**: Business logic for users, chats, and matchmaking

## 🚀 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

### Other Platforms

The app can be deployed to any platform that supports Next.js:
- Netlify
- Railway
- DigitalOcean App Platform
- AWS Amplify

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

## 🆘 Support

If you encounter any issues:

1. Check the browser console for errors
2. Verify your Supabase configuration
3. Ensure the database schema is properly set up
4. Check that realtime is enabled in Supabase

## 🔮 Future Enhancements

- [ ] User profiles and avatars
- [ ] Chat categories (language, interests)
- [ ] Report system for inappropriate users
- [ ] Mobile app versions
- [ ] Video/voice chat integration
- [ ] Chat history and favorites
