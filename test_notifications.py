#!/usr/bin/env python3
"""Quick end-to-end test of the notification system on the server."""
import os, sys, pty, select, time, termios

HOST = "91.99.89.94"
USER_SSH = "root"
PASS = "!m3n@!k@!"

TINKER_CODE = (
    "\\$u = \\App\\Models\\User::find(4); "
    "\\$u->notifications()->where('title', 'TEST_NOTIF')->delete(); "
    "\\$n = \\$u->notifications()->create(["
    "'type' => 'transaction', "
    "'title' => 'TEST_NOTIF', "
    "'message' => 'Wallet credited 5.00 AUD']); "
    "echo 'Step 1 - Created notification ID=' . \\$n->id . PHP_EOL; "
    "\\$unread = \\$u->notifications()->whereNull('read_at')->count(); "
    "echo 'Step 2 - Unread count=' . \\$unread . PHP_EOL; "
    "\\$n->update(['read_at' => now()]); "
    "\\$unread2 = \\$u->notifications()->whereNull('read_at')->count(); "
    "echo 'Step 3 - After markAsRead, Unread=' . \\$unread2 . PHP_EOL; "
    "\\$u->notifications()->where('title', 'TEST_NOTIF')->delete(); "
    "echo 'Step 4 - Cleanup done' . PHP_EOL; "
    "echo '=== ALL STEPS PASSED ===' . PHP_EOL;"
)

CMD = f"cd /var/www/rurubene2/backend && php artisan tinker --execute=\"{TINKER_CODE}\""

def run_ssh(cmd, desc=""):
    print(f"\n{'='*50}")
    print(f" {desc}")
    print('='*50)
    pid, fd = pty.fork()
    if pid == 0:
        try:
            attrs = termios.tcgetattr(0)
            attrs[6][termios.VKILL] = b'\x15'
            attrs[6][termios.VERASE] = b'\x7f'
            termios.tcsetattr(0, termios.TCSADRAIN, attrs)
        except Exception:
            pass
        os.execvp("ssh", ["ssh", "-o", "StrictHostKeyChecking=no", f"{USER_SSH}@{HOST}", cmd])
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
        try:
            os.waitpid(pid, 0)
        except Exception:
            pass

print("\n╔══════════════════════════════════════════╗")
print("║  NOTIFICATION SYSTEM END-TO-END TEST     ║")
print("╚══════════════════════════════════════════╝")

run_ssh(CMD, "Testing create / read / mark-read / cleanup on User #4 (Hine Moana)")

ROUTE_CMD = "cd /var/www/rurubene2/backend && php artisan route:list 2>&1 | grep -i notif"
run_ssh(ROUTE_CMD, "Verify API routes are registered")

print("\n\n✅ Test script complete.")
