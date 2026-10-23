# ATS Resume Analyzer

Paste or upload your resume (PDF/text), paste a job description, and get:

- a strict **job match score** (hard skills, soft skills, job title, education)
- the job's skills highlighted (found / related / missing)
- **where to add each missing skill** in your Skills section, with an auto-built updated section
- buzzwords and weak phrases marked in red with replacements, and bullets without numbers marked in amber

Everything runs in the browser. Your resume is never uploaded.

## Run locally
```bash
npm install
npm run dev
```

## Build
```bash
npm run build
```

## Notes
The score is a guide, not the result of any company's real ATS. Related words (e.g. MySQL vs SQL) get no credit, to mirror strict scanners.

## Roadmap
React components, FastAPI backend for PDF/DOCX parsing, scan history, tests.
