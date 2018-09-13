cp .env /var/tmp/dialadrink.env
git stash
git pull -X theirs && grunt build && cp /var/tmp/dialadrink.env .env && pm2 reload main
