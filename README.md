# MCCI GPS Collector

A lightweight Vite + React application designed to collect and manage GPS data, seamlessly integrated with Supabase for backend services.

## 🚀 Getting Started

### Prerequisites

Ensure you have the following installed on your machine:

- [Node.js](https://nodejs.org/) (v14 or higher)
- [npm](https://www.npmjs.com/) (v6 or higher)

### Installation

1. **Clone the Repository**

   ```bash
   git clone https://github.com/shane-permalloo/mcci-gps-collector.git
   cd mcci-gps-collector
   ```

2. **Install Dependencies**

   ```bash
   npm install
   ```

3. **Configure Environment Variables**

   Create a `.env.local` file in the root directory of the project and add your Supabase credentials:

   ```env
   VITE_SUPABASE_URL=your-supabase-url
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

   > **Note:** In Vite, environment variables must be prefixed with `VITE_` to be exposed to the client-side code.

4. **Start the Development Server**

   ```bash
   npm run dev
   ```

   The application will be available at `http://localhost:5173`.

## 🧪 Supabase Integration

The application utilizes Supabase for backend services. Ensure you have a Supabase project set up:

1. **Create a Supabase Project**

   Sign in to [Supabase](https://supabase.com/) and create a new project.

2. **Obtain API Credentials**

   Navigate to your project's settings to find the `Project URL` and `Anon Public API Key`.

3. **Set Environment Variables**

   Update the `.env.local` file with your Supabase credentials as shown above.

4. **Initialize Supabase Client**

   In your application, you can initialize the Supabase client as follows:

   ```javascript
   import { createClient } from '@supabase/supabase-js';

   const supabase = createClient(
     import.meta.env.VITE_SUPABASE_URL,
     import.meta.env.VITE_SUPABASE_ANON_KEY
   );
   ```

   This setup allows your application to interact with Supabase services securely.

## 📦 Building for Production

To build the application for production, run:

```bash
npm run build
```

The optimized and minified output will be in the `dist` directory.

## 📝 License

This project is licensed under the [MIT License](LICENSE).

---

For more detailed information on using Supabase with React and Vite, refer to the [Supabase React Quickstart Guide](https://supabase.com/docs/guides/getting-started/quickstarts/reactjs).
