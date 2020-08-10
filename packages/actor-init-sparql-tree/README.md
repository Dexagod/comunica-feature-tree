# Comunica SPARQL TREE

[![npm version](https://badge.fury.io/js/@comunica/actor-init-sparql-tree.svg)](https://www.npmjs.com/package/comunica-actor-init-tree)

This is a comunica engine that can process data fragmented according to the [TREE Specification](https://github.com/TREEcg/specification).
It can either be invoked dynamically using a configuration file, or statically using a pre-compiled configuration file. The latter will be faster to start because the dependency-injection phase can be avoided.

This module is part of the [Comunica framework](https://github.com/comunica/comunica).

## Installation
Comunica requires Node.JS 8.0 or higher and is tested on OSX and Linux.

The easiest way to install the client is by installing it from NPM as follows:

```
$ [sudo] npm install -g @comunica/actor-init-sparql-tree 
```
Alternatively, you can install from the latest GitHub sources. For this, please refer to the README of this repo.


## Execute SPARQL queries
This actor can be used to execute SPARQL queries from the command line, within a Node.JS application, or from within a browser.

### Usage from the command line
```
$ comunica-sparql-tree https://fast-and-slow.osoc.be/data/streetname/prefix 'SELECT ?s ?o WHERE { ?s <http://www.w3.org/2000/01/rdf-schema#label> ?o. FILTER(strstarts(?o, "Gent")) }'
```

The *comunica-sparql-tree* command is equal to executing ```node bin/query.js```.

The dynamic variant of this executable is *comunica-dynamic-sparql-tree*. An alternative config file can be passed via the COMUNICA_CONFIG environment variable.

### Usage within application
The easyest way to create an engine (with default config) is as follows:
```
const newEngine = require('@comunica/actor-init-sparql-tree').newEngine;

const myEngine = newEngine();
```

An engine can also be created dynamically with a custom configuration:
```
const newEngineDynamic = require('@comunica/actor-init-sparql-tree').newEngineDynamic;

const myEngine = await newEngineDynamic({ configResourceUrl: 'path/to/config.json' });
```

With the engine created, you can now use it to call te async ```query(queryString, context)``` method.
Here an example of a function that evaluates a ```SELECT``` query.
```
async function query() { 
  const result = await myEngine.query('SELECT ?s ?o WHERE { ?s <http://www.w3.org/2000/01/rdf-schema#label> ?o. FILTER(strstarts(?o, "Gent")) } LIMIT 50', {
    sources: ['https://fast-and-slow.osoc.be/data/streetname/prefix']
  })
  result.bindingsStream.on('data', (data) => console.log(data.toObject()));
}
query()
```
More information about how queries can be constructed and how the results can be retrieved can be found in the [official comunica repo](https://github.com/comunica/comunica/tree/master/packages/actor-init-sparql#usage-within-application)

### Usage within browser
This engine can run in the browser using Webpack. To create a web-packed version of the engine, run ```yarn run browser``` (when inside the *packages/actor-init-sparql-tree* folder) to create *comunica-browser.js*.

Include this file in your webpage as follows:
```
<script src="path/to/comunica-browser.js"></script>
```
After that, Comunica.newEngine can be called via JavaScript.

```
const myEngine = Comunica.newEngine();
myEngine.query('SELECT ?s ?o WHERE { ?s <http://www.w3.org/2000/01/rdf-schema#label> ?o. FILTER(strstarts(?o, "Gent"))',
  { sources: ['https://fast-and-slow.osoc.be/data/streetname/prefix'] })
  .then(function (result) {
    result.bindingsStream.on('data', function (data) {
      console.log(data.toObject());
    });
  });
```
The browser script is pre-compiled using a config file and can therefore only be invoked dynamically. See the prepare and browser scripts in package.json to compile using a custom config file.