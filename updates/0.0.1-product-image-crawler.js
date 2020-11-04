var base64ToCloudinaryUrl = function(base64String, title){
    var r = /^data:image\/([^\;]+);base64,(.*?)$/;
    var match = (base64String || "").match(r);
    if(!match)  return Promise.resolve(base64String);
  
    var base64Image = match[2];
    var fileName = (title || "image").cleanId() + "." + match[1]
  
    return new Promise(resolve => {
      fs.writeFile(`${dataDir}/images/${fileName}`, base64Image, {encoding: 'base64'}, function(err) {
        if(err){
          resolve(base64String);
          return console.warn(err);
        }        
    
        console.log(`File created '${fileName}'!`);
        cloudinary.v2.uploader.upload(
          `${dataDir}/images/${fileName}`, 
          {public_id: "tafutakenya/" + fileName.substr(0, fileName.lastIndexOf("."))},
          function (err, result) {
            if(err){
              resolve(base64String);
              return console.warn(err);
            }  
  
            resolve(result.secure_url || result.url);
          });
      });
    });
  };
  
  var imgcache = {};
  var crawelGoogleImage = async function(page, what){
    if(!what) return null;
    what = '"' + what.replace(/\W/g, " ")
      .replace(/\s+/g, " ").split(" ")
      .filter(w => w && w.length > 1)
      .join(' ') + '"';
  
    var randomPick = 0;//Math.floor(Math.random() * 4);
    var key = what.toLowerCase().split(" ").sort().join("-")
  
    if(imgcache[key])  
      return await base64ToCloudinaryUrl(imgcache[key][randomPick] || imgcache[key][0], what);  
  
    //Google search
    console.log(`Searching for image '${what}'!` );
    await gotoPage(page, `https://www.google.com/search?q=${what}&hl=en-US&source=lnms&tbm=isch&tbs=isz:m`, "div[data-ictx]");
   
    //Wait for image results
    let divElements = await page.$$("div[data-ictx]");
  
    var imgUrls = [];
    for(var i in divElements){
      if(!divElements.hasOwnProperty(i)) continue
      if(i > 5) break;
  
      var div = divElements[i]; 
      try{  
        var imgUrl = await div.$eval("img", elem => elem.getAttribute('src')).catch(r=>null)
        if(imgUrl)  imgUrls.push(imgUrl);
      }catch(e){
        console.warn(e);
      }
    }
  
    if(divElements[randomPick]) divElements[randomPick].click();
  
    await snooze(Math.random() * 3000);
    imgcache[key] = imgUrls;  
    return await base64ToCloudinaryUrl(imgcache[key][randomPick] || imgcache[key][0], what);
  };