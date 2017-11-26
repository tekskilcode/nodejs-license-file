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
}, (err, licenseFileContent) => {
    console.log(licenseFileContent);
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
    licenseFilePath: 'path/to/file.lic' // You can also use `licenseFile` to pass file as a string
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
    privateKeyPath: 'path/to/key.pem',
    template,
    data: {
        licenseVersion: '1',
        applicationVersion: '1.0.0',
        firstName: 'Name',
        lastName: 'Last Name',
        email: 'some@email.com',
        expirationDate: '12/10/2025'
    }
}, (err, licenseFileContent) => {
    console.log(licenseFileContent);
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
    licenseFilePath: 'path/to/file.lic',
    template
}, (err, data) => {
    console.log(data);
});
```

There is an execution result:
```
{
    valid: true,
    serial: 'oZDqoEr2avwhAqwV4HInq9otNzeBeD/azq2yn2jA ...',
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
