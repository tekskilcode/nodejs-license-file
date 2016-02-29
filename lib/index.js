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
 * Template library
 *
 * @type {exports|module.exports}
 */
const mustache = require('mustache');

/**
 * Merge helper
 *
 * @type {*|exports|module.exports}
 */
const merge = require('merge');

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

        if (typeof options.privateKeyPath != 'string') {
            return callback(new Error('LicenseFile::generate: privateKeyPath is required'));
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
     * @param callback
     */
    static parse(options, callback) {

        if (typeof options.publicKeyPath != 'string') {
            return callback(new Error('LicenseFile::parse: publicKeyPath is required'));
        }

        if (typeof options.fileData != 'string') {
            return callback(new Error('LicenseFile::parse: fileData is required'));
        }

        let dataLines = options.fileData.split('\n');

        if (dataLines.length < 4) {
            return callback(new Error('LicenseFile::parse: fileData corrupted'));
        }

        let serial = dataLines[dataLines.length - 2];

        let data = dataLines.slice(1, dataLines.length - 2).join('\n');

        callback(null, {serial: serial, data: data});
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
        var data          = options.data;
        const private_key = fs.readFileSync(options.privateKeyPath);

        if (typeof options.data == 'object') {
            data = JSON.stringify(options.data);
        }

        sign.update(data);

        return sign.sign(private_key, 'base64');
    }
}

/**
 * Export LicenseFile Class
 *
 * @type {LicenseFile}
 */
module.exports = LicenseFile;