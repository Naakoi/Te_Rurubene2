#!/usr/bin/env python3
"""SCP admin/page.tsx to server and rebuild Next.js frontend."""
import os, sys, pty, select, time, termios

HOST = "91.99.89.94"
USER = "root"
PASS = "!m3n@!k@!"

FILES = [
    ("/home/user/Documents/Projects/Rurubene2/frontend/src/app/page.tsx", "/var/www/rurubene2/frontend/src/app/page.tsx"),
    ("/home/user/Documents/Projects/Rurubene2/frontend/src/app/admin/page.tsx", "/var/www/rurubene2/frontend/src/app/admin/page.tsx"),
    ("/home/user/Documents/Projects/Rurubene2/frontend/src/app/wallet/page.tsx", "/var/www/rurubene2/frontend/src/app/wallet/page.tsx"),
    ("/home/user/Documents/Projects/Rurubene2/frontend/src/app/login/page.tsx", "/var/www/rurubene2/frontend/src/app/login/page.tsx"),
    ("/home/user/Documents/Projects/Rurubene2/frontend/src/app/register/page.tsx", "/var/www/rurubene2/frontend/src/app/register/page.tsx"),
    ("/home/user/Documents/Projects/Rurubene2/frontend/src/app/creator/join/page.tsx", "/var/www/rurubene2/frontend/src/app/creator/join/page.tsx"),
    ("/home/user/Documents/Projects/Rurubene2/frontend/src/app/settings/page.tsx", "/var/www/rurubene2/frontend/src/app/settings/page.tsx"),
    ("/home/user/Documents/Projects/Rurubene2/frontend/src/app/library/page.tsx", "/var/www/rurubene2/frontend/src/app/library/page.tsx"),
    ("/home/user/Documents/Projects/Rurubene2/frontend/src/app/discover/page.tsx", "/var/www/rurubene2/frontend/src/app/discover/page.tsx"),
    ("/home/user/Documents/Projects/Rurubene2/frontend/src/app/marketplace/stores/page.tsx", "/var/www/rurubene2/frontend/src/app/marketplace/stores/page.tsx"),
    ("/home/user/Documents/Projects/Rurubene2/frontend/src/app/layout.tsx", "/var/www/rurubene2/frontend/src/app/layout.tsx"),
    ("/home/user/Documents/Projects/Rurubene2/frontend/src/components/AudioPlayer.tsx", "/var/www/rurubene2/frontend/src/components/AudioPlayer.tsx"),
    ("/home/user/Documents/Projects/Rurubene2/frontend/src/components/TopNav.tsx", "/var/www/rurubene2/frontend/src/components/TopNav.tsx"),
    ("/home/user/Documents/Projects/Rurubene2/frontend/src/components/AuthInitializer.tsx", "/var/www/rurubene2/frontend/src/components/AuthInitializer.tsx"),
    ("/home/user/Documents/Projects/Rurubene2/frontend/src/components/OfflineView.tsx", "/var/www/rurubene2/frontend/src/components/OfflineView.tsx"),
    ("/home/user/Documents/Projects/Rurubene2/frontend/src/components/Sidebar.tsx", "/var/www/rurubene2/frontend/src/components/Sidebar.tsx"),
    ("/home/user/Documents/Projects/Rurubene2/frontend/src/components/MobileNav.tsx", "/var/www/rurubene2/frontend/src/components/MobileNav.tsx"),
    ("/home/user/Documents/Projects/Rurubene2/frontend/src/components/NotificationDropdown.tsx", "/var/www/rurubene2/frontend/src/components/NotificationDropdown.tsx"),
    ("/home/user/Documents/Projects/Rurubene2/frontend/src/lib/offlineStorage.ts", "/var/www/rurubene2/frontend/src/lib/offlineStorage.ts"),
    ("/home/user/Documents/Projects/Rurubene2/frontend/src/hooks/useResumableUpload.ts", "/var/www/rurubene2/frontend/src/hooks/useResumableUpload.ts"),
    # New Next.js media proxy route (NOT under /api/ to avoid Nginx → Laravel routing)
    ("/home/user/Documents/Projects/Rurubene2/frontend/src/app/media-proxy/route.ts", "/var/www/rurubene2/frontend/src/app/media-proxy/route.ts"),
    # PWA files
    ("/home/user/Documents/Projects/Rurubene2/frontend/public/manifest.json", "/var/www/rurubene2/frontend/public/manifest.json"),
    ("/home/user/Documents/Projects/Rurubene2/frontend/public/sw.js", "/var/www/rurubene2/frontend/public/sw.js"),
    ("/home/user/Documents/Projects/Rurubene2/frontend/public/icons/icon-192x192.png", "/var/www/rurubene2/frontend/public/icons/icon-192x192.png"),
    ("/home/user/Documents/Projects/Rurubene2/frontend/public/icons/icon-512x512.png", "/var/www/rurubene2/frontend/public/icons/icon-512x512.png"),
    # Core utilities
    ("/home/user/Documents/Projects/Rurubene2/frontend/src/store/authStore.ts", "/var/www/rurubene2/frontend/src/store/authStore.ts"),
    ("/home/user/Documents/Projects/Rurubene2/frontend/src/lib/axios.ts", "/var/www/rurubene2/frontend/src/lib/axios.ts"),
    # Backend
    ("/home/user/Documents/Projects/Rurubene2/backend/app/Http/Controllers/TrackController.php", "/var/www/rurubene2/backend/app/Http/Controllers/TrackController.php"),
    ("/home/user/Documents/Projects/Rurubene2/backend/app/Http/Controllers/MultipartUploadController.php", "/var/www/rurubene2/backend/app/Http/Controllers/MultipartUploadController.php"),
    ("/home/user/Documents/Projects/Rurubene2/backend/routes/api.php", "/var/www/rurubene2/backend/routes/api.php"),
    ("/home/user/Documents/Projects/Rurubene2/backend/app/Exceptions/Handler.php", "/var/www/rurubene2/backend/app/Exceptions/Handler.php"),
]

def run(cmd_list, desc=""):
    print(f"\n--- {desc} ---")
    pid, fd = pty.fork()
    if pid == 0:
        try:
            attrs = termios.tcgetattr(0)
            attrs[6][termios.VKILL] = b'\x15'
            attrs[6][termios.VERASE] = b'\x7f'
            termios.tcsetattr(0, termios.TCSADRAIN, attrs)
        except Exception:
            pass
        os.execvp(cmd_list[0], cmd_list)
    else:
        buf = ""
        pw_sent = False
        deadline = time.time() + 300  # 5 min for build
        while time.time() < deadline:
            r, _, _ = select.select([fd], [], [], 1.0)
            if fd in r:
                try:
                    data = os.read(fd, 4096)
                except OSError:
                    break
                if not data:
                    break
                decoded = data.decode("utf-8", errors="ignore")
                sys.stdout.write(decoded)
                sys.stdout.flush()
                buf += decoded
                if not pw_sent and "password:" in buf.lower():
                    time.sleep(0.3)
                    os.write(fd, (PASS + "\n").encode())
                    pw_sent = True
                    buf = ""
            else:
                try:
                    res, _ = os.waitpid(pid, os.WNOHANG)
                    if res != 0:
                        break
                except ChildProcessError:
                    break
        try:
            os.waitpid(pid, 0)
        except Exception:
            pass

# 0. Pre-create directories on server
run(
    ["ssh", "-o", "StrictHostKeyChecking=no", f"{USER}@{HOST}",
     "mkdir -p /var/www/rurubene2/frontend/src/app/media-proxy /var/www/rurubene2/frontend/src/hooks /var/www/rurubene2/frontend/public/icons /var/www/rurubene2/backend/app/Exceptions"],
    "Creating directories on server"
)

# 1. SCP updated files
for local, remote in FILES:
    run(
        ["scp", "-o", "StrictHostKeyChecking=no", local, f"{USER}@{HOST}:{remote}"],
        f"Uploading {os.path.basename(local)}"
    )

# 2. Clear Laravel caches, rebuild frontend, restart
run(
    ["ssh", "-o", "StrictHostKeyChecking=no", f"{USER}@{HOST}",
     "cd /var/www/rurubene2/backend && php artisan route:clear && php artisan config:clear && php artisan cache:clear && cd /var/www/rurubene2/frontend && rm -rf .next && npm run build && pm2 restart all && echo 'FRONTEND BUILD AND RESTART DONE'"],
    "Clearing Laravel cache, rebuilding frontend & restarting PM2"
)

print("\n=== Done! ===")
