#!/bin/bash
echo "Pulling latest code..."
git pull origin main

echo "Installing dependencies..."
yarn

echo "Restarting PM2..."
pm2 reload grubbex-server --update-env

echo "Done. Latest logs:"
pm2 logs grubbex-server --lines 10
