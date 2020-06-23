import {ActorRdfResolveHypermediaLinks} from "@comunica/bus-rdf-resolve-hypermedia-links";
import {Bus} from "@comunica/core";
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

    let relation = {
      '@id': 'mypage#relation',
      '@type': 'tree:Relation',
      'tree:node': 'mypage#relationNode',
      'tree:value': 'relationValue',
      'tree:path': 'http://example.com/relationPath'
    }

    let relationMetadata = new Map()
    relationMetadata.set("mypage#relation", relation)

    beforeEach(() => {
      actor = new ActorRdfResolveHypermediaLinksTree({ name: 'actor', bus });
    });


    it('should run', () => {
      return expect(actor.run({ metadata: { relations: relationMetadata }})).resolves.toMatchObject({ urls: ['mypage#relationNode'] });
    });

    it('should not test without relation metadata', () => {
      return expect(actor.test({ metadata: {}})).rejects
        .toThrow(new Error('Actor actor requires a \'tree:Relation\' metadata entry.'));
    });

    it('should fail on empty metadata relations', () => {
      return expect(actor.test({ metadata: { relations: [] }})).rejects
        .toThrow(new Error('Actor actor requires a \'tree:Relation\' metadata entry.'));
    });

    // it('should fail on empty metadata relations', () => {
    //   return expect(actor.test({ metadata: { relations: [] }})).resolves.toBeFalsy();
    // });


  });
});
