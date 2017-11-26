## nodejs-license-file [![Build Status](https://travis-ci.org/bushev/nodejs-license-file.svg?branch=master)](https://travis-ci.org/bushev/nodejs-license-file)

A lightweight (Zero dependency) License file generator and parser for NodeJS.

## Generate a keypair using OpenSSL

1. Generate an RSA 2048 bit private key

    `openssl genpkey -algorithm RSA -out private_key.pem -pkeyopt rsa_keygen_bits:2048`

2. Extract the public key from an RSA keypair

    `openssl rsa -pubout -in private_key.pem -out public_key.pem`

## Basic usage

### Getting started

Install nodejs-license-file with:
```
npm install nodejs-license-file --save
```

### Generating license file

```javascript
const licenseFile = require('nodejs-license-file');

licenseFile.generate({
   privateKeyPath: 'path/to/key.pem', // You can also use `privateKey` to pass key as a string
   data: 'data string'
}, (err, fileData) => {
    console.log(fileData);
});
```

This will produce a license key, which uses the default template and will look similar to this:
```
====BEGIN LICENSE====
data string
xxxxxxxxxxxxxxxxxxxxx
=====END LICENSE=====
```

### Parse and verify license file

```javascript
const licenseFile = require('nodejs-license-file');

licenseFile.parse({
    publicKeyPath: 'path/to/key.pub', // You can also use `publicKey` to pass key as a string
    fileData: fs.readFileSync('path/to/file.lic', 'utf8')
}, (err, data) => {
    console.log(data);
});
```

There is an execution result:
```
{
   valid: true,
   data: 'data string'
}
```

## Advanced usage with custom template

### Generating license file

```javascript
const licenseFile = require('nodejs-license-file');

let template = [
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
    privateKeyPath: 'path/to/key.pem',
    template: template,
    data: {
        licenseVersion: '1',
        applicationVersion: '1.0.0',
        firstName: 'Name',
        lastName: 'Last Name',
        email: 'some@email.com',
        expirationDate: '12/10/2025'
    }
}, (err, fileData) => {
    console.log(fileData);
});
```

This will produce a license key, which uses the default template and will look similar to this:
```
====BEGIN LICENSE====
1
1.0.0
Name
Last Name
some@email.com
12/10/2025
xxxxxxxxxxxxxxxxxxxxx
=====END LICENSE=====
```

## Parse and verify license file

```javascript
const licenseFile = require('nodejs-license-file');

licenseFile.parse({
    publicKeyPath: 'path/to/key.pub',
    fileData: fs.readFileSync('path/to/file.lic', 'utf8'),
    fileParseFnc: (fileData, callback) => {
        let dataLines = fileData.split('\n');

        if (dataLines.length !== 9) {
            return callback(new Error('LicenseFile::fileParseFnc: License file must have 9 lines, actual: ' + dataLines.length));
        }

        let licenseVersion     = dataLines[1];
        let applicationVersion = dataLines[2];
        let firstName          = dataLines[3];
        let lastName           = dataLines[4];
        let email              = dataLines[5];
        let expirationDate     = dataLines[6];
        let serial             = dataLines[7];

        callback(null, {
            serial: serial,
            data: {
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
    console.log(data);
});
```

There is an execution result:
```
{
    valid: true,
    data: {
        licenseVersion: '1',
        applicationVersion: '1.0.0',
        firstName: 'Name',
        lastName: 'Last Name',
        email: 'some@email.com',
        expirationDate: '12/10/2025'
    }
}
```

NOTICE: All numeric data will be converted to strings after parsing. You need to take care of a parsed data types.
