# Te RURUBENE UI/UX Optimization Guidelines

To ensure the Te RURUBENE platform is performant, accessible, and visually stunning across both the React (Web) and Flutter (Mobile) frontends, especially under Pacific island internet conditions, adhere to the following UI/UX and performance guidelines.

---

## 1. Low-Bandwidth UX Strategies (Pacific Internet Optimization)

### Offline-First Architecture
- **Web (React/Next.js):** Utilize Service Workers and IndexedDB (via localForage) to cache the user's library, playlists, and recently played tracks. 
- **Mobile (Flutter):** Implement `sqflite` and `just_audio_background`. When a user plays a track, aggressive chunk caching should save the file locally. If they replay the track, it plays 100% from disk, saving data.

### Data Saver Modes
- **Audio-Only Toggle:** Provide a prominent switch in the UI to disable Video/Shorts loading, preventing heavy data drain.
- **Lazy Loading & Thumbnails:** 
  - Never load high-res cover art on list views. Serve heavily compressed WebP thumbnails (e.g., 100x100px) from Cloudflare.
  - Implement Intersection Observers on Web and `ListView.builder` on Flutter so images are only fetched right before they scroll into view.
- **Graceful Degradation:** If network speed drops below a threshold, automatically switch the HLS player to the 64kbps audio-only stream and show a brief toast notification: *"Switched to data saver mode."*

---

## 2. Design System & Premium Aesthetics

Te RURUBENE must feel like a world-class creator platform, competing visually with global giants.

### Color Palette & Glassmorphism
- **Theme:** Default to a sleek, high-contrast Dark Mode to emphasize colorful album art.
- **UI Elements:** Avoid flat, solid backgrounds. Use Glassmorphism (blur filters) for navbars and modals.
  - *Tailwind Example:* `bg-black/40 backdrop-blur-md border border-white/10`
- **Gradients:** Use subtle mesh gradients in the background of Artist Profiles and Playlists derived from the dominant colors of their cover art (using a color extraction library).

### Micro-Interactions & Fluidity
- **Play Button:** The play button should have a snappy scale animation on press.
- **Reactions:** When a user triggers a reaction (e.g., "Fire"), spawn a small, non-blocking particle animation over the button.
- **Page Transitions:** Ensure seamless client-side routing. The persistent mini-player must remain completely uninterrupted during page navigation.

---

## 3. Workflow & Dashboard Optimizations

### Studio & Artist Dashboards
- **Clarity in Analytics:** Financial data (Wallet balance, Royalties) must be displayed using large, legible typography with clear positive/negative color indicators (Green for credits, Red for debits).
- **Data Visualization:** Use lightweight charting libraries (e.g., Recharts for React) to render monthly stream trends.
- **Frictionless Uploads:** The drag-and-drop zone for uploading tracks must show immediate visual feedback, a progress bar connected to the Cloudflare R2 chunked upload, and success states.

### Live Events & Tipping
- **Live Chat UX:** The chat overlay on livestreams must automatically scroll to the bottom. 
- **Tipping Friction:** Include preset tip buttons ($1, $5, $10) next to the chat input to encourage impulsive support. The tipping action must be a 1-click process (assuming sufficient Wallet balance) without redirecting the user away from the live video stream.
