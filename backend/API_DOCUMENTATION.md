# Te RURUBENE API Documentation

This document outlines the core API endpoints generated across the expansion phases (Phases 2-5). All endpoints require authentication via Laravel Sanctum (Bearer Token) unless otherwise specified.

## Base URL
`/api`

---

## 1. Monetization & Creator Economy (Phase 2)

### Wallet Operations
#### `GET /wallet`
- **Description:** Retrieves the authenticated user's current wallet balance, currency, and paginated transaction history.
- **Roles:** All
- **Response:**
  ```json
  {
    "balance": "150.00",
    "currency": "AUD",
    "transactions": [...]
  }
  ```

#### `POST /wallet/topup`
- **Description:** Tops up the wallet balance via an external gateway.
- **Roles:** All
- **Body:**
  - `amount` (numeric, required)
  - `source` (string, required): `stripe` | `paypal`

### Subscriptions
#### `GET /plans`
- **Description:** Lists all active subscription plans.
- **Roles:** All

#### `POST /subscribe`
- **Description:** Subscribes the user to a plan. Deducts the `price` from their Wallet balance.
- **Roles:** All
- **Body:**
  - `plan_id` (integer, required)

### Analytics
#### `GET /artist/analytics`
- **Description:** Fetches total stream counts, revenue history, and total net earnings.
- **Roles:** `artist`

---

## 2. Advanced Social & Media (Phase 3)

### Interactions
#### `POST /comments`
- **Description:** Adds a comment or nested reply to a Track, Video, Album, or Playlist.
- **Body:**
  - `commentable_id` (integer, required)
  - `commentable_type` (string, required)
  - `body` (string, required)
  - `parent_id` (integer, optional)

#### `POST /reactions`
- **Description:** Toggles a specific reaction (`like`, `fire`, `heart`) on a piece of content.
- **Body:**
  - `reactionable_id` (integer, required)
  - `reactionable_type` (string, required)
  - `type` (string, required)

#### `GET /stories/active`
- **Description:** Fetches all non-expired stories.

### Live Streaming
#### `POST /live-events/{id}/chat`
- **Description:** Sends a message to a live event's WebSocket chat. If a `tip_amount` is included, funds are securely transferred from the user's wallet to the streaming artist's wallet.
- **Body:**
  - `message` (string, required)
  - `tip_amount` (numeric, optional)

---

## 3. AI & Discovery (Phase 4)

#### `GET /recommendations`
- **Description:** Fetches a personalized list of 10 track recommendations for the user.

#### `POST /smart-playlist`
- **Description:** Generates and saves an AI-curated playlist based on a requested mood.
- **Body:**
  - `mood` (string, required)

#### `GET /search/semantic`
- **Description:** Performs a semantic vector-based search query.
- **Parameters:**
  - `query` (string, required)

---

## 4. Pacific Expansion & Commerce (Phase 5)

### Extended Content
#### `GET /podcasts`
- **Description:** Lists all podcast series and their episodes.

#### `GET /radio-stations`
- **Description:** Lists active continuous internet radio streams, optionally filtered by `country_id`.

### E-Commerce & Ticketing
#### `GET /artists/{artistId}/products`
- **Description:** Lists physical merchandise available from a specific artist.

#### `POST /orders`
- **Description:** Creates a pending merchandise order.
- **Body:**
  - `product_id` (integer, required)
  - `shipping_address` (string, required)

#### `POST /events/{eventId}/tickets`
- **Description:** Purchases a digital ticket for a live concert/stream and generates a unique QR code payload.
- **Response:**
  ```json
  {
    "message": "Ticket purchased successfully",
    "ticket": {
      "qr_code": "qr_64a9c1...",
      "status": "valid"
    }
  }
  ```
