# Focused public portfolio

This is a dependency-free static shell for the first public portfolio release. The browser reads one generated, sanitized artifact at `/public-data/portfolio.json`; it never imports private knowledge or source records.

Preview locally from the repository root:

```powershell
python -m http.server 4173
```

Open <http://localhost:4173/>. A static server is required because the browser fetches the generated artifact.
