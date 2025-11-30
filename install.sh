#!/bin/bash

# --- STEP 1: Access assets folder ---
cd "$(dirname "$0")/paperGUI/src/assets" || exit
echo "=============================================="
echo "extract these split zip manually using 7zip or winrar ..."
echo "=============================================="

# --- STEP 2: Install & run frontend ---
cd ../../
echo "Installing frontend node modules..."
npm install || { echo "Frontend npm install failed!"; exit 1; }

echo "Starting frontend (npm run dev)..."
gnome-terminal -- bash -c "npm run dev; exec bash"

# --- STEP 3: Install & run backend ---
cd ../server || exit
echo "Installing backend node modules..."
npm install || { echo "Backend npm install failed!"; exit 1; }

echo "Starting backend (npm run dev)..."
gnome-terminal -- bash -c "npm run dev; exec bash"

echo "=============================================="
echo "Everything started successfully!"
echo "=============================================="
