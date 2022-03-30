process.env.TZ = 'Asia/Jakarta';
require('dotenv').config();
const cron = require('node-cron');
const Discord = require("discord-user-bots");
const moment = require('moment-timezone');
const db = require('./utils/db');
const Promise = require('bluebird');
const { checkCoolDown } = require("./helper");

require('moment/locale/id');
moment.locale('id');

const CHANNELID = process.env.SG_CHANNEL_ID;
const PREFIX = process.env.SG_PREFIX;

const getAllUsers = () => db.from('sg_users').where('is_auth_error', false).whereNot('token', null);

const run = async () => {
  const users = await getAllUsers();

  await Promise.mapSeries(users, (user) => {
    console.log('[!] Running for user:', user.username);
    try {
      const emptyNext = user.next_claim === null || user.next_daily === null;
      const nextClaim = user.next_claim ? moment(user.next_claim).toDate() : null;
      const nextDaily = user.next_daily ? moment(user.next_daily).toDate() : null;
  
      let client;
      let newClaim;
      let newDaily;
      let hasClaimOrDaily;

      if (emptyNext) {
        client = new Discord.Client(user.token);
        client.on.ready = async function (ctx) {
          console.log("[!] Client online! SETUP...", ctx);
          await Promise.delay(5000);
          client.send(CHANNELID, {
            content: `${PREFIX}cd`,
            tts: false
          });
        };

        client.on.message_create = async function (message) {
          const isSoccerGuru = message.member.nick === process.env.SG_NICKNAME;
          if (isSoccerGuru) {
            const checkCD = await checkCoolDown(message, user);
            if (checkCD) {
              client.ws.close();
              client = null;
              console.log('[!] Logout client', user.username);
            }
          }
          return true;
        };

        return true;
      }
  
      if (nextClaim || nextDaily) {
        const pastDateClaim = moment().isAfter(nextClaim);
        const pastDateDaily = moment().isAfter(nextDaily);
    
        if (!pastDateClaim && !pastDateClaim) {
          console.log('Belum ready');
          return false;
        }
  
        console.log('[!] Connecting to discord client', user.user_id, user.username);
        client = new Discord.Client(user.token);
        const update = { updated_at: new Date() };
  
        client.on.ready = async function (ctx) {
          console.log("Client online!", ctx);
  
          if (nextClaim) {
            console.log('pastDateClaim', pastDateClaim);
            if (pastDateClaim) {
              client.send(CHANNELID, {
                content: `${PREFIX}claim`,
                tts: false
              });
              hasClaimOrDaily = true;
              newClaim = moment().add(1, 'minute').format('YYYY-MM-D HH:mm:ss');
              update.next_claim = newClaim;
            }
          }
      
          if (nextDaily) {
            await Promise.delay(1000);
            console.log('pastDateDaily', pastDateDaily);
            if (pastDateDaily) {
              client.send(CHANNELID, {
                content: `${PREFIX}daily`,
                tts: false
              });
              hasClaimOrDaily = true;
              newDaily = moment().add(1, 'days').format('YYYY-MM-D HH:mm:ss');
              update.next_daily = newDaily;
            }
          }
  
          await db.from('sg_users').update(update).where('user_id', user.user_id);
  
          if (hasClaimOrDaily || emptyNext) {
            await Promise.delay(5000);
            client.send(CHANNELID, {
              content: `${PREFIX}cd`,
              tts: false
            });
          }
  
          return true;
        };
  
        client.on.message_create = async function (message) {
          const isSoccerGuru = message.member.nick === process.env.SG_NICKNAME;
          if (isSoccerGuru) {
            const checkCD = await checkCoolDown(message, user);
            if (checkCD) {
              client.ws.close();
              client = null;
              console.log('Logout client');
            }
          }
          return true;
        };
  
        return true;
  
      }
    } catch (error) {
      console.log('Error for user', user.username, error.message);
    }

    return false;
  }, { concurrency: 1 } );

  return true;
};


(() => {
  console.log('[+] Cron is running', new Date().toLocaleString());
  cron.schedule('*/5 * * * *', () => {
    console.log('[!] Running a task every 5 minute');
    return run();
  });
})();