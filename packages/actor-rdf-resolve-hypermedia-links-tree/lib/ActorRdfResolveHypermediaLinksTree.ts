import {ActorRdfResolveHypermediaLinks, IActionRdfResolveHypermediaLinks, IActorRdfResolveHypermediaLinksOutput} from "@comunica/bus-rdf-resolve-hypermedia-links";
import {IActorArgs, IActorTest} from "@comunica/core";
import * as path from 'path';

/**
 * A comunica Tree RDF Resolve Hypermedia Links Actor.
 */
export class ActorRdfResolveHypermediaLinksTree extends ActorRdfResolveHypermediaLinks {

  constructor(args: IActorArgs<IActionRdfResolveHypermediaLinks, IActorTest, IActorRdfResolveHypermediaLinksOutput>) {
    super(args);
  }

  public async test(action: IActionRdfResolveHypermediaLinks): Promise<IActorTest> {
    console.log("testing hypermedia links extraction")
    if ( (action.metadata.nodes !== null && action.metadata.nodes !== undefined && action.metadata.nodes.size > 0) || 
      (action.metadata.relations !== null && action.metadata.relations !== undefined && action.metadata.relations.size > 0) ) {
        return true;
    }
    console.log("Failed hypermedia extraction")
    throw new Error(`Actor ${this.name} requires a 'tree:Relation' metadata entry.`);
  }

  public async run(action: IActionRdfResolveHypermediaLinks): Promise<IActorRdfResolveHypermediaLinksOutput> {

    console.log("resolving hypermedia links", action.metadata)
    // let operation = action.context.get('sparql_query_operation');
    let urlSet = new Set<string>()
    for (let relation of action.metadata.relations.values()){
      let relationPath = relation.path;
      // urlSet.add(relation["tree:node"][0])
      urlSet.add(relation["tree:node"])
    }
    console.log("relations found:", urlSet.size)
    return { urls: [...urlSet] };    
  }
}


class Collection {
  "@id": string;
  "@type": string;
  "tree:view": string[];
  "rdfs:label": string | undefined;
  "tree:remainingItems": string | number | undefined;
}

class Node {
  "@id": string;
  "@type": string;
  "tree:relation": string | undefined;
  "tree:remainingItems": string | number | undefined;
}

class Relation {
  "@id": string;
  "@type": string;
  "tree:value": string | number | undefined; 
  "tree:path": string | undefined;
  "tree:node": string | undefined;
}