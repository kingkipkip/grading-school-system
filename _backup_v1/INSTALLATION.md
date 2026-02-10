# 🚀 Installation Guide

## Quick Start

### Prerequisites

- Node.js 18+ ([Download](https://nodejs.org/))
- npm 9+ (comes with Node.js)
- Supabase account ([Sign up](https://supabase.com))

### 1. Clone the Repository

```bash
git clone https://github.com/your-org/grade-management-system.git
cd grade-management-system
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Setup Supabase

#### 3.1 Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign in or create an account
3. Click "New Project"
4. Fill in:
   - **Name:** grade-management-system
   - **Database Password:** (strong password)
   - **Region:** Singapore (closest to Thailand)
5. Wait 2-3 minutes for setup

#### 3.2 Run Database Schema

1. Go to **SQL Editor** in Supabase dashboard
2. Click "New query"
3. Copy contents from `docs/SUPABASE_SETUP.md`
4. Run the query
5. Verify no errors

#### 3.3 Get API Credentials

1. Go to **Settings** → **API**
2. Copy:
   - **Project URL**
   - **anon public** key

### 4. Configure Environment Variables

```bash
cp .env.example .env
```

Edit `.env`:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 6. Create First User

#### Option A: Via Supabase Dashboard

1. Go to **Authentication** → **Users**
2. Click "Add user" → "Create new user"
3. Fill in:
   - Email: teacher@school.com
   - Password: (your password)
   - Auto Confirm User: ✓
4. Click "Create user"

5. Go to **Table Editor** → **users**
6. Click "Insert" → "Insert row"
7. Fill in:
   - id: (copy from auth.users)
   - email: teacher@school.com
   - full_name: Teacher Name
   - role: teacher
8. Click "Save"

#### Option B: Via SQL

```sql
-- 1. Create auth user
INSERT INTO auth.users (email, encrypted_password, email_confirmed_at)
VALUES (
  'teacher@school.com',
  crypt('password123', gen_salt('bf')),
  now()
);

-- 2. Create user profile
INSERT INTO public.users (id, email, full_name, role)
SELECT 
  id,
  email,
  'Teacher Name',
  'teacher'
FROM auth.users
WHERE email = 'teacher@school.com';
```

### 7. Login

1. Go to [http://localhost:3000](http://localhost:3000)
2. Login with:
   - Email: teacher@school.com
   - Password: (your password)

---

## Build for Production

### 1. Build

```bash
npm run build
```

Output will be in `dist/` folder.

### 2. Preview Production Build

```bash
npm run preview
```

---

## Deployment

### Option 1: Vercel (Recommended)

#### Install Vercel CLI

```bash
npm install -g vercel
```

#### Deploy

```bash
vercel
```

Follow the prompts:
- Setup new project? Y
- Link to existing project? N
- Project name: grade-management-system
- Directory: ./
- Override settings? N

#### Set Environment Variables

```bash
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY
```

#### Deploy to Production

```bash
vercel --prod
```

### Option 2: Netlify

#### Install Netlify CLI

```bash
npm install -g netlify-cli
```

#### Deploy

```bash
netlify deploy
```

Follow prompts:
- Create & configure new site? Y
- Team: (your team)
- Site name: grade-management-system
- Publish directory: dist

#### Set Environment Variables

Go to Netlify dashboard:
1. Site settings → Environment variables
2. Add:
   - VITE_SUPABASE_URL
   - VITE_SUPABASE_ANON_KEY

#### Deploy to Production

```bash
netlify deploy --prod
```

### Option 3: Firebase Hosting

#### Install Firebase CLI

```bash
npm install -g firebase-tools
```

#### Login

```bash
firebase login
```

#### Initialize

```bash
firebase init hosting
```

Choose:
- Public directory: dist
- Single-page app: Yes
- GitHub deploys: (optional)

#### Deploy

```bash
npm run build
firebase deploy
```

---

## Troubleshooting

### Common Issues

#### 1. "Cannot find module" error

**Solution:**
```bash
rm -rf node_modules package-lock.json
npm install
```

#### 2. Supabase connection error

**Check:**
- ✓ `.env` file exists
- ✓ URL and key are correct
- ✓ No trailing spaces in `.env`
- ✓ Restart dev server after changing `.env`

#### 3. Database schema errors

**Solution:**
1. Check Supabase logs (Dashboard → Logs)
2. Re-run schema from `docs/SUPABASE_SETUP.md`
3. Ensure RLS policies are enabled

#### 4. Build fails

**Solution:**
```bash
# Clear cache
rm -rf dist .vite node_modules/.vite

# Rebuild
npm run build
```

#### 5. Page blank after login

**Check:**
1. Browser console for errors
2. Network tab for failed requests
3. Supabase RLS policies are correct

### Getting Help

- 📖 Read the [User Manual](docs/USER_MANUAL.md)
- 🛠️ Check [Admin Manual](docs/ADMIN_MANUAL.md)
- 💬 Open an issue on GitHub
- 📧 Email: support@school.com

---

## Next Steps

After installation:

1. ✅ Read [User Manual](docs/USER_MANUAL.md)
2. ✅ Create your first course
3. ✅ Import students
4. ✅ Start grading!

For developers:
1. ✅ Read [Developer Guide](docs/DEVELOPER_GUIDE.md)
2. ✅ Check [Contributing Guidelines](CONTRIBUTING.md)
3. ✅ Review [File Structure](docs/FILE_STRUCTURE.md)

---

**Installation complete! 🎉**

Happy grading! 📚
