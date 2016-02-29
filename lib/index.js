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
            return callback(new Error('LicenseFile::generate: ' + options.privateKeyPath));
        }

        let template = (typeof options.template == 'string') ? options.template : defaultTemplate;

        if (typeof options.data == 'string') options.data = {string: options.data};

        let serial = LicenseFile._generateSerial(options);

        callback(null, mustache.render(template, merge(options.data, {serial: serial})));
    }

    static parse() {

    }

    /**
     *
     * @param options
     * @param options.data
     * @param options.privateKeyPath
     * @private
     */
    static _generateSerial(options) {

        const sign = crypto.createSign('RSA-SHA256');

        sign.update(JSON.stringify(options.data));

        const private_key = fs.readFileSync(options.privateKeyPath);

        return sign.sign(private_key, 'base64');
    }
}

function Generator(options) {

    var self = this;

    if (!options || typeof options !== "object" || !Object.keys(options).length) {
        throw new Error("No options are provided!");
    }

    var fileCheck = function (path, str) {
        if (!path) {
            throw new Error("No " + str + " is specified!");
        }
        if (!fs.existsSync(path)) {
            throw new Error(str + " doesn't exist!");
        }
        if (!fs.statSync(path).isFile()) {
            throw new Error(str + " isn't a file!");
        }
    };

    fileCheck(options.privateKeyPath);
    self.privateKeyPath = options.privateKeyPath;

    var opensslPath = options.opensslPath;
    if (opensslPath) {
        fileCheck(opensslPath);
        self.opensslPath = opensslPath;
    }

}

Generator.prototype = {

    privateKeyPath: null,
    opensslPath: "openssl",
    isOpensslChecked: false,
    isOpensslVersionSupported: false,

    generateLicense: function (args, callback) {
        var self         = this,
            signThis     = args.signThis,
            template     = args.template,
            model        = args.model ? args.model : {name: signThis},
            serialFormat = model.serialFormat;

        // checks
        if (!callback) {
            throw new Error("No callback is assigned!");
        }
        if (typeof callback !== "function") {
            throw new Error("No callback is assigned!");
        }
        if (!signThis || typeof signThis !== "string") {
            callback(new Error("Invalid data to be signed!"));
            return;
        }
        if (model && typeof model !== "object") {
            callback(new Error("Model should be an object!"));
            return;
        }
        if (serialFormat !== undefined && typeof serialFormat !== "function") {
            callback(new Error("model.serialFormat should be a function!"));
            return;
        }
        if (template && typeof template !== "string") {
            callback(new Error("Template should be a string!"));
            return;
        }

        // clean model from non-data props
        delete model.serialFormat;

        // should default template be used?
        if (!template) {
            template = template ? template : defaultTemplate;

            // default model props
            model.name = ( model.name !== undefined ) ? model.name : signThis;
        }

        self._checkOpenssl(function (error) {
            if (error) {
                callback(error);
                return;
            }

            self._generateSerial(signThis, function (error, serial) {
                if (error) {
                    callback(error);
                    return;
                }

                model.serial = serialFormat ? serialFormat(serial) : serial;
                callback(null, Mustache.render(template, model));
            });
        });
    },

};

/**
 * Export LicenseFile Class
 *
 * @type {LicenseFile}
 */
module.exports = LicenseFile;