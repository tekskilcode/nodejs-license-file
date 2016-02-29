/*
 * license-key
 * https://github.com/bushev/nodejs-license-file
 *
 * Copyright (c) 2016 Yuriy Bushev
 * Licensed under the MIT license.
 */

'use strict';

/**
 * Core fs module
 *
 * @type {exports|module.exports}
 */
import fs from 'fs';

/**
 * Core path module
 *
 * @type {posix|exports|module.exports}
 */
import path from 'path';

/**
 * Core crypto module
 *
 * @type {exports|module.exports}
 */
import crypto from 'crypto';

/**
 * Template library
 *
 * @type {exports|module.exports}
 */
import mustache from 'mustache';

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
     * @param options.privateKeyPath {string} - path to private key
     * @param [options.template] - custom license file template
     * @param callback {function} - callback function
     */
    static generate(options, callback) {

        if (!options.data) {
            return callback(new Error('LicenseFile::generate: options.data is required'));
        }

        if (typeof options.privateKeyPath != 'string') {
            return callback(new Error('LicenseFile::generate: options.privateKeyPath is required'));
        }

        if (typeof callback != 'function') {
            return callback(new Error('LicenseFile::parse: callback is required'));
        }

        let template = (typeof options.template == 'string') ? options.template : defaultTemplate;

        let serial = LicenseFile._generateSerial(options);

        if (typeof options.data == 'string') {
            options.data = {string: options.data};
        }

        options.data.serial = serial;

        callback(null, mustache.render(template, options.data));
    }

    /**
     * Parse license file
     *
     * @param options
     * @param options.publicKeyPath {string} - path to public key
     * @param options.fileData {string} - license file content
     * @param [options.fileParseFnc] {function} - file parse function
     * @param callback
     */
    static parse(options, callback) {

        if (typeof options.publicKeyPath != 'string') {
            return callback(new Error('LicenseFile::parse: options.publicKeyPath is required'));
        }

        if (typeof options.fileData != 'string') {
            return callback(new Error('LicenseFile::parse: options.fileData is required'));
        }

        if (typeof options.fileParseFnc != 'function') {
            options.fileParseFnc = LicenseFile._defaultFileParseFnc;
        }

        if (typeof callback != 'function') {
            return callback(new Error('LicenseFile::parse: callback is required'));
        }

        options.fileParseFnc(options.fileData, (err, parsedData) => {
            if (err) return callback(err);

            let data   = parsedData.data;
            let verify = crypto.createVerify('RSA-SHA256');

            if (typeof data == 'object') {
                data = JSON.stringify(data);
            }

            verify.update(data);

            let valid = verify.verify(fs.readFileSync(options.publicKeyPath), parsedData.serial, 'base64');

            callback(null, {valid: valid, serial: parsedData.serial, data: parsedData.data});
        });
    }

    /**
     *
     * @param options
     * @param options.data
     * @param options.privateKeyPath
     * @private
     */
    static _generateSerial(options) {

        const sign        = crypto.createSign('RSA-SHA256');
        let data          = options.data;
        const private_key = fs.readFileSync(options.privateKeyPath);

        if (typeof options.data == 'object') {
            data = JSON.stringify(options.data);
        }

        sign.update(data);

        return sign.sign(private_key, 'base64');
    }

    static _defaultFileParseFnc(fileData, callback) {

        let dataLines = fileData.split('\n');

        if (dataLines.length != 4) {
            return callback(new Error('LicenseFile::_defaultFileParseFnc: License file must have 4 lines'));
        }

        let data   = dataLines[1];
        let serial = dataLines[2];

        callback(null, {serial: serial, data: data});
    }
}

/**
 * Export LicenseFile Class
 *
 * @type {LicenseFile}
 */
export default LicenseFile;
