# Biometric Attendance System - Setup Guide

## 1. Supabase Project
1.  Go to [database.new](https://database.new) and create a new project.
2.  Go to **Project Settings > API**.
3.  Copy the `Project URL` and `anon public` key.

## 2. Environment Variables
1.  Open `.env.local` in the root directory.
2.  Update the values with your credentials:
    ```bash
    NEXT_PUBLIC_SUPABASE_URL=your_project_url
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
    ```

## 3. Database Schema
1.  Go to the **SQL Editor** in your Supabase dashboard.
2.  Copy the content from `supabase/schema.sql` in this project.
3.  Paste it into the SQL Editor and click **Run**.
    *   This will create the `profiles`, `sessions`, and `attendance` tables.
    *   It will also set up Row Level Security (RLS) policies.

## 4. User Accounts
> Note: Since we are using Supabase Auth, you need to create users manually or via the sign-up flow (if enabled).

To create a **Teacher** account:
1.  Go to **Authentication > Users** in Supabase.
2.  Click **Add User** -> **Create New User**.
3.  Enter an email (e.g., `teacher@gmail.com`) and password.
4.  **Crucial Step:** Go to the **Table Editor** > `profiles` table.
5.  Find the row for the user you just created.
6.  Change the `role` column from `student` to `teacher`.

To create a **Student** account:
1.  Simply sign up or create a user in Auth. The default role is `student`.

## 5. Running the App
1.  Run `npm run dev` in your terminal.
2.  Login with the accounts you created.
