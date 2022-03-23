
require('/home/nmasuki/projects/dialadrink/cms.dialadrinkkenya.com/helpers/polyfills')
var filters = require('/home/nmasuki/projects/dialadrink/cms.dialadrinkkenya.com/helpers/filters')

var lucene = "((Experience:[10 TO *] OR Learning:quick) AND Heath:sick) OR (FirstName:Nel* AND LastName:Masuki)";
var mongo = filters.luceneToMongo(lucene);

console.log(lucene, JSON.stringify(mongo))