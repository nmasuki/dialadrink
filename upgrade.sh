<<<<<<< Updated upstream
git stash
git pull -X theirs
./update-sw-version.sh
git add .
git commit -m "Server updates"
git push
git stash pop
pm2 reload main --update-env --log-date-format 'DD-MM HH:mm:ss.SSS'
pm2 log
=======
git stash && git pull -X theirs && /update-sw-version.sh && grunt build && git add . && git commit -m "Server updates" && git push && git unstash && pm2 reload main --update-env --log-date-format 'DD-MM HH:mm:ss.SSS' && pm2 log
>>>>>>> Stashed changes
