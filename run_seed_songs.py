#!/usr/bin/env python3
"""
One-shot script: SCP seed_songs.php to server and execute it via SSH.
Uses pty for password-based auth.
"""
import os
import sys
import pty
import select
import time
import termios

HOST = "91.99.89.94"
USER = "root"
PASS = "!m3n@!k@!"
LOCAL_SCRIPT = "/home/user/Documents/Projects/Rurubene2/seed_songs.php"
REMOTE_SCRIPT = "/tmp/seed_songs.php"


def run_ssh_command(cmd_list, desc="command"):
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
        deadline = time.time() + 120  # 2 min timeout
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


def main():
    # Step 1: SCP the file
    run_ssh_command(
        ["scp", "-o", "StrictHostKeyChecking=no", LOCAL_SCRIPT, f"{USER}@{HOST}:{REMOTE_SCRIPT}"],
        "Uploading seed_songs.php via SCP"
    )

    # Step 2: Execute via SSH
    run_ssh_command(
        ["ssh", "-o", "StrictHostKeyChecking=no", f"{USER}@{HOST}", f"php {REMOTE_SCRIPT}"],
        "Running seed_songs.php on server"
    )

    print("\n=== Done! ===")


if __name__ == "__main__":
    main()
