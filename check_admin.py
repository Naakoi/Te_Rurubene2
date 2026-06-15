#!/usr/bin/env python3
"""Check/reset admin password on the server."""
import os, sys, pty, select, time, termios

HOST = "91.99.89.94"
USER = "root"
PASS = "!m3n@!k@!"

CHECK_CMD = """php -r "
require '/var/www/rurubene2/backend/vendor/autoload.php';
\$app = require '/var/www/rurubene2/backend/bootstrap/app.php';
\$app->make(Illuminate\\\\Contracts\\\\Console\\\\Kernel::class)->bootstrap();
\$user = App\\\\Models\\\\User::where('email', 'admin@rurubene.com')->first();
if (\$user) {
    echo 'Admin user found: ' . \$user->email . PHP_EOL;
    echo 'Role: ' . \$user->role . PHP_EOL;
    echo 'Testing password YourSecurePassword123: ';
    echo (password_verify('YourSecurePassword123', \$user->password) ? 'CORRECT' : 'WRONG') . PHP_EOL;
} else {
    echo 'Admin user NOT found!' . PHP_EOL;
}
" """

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

run(["ssh", "-o", "StrictHostKeyChecking=no", f"{USER}@{HOST}", CHECK_CMD], "Checking admin password")
print("\nDone.")
