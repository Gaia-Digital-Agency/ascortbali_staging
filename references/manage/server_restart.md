ssh -i ~/.ssh/gda-ce01 azlan@34.124.244.233   

cd /var/www/baligirls

pnpm install

pnpm -r build

pm2 restart baligirls-api baligirls-web

pm2 save