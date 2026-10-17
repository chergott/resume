# @chergott/resume

`dist/resume.pdf` is the resume built from `resume.md` and `resume.css` (`npm run build`),
and `dist/resume.md` is the Markdown source, which job-hunter reads.

The `Resume package` workflow (`.github/workflows/package.yml`) builds and publishes a new
version to GitHub Packages on each push to `main` that changes the resume, versioned
`0.1.<run number>`; the version here is a placeholder. chergott-site depends on it and copies
the PDF to `public/resume.pdf` before `dev` and `build`.
