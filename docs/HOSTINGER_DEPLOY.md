# Deploy to generator.weareoasis.io on Hostinger

## 1. Create the Subdomain

In Hostinger hPanel:

1. Open the `weareoasis.io` hosting account.
2. Go to **Domains** or **Subdomains**.
3. Create:

```txt
generator.weareoasis.io
```

4. Enable SSL for the subdomain after it is created.

## 2. Create the Node.js App

Use Hostinger's Node.js app feature if it is available on your plan.

Recommended app settings:

```txt
Domain: generator.weareoasis.io
Node version: 20 or newer
Install command: npm install
Build command: npm run build
Start command: npm run start
```

If Hostinger asks for an app path, use the folder where this package is uploaded.

## 3. Add Environment Variables

Add these in the Node.js app environment settings:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_ALLOW_ARTWORK_SIGNUPS=false
NEXT_PUBLIC_ENABLE_LAYOUT_EDITOR=false
NEXT_PUBLIC_LAYOUT_EDITOR_EMAILS=
```

Keep `SUPABASE_SERVICE_ROLE_KEY` private. Do not put it into Elementor, WordPress, or browser JavaScript.

## 4. Configure Supabase

In Supabase:

1. Run `db/artwork-generator-schema.sql`.
2. Enable Email Auth.
3. Set Auth URL Configuration:

```txt
Site URL: https://generator.weareoasis.io
Redirect URLs:
https://generator.weareoasis.io
https://generator.weareoasis.io/**
https://generator.weareoasis.io/artwork-generator
```

4. Create or invite approved Oasis/Solvo users.

## 5. Add the Photo Library

The app reads people photos from:

```txt
artwork-library/
```

For a fast launch, upload the people photos into that folder on the server. For a cleaner long-term setup, move these images to Supabase Storage and update the image API later.

## 6. WordPress/Elementor Link

In Elementor, add a button or menu item pointing to:

```txt
https://generator.weareoasis.io
```

Use an iframe only if you want the generator embedded inside a WordPress page. A direct link is cleaner.
