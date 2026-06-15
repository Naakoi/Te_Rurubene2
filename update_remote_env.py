#!/usr/bin/env python3
"""Updates the remote server .env file with R2 configurations and clears config cache."""
import os, sys, pty, select, time, termios

HOST = "91.99.89.94"
USER = "root"
PASS = "!m3n@!k@!"

# Commands to execute:
# 1. Clean existing R2 configs from remote .env (if any) and append the new ones.
# 2. Clear Laravel configuration cache.
REMOTE_COMMAND = (
    "sed -i '/^R2_/d' /var/www/rurubene2/backend/.env && "
    "echo '' >> /var/www/rurubene2/backend/.env && "
    "echo 'R2_ACCESS_KEY_ID=2dcdaf6d572305af232c119a9db1061c' >> /var/www/rurubene2/backend/.env && "
    "echo 'R2_SECRET_ACCESS_KEY=95b344894d87228bfbfa56270112c4577bee74ae62f2b4182d9a471dc347b97a' >> /var/www/rurubene2/backend/.env && "
    "echo 'R2_BUCKET=te-rurubene-bucket' >> /var/www/rurubene2/backend/.env && "
    "echo 'R2_ENDPOINT=https://2f4c25dd4f1e4d638d5b7df98598b8c9.r2.cloudflarestorage.com' >> /var/www/rurubene2/backend/.env && "
    "echo 'R2_URL=https://pub-c60b95fe1b83449dad0e55b7b29cd211.r2.dev' >> /var/www/rurubene2/backend/.env && "
    "cd /var/www/rurubene2/backend && php artisan config:clear && php artisan cache:clear && echo 'REMOTE ENV UPDATED AND CACHE CLEARED'"
)

def run():
    pid, fd = pty.fork()
    if pid == 0:
        os.execvp("ssh", ["ssh", "-o", "StrictHostKeyChecking=no", f"{USER}@{HOST}", REMOTE_COMMAND])
    else:
        buf = ""
        pw_sent = False
        deadline = time.time() + 60
        while time.time() < deadline:
            r, _, _ = select.select([fd], [], [], 1.0)
            if fd in r:
                try:
                    data = os.read(fd, 2048)
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

if __name__ == "__main__":
    run()
