require('dotenv').config();
import request from 'request';
import homePageServices from '../services/homepageService';

const MY_VERIFY_TOKEN = process.env.MY_VERIFY_TOKEN;
const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;
const WEBVIEW_URL = process.env.WEBVIEW_URL;
const APP_SECRET = process.env.APP_SECRET;
const APP_ID = process.env.APP_ID;

const { MessengerClient } = require('messaging-api-messenger');

const client = new MessengerClient({
  accessToken: PAGE_ACCESS_TOKEN,
  appId: APP_ID,
  appSecret: APP_SECRET,
  version: '6.0',
});

let getHomepage = (req, res) => {
  return res.render('homepage.ejs');
};

let getWebhook = (req, res) => {
  // Your verify token. Should be a random string.
  let VERIFY_TOKEN = MY_VERIFY_TOKEN;

  // Parse the query params
  let mode = req.query['hub.mode'];
  let token = req.query['hub.verify_token'];
  let challenge = req.query['hub.challenge'];

  // Checks if a token and mode is in the query string of the request
  if (mode && token) {
    // Checks the mode and token sent is correct
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      // Responds with the challenge token from the request
      res.status(200).send(challenge);
    } else {
      // Responds with '403 Forbidden' if verify tokens do not match
      res.sendStatus(403);
    }
  }
};

let postWebhook = (req, res) => {
  // Parse the request body from the POST
  let body = req.body;

  // Check the webhook event is from a Page subscription
  if (body.object === 'page') {
    // Iterate over each entry - there may be multiple if batched
    body.entry.forEach(function (entry) {
      // Gets the body of the webhook event
      let webhook_event = entry.messaging[0];

      // Get the sender PSID
      let sender_psid = webhook_event.sender.id;

      // Check if the event is a message or postback and
      // pass the event to the appropriate handler function
      if (webhook_event.message) {
        handleMessage(sender_psid, webhook_event.message);
      } else if (webhook_event.postback) {
        handlePostback(sender_psid, webhook_event.postback);
      }
    });

    // Return a '200 OK' response to all events
    res.status(200).send('EVENT_RECEIVED');
  } else {
    // Return a '404 Not Found' if event is not from a page subscription
    res.sendStatus(404);
  }
};

// Handles messages events
let handleMessage = (sender_psid, received_message) => {
  let response;

  // Checks if the message contains text
  if (received_message.text) {
    // Create the payload for a basic text message, which
    // will be added to the body of our request to the Send API
    response = {
      text: `Hello. You sent the message: "${received_message.text}". Now send me an attachment!`,
    };

    if (received_message.text.toLowerCase() === 'webview') {
      response = {
        attachment: {
          type: 'template',
          payload: {
            template_type: 'button',
            text: 'What do you want to do next?',
            buttons: [
              {
                type: 'web_url',
                url: WEBVIEW_URL,
                title: 'Show webview',
                webview_height_ratio: 'tall', // display on mobile
                messenger_extensions: true, // false if open webview in new tab
              },
            ],
          },
        },
      };
    }
  } else if (received_message.attachments) {
    // Get the URL of the message attachment
    let attachment_url = received_message.attachments[0].payload.url;
    response = {
      attachment: {
        type: 'template',
        payload: {
          template_type: 'generic',
          elements: [
            {
              title: 'Is this the right picture?',
              subtitle: 'Tap a button to answer.',
              image_url: attachment_url,
              buttons: [
                {
                  type: 'postback',
                  title: 'Yes!',
                  payload: 'yes',
                },
                {
                  type: 'postback',
                  title: 'No!',
                  payload: 'no',
                },
              ],
            },
          ],
        },
      },
    };
  }

  // Send the response message
  callSendAPI(sender_psid, response);
};

// Handles messaging_postbacks events (button click event)
let handlePostback = async (sender_psid, received_postback) => {
  let response;

  // Get the payload for the postback
  let payload = received_postback.payload;

  // Set the response based on the postback payload
  switch (payload) {
    case 'yes':
      response = { text: 'You just click yes!' };
      break;
    case 'no':
      response = { text: 'You just click no!' };
      break;
    case 'GET_STARTED':
      response = { 
        "attachment": {
          "type":"template",
          "payload": {
            "template_type":"button",
            "text":"Check my website",
            "buttons":[
              {
                "type":"web_url",
                "url":"https://demo-chatbot-webview.herokuapp.com/",
                "title":"My website"
              },
            ]
          } 
        }
      };
      break;
    case 'PICKING_RED':
      response = { text: 'You choose red' };
      break;
    default:
      break;
  }
  // Send the message to acknowledge the postback
  callSendAPI(sender_psid, response);
};

// Sends response messages via the Send API
let callSendAPI = (sender_psid, response) => {
  // Construct the message body
  let request_body = {
    recipient: {
      id: sender_psid,
    },
    message: response,
  };

  // Send the HTTP request to the Messenger Platform
  request(
    {
      uri: 'https://graph.facebook.com/v6.0/me/messages',
      qs: { access_token: PAGE_ACCESS_TOKEN },
      method: 'POST',
      json: request_body,
    },
    (err, res, body) => {
      if (!err) {
        console.log('message sent!');
      } else {
        console.error('Unable to send message:' + err);
      }
    },
  );
};

let getWebview = (req, res, next) => {
  res.render('webview');
};

let postWebview = (req, res, next) => {
  console.log('req.body: ', req.body);
  let response = {
    text: `I will book a ${req.body.pillow} and a ${req.body.bed}`,
  };

  callSendAPI(req.body.psid, response);
  res.redirect('/');
};

let handleSetupProfile = async (req, res) => {
  try {
    await homePageServices.handleSetupProfile();
    res.redirect('/');
  } catch (error) {
    console.log('error: ', error);
  }
};

let getSetupProfile = async (req, res) => {
  try {
    res.render('profile');
  } catch (error) {
    console.log('error: ', error);
  }
};

module.exports = {
  getHomepage: getHomepage,
  getWebhook: getWebhook,
  postWebhook: postWebhook,
  getWebview,
  postWebview,
  handleSetupProfile,
  getSetupProfile,
};
