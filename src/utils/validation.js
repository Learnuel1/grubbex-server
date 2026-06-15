const config = require("../config/env");
const QRCode = require('qrcode');
let activeId;
const connections = [];
const characters = ["a","b", "c","d", "e", "f", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s","t","u", "v", "w", "x", "y","z"];
const isValidEmail = (email) => {
  let regex = new RegExp("[a-z0-9]+@[a-z]+.[a-z]{2,3}");
  return regex.test(email);
};
const OPTDigitGen = () =>{
  return Math.floor(Math.random() * 9000 + 100000);
};
const BookingId = () => {
  const cur = new Date;
  const timeSec = cur.getTime().toString().slice(4);
  const dateSec = cur.getFullYear().toString() + (cur.getMonth()+1).toString() + cur.getDate().toString();
  return config.BOOKING_ID_ABB.toUpperCase().concat(timeSec,dateSec,OPTDigitGen());
}
const paymentReference = () =>{
  const cur = new Date;
  const timeSec = cur.getTime().toString().slice(4);
  const dateSec =  (cur.getMonth()+1).toString() + cur.getDate().toString();
  return "GBX-".concat(timeSec,dateSec,OPTDigitGen(),Date.now());
}

const userIdGenerator = (userId) =>{
  if(!userId) throw new Error("Invalid user id data");
  const data =Array.from(JSON.stringify(userId));
  data.pop();//remove trailing space
  data.shift();//remove trailing space
  let charCount = 0;
  let digitSum = 0;
  let digitCount =0;
  let char ="";
  // add all digits
  data.forEach(el =>{
    if(!isNaN(el)){
      digitSum += parseInt(el);
      digitCount++;
    }else{
      char += el;
      charCount++;
    }
  })
  // count the number of characters
  // divide the sum of digits by the number of characters and pick the whole number
  const firstInt =  Math.floor(digitSum/charCount);  
 let  secondInt = Math.floor( (charCount + digitCount) / firstInt);
 if(secondInt.toString().length <2) {
  if(charCount.toString().length >=2) charCount = charCount.toString().substring(0,1);
  secondInt = secondInt.toString().concat(charCount.toString());}
 let thirdInt = Math.floor((charCount + digitCount)/2);
  const firstChar = characters[pickCharacter(0, 25)];
  const secondChar = characters[pickCharacter(0, 25)];
  const ID = `mv${firstInt}${firstChar}${secondInt}${secondChar}`;
  if(ID.toString().length <7) ID.toString().concat(thirdInt);
  return ID.toUpperCase();
}

const pickCharacter = (min, max) =>{
  const randomFraction = Math.random();
 const range = min + randomFraction * (max - min);
 return Math.floor(range);
}


/**
 * Generates a QR code as a data URL.
 * @param {string} text - The text or URL to encode in the QR code.
 * @returns {Promise<string>} - A promise that resolves to a data URL of the QR code image.
 */
async function generateQRCode(text) {
  try {
    const qrDataUrl = await QRCode.toDataURL(text);
    return qrDataUrl;
  } catch (err) {
    throw new Error('Failed to generate QR code: ' + err.message);
  }
}
module.exports = {
  isValidEmail,
  OPTDigitGen,
  BookingId,
  paymentReference,
 activeId,
 connections,
 userIdGenerator,
 generateQRCode,
};
