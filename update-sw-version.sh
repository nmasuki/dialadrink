
oldnum=`head -n 1 public/sw.js | cut -d '=' -f2 | cut -d ';' -f1`  
newnum=`expr $oldnum + 1`
echo  "$oldnum => $newnum"
sed -i "1s/.*/var CACHE_VERSION = $newnum;/" public/sw.js