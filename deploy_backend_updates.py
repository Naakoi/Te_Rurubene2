#!/usr/bin/env python3
"""SCP AdminController.php and api.php routes to server."""
import os, sys, pty, select, time, termios

HOST = "91.99.89.94"
USER = "root"
PASS = "!m3n@!k@!"

FILES = [
    ("/home/user/Documents/Projects/Rurubene2/backend/app/Http/Controllers/AdminController.php", "/var/www/rurubene2/backend/app/Http/Controllers/AdminController.php"),
    ("/home/user/Documents/Projects/Rurubene2/backend/app/Http/Controllers/StudioController.php", "/var/www/rurubene2/backend/app/Http/Controllers/StudioController.php"),
    ("/home/user/Documents/Projects/Rurubene2/backend/app/Http/Controllers/BankDepositController.php", "/var/www/rurubene2/backend/app/Http/Controllers/BankDepositController.php"),
    ("/home/user/Documents/Projects/Rurubene2/backend/app/Models/BankDeposit.php", "/var/www/rurubene2/backend/app/Models/BankDeposit.php"),
    ("/home/user/Documents/Projects/Rurubene2/backend/database/migrations/2026_06_05_000001_create_bank_deposits_table.php", "/var/www/rurubene2/backend/database/migrations/2026_06_05_000001_create_bank_deposits_table.php"),
    ("/home/user/Documents/Projects/Rurubene2/backend/app/Models/User.php", "/var/www/rurubene2/backend/app/Models/User.php"),
    ("/home/user/Documents/Projects/Rurubene2/backend/app/Http/Controllers/WalletController.php", "/var/www/rurubene2/backend/app/Http/Controllers/WalletController.php"),
    ("/home/user/Documents/Projects/Rurubene2/backend/app/Services/CommerceService.php", "/var/www/rurubene2/backend/app/Services/CommerceService.php"),
    ("/home/user/Documents/Projects/Rurubene2/backend/app/Models/Notification.php", "/var/www/rurubene2/backend/app/Models/Notification.php"),
    ("/home/user/Documents/Projects/Rurubene2/backend/app/Http/Controllers/NotificationController.php", "/var/www/rurubene2/backend/app/Http/Controllers/NotificationController.php"),
    ("/home/user/Documents/Projects/Rurubene2/backend/database/migrations/2026_06_05_031300_create_notifications_table.php", "/var/www/rurubene2/backend/database/migrations/2026_06_05_031300_create_notifications_table.php"),
    ("/home/user/Documents/Projects/Rurubene2/backend/app/Http/Controllers/AuthController.php", "/var/www/rurubene2/backend/app/Http/Controllers/AuthController.php"),
    ("/home/user/Documents/Projects/Rurubene2/backend/app/Http/Controllers/CreatorOnboardingController.php", "/var/www/rurubene2/backend/app/Http/Controllers/CreatorOnboardingController.php"),
    ("/home/user/Documents/Projects/Rurubene2/backend/app/Http/Controllers/WalletPinController.php", "/var/www/rurubene2/backend/app/Http/Controllers/WalletPinController.php"),
    ("/home/user/Documents/Projects/Rurubene2/backend/database/migrations/2026_06_05_042529_add_wallet_pin_to_users_table.php", "/var/www/rurubene2/backend/database/migrations/2026_06_05_042529_add_wallet_pin_to_users_table.php"),
    ("/home/user/Documents/Projects/Rurubene2/backend/database/migrations/2026_06_05_065058_add_security_questions_to_users_table.php", "/var/www/rurubene2/backend/database/migrations/2026_06_05_065058_add_security_questions_to_users_table.php"),
    ("/home/user/Documents/Projects/Rurubene2/backend/routes/api.php", "/var/www/rurubene2/backend/routes/api.php")
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

for local, remote in FILES:
    run(
        ["scp", "-o", "StrictHostKeyChecking=no", local, f"{USER}@{HOST}:{remote}"],
        f"Uploading {os.path.basename(local)}"
    )

# Run migrations and clear cache on the server
run(
    ["ssh", "-o", "StrictHostKeyChecking=no", f"{USER}@{HOST}",
     "cd /var/www/rurubene2/backend && php artisan migrate --force && php artisan config:clear && php artisan cache:clear && echo 'MIGRATIONS DONE'"],
    "Running migrations & clearing cache"
)

print("\n=== Done ===")
