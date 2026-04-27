# 📝 Supabase Collaborative Notes App

Welcome to the **Real-Time Collaborative Notes App**! This is a premium, enterprise-grade note-taking application built with **Next.js** and **Supabase**. It allows multiple users to edit notes concurrently, see live presence indicators, and confidently manage conflicts. 🚀

🔗 **Live Demo:** [https://notes-app-steel-kappa.vercel.app/](https://notes-app-steel-kappa.vercel.app/)

## ✨ Key Features

- **⚡️ Real-Time Collaboration**: Edit notes simultaneously with colleagues. See who is online and who is actively typing via live presence indicators.
- **🛡️ Robust Conflict Resolution**: Never lose your work! Our version-based conflict resolution gracefully handles concurrent edits, allowing you to *Keep Yours*, *Apply Remote*, or *Merge Both*.
- **🔐 Secure Authentication & RBAC**: Powered by Supabase Auth, securely log in and manage your notes. Supports Role-Based Access Control (Owner, Editor, Viewer) for fine-grained permissions.
- **🕰️ Note History & Versioning**: Made a mistake? No problem! Browse snapshot histories and restore past versions of your notes with a single click.
- **💅 Premium UI/UX**: Designed with a sleek, modern SaaS aesthetic using **Material UI**, complete with a distraction-free editor and responsive dashboard.

## 🛠️ Tech Stack

- **Framework**: [Next.js (App Router)](https://nextjs.org/)
- **Backend & Database**: [Supabase](https://supabase.com/) (PostgreSQL)
- **Realtime Sync**: Supabase Realtime & Presence
- **Styling & UI**: [Material UI (MUI)](https://mui.com/)
- **Data Fetching**: [TanStack Query (React Query)](https://tanstack.com/query/latest)

## 🚀 Getting Started

### 1. Clone & Install

Clone the repository and install the dependencies using your preferred package manager:

```bash
npm install
# or
yarn install
# or
pnpm install
```

### 2. Configure Environment Variables

Create a `.env.local` file in the root directory and add your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Run the Development Server

Start the application locally:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to explore the app! 🎉

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the issues page if you want to contribute.

## 📄 License

This project is licensed under the MIT License.
