'use strict';
const https = require('https');

const VERIFY_TOKEN = '0a738183-9daf-4f05-af28-3d560f0a3ea2';
const PAGE_ACCESS_TOKEN = 'EAAEiPn5F0T4BACJMMq49Rt5w7i5ZC11sJu3GcQ2zPVwaOtgzsN0YDrZAyzUhj8ZAu87VtdDKlSZCQyfxN2gQdHl5jIbR3axNPCc2cDFuJL8cdvsMgycgneY4ZAOkV4vEYRTjBub5e2HObidasmI1rZCqRiMgBx4T4SYcpnOcEfOAZDZD';

module.exports.hello = (event, context, callback) => {
  const response = {
    statusCode: 200,
    headers: {
      "Access-Control-Allow-Origin": "*"
    },
    body: JSON.stringify({
      message: 'Go Serverless v1.0! Your function executed successfully!',
      input: event,
    }),
  };

  callback(null, response);

  // Use this code if you don't use the http event with the LAMBDA-PROXY integration
  // callback(null, { message: 'Go Serverless v1.0! Your function executed successfully!', event });
};

module.exports.login = (event, context, callback) => {
  const response = {
    statusCode: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Content-Type": "text/html; charset=utf-8"
    },
    body: `<!DOCTYPE html><meta content="width=device-width,initial-scale=1"name=viewport><style>html{font-family:sans-serif;background-image:radial-gradient(ellipse farthest-side at 35% -16%,#4bc4e1 0,#3db9d6 12.97%,#1b9ebc 36.11%,#05557a 100%);color:#fff;background-size:cover;background-repeat:no-repeat;height:100%}form{display:flex;flex-direction:column}.title{text-align:center}input[type=password],input[type=text]{width:100%;padding:12px 20px;margin:8px 0;display:inline-block;border:none;border-radius:2px;box-sizing:border-box;background-color:rgba(0,0,0,.4);color:#fff;font-size:14px}button{background-color:#4caf50;color:#fff;padding:14px 20px;margin:8px 0;border:none;cursor:pointer;width:100%}button:hover{opacity:.8}.cancelbtn{width:auto;padding:10px 18px;background-color:#f44336}.container{padding:16px;max-width:600px;margin:auto}.loginbtn{background:#fff;color:#1b9ebc;height:48px;width:100%;border:none;border-radius:2px;font-size:14px}</style><form method=post action='validate'><h2 class=title>service</h2><div class=container><input type=text name=email placeholder="Email address" required> <input name=password placeholder=Password required type=password> <button class=loginbtn type=submit>Login</button></div></form>`
  };

  callback(null, response);
};

module.exports.validate = (event, context, callback) => {
  const response = {
    statusCode: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
    },
    body: JSON.stringify(event)
  };

  callback(null, response);
};

module.exports.webhook = (event, context, callback) => {
    if(event.queryStringParameters){
        const queryParams = event.queryStringParameters;
        const rVerifyToken = queryParams['hub.verify_token'];
        let response;

        if (rVerifyToken === VERIFY_TOKEN) {
            const challenge = queryParams['hub.challenge'];

            response = {
                headers: {
                  "Access-Control-Allow-Origin": "*"
                },
                body: parseInt(challenge),
                statusCode: 200
            };

            callback(null, response);
        } else {
            response = {
                headers: {
                  "Access-Control-Allow-Origin": "*"
                },
                body: 'Error, wrong validation token',
                statusCode: 422
            };

            callback(null, response);
        }
    } else {
        const data = JSON.parse(event.body);

        if (data.object === 'page') {
            // Iterate over each entry - there may be multiple if batched
            data.entry.forEach(function(entry) {
                const pageID = entry.id;
                const timeOfEvent = entry.time;
                // Iterate over each messaging event
                entry.messaging.forEach(function(msg) {
                    if (msg.message) {
                        receivedMessage(msg);
                    } else {
                        console.log("Webhook received unknown event: ", event);
                    }
                });
            });
        }

        // Assume all went well.
        //
        // You must send back a 200, within 20 seconds, to let us know
        // you've successfully received the callback. Otherwise, the request
        // will time out and we will keep trying to resend.
        var response = {
          'body': "ok",
          'statusCode': 200
        };

        callback(null, response);
    }
};



function receivedMessage(event) {
  console.log("Message data: ", event.message);

  var senderID = event.sender.id;
  var recipientID = event.recipient.id;
  var timeOfMessage = event.timestamp;
  var message = event.message;
  console.log("Received message for user %d and page %d at %d with message:", senderID, recipientID, timeOfMessage);
  console.log(JSON.stringify(message));
  var messageId = message.mid;
  var messageText = message.text;
  var messageAttachments = message.attachments;
  if (messageText) {
    // If we receive a text message, check to see if it matches a keyword
    // and send back the example. Otherwise, just echo the text we received.
    switch (messageText) {
      case 'generic':
        sendGenericMessage(senderID);
        break;
      case 'login':
        sendLoginMessage(senderID);
        break;
      case 'logout':
        sendLogoutMessage(senderID);
        break;
      default:
        sendTextMessage(senderID, messageText);
    }
  } else if (messageAttachments) {
    sendTextMessage(senderID, "Message with attachment received");
  }
}
function sendTextMessage(recipientId, messageText) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      text: messageText
    }
  };
  callSendAPI(messageData);
}

function callSendAPI(messageData) {
  var body = JSON.stringify(messageData);
  var path = '/v2.6/me/messages?access_token=' + PAGE_ACCESS_TOKEN;
  var options = {
    host: "graph.facebook.com",
    path: path,
    method: 'POST',
    headers: {'Content-Type': 'application/json'}
  };
  var callback = function(response) {
    var str = ''
    response.on('data', function (chunk) {
      str += chunk;
    });
    response.on('end', function () {

    });
  }
  var req = https.request(options, callback);
  req.on('error', function(e) {
    console.log('problem with request: '+ e);
  });

  req.write(body);
  req.end();
}


function sendGenericMessage(recipientId) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      attachment: {
        type: "template",
        payload: {
          template_type: "generic",
          elements: [{
            title: "rift",
            subtitle: "Next-generation virtual reality",
            item_url: "https://www.oculus.com/en-us/rift/",
            image_url: "http://messengerdemo.parseapp.com/img/rift.png",
            buttons: [{
              type: "web_url",
              url: "https://www.oculus.com/en-us/rift/",
              title: "Open Web URL"
            }, {
              type: "postback",
              title: "Call Postback",
              payload: "Payload for first bubble",
            }],
          }, {
            title: "touch",
            subtitle: "Your Hands, Now in VR",
            item_url: "https://www.oculus.com/en-us/touch/",
            image_url: "http://messengerdemo.parseapp.com/img/touch.png",
            buttons: [{
              type: "web_url",
              url: "https://www.oculus.com/en-us/touch/",
              title: "Open Web URL"
            }, {
              type: "postback",
              title: "Call Postback",
              payload: "Payload for second bubble",
            }]
          }]
        }
      }
    }
  };

  callSendAPI(messageData);
}

function sendLoginMessage(recipientId) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      attachment: {
        type: "template",
        payload: {
          template_type: "generic",
          elements: [{
            title: "Elementum",
            subtitle: "Login to continue",
            buttons: [{
              type: "account_link",
              url: "https://350bbo09qa.execute-api.us-east-1.amazonaws.com/dev/login"
            }]
          }]
        }
      }
    }
  };

  callSendAPI(messageData);
}


function sendLogoutMessage(recipientId) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      attachment: {
        type: "template",
        payload: {
          template_type: "generic",
          elements: [{
            title: "Elementum",
            subtitle: "Logout",
            buttons: [{
              type: "account_unlink"
            }]
          }]
        }
      }
    }
  };

  callSendAPI(messageData);
}
