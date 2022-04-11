process.env.TZ = 'Asia/Jakarta';
require('dotenv').config();
const cron = require('node-cron');
const Discord = require('discord-user-bots');
const moment = require('moment-timezone');
const db = require('./utils/db');
const Promise = require('bluebird');
const { checkCoolDown } = require('./helper');

require('moment/locale/id');
moment.locale('id');

const CHANNELID = process.env.SG_CHANNEL_ID;
const PREFIX = process.env.SG_PREFIX;

const getAllUsers = () => db.from('sg_users').where('is_active', true).whereNot('token', null);

const run = async () => {
  const users = await getAllUsers();

  const formatHumanDate = (date) => moment(date).format('YYYY-MM-DD HH:mm:ss');

  await Promise.map(users, (user) => {
    console.log('[!] Running for user:', user.username);
    try {
      const emptyNext = !user.next_claim || !user.next_daily;
      let delayClaim = 0;
      let delayDaily = 1000;

      if (user.next_claim) {
        const secClaim = moment(user.next_claim).format('ss');
        delayClaim = parseInt(secClaim, 10) * 1000;
        let nextClaimStr = formatHumanDate(user.next_claim).toString();
        nextClaimStr = nextClaimStr.slice(0, -3);
        nextClaimStr = `${nextClaimStr}:00`;
        user.next_claim = new Date(nextClaimStr);
      }
      if (user.next_daily) {
        const secDaily = moment(user.next_daily).format('ss');
        delayDaily = parseInt(secDaily, 10) * 1000;
        let nextDailyStr = formatHumanDate(user.next_daily).toString();
        nextDailyStr = nextDailyStr.slice(0, -3);
        nextDailyStr = `${nextDailyStr}:00`;
        user.next_daily = new Date(nextDailyStr);
      }

      const nextClaim = user.next_claim ? moment(user.next_claim).toDate() : null;
      const nextDaily = user.next_daily ? moment(user.next_daily).toDate() : null;

      let client;
      let newClaim;
      let newDaily;
      let hasClaimOrDaily;
      const teoriList = ['anjayy', 'cok', 'fak soccer guru', '#FakSoccerGuru', 'lejen', 'ganteng'];
      let teori = '';

      if (user.username === 'BayuN') {
        teori = teoriList[Math.floor(Math.random()*teoriList.length)];
      }

      if (emptyNext) {
        client = new Discord.Client(user.token);
        client.on.ready = async function () {
          console.log('[!] Client online! SETUP...');
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

        if (!pastDateClaim && !pastDateDaily) {
          console.log('Not ready! Next claim:', formatHumanDate(user.next_claim), 'Next daily:', formatHumanDate(user.next_daily));
          return false;
        }
  
        console.log('[!] Connecting to discord client', user.user_id, user.username);
        client = new Discord.Client(user.token);
        const update = { updated_at: new Date() };
  
        client.on.ready = async function () {
          console.log('Client online!');
  
          if (nextClaim) {
            console.log('pastDateClaim', pastDateClaim);
            if (pastDateClaim) {
              await Promise.delay(delayClaim);
              client.send(CHANNELID, {
                content: `${PREFIX}claim ${teori}`,
                tts: false
              });
              hasClaimOrDaily = true;
              newClaim = moment().add(1, 'hour').format('YYYY-MM-DD HH:mm:ss');
              update.next_claim = newClaim;
            }
          }
      
          if (nextDaily) {
            await Promise.delay(delayDaily);
            console.log('pastDateDaily', pastDateDaily);
            if (pastDateDaily) {
              client.send(CHANNELID, {
                content: `${PREFIX}daily`,
                tts: false
              });
              hasClaimOrDaily = true;
              newDaily = moment().add(1, 'days').format('YYYY-MM-DD HH:mm:ss');
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
            await Promise.delay(500);
            const nextClaimTxt = newClaim || formatHumanDate(user.next_claim);
            const nextDailyTxt = newDaily || formatHumanDate(user.next_daily);
            client.send(CHANNELID, {
              content: `Next claim: ${nextClaimTxt}\nNext daily: ${nextDailyTxt}`,
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
              await Promise.delay(800);
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
      return false;
    }

    return false;
  }, { concurrency: 1 } );

  return true;
};


(() => {
  console.log('[+] Job is running, running a task every 5 minute', new Date().toLocaleString());
  // initiate run
  run();
  cron.schedule('*/5 * * * *', () => {
    console.log('[!] Start task', new Date().toLocaleString());
    try {
      return run();
    } catch (error) { return false; }
  });
})();