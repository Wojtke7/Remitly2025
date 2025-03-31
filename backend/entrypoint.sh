#!/bin/sh
echo "Running migrations..."
npx prisma generate
npx prisma db push

echo "Building application..."
npm run build  

echo "Starting application..."
exec npm start
