#!/usr/bin/env python3
"""Deploy ledger changes: AdminController, routes, and admin page."""
import os, sys, pty, select, time, termios

HOST = "91.99.89.94"
USER = "root"
PASS = "!m3n@!k@!"

FILES = [
    (
        "/home/user/Documents/Projects/Rurubene2/backend/app/Http/Controllers/AdminController.php",
        "/var/www/rurubene2/backend/app/Http/Controllers/AdminController.php",
    ),
    (
        "/home/user/Documents/Projects/Rurubene2/backend/routes/api.php",
        "/var/www/rurubene2/backend/routes/api.php",
    ),
    (
        "/home/user/Documents/Projects/Rurubene2/frontend/src/app/admin/page.tsx",
        "/var/www/rurubene2/frontend/src/app/admin/page.tsx",
    ),
]

def run(cmd_list, desc="", timeout=360):
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
        deadline = time.time() + timeout
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

for local, remote in FILES:
    run(
        ["scp", "-o", "StrictHostKeyChecking=no", local, f"{USER}@{HOST}:{remote}"],
        f"Uploading {os.path.basename(local)}"
    )

run(
    ["ssh", "-o", "StrictHostKeyChecking=no", f"{USER}@{HOST}",
     (
         "cd /var/www/rurubene2/backend && "
         "php artisan route:clear && "
         "php artisan config:clear && "
         "php artisan cache:clear && "
         "cd /var/www/rurubene2/frontend && "
         "rm -rf .next && "
         "npm run build && "
         "pm2 restart all && "
         "echo '=== LEDGER DEPLOY COMPLETE ==='"
     )],
    "Clearing caches, rebuilding frontend & restarting PM2",
    timeout=360,
)

print("\n=== Done! ===")
