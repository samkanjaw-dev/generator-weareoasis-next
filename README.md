# Oasis/Solvo Artwork Generator

Deploy this Next.js app at:

```txt
https://generator.weareoasis.io
```

The root route `/` and `/artwork-generator` both open the protected generator.

## Hostinger Commands

Install command:

```bash
npm install
```

Build command:

```bash
npm run build
```

Start command:

```bash
npm run start
```

## Environment Variables

Set these in Hostinger's Node.js app settings:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_ALLOW_ARTWORK_SIGNUPS=false
NEXT_PUBLIC_ENABLE_LAYOUT_EDITOR=false
NEXT_PUBLIC_LAYOUT_EDITOR_EMAILS=
```

## Supabase

Run `db/artwork-generator-schema.sql` in the Supabase SQL editor.

In Supabase Auth URL Configuration, set:

```txt
Site URL: https://generator.weareoasis.io
Redirect URLs:
https://generator.weareoasis.io
https://generator.weareoasis.io/**
https://generator.weareoasis.io/artwork-generator
```

Create or invite users using `@oasisoutsourcing.co.ke` or `@solvoglobal.com` email addresses.
