git pull -X theirs
#./update-sw-version.sh
#grunt build
git add .
git commit -m "$HOSTNAME upgrade"
git push
pm2 reload main --update-env --log-date-format 'DD-MM HH:mm:ss.SSS'
pm2 log