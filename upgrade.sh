cp .env /var/tmp/dialadrink-prod.env
cp upgrade.sh /var/tmp/upgrade.sh
git checkout master
git pull -X theirs
cp /var/tmp/dialadrink-prod.env .env
cp /var/tmp/upgrade.sh upgrade.sh
./update-sw-version.sh
grunt build
git add . && git commit -m "Server updates" && git push
pm2 reload main --update-env --log-date-format 'DD-MM HH:mm:ss.SSS'
pm2 log