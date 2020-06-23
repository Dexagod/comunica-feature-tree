import {ActorRdfMetadataExtract} from "@comunica/bus-rdf-metadata-extract";
import {Bus} from "@comunica/core";
import {ActorRdfMetadataExtractTreeRelations} from "../lib/ActorRdfMetadataExtractTreeRelations";
const stream = require('streamify-array');
const quad = require('rdf-quad');

const TREE: string = 'w3id.org/tree#';
const HYDRA: string = 'w3.org/ns/hydra/core#';
const TYPE: string = 'w3.org/1999/02/22-rdf-syntax-ns#type';
const VOID: string = 'rdfs.org/ns/void#';
const DCTERMS: string = 'purl.org/dc/terms/';

describe('ActorRdfMetadataExtractTreeRelations', () => {
  let bus;

  beforeEach(() => {
    bus = new Bus({ name: 'bus' });
  });

  describe('The ActorRdfMetadataExtractTreeRelations module', () => {
    it('should be a function', () => {
      expect(ActorRdfMetadataExtractTreeRelations).toBeInstanceOf(Function);
    });

    it('should be a ActorRdfMetadataExtractTreeRelations constructor', () => {
      expect(new (<any> ActorRdfMetadataExtractTreeRelations)({ name: 'actor', bus })).toBeInstanceOf(ActorRdfMetadataExtractTreeRelations);
      expect(new (<any> ActorRdfMetadataExtractTreeRelations)({ name: 'actor', bus })).toBeInstanceOf(ActorRdfMetadataExtract);
    });

    it('should not be able to create new ActorRdfMetadataExtractTreeRelations objects without \'new\'', () => {
      expect(() => { (<any> ActorRdfMetadataExtractTreeRelations)(); }).toThrow();
    });
  });

  describe('An ActorRdfMetadataExtractTreeRelations instance', () => {
    let actor: ActorRdfMetadataExtractTreeRelations;

    beforeEach(() => {
      actor = new ActorRdfMetadataExtractTreeRelations({ name: 'actor', bus });
    });

    it('should test', () => {
      return expect(actor.test({ url: '', metadata: stream([]) })).resolves.toBeTruthy();
    });

    it('should run when no tree metadata is present', () => {
      return expect(actor.run({ metadata: stream([
        quad('mypage', HYDRA + 'next', 'next'),
        quad('mypage', HYDRA + 'previous', 'previous'),
        quad('mypage', HYDRA + 'first', 'first'),
        quad('mypage', HYDRA + 'last', 'last'),
        quad('mypage', 'somethingelse', 'somevalue'),
      ]), url: 'mypage' })).resolves.toMatchObject({ metadata: {} });
    })

    it('should run when tree metadata is present', () => {
      return expect(actor.run({ metadata: stream([
        quad('mypage#Collection1', TYPE, HYDRA + 'Collection'),
        quad('mypage#Collection1', TREE + 'view', 'mypage#Node1'),
        quad('mypage#Node1', TYPE, TREE+'Node'),
        quad('mypage#Node1', TREE + 'remainingItems', 100),
        quad('mypage#Node1', TREE + 'relation', '_:relation1'),
        quad('_:relation1', TYPE, TREE+'Relation'),
        quad('_:relation1', TREE + 'value', 'Sint'),
        quad('_:relation1', TREE + 'path', 'http://example.com/StreetName'),
        quad('_:relation1', TREE + 'node', 'otherpage#Node2'),
        quad('_:relation1', TREE + 'remainingItems', 20),
      ]), url: 'mypage' })).resolves.toEqual(
        { 
          metadata: {
            'collections': new Map([
              ['mypage#Collection1', {
                "@id": "mypage#Collection1",
                "@type": "hydra:Collection",
                "tree:view": "mypage#Node1"
              }]
            ]),
            'nodes': new Map([
              ['mypage#Node1', {
                "@id": "mypage#Node1",
                "@type": "tree:Node",
                'tree:remainingItems' : 100,
                'tree:relation' : '_:relation1'
              }]
            ]),
            'relations': new Map([
              [ '_:relation1' , {
                "@id": "_:relation1",
                '@type' : 'tree:Relation',
                'tree:remainingItems' : 20,
                'tree:value' : 'Sint',
                'tree:path' : 'http://example.com/StreetName',
                'tree:node' : 'otherpage#Node2'
              }]
            ]),
          }
        });
    })

    it('should run for multiple collections and multiple views', () => {
      return expect(actor.run({ metadata: stream([
        quad('mypage#Collection1', TYPE, HYDRA + 'Collection'),
        quad('mypage#Collection1', TREE + 'view', 'mypage#Node1'),
        quad('mypage#Collection1', HYDRA + 'view', 'mypage#Node2'),
        quad('mypage#Collection2', TYPE, HYDRA + 'Collection'),
        quad('mypage#Collection2', VOID + 'subset', 'mypage#Node3'),
        quad('mypage#Node4', DCTERMS + 'isPartOf', 'mypage#Collection2'),
        quad('mypage#Node1', TYPE, TREE+'Node'),
        quad('mypage#Node2', TYPE, TREE+'Node'),
        quad('mypage#Node3', TYPE, TREE+'Node'),
        quad('mypage#Node4', TYPE, TREE+'Node'),
        quad('mypage#Node1', TREE+'relation', 'mypage#Relation1'),
        quad('mypage#Node3', TREE+'relation', 'mypage#Relation3'),
        quad('mypage#Relation1', TYPE, TREE+'Relation'),
        quad('mypage#Relation1', TREE + 'value', 'Sint'),
        quad('mypage#Relation1', TREE + 'path', 'http://example.com/StreetName'),
        quad('mypage#Relation1', TREE + 'remainingItems', "100^^http://www.w3.org/2001/XMLSchema#integer"),
        quad('mypage#Relation3', TYPE, TREE+'Relation'),
        quad('mypage#Relation3', TREE + 'value', 'Tech'),
        quad('mypage#Relation3', TREE + 'path', 'http://example.com/StreetName'),
        quad('mypage#Relation3', TREE + 'remainingItems', "300^^http://www.w3.org/2001/XMLSchema#integer"),
      ]), url: 'mypage' })).resolves.toEqual(
        { 
          metadata: {
            'collections': new Map([
              ['mypage#Collection1', {
                "@id": "mypage#Collection1",
                "@type": "hydra:Collection",
                "tree:view": [ "mypage#Node1", "mypage#Node2" ],
              }],
              ['mypage#Collection2', {
                "@id": "mypage#Collection2",
                "@type": "hydra:Collection",
                "tree:view": [ "mypage#Node3", "mypage#Node4" ],
              }] 
            ]),
            'nodes': new Map([
              ['mypage#Node1', {
                "@id": "mypage#Node1",
                "@type": "tree:Node",
                'tree:relation': 'mypage#Relation1'
              }], 
              ['mypage#Node2', {
                "@id": "mypage#Node2",
                "@type": "tree:Node",
              }], 
              ['mypage#Node3', {
                "@id": "mypage#Node3",
                "@type": "tree:Node",
                'tree:relation': 'mypage#Relation3'
              }],
              ['mypage#Node4', {
                "@id": "mypage#Node4",
                "@type": "tree:Node",
              }]
            ]),
            'relations': new Map([
              ['mypage#Relation1', {
                "@id": "mypage#Relation1",
                "@type": "tree:Relation",
                'tree:value' : 'Sint',
                'tree:path' : 'http://example.com/StreetName',
                'tree:remainingItems' : 100,
              }],
              ['mypage#Relation3', {
                "@id": "mypage#Relation3",
                "@type": "tree:Relation",
                'tree:value' : 'Tech',
                'tree:path' : 'http://example.com/StreetName',
                'tree:remainingItems' : 300,
              }],
            ]),
          }
        });
      })

    it('should run for sequence paths', () => {
      return expect(actor.run({ metadata: stream([
        quad('mypage#Relation1', TYPE, TREE+'Relation'),
        quad('mypage#Relation1', TREE + 'node', 'mypage#Node2'),
        quad('mypage#Relation1', TREE + 'value', 'Sint'),
        quad('mypage#Relation1', TREE + 'path', 'http://example.com/firstpart'),
      ]), url: 'mypage' })).resolves.toEqual(
        { 
          metadata: {
            'collections': new Map(),
            'nodes': new Map(),
            'relations': new Map([
              ['mypage#Relation1', {
                "@id": "mypage#Relation1",
                '@type': 'tree:Relation',
                'tree:value': 'Sint',
                'tree:path': 'http://example.com/firstpart',
                'tree:node': 'mypage#Node2'
              }]
            ]),
          }
        });
    })

    // it('should run for alternative paths', () => {})

    // it('should run for inverse paths', () => {})

    // it('should run for multiple collections and multiple nodes', () => {})
  });
});
