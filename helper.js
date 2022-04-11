const moment = require('moment-timezone');
const db = require('./utils/db');

module.exports.checkCoolDown = async (message, user) => {
  const { embeds } = message;
  const richEmbed = embeds.find((e) => e.type === 'rich');
  const isCooldowns = richEmbed && richEmbed.title && (richEmbed.title.includes(user.username) && richEmbed.title.includes('Cooldowns'));
  const res = {
    nextDaily: '',
    nextClaim: ''
  }

  console.log('isCooldowns', isCooldowns);
  if (isCooldowns) {
    const findClaim = richEmbed.fields.find((r) => r.name.includes('Claim'));
    const findDaily = richEmbed.fields.find((r) => r.name.includes('Daily'));
    const update = { updated_at: new Date() };

    if (findClaim) {
      let timeoutClaim = findClaim.value;
      timeoutClaim = timeoutClaim.replace(/\*/g, '');
      update.timeout_claim = timeoutClaim;

      if (timeoutClaim === 'Ready') {
        update.next_claim = moment().add(1, 'hours').format('YYYY-MM-DD HH:mm:ss');
      } else {
        const [hourClaim, minuteClaim, secClaim] = timeoutClaim.split(':');
        const nextClaim = moment()
          .add(parseInt(hourClaim), 'hours')
          .add(parseInt(minuteClaim), 'minutes')
          .add(parseInt(secClaim), 'seconds')
          .format('YYYY-MM-DD HH:mm:ss');
        console.log('nextClaim', nextClaim);
        update.next_claim = nextClaim;
        res.nextClaim = nextClaim;
      }
    }

    if (findDaily) {
      let timeoutDaily = findDaily.value;
      timeoutDaily = timeoutDaily.replace(/\*/g, '');
      update.timeout_daily = timeoutDaily;

      if (timeoutDaily === 'Ready') {
        update.next_daily = moment().add(1, 'days').format('YYYY-MM-DD HH:mm:ss');
      } else {
        const [hourClaim, minuteClaim, secClaim] = timeoutDaily.split(':');
        const nextDaily = moment()
          .add(parseInt(hourClaim), 'hours')
          .add(parseInt(minuteClaim), 'minutes')
          .add(parseInt(secClaim), 'seconds')
          .format('YYYY-MM-DD HH:mm:ss');
        console.log('nextDaily', nextDaily);
        update.next_daily = nextDaily;
        res.nextDaily = nextDaily;
      }
    }

    await db.from('sg_users').update(update).where('user_id', user.user_id);
    return res;
  }
  return false;
}
