# 180 Degrees Consulting WashU website

The 180 Degrees Consulting WashU website: plain HTML, CSS and a little JavaScript. No build step and no dependencies, so it can be hosted anywhere that serves static files.

## The design

Clean and modern, built around the club's own identity: the 180 DC globe logo, its dark green and bright green, and the *Plus Jakarta Sans* typeface. Pages use generous space, rounded photos of members and Saint Louis, and thin rules to organise content, with the bright green kept for buttons and highlights.

Motion stays quiet: headlines rise into place on load, the globe logo in the home hero floats gently and leans toward the pointer, sections and photos ease in as you reach them, the mission statement fills in as you read, and the numbers count up. Everything respects the visitor's reduced-motion setting, and the content stays fully visible if JavaScript is off or fails to load.

## Structure

```
index.html              Home
our-team/index.html     Our Team
services/index.html     Services (includes the contact form)
recruitment/index.html  Recruitment (timeline and FAQ)
assets/css/site.css     All styles: colours, type, layout, components, motion
assets/js/site.js       Smooth scrolling, header, menu, hero logo, reveals, counters,
                        people strip, capability index, timeline, FAQ, contact form
assets/images/          Photos and logos (logo-globe-large.webp is the hero globe)
```

## Preview locally

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000. Pages link to each other with relative paths, so use a local server rather than opening the files directly.

## Deploy

The site is published with GitHub Pages from the root of the `main` branch, at **https://180dcwashu.com**. Pushing to `main` updates the live site within a minute or two.

- The `CNAME` file tells GitHub Pages which domain to serve; keep it in the repository root.
- The domain's DNS is managed in Cloudflare: `A` records for `180dcwashu.com` point to GitHub Pages (185.199.108.153, 185.199.109.153, 185.199.110.153, 185.199.111.153) and `www` is a `CNAME` to `bomardchavit.github.io`. Keep these records set to "DNS only".
- HTTPS is managed in the repository's Settings → Pages.

Any other static host (Vercel, Netlify) also works: import the repo, with no build command.

## Editing content

- **Text**: edit the HTML directly.
- **Capabilities**: each capability is one `<li class="cap-row">` on the home page and one `<article class="cap">` (plus its link in the index) on the Services page.
- **Team members**: each person is one `<li class="person">` in `our-team/index.html` (and in the leadership strip on the home page). Copy an existing one, then change the photo, name, role and Calendly link.
- **Numbers on the home page**: each count animates up to the number in its `data-count` attribute, so change the attribute and the text together.
- **Logos**: client and employer logos are `<li class="logos__item">` cards and the `marquee` list; add or remove items as needed.
- **Images**: add files to `assets/images/` and reference them by name.
- **Colours and fonts**: the design tokens are at the top of `assets/css/site.css`. The typeface is *Plus Jakarta Sans* from Google Fonts.

## Contact form

A static site has no form backend, so the Services page form opens the visitor's email app with their message filled in. It is addressed to `washu@180dc.org`; change the form's `data-mailto` attribute to route it elsewhere, or point the form at a form service such as Formspree if you prefer.
