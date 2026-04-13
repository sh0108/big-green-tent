# Big Green Tent Prototype Redesign Notes

## Summary
This redesign focuses on the visible product experience only. The frontend was overhauled to feel warmer, more editorial, and more aligned with the Big Green Tent brand kit, while the backend structure, routes, scoring logic, API behavior, and database interactions were intentionally left unchanged.

## What Changed
- A unified brand-led design system now drives both the discovery and outreach views.
- The prototype uses the approved typography roles:
  - Headline: `GT Alpina Condensed Light`
  - Accent / pull quote: `GT Alpina Condensed Light Italic`
  - Body copy: `Articulat CF Regular`
  - Subheads and CTAs: `Articulat CF Bold`
- The interface now uses the approved palette:
  - Forest `#0d3023`
  - Pine `#1a7252`
  - Grove `#2d915f`
  - Sun `#f4c146`
  - Ember `#ed5632`
  - Sky `#4fa2db`
  - Ink `#231f20`
  - Warm cream surfaces for readability and softness
- Brand assets from the kit were added selectively:
  - Tent logo treatment in the shell
  - Tent silhouette and organic framing in hero areas
  - Hand-drawn dividers and accent marks in section transitions
- The old prototype styling was replaced with reusable frontend patterns for:
  - Navigation shell
  - Cards and surfaces
  - Tabs
  - Buttons
  - Filters and sliders
  - Empty states
  - Metric tiles
  - Inline feedback/toast messaging
- The outreach dashboard now includes a prototype-only pre-filled contact package so reviewers can visualize a future handoff workflow with subject line, message draft, and package contents already prepared.

## UX Rationale
- Stronger hierarchy:
  - Editorial headlines and clearer sectioning make the product feel purposeful instead of generic.
- Better consistency:
  - Reusable components reduce visual drift between discovery and outreach views.
- Lower cognitive load:
  - Filters are grouped more clearly, results are easier to scan, and selected-detail content is more intentional.
- More trust:
  - Warm surfaces, clearer information groupings, and reduced reliance on prototype-style alerts create a more credible donor-facing experience.
- Improved interaction polish:
  - Inline confirmation/toast messaging is less disruptive than browser alerts and keeps users in flow.
- Better brand expression:
  - The redesign moves closer to the brand kit than the current site while staying appropriate for a working product interface.
- Accessibility-minded decisions:
  - Higher contrast anchors, more legible spacing, larger click targets, and clearer state changes make the prototype easier to use.

## What Was Intentionally Not Changed
- Backend endpoints and server behavior
- Request and response shapes
- Database schema and SQLite usage
- Route structure: `/` and `/admin`
- Core user flows for discovery, explanation, approval, approved listing, and removal

## Client-Facing Takeaway
The new prototype keeps the existing system intact while making the experience feel far more human, branded, and usable. The result is a product that is better suited for stakeholder review, donor confidence, and future UI iteration without requiring a platform rewrite.
