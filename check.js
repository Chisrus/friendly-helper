const fs = require('fs');
let s = fs.readFileSync('multilang.js','utf8');
let balance = 0;
for(let i=0;i<s.length;i++){
  if(s[i]=='{') balance++;
  if(s[i]=='}') balance--;
  if(balance<0){ console.log('negative at', i); break; }
}
console.log('final balance', balance);
