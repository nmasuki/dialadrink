cp .env /var/tmp/dialadrink.env
git reset HEAD .
git stash
git pull -X theirs
git stash pop

cp /var/tmp/dialadrink.env .env
grunt build
git add .
git commit -m "Server updates"
git push
pm2 reload main && pm2 monit
