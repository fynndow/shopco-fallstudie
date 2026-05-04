const { MockAgent, setGlobalDispatcher } = require('undici');
const agent = new MockAgent();
agent.disableNetConnect();
setGlobalDispatcher(agent);
const pool = agent.get('https://email.provider.io');
pool.intercept({ path: '/send', method: 'POST' }).reply(200, { ok: true });

(async () => {
  try {
    const res = await fetch('https://email.provider.io/send', { method: 'POST' });
    console.log('status', res.status);
    console.log('body', await res.json());
  } catch (e) {
    console.log('error', e.message);
  }
})();
