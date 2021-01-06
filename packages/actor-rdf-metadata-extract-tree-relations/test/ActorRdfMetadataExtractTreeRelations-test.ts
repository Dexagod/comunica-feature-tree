import {ActorRdfMetadataExtract} from "@comunica/bus-rdf-metadata-extract";
import {Bus} from "@comunica/core";
import * as N3 from 'n3';
import {ActorRdfMetadataExtractTreeRelations} from "../lib/ActorRdfMetadataExtractTreeRelations";
import { NameSpaces } from '../lib/NameSpaces';
const stream = require('streamify-array');
const quad = require('rdf-quad');

const TREE: string = NameSpaces.TREE;
const XSD: string = NameSpaces.XSD;
const HYDRA: string = NameSpaces.HYDRA;
const TYPE: string = NameSpaces.RDF + 'type';
const VOID: string = NameSpaces.VOID;
const DCTERMS: string = NameSpaces.DCTERMS;

const defaultContext = { "@vocab": TREE };

describe('ActorRdfMetadataExtractTreeRelations', () => {
  let bus;
  let context;

  beforeEach(() => {
    bus = new Bus({ name: 'bus' });
    context = new Map([ ["sparql_query", 'Select ?s WHERE {?s ?p ?o} LIMIT 10' ]]);
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
      return expect(actor.run({ context, metadata: stream([
        quad('mypage', HYDRA + 'next', 'next'),
        quad('mypage', HYDRA + 'previous', 'previous'),
        quad('mypage', HYDRA + 'first', 'first'),
        quad('mypage', HYDRA + 'last', 'last'),
        quad('mypage', 'somethingelse', 'somevalue'),
      ]), url: 'mypage'})).resolves.toMatchObject({ metadata: {} });
    });

    it('should run when tree metadata is present', () => {
      return expect(actor.run({ context, metadata: stream([
        quad('mypage#Collection1', TYPE, HYDRA + 'Collection'),
        quad('mypage#Collection1', TREE + 'view', 'mypage#Node1'),
        quad('mypage#Node1', TYPE, TREE + 'Node'),
        quad('mypage#Node1', TREE + 'relation', '_:relation1'),
        quad('_:relation1', TYPE, TREE + 'Relation'),
        quad('_:relation1', TREE + 'value', '"Sint"'),
        quad('_:relation1', TREE + 'path', 'http://example.com/StreetName'),
        quad('_:relation1', TREE + 'node', 'otherpage#Node2'),
        quad('_:relation1', TREE + 'remainingItems', 20),
      ]), url: 'mypage'})).resolves.toEqual(
        {
          metadata: {
            treeMetadata: {
              collections: new Map([
                ['mypage#Collection1', {
                  '@context': defaultContext,
                  "@id": "mypage#Collection1",
                  "@type": [ HYDRA + "Collection" ],
                  "view":  [ { "@id": "mypage#Node1" } ],
                }],
              ]),
              nodes: new Map([
                ['mypage#Node1', {
                  '@context': defaultContext,
                  "@id": "mypage#Node1",
                  "@type": [ TREE + "Node" ],
                  'relation' : [ { "@id": '_:relation1' } ],
                }],
              ]),
              relations: new Map([
                [ '_:relation1' , {
                  '@context': defaultContext,
                  "@id": "_:relation1",
                  '@type' : [ TREE + 'Relation' ],
                  'node' : [ { "@id": 'otherpage#Node2' } ],
                  'path' : [ { "@id": 'http://example.com/StreetName' } ],
                  'remainingItems' : [
                    {
                      "@value": "20",
                      "@type": XSD + "integer",
                    },
                  ],
                  'value': [ {
                    "@type": XSD + "string",
                    "@value": "Sint",
                  } ],
                } ],
              ]),
            },
          },
        });
    });

    it('should run for multiple collections and multiple views', () => {
      return expect(actor.run({ context, metadata: stream([
        quad('mypage#Collection1', TYPE, TREE + 'Collection'),
        quad('mypage#Collection1', TREE + 'view', 'mypage#Node1'),
        quad('mypage#Collection1', HYDRA + 'view', 'mypage#Node2'),
        quad('mypage#Collection2', TYPE, HYDRA + 'Collection'),
        quad('mypage#Collection2', VOID + 'subset', 'mypage#Node3'),
        quad('mypage#Node4', DCTERMS + 'isPartOf', 'mypage#Collection2'),
        // quad('mypage#Collection2', TREE + 'view', 'mypage#Node3'),
        // quad('mypage#Collection2', HYDRA + 'view', 'mypage#Node4'),

        quad('mypage#Node1', TYPE, TREE + 'Node'),
        quad('mypage#Node2', TYPE, TREE + 'Node'),
        quad('mypage#Node3', TYPE, TREE + 'Node'),
        quad('mypage#Node4', TYPE, TREE + 'Node'),
        quad('mypage#Node1', TREE + 'relation', 'mypage#Relation1'),
        quad('mypage#Node3', TREE + 'relation', 'mypage#Relation3'),
        quad('mypage#Relation1', TYPE, TREE + 'Relation'),
        quad('mypage#Relation1', TREE + 'value', '"Sint"'),
        quad('mypage#Relation1', TREE + 'path', 'http://example.com/StreetName'),
        quad('mypage#Relation1', TREE + 'remainingItems', 100),
        quad('mypage#Relation3', TYPE, TREE + 'Relation'),
        quad('mypage#Relation3', TREE + 'value', '"Tech"'),
        quad('mypage#Relation3', TREE + 'path', 'http://example.com/StreetName'),
        quad('mypage#Relation3', TREE + 'remainingItems', 300),
      ]), url: 'mypage'})).resolves.toEqual(
        {
          metadata: {
            treeMetadata: {
              collections: new Map([
                ['mypage#Collection1', {
                  '@context': defaultContext,
                  "@id": "mypage#Collection1",
                  "@type": [ TREE + "Collection" ],
                  "view": [ { "@id": "mypage#Node1" } , { "@id": "mypage#Node2" } ],
                }],
                ['mypage#Collection2', {
                  '@context': defaultContext,
                  "@id": "mypage#Collection2",
                  "@type": [ HYDRA + "Collection" ],
                  "view": [ { "@id": "mypage#Node3"} , { "@id": "mypage#Node4" } ],
                }],
              ]),
              nodes: new Map([
                ['mypage#Node1', {
                  '@context': defaultContext,
                  "@id": "mypage#Node1",
                  "@type": [ TREE + "Node" ],
                  'relation': [ { "@id": 'mypage#Relation1' } ],
                }],
                ['mypage#Node2', {
                  '@context': defaultContext,
                  "@id": "mypage#Node2",
                  "@type": [ TREE + "Node" ],
                }],
                ['mypage#Node3', {
                  '@context': defaultContext,
                  "@id": "mypage#Node3",
                  "@type": [ TREE + "Node" ],
                  'relation': [ { "@id": 'mypage#Relation3' } ],
                }],
                ['mypage#Node4', {
                  '@context': defaultContext,
                  "@id": "mypage#Node4",
                  "@type": [ TREE + "Node" ],
                }],
              ]),
              relations: new Map([
                ['mypage#Relation1', {
                  '@context': defaultContext,
                  "@id": "mypage#Relation1",
                  "@type": [ TREE + "Relation" ],
                  'path' : [ { "@id": 'http://example.com/StreetName' } ],
                  'remainingItems' : [
                    {
                      "@value": "100",
                      "@type": XSD + "integer",
                    },
                  ],
                  'value': [ {
                    "@value": 'Sint',
                    "@type": "http://www.w3.org/2001/XMLSchema#string",
                  } ],
                }],
                ['mypage#Relation3', {
                  '@context': defaultContext,
                  "@id": "mypage#Relation3",
                  "@type": [ TREE + "Relation" ],
                  'path' : [ { "@id": 'http://example.com/StreetName' } ],
                  'remainingItems' : [
                    {
                      "@value": "300",
                      "@type": XSD + 'integer',
                    },
                  ],
                  'value': [ {
                    "@value": 'Tech',
                    "@type": "http://www.w3.org/2001/XMLSchema#string",
                  } ],
                }],
              ]),
            },
          },
        });
    });

    it('should run for sequence paths', () => {
      return expect(actor.run({ context, metadata: stream([
        quad('mypage#Relation1', TYPE, TREE + 'Relation'),
        quad('mypage#Relation1', TREE + 'node', 'mypage#Node2'),
        quad('mypage#Relation1', TREE + 'value', '"Sint"'),
        quad('mypage#Relation1', TREE + 'path', 'http://example.com/firstpart'),
      ]), url: 'mypage' })).resolves.toEqual(
        {
          metadata: {
            treeMetadata: {
              collections: new Map(),
              nodes: new Map(),
              relations: new Map([
                ['mypage#Relation1', {
                  '@context': defaultContext,
                  "@id": "mypage#Relation1",
                  '@type': [ TREE + 'Relation' ],
                  'node': [ { "@id": 'mypage#Node2' } ],
                  'path': [ { "@id": 'http://example.com/firstpart' } ],
                  'value': [ {
                    "@value": "Sint",
                    "@type": "http://www.w3.org/2001/XMLSchema#string",
                  } ],
                }],
              ]),
            },
          },
        });
    });

    // it('should run for alternative paths', () => {})

    // it('should run for inverse paths', () => {})

    // it('should run for multiple collections and multiple nodes', () => {})
  });
});
