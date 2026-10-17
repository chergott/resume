# Resume

My resume, written in `resume.md` and styled by `resume.css`. In VS Code, the Markdown preview
picks up the CSS through `.vscode/settings.json`, so it looks like the printed page.

```
npm install
npm run build   # makes dist/resume.pdf, one page, using Chrome or Edge
```

`dist/resume.pdf` is published as `@chergott/resume` on GitHub Packages by the `Resume package`
workflow on each push to `main` that changes the resume, and chergott-site copies it to
`/resume.pdf` (see `package/`).
