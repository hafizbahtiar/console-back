# Email Templates

This directory contains HTML email templates for all email types sent by the application.

## Template Files

- **welcome.html** - Welcome email sent on user registration
- **forgot-password.html** - Password reset request email
- **password-changed.html** - Password changed notification email
- **verify-email.html** - Email verification email

## Template Syntax

Templates use simple variable replacement with `{{variable}}` syntax:

- `{{name}}` - User's name
- `{{verificationUrl}}` - Email verification URL
- `{{resetUrl}}` - Password reset URL
- `{{loginUrl}}` - Login page URL

### Conditional Blocks

Use `{{#if variable}}...{{/if}}` for conditional content:

```html
{{#if verificationUrl}}
<p>Click here to verify: {{verificationUrl}}</p>
{{/if}}
```

## Template Design

All templates follow a consistent design:

- Responsive layout (works on mobile and desktop)
- Brand colors (purple gradient header)
- Clear call-to-action buttons
- Security notices where appropriate
- Professional footer

## Building for Production

**Important:** When building for production, ensure templates are copied to the `dist` folder.

You can add this to your `nest-cli.json`:

```json
{
  "compilerOptions": {
    "assets": ["**/*.html"]
  }
}
```

Or manually copy templates to `dist/modules/email/templates/` after build.

## Editing Templates

1. Edit the HTML files directly
2. Test by sending emails in development mode
3. Templates are automatically loaded by `TemplateService`
4. No restart needed for template changes (in development)
