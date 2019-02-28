cp .env /var/tmp/dialadrink.env
git stash
git reset HEAD 
git pull -X theirs
git stash pop

cp /var/tmp/dialadrink.env .env
grunt build
git add .
git commit -a "Server updates"
git push
pm2 reload main && pm2 monit
