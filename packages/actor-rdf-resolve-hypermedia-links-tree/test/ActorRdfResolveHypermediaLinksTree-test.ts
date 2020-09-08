import {ActorRdfResolveHypermediaLinks} from "@comunica/bus-rdf-resolve-hypermedia-links";
import {Bus} from "@comunica/core";
import * as N3 from 'n3';
import { defaultContext } from "tree-specification-pruning/dist/Util/Util";
import {ActorRdfResolveHypermediaLinksTree} from "../lib/ActorRdfResolveHypermediaLinksTree";

describe('ActorRdfResolveHypermediaLinksTree', () => {
  let bus;

  beforeEach(() => {
    bus = new Bus({ name: 'bus' });
  });

  describe('The ActorRdfResolveHypermediaLinksTree module', () => {
    it('should be a function', () => {
      expect(ActorRdfResolveHypermediaLinksTree).toBeInstanceOf(Function);
    });

    it('should be a ActorRdfResolveHypermediaLinksTree constructor', () => {
      expect(new (<any> ActorRdfResolveHypermediaLinksTree)({ name: 'actor', bus })).toBeInstanceOf(ActorRdfResolveHypermediaLinksTree);
      expect(new (<any> ActorRdfResolveHypermediaLinksTree)({ name: 'actor', bus })).toBeInstanceOf(ActorRdfResolveHypermediaLinks);
    });

    it('should not be able to create new ActorRdfResolveHypermediaLinksTree objects without \'new\'', () => {
      expect(() => { (<any> ActorRdfResolveHypermediaLinksTree)(); }).toThrow();
    });
  });

  describe('An ActorRdfResolveHypermediaLinksTree instance', () => {
    let actor: ActorRdfResolveHypermediaLinksTree;

    const query = ' \
    SELECT \
      ?s ?o \
    WHERE { \
      ?s <http://www.w3.org/2000/01/rdf-schema#label> ?o. \
      FILTER(strstarts(?o, "test")) \
    } \
    LIMIT 10';

    const followRelation = {
      'tree:node': 'mypage#relationNode',
      'tree:path': 'http://www.w3.org/2000/01/rdf-schema#label',
      'tree:value': N3.DataFactory.literal('test'),
      '@id': 'https://mypage#relation',
      '@type': 'https://w3id.org/tree#PrefixRelation',
    };

    const notFollowRelation = {
      'tree:node': 'mypage#relationNode',
      'tree:path': 'http://www.w3.org/2000/01/rdf-schema#label',
      'tree:value': N3.DataFactory.literal('apple'),
      '@id': 'https://mypage#relation',
      '@type': 'https://w3id.org/tree#PrefixRelation',
    };

    const relationFollowMap = new Map([["mypage#relation", followRelation]]);
    const relationFollowMetadata = {treeProperties: { context: defaultContext, relations : relationFollowMap }};

    const relationNotFollowMap = new Map([["mypage#relation", notFollowRelation]]);
    const relationNotFollowMetadata = {treeProperties: { context: defaultContext, relations : relationNotFollowMap }};

    beforeEach(() => {
      actor = new ActorRdfResolveHypermediaLinksTree({ name: 'actor', bus });
    });

    it('should run for relations that can be pruned', () => {
      const contextMap: any = new Map([['@query', query]]);
      return expect(actor.run({ metadata: relationFollowMetadata, context: contextMap })).resolves.toMatchObject({ urls: ['mypage#relationNode'] });
    });

    it('should run for relations that can\'t be pruned', () => {
      const contextMap: any = new Map([['@query', query]]);
      return expect(actor.run({ metadata: relationNotFollowMetadata, context: contextMap })).resolves.toMatchObject({ urls: [] });
    });

    it('should test with relation metadata present', () => {
      const contextMap: any = new Map([['@query', query]]);
      return expect(actor.test({ metadata: relationFollowMetadata, context: contextMap })).resolves.toBe(true);
    });

    it('should not test without relation metadata', () => {
      return expect(actor.test({ metadata: {}})).rejects
        .toThrow(new Error('Actor actor requires a \'tree:Relation\' metadata entry.'));
    });

    it('should fail on empty metadata relations', () => {
      return expect(actor.test({ metadata: { relations: [] }})).rejects
        .toThrow(new Error('Actor actor requires a \'tree:Relation\' metadata entry.'));
    });

    it('should not prune but add url if context query is null', () => {
      const contextMap: any = new Map([['@query', undefined]]);
      return expect(actor.run({ metadata: relationNotFollowMetadata, context: contextMap })).resolves.toMatchObject({ urls: ['mypage#relationNode'] });
    });

    it('should not prune but add url if tree:value property missing', () => {
      const relation = {
        'tree:node': 'mypage#relationNode',
        'tree:path': 'http://www.w3.org/2000/01/rdf-schema#label',
        '@id': 'https://mypage#relation',
        '@type': 'https://w3id.org/tree#PrefixRelation',
      };
      const contextMap: any = new Map([['@query', query]]);
      return expect(actor.run({ metadata: {treeProperties: { context: defaultContext, relations : new Map([["mypage#relation", relation]]) }}, context: contextMap })).resolves.toMatchObject({ urls: ['mypage#relationNode'] });
    });

    it('should not prune but add url if tree:path property missing', () => {
      const relation = {
        'tree:node': 'mypage#relationNode',
        'tree:value': N3.DataFactory.literal('apple'),
        '@id': 'https://mypage#relation',
        '@type': 'https://w3id.org/tree#PrefixRelation',
      };
      const contextMap: any = new Map([['@query', query]]);
      return expect(actor.run({ metadata: {treeProperties: { context: defaultContext, relations : new Map([["mypage#relation", relation]]) }}, context: contextMap })).resolves.toMatchObject({ urls: ['mypage#relationNode'] });
    });

  });
});
