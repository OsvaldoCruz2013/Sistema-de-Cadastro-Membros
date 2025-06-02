const bcrypt = require('bcrypt');

bcrypt.hash('654321', 10).then(hash => {
  console.log('Senha criptografada:', hash);
});
