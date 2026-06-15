#!/usr/bin/env python3
import os, sys, pty, select, time, termios

HOST = "91.99.89.94"
USER = "root"
PASS = "!m3n@!k@!"

def run(cmd_list, desc=""):
    print(f"\n--- {desc} ---")
    pid, fd = pty.fork()
    if pid == 0:
        os.execvp(cmd_list[0], cmd_list)
    else:
        buf = ""
        pw_sent = False
        deadline = time.time() + 60
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

run(
    ["ssh", "-o", "StrictHostKeyChecking=no", f"{USER}@{HOST}",
     "cd /var/www/rurubene2/backend && php artisan tinker --execute=\"\\$u = \\App\\Models\\User::where('name', 'like', '%Hine Moana%')->first(); if (\\$u) { echo 'User: ' . \\$u->name . ' (ID: ' . \\$u->id . ')\n'; \\$w = \\$u->wallet; if (\\$w) { echo 'Balance: ' . \\$w->balance . '\n'; } else { echo 'No wallet.\n'; } } else { echo 'Not found.\n'; }\""],
    "Checking Hine Moana's wallet"
)
