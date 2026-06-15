#!/bin/bash
# Fix the NEXT_PUBLIC_BACKEND_URL on the Hetzner server and rebuild

SERVER="91.99.89.94"
USER="root"

echo "=== Step 1: Update .env.local on server ==="
ssh -o StrictHostKeyChecking=no ${USER}@${SERVER} \
  "echo 'NEXT_PUBLIC_BACKEND_URL=http://91.99.89.94:8000' > /root/Rurubene2/frontend/.env.local && cat /root/Rurubene2/frontend/.env.local"

echo ""
echo "=== Step 2: Rebuild the Next.js frontend ==="
ssh -o StrictHostKeyChecking=no ${USER}@${SERVER} \
  "cd /root/Rurubene2/frontend && npm run build 2>&1 | tail -20"

echo ""
echo "=== Step 3: Restart PM2 frontend process ==="
ssh -o StrictHostKeyChecking=no ${USER}@${SERVER} \
  "pm2 restart frontend && pm2 list"

echo ""
echo "Done! Try visiting http://91.99.89.94/marketplace/merch"
