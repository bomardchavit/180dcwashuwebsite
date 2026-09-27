# 180 Degrees Consulting WashU website

Static rebuild of [180dcwashu.org](https://www.180dcwashu.org/): plain HTML, CSS and a little JavaScript. No build step and no dependencies, so it can be hosted anywhere that serves static files.

## Structure

```
index.html              Home
our-team/index.html     Our Team
services/index.html     Services (includes the contact form)
recruitment/index.html  Recruitment (FAQ accordions)
assets/css/styles.css   All styles: theme colours, fonts, layout grid, components
assets/js/main.js       Mobile menu, FAQ accordions, animated recruitment background, contact form
assets/images/          Photos and logos
```

## Preview locally

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000. Pages link to each other with relative paths, so use a local server rather than opening the files directly.

## Deploy

Any static host works: GitHub Pages (Settings → Pages → deploy from the `main` branch root), Vercel or Netlify (import the repo, no build command). Point the `180dcwashu.org` domain at whichever host you choose.

## Editing content

- **Text**: edit the HTML directly. Paragraph sizes use the classes `text-large` and `text-small`.
- **Team members**: each person is one `<li class="list-item">` in `our-team/index.html`. Copy an existing one, then change the photo, name, role and Calendly link.
- **Images**: add files to `assets/images/` and reference them by name.
- **Colours and fonts**: the design tokens are at the top of `assets/css/styles.css`. The site uses the Google Fonts *Unbounded* (headings) and *Archivo* (body).
- **Layout**: blocks inside a section are placed on a 24-column grid on desktop and an 8-column grid on phones. `--d` and `--m` in each block's `style` attribute are its grid positions (`row-start / column-start / row-end / column-end`).

## Contact form

A static site has no form backend, so the Services page form opens the visitor's email app with their message filled in. It is addressed to `washu@180dc.org`; change the form's `data-mailto` attribute to route it elsewhere, or point the form at a form service such as Formspree if you prefer.
