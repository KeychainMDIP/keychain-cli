import { program } from 'commander';
import fs from 'fs';
import * as gatekeeper from './gatekeeper-sdk.js';
import * as keymaster from './keymaster.js';

program
    .version('1.0.0')
    .description('Admin CLI tool')
    .configureHelp({ sortSubcommands: true });

program
    .command('get-dids')
    .description('Fetch all DIDs')
    .action(async () => {
        try {
            const dids = await gatekeeper.getDIDs();
            console.log(JSON.stringify(dids, null, 4));
        }
        catch (error) {
            console.error(error);
        }
    });

program
    .command('export-dids')
    .description('Export all DIDs')
    .action(async () => {
        try {
            const dids = await gatekeeper.getDIDs();
            const data = await gatekeeper.exportDIDs(dids);
            console.log(JSON.stringify(data, null, 4));
        }
        catch (error) {
            console.error(error);
        }
    });

program
    .command('import-dids <file>')
    .description('Import batch of DIDs')
    .action(async (file) => {
        try {
            const contents = fs.readFileSync(file).toString();
            const data = JSON.parse(contents);
            const batch = Object.values(data);

            console.time('importDIDs');
            const { verified, updated, failed } = await gatekeeper.importDIDs(batch);
            console.timeEnd('importDIDs');
            console.log(`* ${verified} verified, ${updated} updated, ${failed} failed`);
        }
        catch (error) {
            console.error(error);
        }
    });

program
    .command('create-batch <registry>')
    .description('Create a batch for a registry')
    .action(async (registry) => {
        try {
            const batch = await gatekeeper.getQueue(registry);
            console.log(JSON.stringify(batch, null, 4));

            if (batch.length > 0) {
                const did = await keymaster.createData(batch);
                console.log(did);
            }
            else {
                console.log('empty batch');
            }
        }
        catch (error) {
            console.error(error);
        }
    });

program
    .command('clear-batch <registry> <batch>')
    .description('Clear a batch from a registry')
    .action(async (registry, batch) => {
        try {
            const queue = await keymaster.resolveAsset(batch);
            console.log(JSON.stringify(queue, null, 4));
            const ok = await gatekeeper.clearQueue(registry, queue);

            if (ok) {
                console.log("Batch cleared");
            }
            else {
                console.log("Error: batch not cleared");
            }
        }
        catch (error) {
            console.error(error);
        }
    });

program
    .command('import-batch <did>')
    .description('Import a batch')
    .action(async (did) => {
        try {
            const batch = await keymaster.resolveAsset(did);
            console.log(JSON.stringify(batch, null, 4));

            console.time('importBatch');
            const { verified, updated, failed } = await gatekeeper.importBatch(batch);
            console.timeEnd('importBatch');
            console.log(`* ${verified} verified, ${updated} updated, ${failed} failed`);
        }
        catch (error) {
            console.error(error);
        }
    });

async function run() {
    await keymaster.start(gatekeeper);
    program.parse(process.argv);
    await keymaster.stop();
}

run();
