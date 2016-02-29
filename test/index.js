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
 * Core crypto module
 *
 * @type {exports|module.exports}
 */
const crypto = require('crypto');

/**
 * LicenseFile module
 *
 * @type {Generator|exports|module.exports}
 */
const licenseFile = require('../lib');

const LICENSE_VERSION = 1;
const EMAIL           = 'some@email.com';

describe('Generate license file', function () {

    it('with default template', function (done) {
        licenseFile.generate({
            privateKeyPath: 'test/keys/key.pem',
            data: 'data string'
        }, function (err, fileData) {
            should.equal(err, null);

            fileData.should.match(/^====BEGIN LICENSE====\ndata string\n(.*)\n=====END LICENSE=====$/);

            fs.writeFileSync('test/1.lic', fileData, 'utf8');

            done()
        });
    });

    it('with custom template', function (done) {

        let template = [
            '====BEGIN LICENSE====',
            '{{&licenseVersion}}',
            '{{&email}}',
            '{{&serial}}',
            '=====END LICENSE====='
        ].join('\n');

        licenseFile.generate({
            template: template,
            privateKeyPath: 'test/keys/key.pem',
            data: {
                licenseVersion: LICENSE_VERSION,
                email: EMAIL
            }
        }, function (err, fileData) {
            should.equal(err, null);

            let regExp = new RegExp('^====BEGIN LICENSE====\\n' + LICENSE_VERSION + '\\n' + EMAIL + '\\n(.*)\\n=====END LICENSE=====$');

            fileData.should.match(regExp);

            done()
        });
    });
});

describe('Parse license files', function () {

    it('with default template', function (done) {
        licenseFile.parse({
            publicKeyPath: 'test/keys/key.pub',
            fileData: fs.readFileSync('test/1.lic', 'utf8')
        }, function (err, data) {
            should.equal(err, null);

            var verify = crypto.createVerify('RSA-SHA256');

            verify.update('data string');

            let res = verify.verify(fs.readFileSync('test/keys/key.pub'), data.serial, 'base64');

            res.should.be.ok();

            done();
        });
    });
});