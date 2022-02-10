const bcrypt = require('bcrypt');
var salt = "$2b$10$ccJwJQJw3O9ZXB16bfJAYu";
var encryptedPassword = bcrypt.hashSync("12345", salt.toString());

console.log(salt, encryptedPassword, "$2b$10$ccJwJQJw3O9ZXB16bfJAYulN75NkL.mVnADtAt7vGUlLom9KTlC5q$2b$10$ccJwJQJw3O9ZXB16bfJAYulN75NkL.mVnADtAt7vGUlLom9KTlC5q");
