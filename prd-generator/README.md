# PRD Generator

AI-Powered Product Requirements Document Generator using the ISTVON Framework.

## Features

### Real AI Integration
- Supports OpenAI and Claude (Anthropic) APIs
- AI-powered enhancements for:
  - Problem Statement
  - Goals
  - Out of Scope suggestions
  - Chart Guidelines
  - Image Guidelines
  - API & MCP recommendations
  - Competitor Discovery & Analysis
  - Full PRD Generation
  - Proposal Cover Letters

### File Handling
- Base64 file storage with preview
- Image thumbnails for uploaded photos
- Support for ZIP, documents, and multiple file uploads
- Google Drive and OneDrive link storage

### Export Functionality
- **PDF Export**: Formatted PDF with headers, colors, and branding
- **DOCX Export**: Microsoft Word format with proper styling
- **JSON Export**: Structured data for programmatic access

### Email Integration
- Send PRD to team via mailto: links
- Opens default email client with PRD content
- Supports multiple recipients

### Auto-Save
- Automatic saving to localStorage
- Previous tech stack preservation
- Form data persistence across sessions

## Installation

```bash
cd prd-generator
npm install
npm start
```

## Configuration

1. Click the Settings icon (gear) in the header
2. Select your AI Provider (OpenAI or Claude)
3. Enter your API key
4. AI features will now be enabled

## Project Structure

```
prd-generator/
├── public/
│   └── index.html
├── src/
│   ├── components/
│   │   ├── PRDGenerator.jsx    # Main component (UI unchanged)
│   │   └── index.js
│   ├── constants/
│   │   └── index.js            # All constants and config
│   ├── hooks/
│   │   ├── useFormData.js      # Form data management hook
│   │   ├── useAI.js            # AI functionality hook
│   │   └── index.js
│   ├── services/
│   │   └── aiService.js        # AI API integration
│   ├── utils/
│   │   ├── colorUtils.js       # Color/contrast calculations
│   │   ├── emailUtils.js       # Email/mailto functionality
│   │   ├── exportUtils.js      # PDF/DOCX/JSON exports
│   │   ├── fileUtils.js        # File handling utilities
│   │   └── index.js
│   ├── App.jsx
│   ├── index.js
│   └── index.css
├── package.json
├── tailwind.config.js
└── postcss.config.js
```

## Dependencies

- **React 18**: UI framework
- **Lucide React**: Icon library
- **jsPDF**: PDF generation
- **docx**: Microsoft Word document generation
- **Tailwind CSS**: Styling

## API Requirements

For AI features, you need one of:
- OpenAI API key (uses gpt-4o-mini model)
- Anthropic API key (uses claude-3-haiku model)

## Functionality Added

1. **AI Features**: Real API integration with OpenAI/Claude
2. **File Uploads**: Base64 storage with image previews
3. **PDF Export**: Properly formatted PDF documents
4. **DOCX Export**: Microsoft Word compatible exports
5. **JSON Export**: Structured data export
6. **Email Integration**: mailto: links for team sharing
7. **Auto-Save**: localStorage persistence
8. **Previous Tech Stack**: Load saved technology choices
9. **Upload Status Checklist**: Visual feedback on document uploads
10. **PRD Review Checklist**: Proper tracking of completion
11. **Notifications**: Toast notifications for user feedback
12. **Settings Dialog**: API key and provider configuration

## License

Powered by ISTVON PRD Prompt Framework | BuLLMake PRD Generator
