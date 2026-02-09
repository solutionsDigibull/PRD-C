# BuLLMake PRD Generator - Requirements

## System Requirements

| Requirement | Version |
|-------------|---------|
| Node.js     | >= 16.x |
| npm         | >= 8.x  |
| OS          | Windows / macOS / Linux |
| Browser     | Chrome, Firefox, Edge, Safari (latest) |

## Frontend Dependencies (prd-generator/)

### Production Dependencies

| Package       | Version   | Purpose                              |
|---------------|-----------|--------------------------------------|
| react         | ^18.2.0   | UI framework                         |
| react-dom     | ^18.2.0   | React DOM rendering                  |
| lucide-react  | ^0.263.1  | Icon library (Loader2, Wand2, etc.)  |
| jspdf         | ^2.5.1    | PDF document generation              |
| docx          | ^8.2.4    | Microsoft Word (.docx) generation    |

### Dev Dependencies

| Package        | Version   | Purpose                          |
|----------------|-----------|----------------------------------|
| react-scripts  | 5.0.1     | Create React App build tooling   |
| tailwindcss    | ^3.3.0    | Utility-first CSS framework      |
| autoprefixer   | ^10.4.14  | CSS vendor prefix automation     |
| postcss        | ^8.4.24   | CSS transformation tool          |

## Backend Dependencies (prd-generator/backend/)

### Production Dependencies

| Package    | Version   | Purpose                                    |
|------------|-----------|---------------------------------------------|
| express    | ^4.18.2   | Web server framework                        |
| cors       | ^2.8.5    | Cross-Origin Resource Sharing middleware     |
| dotenv     | ^16.3.1   | Environment variable management             |
| mammoth    | ^1.8.0    | .docx file reading (Cowork file scanning)   |
| pdf-parse  | ^1.1.1    | PDF file reading (Cowork file scanning)     |

### Dev Dependencies

| Package  | Version | Purpose                            |
|----------|---------|-------------------------------------|
| nodemon  | ^3.0.1  | Auto-restart server on file changes |

## API Keys Required

One of the following AI provider API keys is required for AI features:

| Provider  | Model Used        | Get Key From                          |
|-----------|-------------------|---------------------------------------|
| OpenAI    | gpt-4o-mini       | https://platform.openai.com/api-keys  |
| Anthropic | claude-3-haiku    | https://console.anthropic.com/        |

## Environment Variables

Create a `.env` file in `prd-generator/backend/` with:

```env
# AI Provider: "openai" or "claude"
AI_PROVIDER=openai

# OpenAI API Key
OPENAI_API_KEY=your-openai-api-key-here

# Claude/Anthropic API Key
CLAUDE_API_KEY=your-anthropic-api-key-here

# Server Port (default: 5000)
PORT=5000
```

## Ports Used

| Service  | Port | URL                      |
|----------|------|--------------------------|
| Frontend | 3000 | http://localhost:3000     |
| Backend  | 5000 | http://localhost:5000     |

## Quick Setup

```bash
# 1. Install frontend dependencies
cd prd-generator
npm install

# 2. Install backend dependencies
cd backend
npm install

# 3. Configure environment
#    Copy .env.example to .env and add your API keys
cp .env.example .env

# 4. Start backend server (from prd-generator/backend/)
npm run dev

# 5. Start frontend (from prd-generator/ in a new terminal)
cd ..
npm start
```

## Project Structure

```
prd-generator/
├── public/
│   └── index.html
├── src/
│   ├── components/
│   │   ├── PRDGenerator.jsx       # Main component (~2500 lines)
│   │   └── index.js
│   ├── constants/
│   │   └── index.js               # Constants, form defaults, checklist
│   ├── hooks/
│   │   ├── useFormData.js         # Form state management hook
│   │   ├── useAI.js               # AI integration hook
│   │   └── index.js
│   ├── services/
│   │   ├── aiService.js           # AI API service layer
│   │   └── index.js
│   ├── utils/
│   │   ├── colorUtils.js          # Color/contrast utilities
│   │   ├── emailUtils.js          # Email/mailto utilities
│   │   ├── exportUtils.js         # PDF/DOCX/JSON/MD exports
│   │   ├── fileUtils.js           # File handling utilities
│   │   └── index.js
│   ├── App.jsx
│   ├── index.js
│   └── index.css
├── backend/
│   ├── routes/
│   │   └── ai.js                  # All AI API routes
│   ├── server.js                  # Express server entry
│   ├── package.json
│   ├── .env                       # Environment config (not in git)
│   └── .env.example               # Environment template
├── package.json
├── tailwind.config.js
├── postcss.config.js
└── README.md
```

## Features Summary

1. **4-Step PRD Wizard** - Guided form for building PRDs
2. **AI Enhancements** - Per-field AI suggestions (OpenAI/Claude)
3. **Competitor Discovery** - Auto-populate + G2/TrustRadius/SourceForge pain points
4. **Claude Cowork** - Local file system scanning with AI analysis
5. **BuLLM Document Checklist** - 15-item checklist with upload status mapping
6. **Multi-Platform Selection** - Web, Mobile, Desktop, API, ML, etc.
7. **Visual Style Guide** - Colors, typography, image guidelines
8. **Export** - PDF, DOCX, JSON, Markdown formats
9. **Email Sharing** - Send PRD via mailto links
10. **Sales Proposals** - Generate cover letters and proposals from PRD
11. **PRD Section Highlighting** - Click checklist items to navigate PRD
12. **Auto-Save** - localStorage persistence across sessions

## License

Powered by ISTVON PRD Prompt Framework | BuLLMake PRD Generator
