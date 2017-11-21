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
const EXPIRATION_DATE     = '2025/09/25';

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

    it('with custom template', done => {

        const template = [
            '====BEGIN LICENSE====',
            '{{&licenseVersion}}',
            '{{&applicationVersion}}',
            '{{&firstName}}',
            '{{&lastName}}',
            '{{&email}}',
            '{{&expirationDate}}',
            '{{&serial}}',
            '=====END LICENSE====='
        ].join('\n');

        licenseFile.generate({
            template: template,
            privateKeyPath: 'test/keys/private_key.pem',
            data: {
                licenseVersion: LICENSE_VERSION,
                applicationVersion: APPLICATION_VERSION,
                firstName: FIRST_NAME,
                lastName: LAST_NAME,
                email: EMAIL,
                expirationDate: EXPIRATION_DATE
            }
        }, (err, fileData) => {
            should.equal(err, null);

            const regExp = new RegExp('^====BEGIN LICENSE====\\n' +
                LICENSE_VERSION + '\\n' +
                APPLICATION_VERSION + '\\n' +
                FIRST_NAME + '\\n' +
                LAST_NAME + '\\n' +
                EMAIL + '\\n' +
                EXPIRATION_DATE + '\\n(.*)\\n=====END LICENSE=====$');

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
            fileData: fs.readFileSync('test/1.lic', 'utf8')
        }, (err, data) => {
            should.equal(err, null);

            data.valid.should.be.ok();
            data.data.should.be.eql('data string');

            done();
        });
    });

    it('with default template (bad license file)', done => {

        const fileData = fs.readFileSync('test/1.lic', 'utf8').replace(/data string/g, 'another one data string');

        licenseFile.parse({
            publicKeyPath: 'test/keys/public_key.pem',
            fileData: fileData
        }, (err, data) => {
            should.equal(err, null);

            data.valid.should.not.be.ok();

            done();
        });
    });

    it('with custom template', done => {
        licenseFile.parse({
            publicKeyPath: 'test/keys/public_key.pem',
            fileData: fs.readFileSync('test/2.lic', 'utf8'),
            fileParseFnc: (fileData, callback) => {
                const dataLines = fileData.split('\n');

                if (dataLines.length !== 9) {
                    return callback(new Error('LicenseFile::fileParseFnc: License file must have 5 lines, actual: ' + dataLines.length));
                }

                const licenseVersion     = dataLines[1];
                const applicationVersion = dataLines[2];
                const firstName          = dataLines[3];
                const lastName           = dataLines[4];
                const email              = dataLines[5];
                const expirationDate     = dataLines[6];
                const serial             = dataLines[7];

                callback(null, {
                    serial: serial, data: {
                        licenseVersion: licenseVersion,
                        applicationVersion: applicationVersion,
                        firstName: firstName,
                        lastName: lastName,
                        email: email,
                        expirationDate: expirationDate
                    }
                });
            }
        }, (err, data) => {
            should.equal(err, null);

            data.valid.should.be.ok();
            data.data.licenseVersion.should.be.eql(LICENSE_VERSION);
            data.data.applicationVersion.should.be.eql(APPLICATION_VERSION);
            data.data.firstName.should.be.eql(FIRST_NAME);
            data.data.lastName.should.be.eql(LAST_NAME);
            data.data.email.should.be.eql(EMAIL);
            data.data.expirationDate.should.be.eql(EXPIRATION_DATE);

            done();
        });
    });

    it('with custom template (bad license file)', done => {

        const fileData = fs.readFileSync('test/2.lic', 'utf8').replace(/2025\/09\/25/g, '2045/09/25');

        licenseFile.parse({
            publicKeyPath: 'test/keys/public_key.pem',
            fileData: fileData,
            fileParseFnc: (fileData, callback) => {
                let dataLines = fileData.split('\n');

                if (dataLines.length !== 9) {
                    return callback(new Error('LicenseFile::fileParseFnc: License file must have 5 lines, actual: ' + dataLines.length));
                }

                const licenseVersion     = dataLines[1];
                const applicationVersion = dataLines[2];
                const firstName          = dataLines[3];
                const lastName           = dataLines[4];
                const email              = dataLines[5];
                const expirationDate     = dataLines[6];
                const serial             = dataLines[7];

                callback(null, {
                    serial: serial, data: {
                        licenseVersion: licenseVersion,
                        applicationVersion: applicationVersion,
                        firstName: firstName,
                        lastName: lastName,
                        email: email,
                        expirationDate: expirationDate
                    }
                });
            }
        }, (err, data) => {
            should.equal(err, null);

            data.valid.should.not.be.ok();

            done();
        });
    });
});

describe('Clean', () => {
    it('license files', done => {
        fs.unlinkSync('test/1.lic');
        fs.unlinkSync('test/2.lic');
        done();
    });
});
