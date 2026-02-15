git pull -X theirs
grunt build
git add .
git commit -m "$HOSTNAME build"
git push
pm2 reload app --update-env --log-date-format 'DD-MM HH:mm:ss.SSS'
pm2 log