const pkg = require('./package.json');

const fs = require('fs');
const path = require('path');
const https = require('https');

const sqlite3 = require('sqlite3').verbose();

const express = require('express');
const bodyParser = require('body-parser');

const semverCompare = require('semver-compare');

const port = parseInt(process.env.PORT, 10) || 8443;
const dbfile = process.env.DB || path.join(__dirname, 'redmatic-telemetry.db');
const certfile = process.env.CERT || path.join(__dirname, '/server.cert');
const keyfile = process.env.KEY || path.join(__dirname, '/server.key');

const db = new sqlite3.Database(dbfile);
db.exec(fs.readFileSync(path.join(__dirname, '/redmatic-telemetry.sql')).toString());

db.on('error', err => {
    log(err.message);
});

const app = express();
app.use(express.static(path.join(__dirname, 'www')));

app.get('/database', (req, res) => {
    log('get /database');
    res.download(dbfile);
});

app.get('/data', (req, res) => {
    log('get /data');
    const data = {};
    db.serialize(() => {
        db.get('SELECT COUNT(redmatic) AS total FROM installation;', (error, row) => {
            Object.assign(data, row);
        });
        db.all('SELECT product, COUNT(uuid) AS count FROM installation GROUP BY product ORDER BY count DESC;', (error, rows) => {
            data.products = rows.map(o => [o.product, o.count]);
        });
        db.all('SELECT platform, COUNT(uuid) AS count FROM installation GROUP BY platform ORDER BY count DESC;', (error, rows) => {
            data.platforms = rows.map(o => [o.platform, o.count]);
        });
        db.all('SELECT ccu, COUNT(uuid) AS count FROM installation GROUP BY ccu ORDER BY count DESC;', (error, rows) => {
            data.ccuVersions = rows.map(o => [o.ccu, o.count]);
        });
        db.all('SELECT name, COUNT(installation_uuid) AS count FROM node GROUP BY name ORDER BY count DESC;', (error, rows) => {
            data.nodes = rows.filter(o => {
                return (o.name.startsWith('redmatic-') || o.name.startsWith('node-red-'));
            }).map(o => [o.name, o.count]);
        });
        db.all('SELECT redmatic AS version, COUNT(uuid) AS count FROM installation GROUP BY redmatic;', (error, rows) => {
            data.versions = rows.map(o => [o.version, o.count]).sort((a, b) => semverCompare(b[0], a[0]));
            res.json(data);
        });
    });
});

app.post('/', bodyParser.json(), (req, res) => {
    res.send('');
    processData(req.headers, req.body);
});

https.createServer({
    key: fs.readFileSync(keyfile),
    cert: fs.readFileSync(certfile)
}, app).listen(port, function () {
    log(pkg.name, 'listening on', 'https://localhost:' + port);
});

function processData(headers, data) {
    if (
        headers['user-agent'].startsWith('curl/')
        && headers['x-redmatic-uuid'].match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{8}/)
        && data && data.ccu && data.redmatic
    ) {
        const installation = {
            uuid: headers['x-redmatic-uuid'],
            redmatic: data.redmatic,
            ccu: data.ccu.VERSION,
            platform: data.ccu.PLATFORM,
            product: data.ccu.PRODUCT
        };
        delete data['ccu'];
        delete data['redmatic'];
        delete data['node-red'];
        delete data.nodejs;
        delete data.ain2;
        delete data.npm;
        db.get('SELECT redmatic FROM installation WHERE uuid=?;', installation.uuid, (error, res) => {
            if (res) {
                updateData(installation, data);
            } else {
                insertData(installation, data);
            }
        });
    } else {
        log('invalid request');
    }
}

function insertData(inst, nodes) {
    log('insert', JSON.stringify(inst));
    db.serialize(() => {
        db.run('BEGIN TRANSACTION;');
        db.run('INSERT INTO installation (uuid, redmatic, initial, ccu, platform, product, created, counter) VALUES (?,?,?,?,?,?,CURRENT_TIMESTAMP,0);', [inst.uuid, inst.redmatic, inst.redmatic, inst.ccu, inst.platform, inst.product]);
        updateNodes(inst.uuid, nodes);
        db.run('COMMIT;');
    });
}

function updateData(inst, nodes) {
    log('update', inst.uuid);
    db.serialize(() => {
        db.run('BEGIN TRANSACTION;');
        db.run('UPDATE installation SET redmatic=?, ccu=?, platform=?, product=?, updated=CURRENT_TIMESTAMP, counter=counter+1 WHERE uuid=?;', [inst.redmatic, inst.ccu, inst.platform, inst.product, inst.uuid]);
        updateNodes(inst.uuid, nodes);
        db.run('COMMIT;');
    });
}

function updateNodes(uuid, nodes) {
    db.run('DELETE FROM node WHERE installation_uuid=?', uuid);
    Object.keys(nodes).forEach(name => {
        db.run('INSERT INTO node (name, version, installation_uuid) VALUES (?,?,?);', [name, nodes[name], uuid]);
    });
}

function log() {
    const d = new Date();
    const ts = d.getFullYear() + '-' +
        ('0' + (d.getMonth() + 1)).slice(-2) + '-' +
        ('0' + d.getDate()).slice(-2) + ' ' +
        ('0' + d.getHours()).slice(-2) + ':' +
        ('0' + d.getMinutes()).slice(-2) + ':' +
        ('0' + d.getSeconds()).slice(-2) + '.' +
        ('000' + d.getMilliseconds()).slice(-3);
    console.log([ts, ...arguments].join(' '));
}

function exit(signal) {
    process.on(signal, () => {
        log('received', signal);
        db.close(err => {
            log('db.close', err);
            process.exit(0);
        });
    });
}

exit('SIGTERM');
exit('SIGINT');
exit('SIGKILL');
