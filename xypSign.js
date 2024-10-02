import * as fs from 'fs';
import crypto from 'crypto'
import { Buffer } from 'buffer';
import 'dotenv/config'

//const xypSign = crypto.createSign('SHA256');

const keyPath = process.env.XYP_KEY 
const accessToken = process.env.XYP_TOKEN

export function sign(){
    const timeStamp = Math.floor(+new Date() / 1000);
  //  console.log('keyPath : ', keyPath)
  
    var signData = accessToken + "." + timeStamp;
  //  xypSign.write(signData);
  //  xypSign.end();

    // Convert string to buffer  
    const data = Buffer.from(signData); 

    const key = fs.readFileSync(keyPath);

    const sign = crypto.sign("SHA256", data, key); 
    const signature_b64 = sign.toString('base64'); 
   // console.log('signature : ', signature_b64);
   // var signature_b64 = xypSign.sign(key, 'base64');
    return {
        accessToken: accessToken, timeStamp: timeStamp, signature: signature_b64
    };

}
