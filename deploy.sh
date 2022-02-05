git pull -X theirs
RESULT=$?
if [ $RESULT -eq 0 ]; then
    oldnum=`head -n 1 public/sw.js | cut -d '=' -f2 | cut -d ';' -f1`
    newnum=`expr $oldnum + 1`
    echo  "$oldnum => $newnum"
    sed -i "1s/.*/var CACHE_VERSION = $newnum;/" public/sw.js
    grunt build
    git add .
    git commit -m "$HOSTNAME upgrade"
    git push
    pm2 reload main --update-env --log-date-format 'DD-MM HH:mm:ss.SSS'
    pm2 log
fi

