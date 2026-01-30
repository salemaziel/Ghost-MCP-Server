# MCP Tools Reference

This document provides a comprehensive reference for all 51 MCP tools available in the Ghost MCP Server.

## Breaking Changes

### v1.x - getTags Default Limit Changed (PR #87)

**What Changed:**
- The `ghost_get_tags` tool default `limit` parameter changed from `'all'` (unlimited) to `15`

**Impact:**
- Users with more than 15 tags will now see only the first 15 tags by default
- This may affect existing integrations that expected all tags to be returned

**Migration Guide:**

To get the old behavior (fetch all tags), explicitly set `limit: 'all'`:

```json
{
  "limit": "all"
}
```

For better performance with large tag lists, use pagination instead:

```json
{
  "limit": 50,
  "page": 1
}
```

**Rationale:**
- Aligns with Ghost API best practices
- Prevents performance issues with large tag lists
- Matches the schema-defined default
- Encourages explicit pagination for scalability

---

## Overview

| Resource    | Tools | Description                            |
| ----------- | ----- | -------------------------------------- |
| Tags        | 5     | Create, read, update, delete tags      |
| Images      | 1     | Upload images to Ghost                 |
| Posts       | 6     | Full CRUD + search for posts           |
| Pages       | 6     | Full CRUD + search for pages           |
| Members     | 6     | Full CRUD + search for members         |
| Newsletters | 5     | Full CRUD for newsletters              |
| Tiers       | 5     | Full CRUD for membership tiers         |
| **Roles**   | **2** | **Read-only access to staff roles**    |
| **Offers**  | **5** | **Full CRUD for promotional offers**   |
| **Users**   | **4** | **Browse, read, update, delete staff** |
| **Webhooks**| **3** | **Create, update, delete webhooks**    |
| **Invites** | **3** | **Send and manage staff invitations**  |

## Tool Response Format

All tools return responses in this format:

```json
{
  "content": [{ "type": "text", "text": "JSON result or message" }],
  "isError": false // true if error occurred
}
```

---

## Tag Tools

### ghost_get_tags

Retrieves a list of tags from Ghost CMS with advanced filtering and pagination.

**Schema:**

```typescript
{
  name?: string;       // Filter by exact tag name
  slug?: string;       // Filter by tag slug
  visibility?: 'public' | 'internal';  // Filter by visibility
  limit?: number | 'all';  // Results per page (1-100, default: 15, or 'all' for unlimited)
  page?: number;       // Page number for pagination (default: 1)
  order?: string;      // Sort order (e.g., "name ASC", "created_at DESC")
  include?: string;    // Relations to include (e.g., "count.posts")
  filter?: string;     // NQL (Ghost Query Language) filter string
}
```

**⚠️ Breaking Change:**
- **Default limit changed from 'all' to 15** in PR #87
- To retrieve all tags, set `limit: 'all'` or use pagination

**Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `name` | string | - | Filter by exact tag name (case-sensitive) |
| `slug` | string | - | Filter by tag slug |
| `visibility` | enum | - | Filter by visibility: `'public'` or `'internal'` |
| `limit` | number \| 'all' | 15 | Number of tags to return (1-100, or 'all' for unlimited) |
| `page` | number | 1 | Page number for pagination |
| `order` | string | - | Sort field and direction (e.g., `"name ASC"`, `"created_at DESC"`) |
| `include` | string | - | Comma-separated relations to include (e.g., `"count.posts"`) |
| `filter` | string | - | NQL filter string for complex queries |

**Examples:**

Basic usage (returns first 15 tags):
```json
{}
```

Get all tags (for backward compatibility):
```json
{ "limit": "all" }
```

Filter by tag name:
```json
// Get first 10 tags, ordered by name
{
  "limit": 10,
  "order": "name ASC"
}

// Get public tags only
{
  "visibility": "public",
  "limit": 20
}

// Filter by name
{
  "name": "Technology"
}

// Filter by slug
{
  "slug": "javascript"
}

// Get all tags with post counts
{
  "limit": "all",
  "include": "count.posts"
}

// Complex NQL filter: tags with 'tech' in name
{
  "filter": "name:~'tech'",
  "limit": 50
}

// Pagination example
{
  "limit": 15,
  "page": 2,
  "order": "created_at DESC"
}
```

**NQL Filter Examples:**

```javascript
// Tags containing a substring (case-insensitive)
{ "filter": "name:~'javascript'" }

// Tags created after a date
{ "filter": "created_at:>'2024-01-01'" }

// Combine filters with + (AND)
{ "filter": "visibility:public+name:~'tech'" }

// Multiple conditions
{ "filter": "slug:javascript,slug:python" }  // OR condition
```

**Note:** Single quotes in filter strings are automatically escaped for security. If you have more than 15 tags and need all of them, explicitly set `limit: 'all'` or use pagination. See [Breaking Changes](#breaking-changes) for migration details.

---

### ghost_create_tag

Creates a new tag in Ghost CMS.

**Schema:**

```typescript
{
  name: string;         // Required: Tag name (1-191 chars)
  description?: string; // Tag description
  slug?: string;        // URL slug (auto-generated if omitted)
}
```

**Example:**

```json
{
  "name": "JavaScript",
  "description": "Posts about JavaScript programming"
}
```

---

### ghost_get_tag

Retrieves a single tag by ID or slug.

**Schema:**

```typescript
{
  id?: string;      // Ghost ID (24 hex chars)
  slug?: string;    // Tag slug
  include?: string; // Additional relations (e.g., "count.posts")
}
```

**Note:** Either `id` or `slug` must be provided.

---

### ghost_update_tag

Updates an existing tag.

**Schema:**

```typescript
{
  id: string;           // Required: Ghost ID
  name?: string;        // New tag name
  description?: string; // New description
  slug?: string;        // New slug
}
```

---

### ghost_delete_tag

Deletes a tag permanently.

**Schema:**

```typescript
{
  id: string; // Required: Ghost ID
}
```

---

## Image Tools

### ghost_upload_image

Downloads an image from URL, processes it, and uploads to Ghost.

**Schema:**

```typescript
{
  imageUrl: string;  // Required: Publicly accessible image URL
  alt?: string;      // Alt text (auto-generated if omitted)
}
```

**Response:**

```json
{
  "url": "https://your-ghost.com/content/images/2024/01/image.jpg",
  "alt": "Uploaded image"
}
```

**Security:** URLs are validated for SSRF protection before downloading.

---

## Post Tools

### ghost_create_post

Creates a new post in Ghost CMS.

**Schema:**

```typescript
{
  title: string;              // Required: Post title (1-255 chars)
  html: string;               // Required: HTML content (sanitized)
  status?: 'draft' | 'published' | 'scheduled';  // Default: 'draft'
  tags?: string[];            // Tag names (auto-created if missing)
  published_at?: string;      // ISO datetime (required if scheduled)
  custom_excerpt?: string;    // Post excerpt (max 500 chars)
  feature_image?: string;     // Featured image URL
  feature_image_alt?: string; // Alt text (max 125 chars)
  feature_image_caption?: string;
  meta_title?: string;        // SEO title (max 300 chars)
  meta_description?: string;  // SEO description (max 500 chars)
  visibility?: 'public' | 'members' | 'paid' | 'tiers';
  featured?: boolean;         // Default: false
}
```

**Note:** HTML content is automatically sanitized to prevent XSS attacks.

---

### ghost_get_posts

Retrieves posts with pagination, filtering, and field selection.

**Schema:**

```typescript
{
  limit?: number;     // Results per page (1-100, default: 15)
  page?: number;      // Page number for pagination (default: 1)
  filter?: string;    // NQL filter string for complex queries
  order?: string;     // Sort order (e.g., "published_at DESC", "title ASC")
  include?: string;   // Relations to include (e.g., "tags,authors")
  fields?: string;    // Comma-separated list of fields to return
  formats?: string;   // Content formats to include (html, plaintext, mobiledoc)
}
```

**⚠️ Breaking Change:**
- **Default limit changed from 'all' to 15** in PR #87
- To retrieve all posts, set `limit: 100` and implement pagination

**Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `limit` | number | 15 | Number of posts to return (1-100) |
| `page` | number | 1 | Page number for pagination |
| `filter` | string | - | NQL filter string (e.g., `"status:published+featured:true"`) |
| `order` | string | - | Sort field and direction (e.g., `"published_at DESC"`) |
| `include` | string | - | Comma-separated relations (e.g., `"tags,authors"`) |
| `fields` | string | - | Comma-separated fields to return (e.g., `"id,title,slug"`) |
| `formats` | string | - | Content formats: `"html"`, `"plaintext"`, `"mobiledoc"` (comma-separated) |

**Examples:**

```json
// Get first 10 published posts with tags
{
  "filter": "status:published",
  "limit": 10,
  "include": "tags,authors",
  "order": "published_at DESC"
}

// Get only specific fields (optimize response size)
{
  "fields": "id,title,slug,published_at",
  "limit": 50
}

// Get posts with plaintext format in addition to HTML
{
  "formats": "html,plaintext",
  "limit": 20
}

// Get featured posts only
{
  "filter": "featured:true",
  "limit": 5
}

// Pagination through all posts
{
  "limit": 15,
  "page": 2,
  "order": "created_at DESC"
}

// Posts by specific tag
{
  "filter": "tag:javascript",
  "include": "tags"
}

// Posts published in 2024
{
  "filter": "published_at:>='2024-01-01'+published_at:<'2025-01-01'",
  "order": "published_at DESC"
}

// Draft posts only
{
  "filter": "status:draft",
  "limit": 20
}
```

**Field Selection Examples:**

```json
// Minimal response - just IDs and titles
{
  "fields": "id,title"
}

// SEO fields only
{
  "fields": "id,title,meta_title,meta_description,og_title,og_description"
}

// Include all default fields plus custom ones
{
  "fields": "id,title,html,feature_image,custom_excerpt"
}
```

**Format Options:**

| Format | Description |
|--------|-------------|
| `html` | HTML content (default, always included) |
| `plaintext` | Plain text version of content |
| `mobiledoc` | Ghost's internal JSON format |

```json
// Get all three formats
{
  "formats": "html,plaintext,mobiledoc",
  "limit": 10
}
```

**NQL Filter Examples:**

```javascript
// Published posts only
{ "filter": "status:published" }

// Featured posts
{ "filter": "featured:true" }

// Posts with specific tag
{ "filter": "tag:javascript" }

// Posts by author email
{ "filter": "author:john@example.com" }

// Combine filters with + (AND)
{ "filter": "status:published+featured:true+tag:tutorial" }

// Date range
{ "filter": "published_at:>='2024-01-01'+published_at:<'2024-12-31'" }

// Visibility filter
{ "filter": "visibility:public" }

// Multiple tags (OR condition)
{ "filter": "tag:[javascript,typescript,nodejs]" }

// Exclude tag
{ "filter": "tag:-news" }

// Title contains text
{ "filter": "title:~'tutorial'" }
```

**Note:** Single quotes in filter strings are automatically escaped for security.

---

### ghost_get_post

Retrieves a single post by ID or slug.

**Schema:**

```typescript
{
  id?: string;       // Ghost ID
  slug?: string;     // Post slug
  include?: string;  // Relations to include
}
```

---

### ghost_search_posts

Searches posts by title/content.

**Schema:**

```typescript
{
  query: string;     // Required: Search query
  status?: 'published' | 'draft' | 'scheduled' | 'all';
  limit?: number;    // 1-50, default: 15
}
```

---

### ghost_update_post

Updates an existing post.

**Schema:**

```typescript
{
  id: string; // Required: Ghost ID
  // All other post fields are optional
}
```

---

### ghost_delete_post

Deletes a post permanently.

**Schema:**

```typescript
{
  id: string; // Required: Ghost ID
}
```

---

## Page Tools

Pages are similar to posts but do **NOT** support tags.

### ghost_create_page

**Schema:**

```typescript
{
  title: string;              // Required
  html: string;               // Required
  status?: 'draft' | 'published' | 'scheduled';
  published_at?: string;
  feature_image?: string;
  meta_title?: string;
  meta_description?: string;
  // Note: No tags field
}
```

### ghost_get_pages, ghost_get_page, ghost_search_pages, ghost_update_page, ghost_delete_page

Same patterns as post tools, without tag support.

---

## Member Tools

### ghost_create_member

Creates a new member/subscriber.

**Schema:**

```typescript
{
  email: string;          // Required: Valid email
  name?: string;          // Member name
  note?: string;          // Internal notes
  labels?: string[];      // Label names
  newsletters?: string[]; // Newsletter IDs to subscribe
}
```

---

### ghost_get_members

Retrieves members with filtering.

**Schema:**

```typescript
{
  limit?: number;
  page?: number;
  filter?: string;
  order?: string;
  include?: string;  // e.g., "labels,newsletters"
}
```

---

### ghost_get_member

Retrieves a member by ID or email.

**Schema:**

```typescript
{
  id?: string;    // Ghost ID
  email?: string; // Member email
}
```

---

### ghost_search_members

Searches members by name or email.

**Schema:**

```typescript
{
  query: string;   // Required: Search query
  limit?: number;  // 1-50
}
```

---

### ghost_update_member

**Schema:**

```typescript
{
  id: string;             // Required
  email?: string;
  name?: string;
  note?: string;
  labels?: string[];
  newsletters?: string[];
}
```

---

### ghost_delete_member

**Schema:**

```typescript
{
  id: string; // Required
}
```

---

## Newsletter Tools

### ghost_create_newsletter

**Schema:**

```typescript
{
  name: string;                // Required: Newsletter name
  description?: string;
  sender_name?: string;
  sender_email?: string;
  subscribe_on_signup?: boolean;
}
```

### ghost_get_newsletters

**Schema:**

```typescript
{
  limit?: number;
  page?: number;
  filter?: string;
  order?: string;
}
```

### ghost_get_newsletter

**Schema:**

```typescript
{
  id: string; // Required
}
```

### ghost_update_newsletter

**Schema:**

```typescript
{
  id: string;   // Required
  name?: string;
  description?: string;
  sender_name?: string;
  sender_email?: string;
}
```

### ghost_delete_newsletter

**Schema:**

```typescript
{
  id: string; // Required
}
```

---

## Tier Tools

### ghost_create_tier

Creates a membership tier.

**Schema:**

```typescript
{
  name: string;          // Required: Tier name
  description?: string;  // Max 500 chars
  monthly_price?: number; // Price in cents
  yearly_price?: number;  // Price in cents
  currency?: string;      // 3-letter code (e.g., "USD")
  benefits?: string[];    // List of benefits
}
```

### ghost_get_tiers

**Schema:**

```typescript
{
  type?: 'free' | 'paid';
  limit?: number;
  page?: number;
  filter?: string;
}
```

### ghost_get_tier

**Schema:**

```typescript
{
  id: string; // Required
}
```

### ghost_update_tier

**Schema:**

```typescript
{
  id: string;  // Required
  name?: string;
  description?: string;
  monthly_price?: number;
  yearly_price?: number;
  benefits?: string[];
}
```

### ghost_delete_tier

**Schema:**

```typescript
{
  id: string; // Required
}
```

---

## Role Tools

### ghost_get_roles

Retrieves a list of all available staff roles (read-only operation).

**Schema:**

```typescript
{
  // No parameters - retrieves all roles
}
```

**Response Fields:**
- `id`: Role ID (24-char hex)
- `name`: Role name (Administrator, Editor, Author, Contributor, Owner)
- `description`: Role description
- `permissions`: Array of permission objects
- `created_at`, `updated_at`: Timestamps

**Example Response:**
```json
[
  {
    "id": "629b00d4ce9e990001234567",
    "name": "Administrator",
    "description": "Full site access",
    "permissions": [...]
  }
]
```

**Use Cases:**
- List available roles for staff invitations
- Display role hierarchy
- Check permission levels before operations

### ghost_get_role

Retrieves a specific role by ID.

**Schema:**

```typescript
{
  id: string;  // Required: 24-char hex Ghost role ID
}
```

**Response:** Single role object with permissions.

**Example:**
```json
{
  "id": "629b00d4ce9e990001234567",
  "name": "Editor",
  "permissions": [...]
}
```

---

## Offer Tools

### ghost_get_offers

Retrieves a list of promotional offers with filtering and pagination.

**Schema:**

```typescript
{
  limit?: number;  // 1-100, default: 15
  page?: number;   // default: 1
  order?: string;  // e.g., "name ASC", "created_at DESC"
  filter?: string; // NQL filter
}
```

**Response Fields:**
- `id`: Offer ID
- `name`: Offer name
- `code`: Redemption code (unique)
- `display_title`, `display_description`: UI display text
- `type`: `'percent'` or `'fixed'`
- `amount`: Discount amount (percentage or currency amount)
- `duration`: `'once'`, `'forever'`, `'repeating'`
- `duration_in_months`: Number of months (if duration='repeating')
- `currency`: Currency code (if type='fixed')
- `status`: `'active'` or `'archived'`
- `redemption_count`: Number of times redeemed
- `tier`: Associated membership tier object

**Example Response:**
```json
[
  {
    "id": "629b00d4ce9e990001234567",
    "name": "Black Friday 2024",
    "code": "BLACKFRIDAY24",
    "type": "percent",
    "amount": 50,
    "duration": "once",
    "status": "active",
    "redemption_count": 42
  }
]
```

### ghost_get_offer

Retrieves a specific offer by ID.

**Schema:**

```typescript
{
  id: string;  // Required: 24-char hex Ghost offer ID
}
```

### ghost_create_offer

Creates a new promotional offer.

**Schema:**

```typescript
{
  name: string;                    // Required: Offer name
  code: string;                    // Required: Unique redemption code (uppercase alphanumeric, hyphens)
  display_title?: string;          // Display name (defaults to name)
  display_description?: string;    // Display description
  type: 'percent' | 'fixed';       // Required: Discount type
  amount: number;                  // Required: Discount amount (1-100 for percent, currency amount for fixed)
  duration: 'once' | 'forever' | 'repeating';  // Required
  duration_in_months?: number;     // Required if duration='repeating' (1-60)
  currency?: string;               // Required if type='fixed' (e.g., 'USD', 'EUR')
  status?: 'active' | 'archived';  // default: 'active'
  tier_id?: string;                // Associated membership tier ID
}
```

**Validation Rules:**
- **code**: Must be unique, uppercase alphanumeric + hyphens only
- **amount**: 1-100 for percent, positive for fixed
- **duration_in_months**: Required only if duration='repeating', range 1-60
- **currency**: Required only if type='fixed', must be valid 3-letter code

**Example:**
```json
{
  "name": "Summer Sale",
  "code": "SUMMER2024",
  "type": "percent",
  "amount": 30,
  "duration": "once",
  "display_title": "30% Off Summer Sale"
}
```

### ghost_update_offer

Updates an existing offer.

**Schema:**

```typescript
{
  id: string;                      // Required: Offer ID to update
  name?: string;
  code?: string;                   // Must remain unique
  display_title?: string;
  display_description?: string;
  type?: 'percent' | 'fixed';
  amount?: number;
  duration?: 'once' | 'forever' | 'repeating';
  duration_in_months?: number;
  currency?: string;
  status?: 'active' | 'archived';
  tier_id?: string;
}
```

**Note:** Cannot change `type` if offer has been redeemed.

### ghost_delete_offer

Deletes an offer permanently.

**Schema:**

```typescript
{
  id: string;  // Required: Offer ID to delete
}
```

**Warning:** Deletion is permanent and cannot be undone. Consider archiving (`status: 'archived'`) instead.

---

## User Tools

### ghost_get_users

Retrieves a list of staff users with filtering and pagination.

**Schema:**

```typescript
{
  limit?: number;  // 1-100, default: 15
  page?: number;   // default: 1
  order?: string;  // e.g., "name ASC", "created_at DESC"
  filter?: string; // NQL filter (e.g., "status:active")
  include?: string; // Relations to include (e.g., "count.posts,roles")
}
```

**Response Fields:**
- `id`: User ID (24-char hex)
- `name`: Full name
- `slug`: URL-friendly identifier
- `email`: Email address
- `profile_image`: Avatar URL
- `cover_image`: Cover image URL
- `bio`: Biography text
- `website`: Personal website URL
- `location`: Geographic location
- `facebook`, `twitter`: Social media handles
- `accessibility`: Accessibility settings JSON
- `status`: `'active'`, `'inactive'`, `'locked'`
- `meta_title`, `meta_description`: SEO fields
- `tour`: Onboarding tour completion JSON
- `last_seen`: Last activity timestamp
- `created_at`, `updated_at`: Timestamps
- `roles`: Array of role objects (if `include=roles`)
- `count.posts`: Post count (if `include=count.posts`)

**Example Response:**
```json
[
  {
    "id": "1",
    "name": "Jane Doe",
    "slug": "jane",
    "email": "jane@example.com",
    "status": "active",
    "roles": [{ "name": "Editor" }],
    "count": { "posts": 42 }
  }
]
```

### ghost_get_user

Retrieves a specific user by ID or slug.

**Schema:**

```typescript
{
  id?: string;      // User ID (24-char hex)
  slug?: string;    // User slug (URL-friendly)
  include?: string; // Relations to include
}
```

**Note:** Must provide either `id` or `slug`.

### ghost_update_user

Updates a staff user's profile and settings.

**Schema:**

```typescript
{
  id: string;               // Required: User ID to update
  name?: string;            // Full name (1-191 chars)
  slug?: string;            // URL-friendly slug (lowercase, alphanumeric + hyphens)
  email?: string;           // Valid email address
  bio?: string;             // Biography (max 200 chars)
  website?: string;         // Valid URL
  location?: string;        // Geographic location (max 150 chars)
  facebook?: string;        // Facebook username (max 2000 chars)
  twitter?: string;         // Twitter handle WITHOUT @ (max 2000 chars)
  profile_image?: string;   // Avatar image URL
  cover_image?: string;     // Cover image URL
  meta_title?: string;      // SEO title (max 300 chars)
  meta_description?: string;// SEO description (max 500 chars)
  tour?: string;            // JSON string for tour completion state
  accessibility?: string;   // JSON string for accessibility settings
}
```

**Validation Rules:**
- **slug**: Lowercase alphanumeric + hyphens only, must be unique
- **email**: Must be valid format and unique
- **twitter**: Do NOT include @ symbol
- **bio**: Max 200 characters
- **website**: Must be valid URL format
- **tour**, **accessibility**: Must be valid JSON strings

**Example:**
```json
{
  "id": "629b00d4ce9e990001234567",
  "name": "Jane Doe",
  "bio": "Editor and content strategist",
  "twitter": "janedoe",
  "website": "https://janedoe.com"
}
```

**Note:** Cannot update user roles via this tool. Use Ghost Admin UI for role changes.

### ghost_delete_user

Deletes a staff user permanently.

**Schema:**

```typescript
{
  id: string;  // Required: User ID to delete
}
```

**Warning:** 
- Deletion is permanent and cannot be undone
- Cannot delete the site owner or your own account
- Posts created by deleted users will remain but show "Unknown Author"

---

## Webhook Tools

### ghost_create_webhook

Creates a new webhook for Ghost events.

**Schema:**

```typescript
{
  event: string;          // Required: Event name (e.g., 'post.published', 'member.added')
  target_url: string;     // Required: HTTPS webhook endpoint URL
  name?: string;          // Optional: Webhook name (defaults to "{event} webhook")
  secret?: string;        // Optional: Secret for HMAC signature validation
  api_version?: string;   // Optional: Ghost API version (default: 'v5.0')
  integration_id?: string;// Optional: Associated integration ID
}
```

**Supported Events:**
- **Posts**: `post.added`, `post.deleted`, `post.edited`, `post.published`, `post.unpublished`, `post.scheduled`, `post.unscheduled`, `post.rescheduled`
- **Pages**: `page.added`, `page.deleted`, `page.edited`, `page.published`, `page.unpublished`, `page.scheduled`, `page.unscheduled`, `page.rescheduled`
- **Tags**: `tag.added`, `tag.edited`, `tag.deleted`
- **Members**: `member.added`, `member.edited`, `member.deleted`
- **Site**: `site.changed`

**Validation Rules:**
- **target_url**: Must use HTTPS protocol (HTTP not allowed for security)
- **event**: Must match one of the supported event names exactly
- **secret**: Optional but recommended for signature verification
- **name**: Max 191 characters

**Example:**
```json
{
  "event": "post.published",
  "target_url": "https://api.example.com/webhooks/ghost",
  "name": "Publish Notification",
  "secret": "your-secret-key"
}
```

**Security Notes:**
- Always use HTTPS endpoints
- Implement signature verification using the secret
- Validate webhook payloads before processing

### ghost_update_webhook

Updates an existing webhook configuration.

**Schema:**

```typescript
{
  id: string;             // Required: Webhook ID to update
  event?: string;         // Event name
  target_url?: string;    // HTTPS webhook endpoint URL
  name?: string;          // Webhook name
  secret?: string;        // Secret for HMAC validation
  api_version?: string;   // Ghost API version
}
```

**Note:** Same validation rules apply as create webhook.

### ghost_delete_webhook

Deletes a webhook permanently.

**Schema:**

```typescript
{
  id: string;  // Required: Webhook ID to delete
}
```

**Warning:** Deletion is permanent. No further event notifications will be sent.

---

## Invite Tools

### ghost_get_invites

Retrieves a list of pending staff invitations.

**Schema:**

```typescript
{
  limit?: number;  // 1-100, default: 15
  page?: number;   // default: 1
  order?: string;  // e.g., "created_at DESC"
  filter?: string; // NQL filter
}
```

**Response Fields:**
- `id`: Invite ID (24-char hex)
- `role_id`: Associated role ID
- `email`: Invitee email address
- `expires`: Expiration timestamp (ISO 8601)
- `created_at`, `updated_at`: Timestamps
- `status`: `'pending'` or `'sent'`

**Example Response:**
```json
[
  {
    "id": "629b00d4ce9e990001234567",
    "email": "neweditor@example.com",
    "role_id": "629b00d4ce9e990001234568",
    "status": "pending",
    "expires": "2026-02-05T10:00:00.000Z"
  }
]
```

**Note:** Only pending/sent invites are shown. Accepted invites are automatically removed.

### ghost_create_invite

Sends a new staff invitation email.

**Schema:**

```typescript
{
  email: string;       // Required: Valid email address
  role_id: string;     // Required: 24-char hex Ghost role ID
  expires_at?: string; // Optional: ISO 8601 datetime (must be future, max 7 days)
}
```

**Validation Rules:**
- **email**: Must be valid format, not already a user or pending invite
- **role_id**: Must be a valid Ghost role ID (get from `ghost_get_roles`)
- **expires_at**: Must be future datetime, max 7 days from now (default: 7 days)

**Example:**
```json
{
  "email": "neweditor@example.com",
  "role_id": "629b00d4ce9e990001234568"
}
```

**Workflow:**
1. Call `ghost_get_roles` to get valid role IDs
2. Create invite with email and role_id
3. Ghost sends invitation email automatically
4. Invitee clicks link to accept (creates user account)
5. Invite is automatically removed upon acceptance

**Note:** Invites expire after 7 days by default. Expired invites must be deleted and recreated.

### ghost_delete_invite

Revokes a pending staff invitation.

**Schema:**

```typescript
{
  id: string;  // Required: Invite ID to delete
}
```

**Use Cases:**
- Cancel invitation before it's accepted
- Remove expired invitations
- Correct mistakes in role or email

**Warning:** Deletion is immediate. The invitation link will no longer work.

---

## Error Handling

All tools handle errors consistently:

1. **Validation Errors**: Input validation failures return detailed field-level errors
2. **Ghost API Errors**: Upstream Ghost API errors are caught and formatted
3. **Network Errors**: Connection issues return clear error messages

**Error Response Example:**

```json
{
  "content": [
    {
      "type": "text",
      "text": "{\"error\":\"ValidationError\",\"message\":\"Invalid email format\",\"field\":\"email\"}"
    }
  ],
  "isError": true
}
```

---

## NQL (Ghost Query Language) Filter Reference

NQL (Ghost Query Language) is used in `filter` parameters for advanced querying. This section provides a comprehensive reference for constructing NQL filters.

### Basic Syntax

```
field:value
```

### Operators

| Operator | Description | Example |
|----------|-------------|---------|
| `:` | Equals | `status:published` |
| `:-` | Not equals | `status:-draft` |
| `:>` | Greater than | `created_at:>'2024-01-01'` |
| `:>=` | Greater than or equal | `published_at:>='2024-01-01'` |
| `:<` | Less than | `created_at:<'2024-12-31'` |
| `:<=` | Less than or equal | `created_at:<='2024-12-31'` |
| `:~` | Contains (case-insensitive) | `title:~'tutorial'` |
| `:[...]` | In array (OR) | `tag:[javascript,python]` |

### Combining Filters

| Combinator | Description | Example |
|------------|-------------|---------|
| `+` | AND | `status:published+featured:true` |
| `,` | OR (within same field) | `status:published,status:scheduled` |

### Common Filter Examples

**Posts:**
```javascript
// Published posts
"status:published"

// Featured posts published after 2024
"featured:true+published_at:>='2024-01-01'"

// Posts with specific tag
"tag:javascript"

// Posts with multiple tags (any)
"tag:[javascript,typescript,nodejs]"

// Posts without a tag
"tag:-archived"

// Posts by author
"author:john@example.com"

// Public posts only
"visibility:public"

// Title contains keyword
"title:~'guide'"

// Email-only posts
"email_only:true"
```

**Tags:**
```javascript
// Public tags only
"visibility:public"

// Tags with name containing keyword
"name:~'tech'"

// Tags created in 2024
"created_at:>='2024-01-01'+created_at:<'2025-01-01'"

// Multiple slugs
"slug:[javascript,python,ruby]"
```

**Members:**
```javascript
// Members subscribed to newsletter
"newsletters.id:507f1f77bcf86cd799439011"

// Members with specific label
"label:vip"

// Free members
"status:free"

// Paid members
"status:paid"

// Members created after date
"created_at:>'2024-01-01'"

// Email domain filter
"email:~'@company.com'"
```

### Field Types

**Boolean Fields:**
```javascript
"featured:true"
"featured:false"
```

**Date Fields:**
```javascript
// ISO 8601 format recommended
"published_at:>='2024-01-01'"
"created_at:<'2024-12-31'"

// Relative dates (if supported)
"updated_at:>'2024-01-01T00:00:00.000Z'"
```

**String Fields:**
```javascript
// Exact match
"status:published"

// Contains (case-insensitive)
"title:~'tutorial'"

// Not equals
"status:-draft"
```

**Array Fields (tags, authors, etc.):**
```javascript
// Has any of these values
"tag:[javascript,python]"

// Doesn't have this value
"tag:-archived"
```

### Complex Filter Examples

```javascript
// Published featured posts from 2024 with 'tutorial' tag
"status:published+featured:true+tag:tutorial+published_at:>='2024-01-01'"

// Posts that are either featured OR have tutorial tag
"featured:true,tag:tutorial"  // Note: This may not work; use multiple filters instead

// Draft or scheduled posts
"status:draft,status:scheduled"

// Posts published in Q1 2024
"published_at:>='2024-01-01'+published_at:<'2024-04-01'"

// Member posts with public visibility
"visibility:members+status:published"

// Posts with JavaScript or TypeScript tags
"tag:[javascript,typescript]"

// Posts updated in last year excluding archived
"updated_at:>='2024-01-01'+tag:-archived"
```

### Security Notes

- **Automatic Escaping**: Single quotes in filter strings are automatically escaped for security
- **Input Validation**: All filters are validated against a regex pattern to prevent injection attacks
- **Allowed Characters**: Filters can only contain: `a-z A-Z 0-9 _ - : . ' " space , [ ] < > = ! +`

### Limitations

1. **No nested parentheses**: You cannot group conditions with `(` and `)`
2. **OR across fields**: Cannot do `status:published OR featured:true` - use array syntax where applicable
3. **Case sensitivity**: Exact matches are case-sensitive; use `:~` for case-insensitive substring matching
4. **Regex not supported**: Use `:~` for substring matching only

### Best Practices

1. **Use specific filters**: More specific filters improve query performance
2. **Combine with pagination**: Use `limit` and `page` with filters for large result sets
3. **Test filters**: Verify filter syntax with simple queries before combining multiple conditions
4. **Order matters for readability**: Put most restrictive filters first
5. **Use include wisely**: Only include related data you need

### NQL Resources

- [Ghost NQL Documentation](https://ghost.org/docs/content-api/#filtering)
- [Ghost API Explorer](https://ghost.org/docs/admin-api/)

---

## Related Documentation

- [Schema Validation](./SCHEMA_VALIDATION.md) - Zod schema architecture
- [Error Handling](./ERROR_HANDLING.md) - Error types and patterns
- [MCP Transport](./MCP_TRANSPORT.md) - Transport configuration
