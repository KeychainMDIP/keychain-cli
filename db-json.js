import fs from 'fs';

const dataFolder = 'data';
let dbName;

function loadDb() {
    if (fs.existsSync(dbName)) {
        return JSON.parse(fs.readFileSync(dbName));
    }
    else {
        return {
            dids: {}
        }
    }
}

function writeDb(db) {
    if (!fs.existsSync(dataFolder)) {
        fs.mkdirSync(dataFolder, { recursive: true });
    }

    fs.writeFileSync(dbName, JSON.stringify(db, null, 4));
}

export async function start(name = 'mdip') {
    dbName = `${dataFolder}/${name}.json`;
}

export async function stop() {
}

export async function resetDb() {
    if (fs.existsSync(dbName)) {
        fs.rmSync(dbName);
    }
}

export async function addOperation(op) {
    const db = loadDb();
    const suffix = op.did.split(':').pop();

    if (Object.prototype.hasOwnProperty.call(db.dids, suffix)) {
        db.dids[suffix].push(op);
    }
    else {
        db.dids[suffix] = [op];
    }

    writeDb(db);
}

export async function getOperations(did) {
    try {
        const db = loadDb();
        const suffix = did.split(':').pop();
        const updates = db.dids[suffix];

        if (updates && updates.length > 0) {
            return updates;
        }
        else {
            return [];
        }
    }
    catch {
        return [];
    }
}

export async function deleteOperations(did) {
    const db = loadDb();
    const suffix = did.split(':').pop();

    if (db.dids[suffix]) {
        delete db.dids[suffix];
        writeDb(db);
    }
}

export async function getAllKeys() {
    const db = loadDb();
    const ids = Object.keys(db.dids);
    return ids;
}