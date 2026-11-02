# DragonSmashPH Elite Website

This is a stronger redesign of the supplied DragonSmashPH site. The design was benchmarked against the public Astra Pickleball site for feature coverage, especially its booking, court availability, gallery, FAQ, events and inquiry flow. The DragonSmash branding, rates and content remain its own.

## Included
- Premium cinematic hero
- Responsive navigation
- About / experience / rates
- Badminton + Pickleball
- Court booking interface
- 1/2/3-hour duration
- Player-based entrance fee
- Conflict checking
- My Bookings / cancellation
- Live court board
- Events section
- FAQ
- Contact inquiry
- Mobile responsive layout
- DragonSmash logo

## Current values
From the supplied DragonSmashPH HTML:
- Badminton: PHP 350
- Pickleball: PHP 500
- Entrance: PHP 85/person
- Hours: 6:00 AM–2:00 AM
- Courts configured: 4 badminton + 2 pickleball

## Important production note
The booking system is a working browser-side demo using localStorage. It prevents conflicts on the same device/browser, but it is NOT a shared public database.

For production, connect `load()` and `save()` in `app.js` to Supabase/Firebase/MySQL/API. Then every customer will see the same live inventory and double-booking can be prevented server-side.

## Configure
Edit the CONFIG object at the top of `app.js`:
- rates
- entrance fee
- courts
- operating hours
- contact email

## Run
Open `index.html` in a modern browser, or upload the whole folder to your hosting provider.


## Admin Portal
Open `admin.html` for the DragonSmashPH staff portal.

### Demo login
- Username: `admin`
- Password: `DragonSmash@2026`

### Admin features
- Dashboard KPIs and today's schedule
- Create / edit / confirm / complete / cancel bookings
- Master court calendar
- 18-court management: 12 badminton + 6 pickleball
- Activate / disable individual courts
- Customer directory and spend summary
- Website inquiry/messages inbox
- Revenue, booking and court reports
- CSV export and JSON backup
- Pricing, entrance fee, operating hours and contact email settings
- Admin credential change
- Demo data loader and local data reset

### Production security
This is a fully functional browser-side prototype. Admin authentication and booking data are stored in browser storage, so this is NOT secure enough for a public commercial deployment. For production, replace the localStorage/sessionStorage layer with a server/database such as Supabase, Firebase, or a custom API, and enforce authentication, authorization, server-side booking conflict checks, audit logs, and payment verification on the backend.
