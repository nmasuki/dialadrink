cp .env /var/tmp/dialadrink-prod.env
git checkout .
git pull -X theirs

grunt build
git add .
git commit -m "Server updates"
git push

cp /var/tmp/dialadrink-prod.env .env
pm2 reload all --update-env --log-date-format 'DD-MM HH:mm:ss.SSS'
pm2 log
