const { customAlphabet } = require("nanoid");
const { monotonicFactory } = require("ulid");
const ulid = monotonicFactory();


/**
 * This generates an alphanumeric ID,
 * based on the number of characters provided.
 * @param {Number} length
 * @returns String
 */ 
exports.uniqueIdGen = () => {
	return String(ulid()).toLowerCase();
}


exports.shortIdGen = (length =7) => {
  if(isNaN(length)) throw new Error("Length of ID must be digit")
	const nanoid = customAlphabet("0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ", length);
	return nanoid();
}
// exports.shortIdGen = () => {
// 	const nanoid = customAlphabet("0123456789", 10);
// 	return nanoid();
// }
exports.OTPGen = () => {
	const nanoid = customAlphabet("0123456789", 6);
	return nanoid();
}

exports.referenceGen = (length = 15) => {
	const nanoid = customAlphabet("0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ", length);
	return nanoid();
}

exports.isValidEmail = (email) => {
  let regex = new RegExp("[a-z0-9]+@[a-z]+.[a-z]{2,3}");
  return regex.test(email);
};

 

exports.isPhoneNumberValid = (phone) => {
  if(phone.charAt(0) !== "+"){
    if(isNaN(phone)) return false;
  }else phone =  "0".concat(phone.slice(4))
  if(phone.length !== 11 && phone.length !== 15) return false;
  if(phone.charAt(0) !== "0" && phone.charAt(0) !== "+") return false;
  if(phone.charAt(1) !== "8" && phone.charAt(1) !== "7" && phone.charAt(1) !== "9") return false;
  return true;
}

exports.isStrongPassword =(password) =>{
  const strongPasswordRegex = new RegExp(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#\$%\^&\*\(\)_\+\-=\[\]\{\}\|;:'",<>\.\?\/])[A-Za-z\d!@#\$%\^&\*\(\)_\+\-=\[\]\{\}\|;:'",<>\.\?\/]{8,}$/)
  return strongPasswordRegex.test(password);
}
exports.generateStrongPassword =(length = 8) => {
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  const specialChars = '@$!%*?&';

  
  // Ensure the password contains at least one character from each required set
  const allChars = lowercase + uppercase + numbers + specialChars;
  let password = '';
  
  // Pick at least one character from each set
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += specialChars[Math.floor(Math.random() * specialChars.length)];
  
  // Fill the rest of the password length with random characters from all sets
  for (let i = 4; i < length; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
  }

  // Shuffle the password to avoid predictable sequences
  password = password.split('').sort(() => Math.random() - 0.5).join('');

  return password;
}