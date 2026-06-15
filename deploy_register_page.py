#!/usr/bin/env python3
"""Create register dir on server and upload register page, then rebuild."""
import os, sys, pty, select, time, termios

HOST = "91.99.89.94"
USER = "root"
PASS = "!m3n@!k@!"

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
        deadline = time.time() + 300
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
                if not pw_sent and "password" in buf.lower():
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

# 1. Create the remote register directory
run(
    ["ssh", "-o", "StrictHostKeyChecking=no", f"{USER}@{HOST}",
     "mkdir -p /var/www/rurubene2/frontend/src/app/register"],
    "Creating register directory on server"
)

# 2. Upload register page
run(
    ["scp", "-o", "StrictHostKeyChecking=no",
     "/home/user/Documents/Projects/Rurubene2/frontend/src/app/register/page.tsx",
     f"{USER}@{HOST}:/var/www/rurubene2/frontend/src/app/register/page.tsx"],
    "Uploading register/page.tsx"
)

# 3. Rebuild and restart
run(
    ["ssh", "-o", "StrictHostKeyChecking=no", f"{USER}@{HOST}",
     "cd /var/www/rurubene2/frontend && npm run build && pm2 restart all && echo 'REGISTER PAGE DEPLOYED'"],
    "Rebuilding frontend & restarting PM2"
)

print("\n=== Done! ===")
