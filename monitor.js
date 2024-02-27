import Hyperswarm from 'hyperswarm';
import goodbye from 'graceful-goodbye';
import b4a from 'b4a';
import { sha256 } from '@noble/hashes/sha256';
import * as gatekeeper from './gatekeeper.js';
import * as cipher from './cipher.js';

import { EventEmitter } from 'events';
EventEmitter.defaultMaxListeners = 100;

const swarm = new Hyperswarm();
goodbye(() => swarm.destroy())

const nodes = {};
const messagesSeen = {};

// Keep track of all connections
const conns = [];
swarm.on('connection', conn => {
    const name = b4a.toString(conn.remotePublicKey, 'hex');
    console.log('* got a connection from:', name, '*');
    conns.push(conn);
    conn.once('close', () => conns.splice(conns.indexOf(conn), 1));
    conn.on('data', data => receiveMsg(name, data));
});

async function shareDb() {
    try {
        const db = gatekeeper.loadDb();
        const hash = cipher.hashJSON(db);

        messagesSeen[hash] = true;

        const msg = {
            hash: hash.toString(),
            data: db,
            relays: [],
        };

        await relayDb(msg);
    }
    catch (error) {
        console.log(error);
    }
}

async function relayDb(msg) {
    const json = JSON.stringify(msg);

    console.log(`* relaying db: ${msg.hash} *`);

    for (const conn of conns) {
        const name = b4a.toString(conn.remotePublicKey, 'hex');

        if (!msg.relays.includes(name)) {
            conn.write(json);
            console.log(`* relaying to: ${name} *`);
        }
        else {
            console.log(`* skipping relay to: ${name} *`);
        }
    }
}

function mergeDb(newdb) {
    const db = gatekeeper.loadDb();

    if (!db.anchors) {
        db.anchors = {};
    }

    for (const did of Object.keys(newdb.anchors)) {
        if (!db.anchors[did]) {
            db.anchors[did] = newdb.anchors[did];
            console.log(`* imported new anchor: ${did} *`);
        }
        else {
            console.log(`* already have anchor: ${did} *`);
        }
    }

    gatekeeper.writeDb(db);
}

async function receiveMsg(name, json) {
    try {
        const msg = JSON.parse(json);
        const hash = cipher.hashJSON(msg.data);
        const seen = messagesSeen[hash];

        if (!seen) {
            messagesSeen[hash] = true;
            msg.relays.push(name);
            logMsg(msg.relays[0], hash);
            relayDb(msg);
            console.log(`* merging db ${hash} *`);
            mergeDb(msg.data);
        }
        else {
            console.log(`* received already seen ${hash} *`);
        }
    }
    catch (error) {
        console.log('receiveMsg error:', error);
    }
}

function logMsg(name, hash) {
    nodes[name] = (nodes[name] || 0) + 1;
    const detected = Object.keys(nodes).length;

    console.log(`from: ${name}`);
    console.log(`received: ${hash}`);
    console.log(`--- ${conns.length} nodes connected, ${detected} nodes detected`);
}

setInterval(async () => {
    try {
        shareDb();
    }
    catch (error) {
        console.error(`Error: ${error}`);
    }
}, 10000);

// Join a common topic
const protocol = '/MDIP/v22.02.27';
const hash = sha256(protocol);
const networkID = Buffer.from(hash).toString('hex');
const topic = b4a.from(networkID, 'hex');
const discovery = swarm.join(topic, { client: true, server: true });

// The flushed promise will resolve when the topic has been fully announced to the DHT
discovery.flushed().then(() => {
    console.log('joined topic:', b4a.toString(topic, 'hex'));
});

process.on('uncaughtException', (error) => {
    console.error('Unhandled exception caught');
});

process.on('unhandledRejection', (reason, promise) => {
    //console.error('Unhandled rejection at:', promise, 'reason:', reason);
    console.error('Unhandled rejection caught');
});

process.stdin.on('data', d => {
    if (d.toString().startsWith('q')) {
        process.exit();
    }
});