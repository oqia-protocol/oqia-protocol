// Script to update AI_COMMITMENT_MESSAGE.md with a new message and timestamp
const fs = require('fs');
const path = require('path');

const COMMITMENT_PATH = path.resolve(__dirname, '../docs/AI_COMMITMENT_MESSAGE.md');

function getTimestamp() {
    return new Date().toISOString();
}

function appendMessage(message) {
    const timestamp = getTimestamp();
    const entry = `\n## Update (${timestamp})\n${message}\n`;
    fs.appendFileSync(COMMITMENT_PATH, entry);
    console.log(`Message appended at ${timestamp}`);
}

// Usage: node update_commitment_message.js "Your message here"
if (require.main === module) {
    const msg = process.argv.slice(2).join(' ');
    if (!msg) {
        console.error('Usage: node update_commitment_message.js "Your message here"');
        process.exit(1);
    }
    appendMessage(msg);
}

module.exports = { appendMessage };
