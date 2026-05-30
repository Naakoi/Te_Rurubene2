#!/bin/bash

# Download MinIO Server
echo "Downloading MinIO Server..."
wget -q https://dl.min.io/server/minio/release/linux-amd64/minio
chmod +x minio

# Start MinIO Server in the background
echo "Starting MinIO Server on port 9000..."
./minio server ~/minio-data --console-address ":9001" &
MINIO_PID=$!
sleep 3 # Wait for server to start

# Download MinIO Client (mc)
echo "Downloading MinIO Client (mc)..."
wget -q https://dl.min.io/client/mc/release/linux-amd64/mc
chmod +x mc

# Configure mc for local MinIO
echo "Configuring MinIO client..."
./mc alias set localminio http://127.0.0.1:9000 minioadmin minioadmin

# Create the bucket
echo "Creating bucket te-rurubene-bucket..."
./mc mb localminio/te-rurubene-bucket

# Set bucket to public
echo "Setting bucket policy to public..."
./mc anonymous set public localminio/te-rurubene-bucket

# Setup CORS to allow Next.js uploads
echo "Configuring CORS..."
cat <<EOF > cors.json
{
  "CORSRules": [
    {
      "AllowedOrigins": ["http://localhost:3000", "http://127.0.0.1:3000"],
      "AllowedHeaders": ["*"],
      "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
      "ExposeHeaders": ["ETag"]
    }
  ]
}
EOF
./mc cors set cors.json localminio/te-rurubene-bucket

echo "========================================="
echo "MinIO setup complete!"
echo "API Endpoint: http://127.0.0.1:9000"
echo "Web Console:  http://127.0.0.1:9001"
echo "Login: minioadmin / minioadmin"
echo "========================================="
echo "To stop MinIO later, run: kill $MINIO_PID"
