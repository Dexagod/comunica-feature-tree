import {
  ActorRdfResolveHypermediaLinks,
  IActionRdfResolveHypermediaLinks,
  IActorRdfResolveHypermediaLinksOutput,
} from "@comunica/bus-rdf-resolve-hypermedia-links";
import { IActorArgs, IActorTest } from "@comunica/core";
import { evaluate } from "tree-specification-pruning";

/**
 * A comunica Tree RDF Resolve Hypermedia Links Actor.
 */
export class ActorRdfResolveHypermediaLinksTree extends ActorRdfResolveHypermediaLinks {
  constructor(
    args: IActorArgs<
      IActionRdfResolveHypermediaLinks,
      IActorTest,
      IActorRdfResolveHypermediaLinksOutput
    >,
  ) {
    super(args);
  }

  public async test(
    action: IActionRdfResolveHypermediaLinks,
  ): Promise<IActorTest> {
    const props = action.metadata.treeProperties;
    if (!!props && !!props.relations && props.relations.size > 0) {
      return true;
    }
    throw new Error(
      `Actor ${this.name} requires a 'tree:Relation' metadata entry.`,
    );
  }

  public async run(
    action: IActionRdfResolveHypermediaLinks,
  ): Promise<IActorRdfResolveHypermediaLinksOutput> {
    const props = action.metadata.treeProperties;
    const query = action.context.get("@query") || null;
    const urlSet = new Set<string>();
    for (const relation of props.relations.values()) {
      relation["@context"] = props.context || {};
      if (
        !!query &&
        !!(
          relation["tree:path"] &&
          relation["tree:value"] &&
          relation["tree:node"]
        )
      ) {
        const canPrune = await evaluate(query, relation as any);
        if (canPrune) {
          // We can prune this relation
        } else {
          if (relation["tree:node"]) {
            urlSet.add(relation["tree:node"]);
          }
        }
      } else {
        if (relation["tree:node"]) {
          urlSet.add(relation["tree:node"]);
        }
      }
    }
    return { urls: [...Array.from(urlSet)] };
  }
}
