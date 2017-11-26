'use strict';

/**
 * Should library
 *
 * @type {should|exports|module.exports}
 */
const should = require('should');

/**
 * Core fs module
 *
 * @type {exports|module.exports}
 */
const fs = require('fs');

/**
 * LicenseFile module
 *
 * @type {Generator|exports|module.exports}
 */
const licenseFile = require('../index');

/**
 * Some constants
 */
const LICENSE_VERSION     = '1';
const APPLICATION_VERSION = '1.0.0';
const FIRST_NAME          = 'First Name';
const LAST_NAME           = 'Last Name';
const EMAIL               = 'some@email.com';
const SOME_NUMBER         = 123;
const EXPIRATION_DATE     = '2025/09/25';

const template = [
    '====BEGIN LICENSE====',
    'Ver: {{&licenseVersion}}',
    '{{&applicationVersion}}',
    '{{&firstName}}',
    '{{&lastName}}',
    '{{&email}} - User E-mail',
    '{{&someNumber}}',
    '{{&expirationDate}}',
    'Serial: {{&serial}}',
    '=====END LICENSE====='
].join('\n');

describe('Generate license file', () => {

    it('with default template', done => {
        licenseFile.generate({
            privateKeyPath: 'test/keys/private_key.pem',
            data: 'data string'
        }, (err, fileData) => {
            should.equal(err, null);

            fileData.should.match(/^====BEGIN LICENSE====\ndata string\n(.*)\n=====END LICENSE=====$/);

            fs.writeFileSync('test/1.lic', fileData, 'utf8');

            done()
        });
    });

    it('with default template (with kew string)', done => {
        licenseFile.generate({
            privateKey: fs.readFileSync('test/keys/private_key.pem', 'utf8'),
            data: 'data string'
        }, (err, fileData) => {
            should.equal(err, null);

            fileData.should.match(/^====BEGIN LICENSE====\ndata string\n(.*)\n=====END LICENSE=====$/);

            fs.writeFileSync('test/1.lic', fileData, 'utf8');

            done()
        });
    });

    it('with custom template', done => {

        licenseFile.generate({
            template,
            privateKeyPath: 'test/keys/private_key.pem',
            data: {
                licenseVersion: LICENSE_VERSION,
                applicationVersion: APPLICATION_VERSION,
                firstName: FIRST_NAME,
                lastName: LAST_NAME,
                email: EMAIL,
                someNumber: SOME_NUMBER,
                expirationDate: EXPIRATION_DATE
            }
        }, (err, fileData) => {
            should.equal(err, null);

            const regExp = new RegExp('^====BEGIN LICENSE====\\n' +
                'Ver: ' + LICENSE_VERSION + '\\n' +
                APPLICATION_VERSION + '\\n' +
                FIRST_NAME + '\\n' +
                LAST_NAME + '\\n' +
                EMAIL + ' - User E-mail\\n' +
                SOME_NUMBER + '\\n' +
                EXPIRATION_DATE + '\\nSerial: (.*)\\n=====END LICENSE=====$');

            fileData.should.match(regExp);

            fs.writeFileSync('test/2.lic', fileData, 'utf8');

            done()
        });
    });
});

describe('Parse license files', () => {

    it('with default template', done => {
        licenseFile.parse({
            publicKeyPath: 'test/keys/public_key.pem',
            licenseFilePath: 'test/1.lic'
        }, (err, data) => {
            should.equal(err, null);

            data.valid.should.be.ok();
            data.data.should.be.eql('data string');

            done();
        });
    });

    it('with default template (using key string)', done => {
        licenseFile.parse({
            publicKey: fs.readFileSync('test/keys/public_key.pem', 'utf8'),
            licenseFile: fs.readFileSync('test/1.lic', 'utf8')
        }, (err, data) => {
            should.equal(err, null);

            data.valid.should.be.ok();
            data.data.should.be.eql('data string');

            done();
        });
    });

    it('with default template (bad license file)', done => {

        licenseFile.parse({
            publicKeyPath: 'test/keys/public_key.pem',
            licenseFile: fs.readFileSync('test/1.lic', 'utf8').replace(/data string/g, 'another one data string')
        }, (err, data) => {
            should.equal(err, null);

            data.valid.should.not.be.ok();

            done();
        });
    });

    it('with custom template', done => {
        licenseFile.parse({
            template,
            publicKeyPath: 'test/keys/public_key.pem',
            licenseFile: fs.readFileSync('test/2.lic', 'utf8')
        }, (err, data) => {

            should.equal(err, null);

            Object.keys(data).should.deepEqual(['valid', 'serial', 'data']);
            Object.keys(data.data).should.deepEqual(['licenseVersion', 'applicationVersion', 'firstName', 'lastName', 'email', 'someNumber', 'expirationDate']);

            data.valid.should.be.ok();
            data.serial.should.equal('oZDqoEr2avwhAqwV4HInq9otNzeBeD/azq2yadDGLXDeUUQF/e8taKJynPp6yn2jARzwDSjuEwfRkdvX+n5kokMhWz3/1GJyi7Mdggy9+h0JUPmydpJ5hPL+X5Kp0tg/552C7Gfx9wcMh2ifqgRfhwLgTJQkOVWXACyWapchFeCi2jZHkKJqE3ZJTyQdGJINFRt5lRaDZZMCQGz7zBpiJE/86g71L9ziop8ny0EUW3mktmRJKT2WVPIH8Keq4bO+gG4qYUaDxH+syqrH4xHb2ivYkS7d/pgh2TRMbJCwMMrOw93IdmaSSxpOpnPPEykKl6qK7beRxJWbvb4l66zrvA==');
            data.data.licenseVersion.should.be.eql(LICENSE_VERSION);
            data.data.applicationVersion.should.be.eql(APPLICATION_VERSION);
            data.data.firstName.should.be.eql(FIRST_NAME);
            data.data.lastName.should.be.eql(LAST_NAME);
            data.data.email.should.be.eql(EMAIL);
            data.data.someNumber.should.be.eql(SOME_NUMBER.toString());
            data.data.expirationDate.should.be.eql(EXPIRATION_DATE);

            done();
        });
    });

    it('with custom template (bad license file)', done => {

        licenseFile.parse({
            template,
            publicKeyPath: 'test/keys/public_key.pem',
            licenseFile: fs.readFileSync('test/2.lic', 'utf8').replace(/2025\/09\/25/g, '2045/09/25')
        }, (err, data) => {
            should.equal(err, null);

            data.valid.should.not.be.ok();

            done();
        });
    });
})
;

describe('Clean', () => {
    it('license files', done => {
        fs.unlinkSync('test/1.lic');
        fs.unlinkSync('test/2.lic');
        done();
    });
});
