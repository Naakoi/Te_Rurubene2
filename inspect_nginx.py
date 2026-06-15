#!/usr/bin/env python3
import os, sys, pty, select, time, termios

HOST = "91.99.89.94"
USER = "root"
PASS = "!m3n@!k@!"

COMMAND = "echo '--- SITES ENABLED ---' && ls -la /etc/nginx/sites-enabled/ && echo '--- ACTIVE NGINX CONF ---' && cat /etc/nginx/sites-enabled/*"

def run():
    pid, fd = pty.fork()
    if pid == 0:
        os.execvp("ssh", ["ssh", "-o", "StrictHostKeyChecking=no", f"{USER}@{HOST}", COMMAND])
    else:
        buf = ""
        pw_sent = False
        deadline = time.time() + 30
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

if __name__ == "__main__":
    run()
