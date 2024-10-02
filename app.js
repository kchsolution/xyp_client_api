import express from "express";
import cors from "cors";
import bodyParser  from "body-parser";
import 'dotenv/config'
import { sign } from "./xypSign.js"
import soap from 'soap'
import expressBasicAuth from "express-basic-auth";
import bcrypt from "bcrypt";

const app = express();
// app.use(cors())
app.use(bodyParser.json());
const port = process.env.PORT || 3002;

const allowedOrigins = ['http://localhost:3000']

const corsOptions = {
  origin: (origin, callback) => {
        // allow requests with no origin 
    // (like mobile apps or curl requests)
    if(!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  }
}

app.use(expressBasicAuth({
  authorizer: asyncAuthorizer,
  authorizeAsync: true,
  unauthorizedResponse: getUnauthorizedResponse
}))

const whitelist = ['192.168.0.13', '::ffff:192.168.2.13']; // Example IP 
const whitelistMiddleware = (req, res, next) => {
    const userIP = req.ip; // Get user's IP address
    console.log('userIP' , userIP)
    
    // Check if user's IP is in the whitelist
    if (!whitelist.includes(userIP)) {
    return res.status(403).send('Access forbidden');
    }
    
    // Proceed to next middleware if IP is whitelisted
    next();
  };
  
// Apply whitelist middleware to routes
app.use(whitelistMiddleware);

async function asyncAuthorizer(username, password, cb) {
  if (expressBasicAuth.safeCompare(username, process.env.AUTH_USER) & bcrypt.compareSync(password, process.env.AUTH_PASS))
      return cb(null, true)
  else
      return cb(null, false)
}

function getUnauthorizedResponse(req) {
  return req.auth
      ? { message : 'Credentials rejected'}
      : { message : 'No credentials provided'}
}


const REQUEST_URL =  {
  citizen : 'https://xyp.gov.mn/citizen-1.5.0/ws?WSDL',
  insurance : 'https://xyp.gov.mn/insurance-1.5.0/ws?WSDL',
  property : 'https://xyp.gov.mn/property-1.5.0/ws?WSDL',
  transport : 'https://xyp.gov.mn/transport-1.5.0/ws?WSDL'
};


app.post('/citizen-salary-info', async(req, res, next) => { 
      const { regnum, startYear, endYear  } = req.body;

      if(!regnum){
        res.status(400).json({ message : 'РД дугаар шаардлагатай!' });
        return;
      }

      if(!startYear){
        res.status(400).json({ message : 'Эхлэх өдөр шаардлагатай!' });
        return;
      }

      if(!endYear){
        res.status(400).json({ message : 'Дуусах өдөр шаардлагатай!' });
        return;
      }

      const url = REQUEST_URL.insurance; 
      const signData = sign();
      const args = {
        'request': {
            'regnum': regnum,
            'startYear': startYear.toString(), 
            'endYear': endYear.toString()
        },
      };
      try {
        soap.createClient(url, {endpoint: url}, function (err, client) {
          if(err){
            console.error('createClient error : ', err)
            res.status(500).json({
                message: err?.message || "failed",
            });
          } 
          client.addHttpHeader('accessToken', signData.accessToken);
          client.addHttpHeader('timeStamp', signData.timeStamp.toString());
          client.addHttpHeader('signature', signData.signature);

          client.WS100501_getCitizenSalaryInfo(args, function (err, result) {
              if(err){
                res.status(500).json({
                    message: err?.message || "failed",
                });
              }
              const resultCode = result?.return?.resultCode;
              const resultData = resultCode === 0 ? result?.return?.response?.list : [];
              const data = {
                resultData,
                resultCode,
                resultMessage : result?.return?.resultMessage
              }
              res.status(200).json(data);
          });
      });
    } catch (err){
      console.error(err)
      res.status(500).json({
          message: err?.message || "failed",
      });
    }
 
})

app.post('/citizen-address-info', async(req, res, next) => {
    const { regnum, civilId } = req.body;

  if(!regnum){
    res.status(400).json({ message : 'РД дугаар шаардлагатай!' });
    return;
  }
    const url = REQUEST_URL.citizen; 
    const signData = sign();
    const args = {
      'request': {
          'regnum': regnum,
          'civilId' : '0'
      },
    };
    try {
        soap.createClient(url, {endpoint: url}, function (err, client) {
          if(err){
            console.error('createClient error : ', err)
            res.status(500).json({
                message: err?.message || "fails",
            });
          }
          
          client.addHttpHeader('accessToken', signData.accessToken);
          client.addHttpHeader('timeStamp', signData.timeStamp.toString());
          client.addHttpHeader('signature', signData.signature);
    
          client.WS100103_getCitizenAddressInfo(args, function (err, result) {
              if(err){
                console.error(err)
                res.status(500).json({
                    message: err?.message || "fails",
                });
              }
              const resultCode = result?.return?.resultCode;
              const resultData = resultCode === 0 ? result?.return?.response : null;
              const data = {
                resultData,
                resultCode,
                resultMessage : result?.return?.resultMessage
              }
              res.status(200).json(data);
          });
      });

    } catch (err){
      console.error(err)
      res.status(500).json({
          message: err?.message || "failed",
      });
    }
});

app.post('/property-list', async(req, res, next) => {
  const { regnum } = req.body;

if(!regnum){
  res.status(400).json({ message : 'РД дугаар шаардлагатай!' });
  return;
}
  const url = REQUEST_URL.property; 
  const signData = sign();
  const args = {
    'request': {
        'regnum': regnum
    },
  };
  try {
      soap.createClient(url, {endpoint: url}, function (err, client) {
        if(err){
          console.error('createClient error : ', err)
          res.status(500).json({
              message: err?.message || "fails",
          });
        }
        
        client.addHttpHeader('accessToken', signData.accessToken);
        client.addHttpHeader('timeStamp', signData.timeStamp.toString());
        client.addHttpHeader('signature', signData.signature);
  
        client.WS100202_getPropertyList(args, function (err, result) {
            if(err){
              console.error(err)
              res.status(500).json({
                  message: err?.message || "fails",
              });
            }
            const resultCode = result?.return?.resultCode;
            const resultData = resultCode === 0 ? result?.return?.response?.listData : [];
            const data = {
              resultData,
              resultCode,
              resultMessage : result?.return?.resultMessage
            }
            res.status(200).json(data);
        });
    });

  } catch (err){
    console.error(err)
    res.status(500).json({
        message: err?.message || "failed",
    });
  }
});


app.post('/citizen-idcard-info', async(req, res, next) => {
  const { regnum } = req.body;

if(!regnum){
  res.status(400).json({ message : 'РД дугаар шаардлагатай!' });
  return;
}
  const url = REQUEST_URL.citizen;
  const signData = sign();
  const args = {
    'request': {
        'regnum': regnum,
        'civilId' : '0'
    },
  };
  try {
      soap.createClient(url, {endpoint: url}, function (err, client) {
        if(err){
          console.error('createClient error : ', err)
          res.status(500).json({
              message: err?.message || "fails",
          });
        }
        
        client.addHttpHeader('accessToken', signData.accessToken);
        client.addHttpHeader('timeStamp', signData.timeStamp.toString());
        client.addHttpHeader('signature', signData.signature);
  
        client.WS100101_getCitizenIDCardInfo(args, function (err, result) {
            if(err){
              console.error(err)
              res.status(500).json({
                  message: err?.message || "fails",
              });
            }
            const resultCode = result?.return?.resultCode;
            const resultData = resultCode === 0 ? result?.return?.response : null;
            const data = {
              resultData,
              resultCode,
              resultMessage : result?.return?.resultMessage
            }
            res.status(200).json(data);
        });
    });

  } catch (err){
    console.error(err)
    res.status(500).json({
        message: err?.message || "failed",
    });
  }
});


app.post('/citizen-marriage-info', async(req, res, next) => {
  const { regnum } = req.body;

if(!regnum){
  res.status(400).json({ message : 'РД дугаар шаардлагатай!' });
  return;
}
  const url = REQUEST_URL.citizen; 
  const signData = sign();
  const args = {
    'request': {
        'regnum': regnum,
        'civilId' : '0'
    },
  };
  try {
      soap.createClient(url, {endpoint: url}, function (err, client) {
        if(err){
          console.error('createClient error : ', err)
          res.status(500).json({
              message: err?.message || "fails",
          });
        }
        
        client.addHttpHeader('accessToken', signData.accessToken);
        client.addHttpHeader('timeStamp', signData.timeStamp.toString());
        client.addHttpHeader('signature', signData.signature);
  
        client.WS100104_getCitizenMarriageInfo(args, function (err, result) {
            if(err){
              console.error(err)
              res.status(500).json({
                  message: err?.message || "fails",
              });
            }
            const resultCode = result?.return?.resultCode;
            const resultData = resultCode === 0 ? result?.return?.response : null;
            const data = {
              resultData,
              resultCode,
              resultMessage : result?.return?.resultMessage
            }
            res.status(200).json(data);
        });
    });

  } catch (err){
    console.error(err)
    res.status(500).json({
        message: err?.message || "failed",
    });
  }
});


app.post('/citizen-vehicle-list', async(req, res, next) => {
  const { regnum } = req.body;

if(!regnum){
  res.status(400).json({ message : 'РД дугаар шаардлагатай!' });
  return;
}
  const url = REQUEST_URL.transport; 
  const signData = sign();
  const args = {
    'request': {
        'regnum': regnum,
        'plateNumber' : '',
        'cabinNumber' : '',
        'certificatNumber' : ''
    },
  };
  try {
      soap.createClient(url, {endpoint: url}, function (err, client) {
        if(err){
          console.error('createClient error : ', err)
          res.status(500).json({
              message: err?.message || "fails",
          });
        }
        
        client.addHttpHeader('accessToken', signData.accessToken);
        client.addHttpHeader('timeStamp', signData.timeStamp.toString());
        client.addHttpHeader('signature', signData.signature);
  
        client.WS100406_getCitizenVehicleList(args, function (err, result) {
            if(err){
              console.error(err)
              res.status(500).json({
                  message: err?.message || "fails",
              });
            }
            const resultCode = result?.return?.resultCode;
            const resultData = resultCode === 0 ? result?.return?.response : null;
            const data = {
              resultData,
              resultCode,
              resultMessage : result?.return?.resultMessage
            }
            res.status(200).json(data);
        });
    });

  } catch (err){
    console.error(err)
    res.status(500).json({
        message: err?.message || "failed",
    });
  }
});



app.post('/test', cors(corsOptions), async(req, res, next) => {
  res.json({msg: 'success'})
});

app.listen(port, () => {
  console.log(`listening on port : ${port}`)
});