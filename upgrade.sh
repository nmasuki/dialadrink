cp .env /var/tmp/dialadrink.env
git stash
git pull -X theirs
git add .
git stash pop

cp /var/tmp/dialadrink.env .env
grunt build
pm2 reload main && pm2 monit
