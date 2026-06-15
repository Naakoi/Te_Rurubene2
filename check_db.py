import pexpect
import sys

child = pexpect.spawn('ssh root@91.99.89.94', encoding='utf-8', timeout=15)
child.expect('password:')
child.sendline('Rurubene!123')
child.expect('#')

cmd = """cd /var/www/rurubene/backend && php artisan tinker --execute="\\$u = \\App\\Models\\User::where('name', 'like', '%Hine Moana%')->first(); if (\\$u) { echo 'User: ' . \\$u->name . ' (ID: ' . \\$u->id . ')\n'; \\$w = \\$u->wallet; if (\\$w) { echo 'Balance: ' . \\$w->balance . '\n'; } else { echo 'No wallet.\n'; } } else { echo 'Not found.\n'; }" """
child.sendline(cmd)
child.expect('#')
print(child.before)

child.sendline('exit')
