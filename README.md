# Scalable Image Upload Server

A backend system built with Node.js and Express that securely uploads images to AWS S3. It features multiple backend instances load-balanced via NGINX and includes a GitHub Actions CI pipeline. 

## Features
- **Express Backend:** Built with Node.js and Express.
- **Image Validation:** Accepts only `.jpg` and `.png` formats via `multipart/form-data`, with a maximum file size of 2MB.
- **S3 Integration:** Uploads images directly to an AWS S3 bucket and returns the object URL.
- **Load Balancing:** NGINX handles round-robin load balancing across multiple server instances.
- **CI Pipeline:** GitHub Actions automatically installs dependencies, runs linters, and verifies the application builds and starts on push/PR.
- **Bonus Features Implemented:**
  - **Image Resizing:** Uses `sharp` to optimize and resize images prior to S3 upload.
  - **Signed S3 URLs:** Returns a presigned S3 URL valid for 1 hour alongside the standard URL.
  - **Dockerized Setup:** Includes a `Dockerfile` and `docker-compose.yml` for effortless scaling and deployment.

## Setup Instructions

### 1. Prerequisites
- Node.js (v18 or higher)
- Docker & Docker Compose (optional, but recommended for NGINX & scaling)
- AWS Account with an S3 Bucket and IAM credentials (with `s3:PutObject` and `s3:GetObject` permissions).

### 2. Environment Variables
Create a `.env` file in the root directory and populate it with your AWS credentials:
```env
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
S3_BUCKET_NAME=your_bucket_name
```

### 3. Installation
```bash
npm install
```

## Running the Application

### Option A: Using Docker (Recommended)
This spins up two backend instances (app1 and app2) alongside an NGINX container that acts as a load balancer on Port 80.
```bash
docker-compose up --build
```
The API will be available at `http://localhost/upload`

### Option B: Running Locally without Docker
If you'd like to manually run multiple instances without Docker:

1. **Start Instance 1:**
```bash
PORT=3001 npm start
```

2. **Start Instance 2:**
```bash
PORT=3002 npm start
```

3. **Configure Local NGINX:**
You will need NGINX installed on your machine. Update your `nginx.conf` with the following upstream block:
```nginx
upstream backend_servers {
    server 127.0.0.1:3001;
    server 127.0.0.1:3002;
}

server {
    listen 80;
    location / {
        proxy_pass http://backend_servers;
    }
}
```

## NGINX Configuration Explained
The load balancer configuration (`nginx.conf`) is set to listen on port 80 and uses an `upstream` block named `backend_servers`. It registers two servers: `app1` (port 3001) and `app2` (port 3002). By default, NGINX utilizes the **Round Robin** algorithm, distributing each new upload request evenly between Instance 1 and Instance 2.

## GitHub Actions CI Pipeline
The pipeline runs on `push` and `pull_request` events to the `main` or `master` branches.
- Sets up a Node.js 20 environment.
- Installs all dependencies via `npm install`.
- Runs `eslint` checks to verify code quality.
- Boots up the backend server in the background and sends a test request to the `/health` endpoint to ensure successful execution. It fails the pipeline if the server doesn't respond.

## Sample Request & Response

### Request
Upload an image via `curl` or Postman:

```bash
curl -X POST http://localhost/upload \
  -F "image=@/path/to/your/image.jpg"
```

### Response
```json
{
  "url": "https://your_bucket_name.s3.amazonaws.com/1707258302011-e4b525f3-5246-4c4f-9b1d-721245b0bb62.jpg",
  "signedUrl": "https://your_bucket_name.s3.us-east-1.amazonaws.com/1707258302011-e4b525f3-5246-4c4f-9b1d-721245b0bb62.jpg?X-Amz-Algorithm=...",
  "serverPort": "3001" 
}
```
*Please note that the `serverPort` toggles between `3001` and `3002` on subsequent requests, proving the NGINX round-robin functionality is active.*
