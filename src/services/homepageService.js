require('dotenv').config();
import request from 'request';
const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;

let handleSetupProfile = () => {
  return new Promise((resolve, reject) => {
    let url = `https://graph.facebook.com/v9.0/me/messenger_profile`
    let request_body = {
      "get_started":{
        "payload":"GET_STARTED"
      },
      "persistent_menu": [
        {
            "locale": "default",
            "composer_input_disabled": false,
            "call_to_actions": [
                {
                    "type": "postback",
                    "title": "Talk to an agent",
                    "payload": "CARE_HELP"
                },
                {
                    "type": "postback",
                    "title": "Outfit suggestions",
                    "payload": "CURATION"
                },
                {
                    "type": "web_url",
                    "title": "Shop now",
                    "url": "https://www.originalcoastclothing.com/",
                    "webview_height_ratio": "full"
                }
            ]
        }
      ],
      "whitelisted_domains":[
        "https://demo-chatbot-webview.herokuapp.com/"
      ]
    }
    try {
      // 
      request(
        {
          uri: url,
          qs: { access_token: PAGE_ACCESS_TOKEN },
          method: 'POST',
          json: request_body
        },
        (err, res, body) => {
          if (!err) {
            resolve('success');
          } else {
            reject('Unable to send message:' + err);
          }
        },
      );

    } catch (error) {
      reject(error);
    }
  });
};

let getFacebookUsername = (sender_psid) => {
  return new Promise((resolve, reject) => {
    try {
      let url = `https://graph.facebook.com/${sender_psid}?fields=first_name,last_name,profile_pic,gender&access_token=${PAGE_ACCESS_TOKEN}`
      request(
        {
          uri: url,
          method: 'GET'
        },
        (err, res, body) => {
          if (!err) {
            let username = `${body.first_name} ${body.last_name}` 
            resolve(username);
          } else {
            reject('Unable to send message:' + err);
          }
        },
      );
    } catch (error) {
      reject(error);
    }
  });
}

module.exports = {
  handleSetupProfile,
  getFacebookUsername
};
