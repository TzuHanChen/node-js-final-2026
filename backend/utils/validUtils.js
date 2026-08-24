const isValidString = (value) =>
  typeof value === "string" && value.trim() !== "";
const isInteger = (value) =>
  typeof value === "number" && Number.isInteger(value);
const isValidPassword = (value) =>
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,16}$/.test(value);

module.exports = { isValidString, isInteger, isValidPassword };
