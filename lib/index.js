/*
 * nodejs-license-file
 * https://github.com/bushev/nodejs-license-file
 *
 * Copyright (c) 2016 Yury Bushev
 * Licensed under the MIT license.
 */

'use strict';

/**
 * Core fs module
 *
 * @type {exports|module.exports}
 */
const fs = require('fs');

/**
 * Core path module
 *
 * @type {posix|exports|module.exports}
 */
const path = require('path');

/**
 * Core crypto module
 *
 * @type {exports|module.exports}
 */
const crypto = require('crypto');

/**
 * Default license file template
 */
const defaultTemplate = fs.readFileSync(path.resolve(__dirname, '..', 'data', 'default.tpl'), 'utf8');

/**
 * LicenseFile Class
 */
class LicenseFile {

    /**
     *  Generate license file
     *
     * @param options
     * @param options.data {object|string} - data to sign
     * @param [options.privateKeyPath] {string} - path to private key
     * @param [options.privateKey] {string} - private key content
     * @param [options.template] - custom license file template
     * @param callback {function} - callback function
     */
    static generate(options, callback) {

        let privateKey;

        if (!options.data) {
            return callback(new Error('LicenseFile::generate: options.data is required'));
        }

        if (typeof options.privateKey === 'string') {

            privateKey = options.privateKey;

        } else if (typeof options.privateKeyPath === 'string') {

            privateKey = fs.readFileSync(options.privateKeyPath, 'utf8');

        } else {

            return callback(new Error('LicenseFile::generate: privateKeyPath or privateKey is required'));
        }

        if (typeof callback !== 'function') {

            return callback(new Error('LicenseFile::parse: callback is required'));
        }

        const template = (typeof options.template === 'string') ? options.template : defaultTemplate;

        const serial = LicenseFile._generateSerial(Object.assign({}, options, {privateKey}));

        if (typeof options.data === 'string') {

            options.data = {string: options.data};
        }

        options.data.serial = serial;

        callback(null, LicenseFile._render(template, LicenseFile._prepareDataObject(options.data)));
    }

    /**
     * Parse license file
     *
     * @param options
     * @param [options.publicKeyPath] {string} - path to public key
     * @param [options.publicKey] {string} - path to public key
     * @param [options.licenseFilePath] {string} - path to license file
     * @param [options.licenseFile] {string} - license file content
     * @param [options.template] - custom license file template
     * @param callback - callback function
     */
    static parse(options, callback) {

        let publicKey;
        let licenseFile;
        let isDefaultTemplate = false;

        if (typeof options.publicKey === 'string') {

            publicKey = options.publicKey;

        } else if (typeof options.publicKeyPath === 'string') {

            publicKey = fs.readFileSync(options.publicKeyPath, 'utf8');

        } else {

            return callback(new Error('LicenseFile::parse: publicKeyPath or publicKey is required'));
        }

        if (typeof options.licenseFile === 'string') {

            licenseFile = options.licenseFile;

        } else if (typeof options.licenseFilePath === 'string') {

            licenseFile = fs.readFileSync(options.licenseFilePath, 'utf8');

        } else {

            return callback(new Error('LicenseFile::parse: licenseFilePath or licenseFile is required'));
        }

        if (typeof callback !== 'function') {

            return callback(new Error('LicenseFile::parse: callback is required'));
        }

        let template;

        if (typeof options.template === 'string') {

            template = options.template;

        } else {

            template          = defaultTemplate;
            isDefaultTemplate = true;
        }

        const tokens = [];

        const regExpString = template.replace(/{{&(\w+)}}/g, (match, token) => {

            tokens.push(token);

            return '(.*)';
        });

        const result = licenseFile.match(new RegExp(regExpString));

        if (!result) {

            return callback(new Error(`License file corrupted`));
        }

        if (result.length - tokens.length !== 1) {

            return callback(new Error(`License file corrupted, tokens expected: ${tokens.length}, actual: ${result.length - 1}`));
        }

        const dataObj = {
            data: {}
        };

        for (let i = 0; i < tokens.length; i++) {

            if (tokens[i] === 'serial') {

                dataObj[tokens[i]] = result[i + 1];

            } else {

                dataObj['data'][tokens[i]] = result[i + 1];
            }
        }

        const verify = crypto.createVerify('RSA-SHA256');

        let dataObjString;

        if (isDefaultTemplate) {

            dataObjString = dataObj.data.string;

        } else {

            dataObjString = JSON.stringify(dataObj.data);
        }

        verify.update(dataObjString);

        const valid = verify.verify(publicKey, dataObj.serial, 'base64');

        if (isDefaultTemplate) {

            callback(null, {valid: valid, serial: dataObj.serial, data: dataObj.data.string});

        } else {

            callback(null, {valid: valid, serial: dataObj.serial, data: dataObj.data});
        }
    }

    /**
     *
     * @param options
     * @param options.data
     * @param options.privateKey
     * @private
     */
    static _generateSerial(options) {

        const sign = crypto.createSign('RSA-SHA256');
        let data   = options.data;

        if (typeof options.data === 'object') {
            data = JSON.stringify(LicenseFile._prepareDataObject(options.data));
        }

        sign.update(data);

        return sign.sign(options.privateKey, 'base64');
    }

    static _render(template, data) {

        for (let property in data) {

            if (data.hasOwnProperty(property)) {

                const regExp = new RegExp(`{{&${property}}}`, `g`);

                template = template.replace(regExp, data[property]);
            }
        }

        return template;
    }

    static _prepareDataObject(data) {

        const result = {};

        for (let property in data) {

            if (data.hasOwnProperty(property)) {

                result[property] = typeof data[property] === 'string' ? data[property] : data[property] + '';
            }
        }

        return result;
    }
}

/**
 * Export LicenseFile Class
 *
 * @type {LicenseFile}
 */
module.exports = LicenseFile;
