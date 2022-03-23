function StringChallenge(str) { 
    var mapping = {
      "\\+": "[a-zA-Z]",
      "\\$": "[1-9]", 
      "\\*\\{(\\d+)\\}": ".{$1}",
      "\\*": ".{3}"
    };
  
    var parts = str.split(' ');
    var pattern = parts[0];
    var data = parts[1];
  
    var myPattern = "";
    var i = 0;
    for(var j in pattern){
      var char = data[i];
      var p = pattern[j];

      for(var k in mapping){
        var keyRegex = new RegExp(k);
        var valRegex = new RegExp(mapping[k]);

        if(keyRegex.test(p) && valRegex.test(char)){
          var matches = Array.from(keyRegex.exec(p));

          if(matches.length > 1){
            p = p.replace(keyRegex, mapping[k])
            var c = parseInt(matches[1]);
            i += c;
          } else {
            i += 1;
          }

          myPattern += p;
          break;
        }
      }
    }
  
  
    // code goes here  
    return myPattern == pattern; 
  
  }
     
  // keep this function call here 
  console.log(StringChallenge("$**+*{2} 9mmmrrrkbb") == true? "Passed": "Failed");
    console.log(StringChallenge("+++++* abcdehhhhhh") == false? "Passed": "Failed");
