const bcrypt = require("bcrypt");
const hashPass = (password) => {
  const salt = bcrypt.genSaltSync(10);
  return bcrypt.hashSync(password, salt);
};

const comparePass = (oldPass, encPass) => {
  return bcrypt.compareSync(oldPass, encPass);
};

module.exports = {
  hashPass,
  comparePass,
};
