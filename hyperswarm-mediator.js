import Hyperswarm from 'hyperswarm';
import goodbye from 'graceful-goodbye';
import b4a from 'b4a';
import { sha256 } from '@noble/hashes/sha256';
import fs from 'fs';
import asyncLib from 'async';

import * as gatekeeper from './gatekeeper-sdk.js';
import * as cipher from './cipher.js';
import config from './config.js';

import { EventEmitter } from 'events';
EventEmitter.defaultMaxListeners = 100;

const protocol = '/MDIP/v22.03.20';

const swarm = new Hyperswarm();
const peerName = b4a.toString(swarm.keyPair.publicKey, 'hex');

goodbye(() => swarm.destroy())

const nodes = {};
const messagesSeen = {};
let merging = false;

// Keep track of all connections
const conns = [];
swarm.on('connection', conn => {
    const name = b4a.toString(conn.remotePublicKey, 'hex');
    console.log('* got a connection from:', shortName(name), '*');
    conns.push(conn);
    conn.once('close', () => conns.splice(conns.indexOf(conn), 1));
    conn.on('data', data => receiveMsg(name, data));
});

function shortName(name) {
    return name.slice(0, 4) + '-' + name.slice(-4);
}

function isEmpty(obj) {
    return Object.keys(obj).length === 0 && obj.constructor === Object;
}

function loadDb() {
    const dbName = 'data/mdip.json';

    if (fs.existsSync(dbName)) {
        return JSON.parse(fs.readFileSync(dbName));
    }
    else {
        return {}
    }
}

async function shareDb() {
    if (merging) {
        return;
    }

    try {
        const db = loadDb();

        if (isEmpty(db) || !db.hyperswarm || isEmpty(db.hyperswarm)) {
            return;
        }

        const hash = cipher.hashJSON(db.hyperswarm);

        messagesSeen[hash] = true;

        const msg = {
            hash: hash.toString(),
            data: db.hyperswarm,
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

    console.log(`publishing my db: ${shortName(msg.hash)} from: ${shortName(peerName)}`);

    for (const conn of conns) {
        const name = b4a.toString(conn.remotePublicKey, 'hex');

        if (!msg.relays.includes(name)) {
            conn.write(json);
            console.log(`* relaying to: ${shortName(name)} *`);
        }
        else {
            console.log(`* skipping relay to: ${shortName(name)} *`);
        }
    }
}

async function mergeBatch(batch) {
    try {
        console.log(`mergeBatch: merging ${batch.length} DIDs...`);
        const { verified, updated, failed } = await gatekeeper.mergeBatch(batch);
        console.log(`* ${verified} verified, ${updated} updated, ${failed} failed`);
    }
    catch (error) {
        console.error(`mergeBatch error: ${error}`);
    }
}

async function mergeDb(db) {
    merging = true;
    if (db) {
        // Import DIDs by creation time order to avoid dependency errors
        let dids = Object.keys(db);
        dids.sort((a, b) => db[a][0].time - db[b][0].time);

        let batch = [];
        for (const did of dids) {
            //console.log(`Adding to batch: ${did} ${db.hyperswarm[did][0].time}`);
            batch.push(db[did]);

            if (batch.length >= 100) {
                await mergeBatch(batch);
                batch = [];
            }
        }

        await mergeBatch(batch);
    }
    merging = false;
}

let queue = asyncLib.queue(async function (task, callback) {
    const { name, json } = task;
    try {
        const msg = JSON.parse(json);
        const hash = cipher.hashJSON(msg.data);
        const seen = messagesSeen[hash];

        if (!seen) {
            messagesSeen[hash] = true;

            const db = msg.data;

            if (isEmpty(db)) {
                return;
            }

            // const dbName = `${hash}.json`
            // fs.writeFileSync(dbName, JSON.stringify(db, null, 4));

            msg.relays.push(name);
            logMsg(msg.relays[0], hash);
            relayDb(msg);
            console.log(`* merging db ${shortName(hash)} *`);
            await mergeDb(db);
        }
        else {
            console.log(`received old db:  ${shortName(hash)} from: ${shortName(name)}`);
        }
    }
    catch (error) {
        console.log('receiveMsg error:', error);
    }
    callback();
}, 1); // concurrency is 1

async function receiveMsg(name, json) {
    queue.push({ name, json });
}

function logMsg(name, hash) {
    nodes[name] = (nodes[name] || 0) + 1;
    const detected = Object.keys(nodes).length;

    console.log(`received new db: ${shortName(hash)} from: ${shortName(name)}`);
    console.log(`--- ${conns.length} nodes connected, ${detected} nodes detected`);
}

process.on('uncaughtException', (error) => {
    //console.error('Unhandled exception caught');
    console.error('Unhandled exception caught', error);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled rejection at:', promise, 'reason:', reason);
    //console.error('Unhandled rejection caught');
});

process.stdin.on('data', d => {
    if (d.toString().startsWith('q')) {
        process.exit();
    }
});

// Join a common topic
const hash = sha256(protocol);
const networkID = Buffer.from(hash).toString('hex');
const topic = b4a.from(networkID, 'hex');

async function start() {
    console.log(`hyperswarm peer id: ${shortName(peerName)}`);
    console.log('joined topic:', shortName(b4a.toString(topic, 'hex')));

    setInterval(async () => {
        try {
            const version = gatekeeper.getVersion();

            if (version) {
                shareDb();
            }
        }
        catch (error) {
            console.error(`Error: ${error}`);
        }
    }, 10000);
}

function main() {
    console.log(`connecting to gatekeeper at ${config.gatekeeperURL}`);

    const discovery = swarm.join(topic, { client: true, server: true });

    // The flushed promise will resolve when the topic has been fully announced to the DHT
    discovery.flushed().then(() => {
        start();
    });
}

main();