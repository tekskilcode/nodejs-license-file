'use strict';

/**
 * Assert library
 *
 * @type {ok|exports|module.exports}
 */
const assert = require('assert');

/**
 * Should library
 *
 * @type {should|exports|module.exports}
 */
const should = require('should');

/**
 * LicenseFile module
 *
 * @type {Generator|exports|module.exports}
 */
const licenseFile = require('../lib');

const LICENSE_VERSION = 1;
const EMAIL           = 'some@email.com';

describe('Generate license files', function () {

    it('Generate license file', function (done) {
        licenseFile.generate({
            privateKeyPath: 'test/keys/key.pem',
            data: 'Some data here'
        }, function (err, fileData) {
            assert.equal(null, err);

            fileData.should.match(/^====BEGIN LICENSE====\nSome data here\n(.*)\n=====END LICENSE=====$/);

            done()
        });
    });

    it('Generate license file with custom template', function (done) {

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
            assert.equal(null, err);

            let regExp = new RegExp('^====BEGIN LICENSE====\n' + LICENSE_VERSION + '\n' + EMAIL + '\n(.*)\n=====END LICENSE=====$');

            fileData.should.match(regExp);

            done()
        });
    });
});

describe('Parse license files', function () {

});