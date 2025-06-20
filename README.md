# Mapper Traces Viewer

A modern React frontend application for viewing and analyzing LLM prompt traces from the Mapper app stored in Supabase.

## Features

- 📊 **Real-time Dashboard** - View LLM prompt traces with comprehensive statistics across all data
- 🔍 **Advanced Filtering** - Filter by document name, result status, mapping ID, and user ID
- 📄 **Detailed Trace Views** - Expandable cards showing full prompt and response data
- 🎯 **JSON Viewer** - Interactive JSON viewer for prompt objects and response data
- 📊 **Statistics** - Real-time stats showing success rates and trace counts
- 📱 **Responsive Design** - Works seamlessly on desktop and mobile devices
- ⚡ **Fast Performance** - Optimized with pagination and efficient data loading
- 🔧 **Smart JSON Repair** - Advanced JSON repair utility handles malformed LLM responses

## Data Structure

The application displays traces from the `mapper_app.llm_prompt_traces` table with the following key fields:

- **Document Information**: `document_name`, `document_checksum`
- **Mapping Data**: `mapping_id`, `mapping_detail_id`, `criteria_id`
- **Prompt Data**: `prompt_object` (JSONB with model, system prompts, messages)
- **Response Data**: `response_data` (JSON with summary, result, references, reasoning)
- **Metadata**: `user_id`, `created_at`, `updated_at`

## Quick Start

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start the development server**:
   ```bash
   npm run dev
   ```

3. **Open your browser** to `http://localhost:3000`

## Technology Stack

- **Frontend**: React 18 with Vite
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Icons**: Lucide React
- **JSON Viewer**: Custom React component
- **Date Handling**: date-fns

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── TraceCard.jsx   # Individual trace display
│   ├── FilterBar.jsx   # Search and filter controls
│   ├── Pagination.jsx  # Page navigation
│   ├── JsonViewer.jsx  # Custom JSON viewer component
│   ├── LoadingSpinner.jsx
│   ├── ErrorMessage.jsx
│   └── StatsCard.jsx
├── hooks/
│   └── useTraces.js    # Custom hook for data fetching
├── lib/
│   └── supabase.js     # Supabase client configuration
├── utils/
│   └── jsonRepair.js   # Advanced JSON repair utility
├── App.jsx             # Main application component
├── main.jsx           # React entry point
└── index.css          # Global styles
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Configuration

The app connects to the Supabase project "Mapper" with the following configuration:

- **Project URL**: `https://bcinjxawjnsluevsnisk.supabase.co`
- **Table**: `mapper_app.llm_prompt_traces`
- **Authentication**: Uses anonymous access with public read permissions

## Features in Detail

### Trace Cards
- Expandable cards showing trace summary and details
- Tabbed interface for Overview, Prompt, and Response data
- Color-coded result badges (Met/Not Met)
- Document information and metadata display

### Filtering & Search
- Text search across document names
- Filter by result status (Met/Not Met)
- Filter by mapping ID and user ID
- Active filter indicators with easy removal

### Statistics Dashboard
- **Global Statistics** - Shows totals across all traces in database, not just current page
- **Real-time Updates** - Statistics automatically update when filters change
- **Success/Failure Rates** - Visual indicators with trend analysis
- **Pagination Context** - Shows both overall totals and current page counts
- **Parallel Queries** - Efficient database queries for fast statistics loading

### JSON Data Viewer
- Interactive JSON viewer for complex data structures
- Collapsible sections for better navigation
- Copy-to-clipboard functionality
- Dark theme for better readability

### Smart JSON Repair System
- **Automatic Repair** - Fixes malformed JSON from LLM responses
- **Multiple Strategies** - Tries various repair methods in sequence
- **Markdown Cleaning** - Removes code block markers from LLM output
- **Character Sanitization** - Cleans incompatible characters and control codes
- **String Escaping** - Properly escapes strings and handles quotes
- **Graceful Fallback** - Shows raw data when repair fails

## Database Schema

The application expects the following table structure in Supabase:

```sql
-- mapper_app.llm_prompt_traces table structure
CREATE TABLE mapper_app.llm_prompt_traces (
  id BIGINT PRIMARY KEY,
  mapping_id BIGINT NOT NULL,
  mapping_detail_id BIGINT NOT NULL,
  criteria_id INTEGER NOT NULL,
  document_name TEXT NOT NULL,
  document_checksum TEXT NOT NULL,
  prompt_object JSONB NOT NULL,
  response_data TEXT NOT NULL,
  user_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is part of the Mapper application suite.