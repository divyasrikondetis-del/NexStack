const assert = require('assert');
const { getRequiredVerification } = require('../utils/language');

function run() {
  const french = getRequiredVerification('fr');
  const spanish = getRequiredVerification('es');

  assert.strictEqual(french.method, 'email');
  assert.strictEqual(french.channel, 'email');
  assert.strictEqual(spanish.method, 'email');
  assert.strictEqual(spanish.channel, 'email');
}

run();
console.log('language-switch tests passed');
