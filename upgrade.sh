cp .env /var/tmp/dialadrink.env
git checkout .
git pull -X theirs

cp /var/tmp/dialadrink.env .env
grunt build
git add .
git commit -m "Server updates"
git push
pm2 reload main --update-env --log-date-format 'DD-MM HH:mm:ss.SSS' && pm2 monit
