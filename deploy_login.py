#!/usr/bin/env python3
"""SCP login page to server and rebuild the Next.js frontend."""
import os, sys, pty, select, time, termios

HOST = "91.99.89.94"
USER = "root"
PASS = "!m3n@!k@!"

LOCAL_FILE  = "/home/user/Documents/Projects/Rurubene2/frontend/src/app/login/page.tsx"
REMOTE_FILE = "/var/www/rurubene2/frontend/src/app/login/page.tsx"

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

# 1. SCP updated login page
run(
    ["scp", "-o", "StrictHostKeyChecking=no", LOCAL_FILE, f"{USER}@{HOST}:{REMOTE_FILE}"],
    "Uploading updated login/page.tsx"
)

# 2. Rebuild and restart
run(
    ["ssh", "-o", "StrictHostKeyChecking=no", f"{USER}@{HOST}",
     "cd /var/www/rurubene2/frontend && npm run build && pm2 restart all && echo 'BUILD AND RESTART DONE'"],
    "Rebuilding frontend & restarting PM2"
)

print("\n=== Done! Visit http://91.99.89.94/login to test the eye toggle ===")
