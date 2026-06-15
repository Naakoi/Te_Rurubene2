#!/usr/bin/env python3
import subprocess

script = """
set timeout 120

spawn ssh -o StrictHostKeyChecking=no root@91.99.89.94

expect {
    "password:" {
        send "!m3n@!K@!\\r"
        expect "# "
    }
    "# " {}
}

send "cd /var/www/rurubene2/backend && php artisan tinker --execute=\\"\\$u = \\\\App\\\\Models\\\\User::where('name', 'like', '%Hine Moana%')->first(); if (\\$u) { echo 'USER: ' . \\$u->id . \\\\PHP_EOL; foreach (\\\\App\\\\Models\\\\Wallet::where('user_id', \\$u->id)->get() as \\$w) { echo 'WALLET ID: ' . \\$w->id . ' BAL: ' . \\$w->balance . ' CUR: ' . \\$w->currency . \\\\PHP_EOL; } } else { echo 'NOT FOUND'; }\\"\\r"
expect "# "
send "exit\\r"
expect eof
"""

with open('/tmp/db_check.expect', 'w') as f:
    f.write(script)

result = subprocess.run(['expect', '/tmp/db_check.expect'], capture_output=True, text=True, timeout=600)
print(result.stdout)
