#!/usr/bin/env python3
"""Deploy updated files to server and rebuild Next.js frontend."""
import os, subprocess

HOST = "91.99.89.94"
USER = "root"
PASS = "!m3n@!k@!"

FILES = [
    ("frontend/src/app/page.tsx", "/var/www/rurubene2/frontend/src/app/page.tsx"),
    ("frontend/src/app/admin/page.tsx", "/var/www/rurubene2/frontend/src/app/admin/page.tsx"),
    ("frontend/src/app/wallet/page.tsx", "/var/www/rurubene2/frontend/src/app/wallet/page.tsx"),
    ("frontend/src/app/login/page.tsx", "/var/www/rurubene2/frontend/src/app/login/page.tsx"),
    ("frontend/src/app/register/page.tsx", "/var/www/rurubene2/frontend/src/app/register/page.tsx"),
    ("frontend/src/app/creator/join/page.tsx", "/var/www/rurubene2/frontend/src/app/creator/join/page.tsx"),
    ("frontend/src/app/settings/page.tsx", "/var/www/rurubene2/frontend/src/app/settings/page.tsx"),
    ("frontend/src/app/library/page.tsx", "/var/www/rurubene2/frontend/src/app/library/page.tsx"),
    ("frontend/src/components/AudioPlayer.tsx", "/var/www/rurubene2/frontend/src/components/AudioPlayer.tsx"),
    ("frontend/src/components/TopNav.tsx", "/var/www/rurubene2/frontend/src/components/TopNav.tsx"),
    ("frontend/src/components/NotificationDropdown.tsx", "/var/www/rurubene2/frontend/src/components/NotificationDropdown.tsx"),
    ("frontend/src/lib/offlineStorage.ts", "/var/www/rurubene2/frontend/src/lib/offlineStorage.ts"),
]

BASE = "/home/user/Documents/Projects/Rurubene2"
env = {**os.environ, "SSHPASS": PASS}

def run(cmd, desc):
    print(f"\n--- {desc} ---")
    result = subprocess.run(cmd, env=env, capture_output=False, text=True)
    return result.returncode

# Upload files
for local_rel, remote in FILES:
    local = os.path.join(BASE, local_rel)
    run(
        ["sshpass", "-e", "scp", "-o", "StrictHostKeyChecking=no", local, f"{USER}@{HOST}:{remote}"],
        f"Uploading {os.path.basename(local)}"
    )

# Rebuild
run(
    ["sshpass", "-e", "ssh", "-o", "StrictHostKeyChecking=no", f"{USER}@{HOST}",
     "cd /var/www/rurubene2/frontend && rm -rf .next && npm run build && pm2 restart all && echo 'FRONTEND BUILD AND RESTART DONE'"],
    "Clean rebuild & restart"
)

print("\n=== Done! ===")
