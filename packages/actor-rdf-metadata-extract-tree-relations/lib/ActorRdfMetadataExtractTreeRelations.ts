import {ActorRdfMetadataExtract, IActionRdfMetadataExtract, IActorRdfMetadataExtractOutput} from "@comunica/bus-rdf-metadata-extract";
import {IActorArgs, IActorTest, Logger} from "@comunica/core";
import * as N3 from 'n3';
import {
  fromRdf,
} from "rdf-literal";

import * as RDF from 'rdf-js';
import { defaultContext } from "tree-specification-pruning/dist/Util/Util";
import { NameSpaces } from './NameSpaces';
import { compareURLs } from './Util';

/**
 * A comunica actor to extract the tree metadata from RDF sources
 */
export class ActorRdfMetadataExtractTreeRelations extends ActorRdfMetadataExtract {

  public static readonly TYPE: string = NameSpaces.RDF + 'type';

  protected readonly predicateMapping: Map<string, string> =
    new Map([
      [NameSpaces.TREE + "node", "tree:node"],

      [NameSpaces.TREE + "relation", "tree:relation"],

      [NameSpaces.TREE + "view", "tree:view"],
      [NameSpaces.HYDRA + "view", "tree:view"],
      [NameSpaces.VOID + "subset", "tree:view"],
      [NameSpaces.HYDRA + "entrypoint", "tree:view"],

      [NameSpaces.TREE + "path", "tree:path"],
      [NameSpaces.SHACL + "path", "tree:path"],

      [NameSpaces.TREE + "value", "tree:value"],
      [NameSpaces.HYDRA + "value", "tree:value"],

      [NameSpaces.TREE + "remainingItems", "tree:remainingItems"],
      [NameSpaces.HYDRA + "totalItems", "tree:remainingItems"],

      [NameSpaces.RDFS + "schema", "rdfs:schema"],
    ]);

  protected readonly reversePredicateMapping: Map<string, string> =
  new Map([
    [NameSpaces.DCTERMS + "isPartOf", "tree:view"],
  ]);

  protected readonly typeMapping: Map<string, string> =
    new Map([
      [NameSpaces.TREE + "Collection", "hydra:Collection"],
      [NameSpaces.HYDRA + "Collection", "hydra:Collection"],

      [NameSpaces.TREE + "Node", "tree:Node"],

      [NameSpaces.TREE + "Relation", NameSpaces.TREE + "Relation"],
      [NameSpaces.TREE + "PrefixRelation", NameSpaces.TREE + "PrefixRelation"],
      [NameSpaces.TREE + "SubstringRelation", NameSpaces.TREE + "SubstringRelation"],
      [NameSpaces.TREE + "GreaterThanRelation", NameSpaces.TREE + "GreaterThanRelation"],
      [NameSpaces.TREE + "GreaterOrEqualThanRelation", NameSpaces.TREE + "GreaterOrEqualThanRelation"],
      [NameSpaces.TREE + "LessThanRelation", NameSpaces.TREE + "LessThanRelation"],
      [NameSpaces.TREE + "LesserThanRelation", NameSpaces.TREE + "LessThanRelation"],
      [NameSpaces.TREE + "LessOrEqualThanRelation", NameSpaces.TREE + "LessOrEqualThanRelation"],
      [NameSpaces.TREE + "LesserOrEqualThanRelation", NameSpaces.TREE + "LessOrEqualThanRelation"],
      [NameSpaces.TREE + "EqualThanRelation", NameSpaces.TREE + "EqualThanRelation"],
      [NameSpaces.TREE + "GeospatiallyContainsRelation", NameSpaces.TREE + "GeospatiallyContainsRelation"],
      [NameSpaces.TREE + "InBetweenRelation", NameSpaces.TREE + "InBetweenRelation"],
    ]);

  constructor(args: IActorArgs<IActionRdfMetadataExtract, IActorTest, IActorRdfMetadataExtractOutput>) {
    super(args);
  }

  public async test(action: IActionRdfMetadataExtract): Promise<IActorTest> {
    return true;
  }

  /**
   * Collect all tree properties from a given metadata stream
   * in a nice convenient nested hash (property / subject / objects).
   * @param {RDF.Stream} metadata
   * @return The collected tree properties.
   */
  public getTreeProperties(metadata: RDF.Stream): Promise<{ "collections": Map<string, Collection>, "nodes": Map<string, Node>, "relations": Map<string, Relation> }> {
    return new Promise((resolve, reject) => {
      const data = [];
      const collections: Map<string, Collection> = new Map();
      const nodes: Map<string, Node> = new Map();
      const relations: Map<string, Relation> = new Map();
      const treeMetadata: Map<string, any> = new Map();
      metadata.on('error', reject);
      // Collect all tree properties in a nice convenient nested hash (property / subject / objects).
      metadata.on('data', (quad: N3.Quad) => {
        data.push(quad);
        if (compareURLs(quad.predicate.value, ActorRdfMetadataExtractTreeRelations.TYPE)) {
          // Check for relation type
          const resultingType = this.typeMapping.get(quad.object.value);
          if (resultingType === "hydra:Collection") {
            this.addToObjectInMap(collections, convertBlanknodeTerm(quad.subject), "@type", resultingType);
          } else if (resultingType === "tree:Node") {
            this.addToObjectInMap(nodes, convertBlanknodeTerm(quad.subject), "@type", resultingType);
          } else if (resultingType) {
            this.addToObjectInMap(relations, convertBlanknodeTerm(quad.subject), "@type", resultingType);
          }
        } else {
          // Check for predicates used in TREE specification
          let normalizedPredicateValue = this.predicateMapping.get(quad.predicate.value);
          if (normalizedPredicateValue !== undefined) {
            if (normalizedPredicateValue === 'tree:value') { // We require the datatype of the relation value
              this.addToObjectInMap(treeMetadata, convertBlanknodeTerm(quad.subject), normalizedPredicateValue, quad.object);
            } else {
              this.addToObjectInMap(treeMetadata, convertBlanknodeTerm(quad.subject), normalizedPredicateValue, convertBlanknodeTerm(quad.object));
            }
          }
          normalizedPredicateValue = this.reversePredicateMapping.get(quad.predicate.value);
          if (normalizedPredicateValue !== undefined) {
            this.addToObjectInMap(treeMetadata, convertBlanknodeTerm(quad.object), normalizedPredicateValue, convertBlanknodeTerm(quad.subject));
          }
        }
      });

      metadata.on('end', () => {
        for (const mapping of [collections, nodes, relations]) {
          for (const id of Array.from(mapping.keys())) {
            const obj: any = mapping.get(id);
            let object = treeMetadata.get(id);
            if (!object) { object = obj; }
            object['@id'] = id;
            object['@type'] = Array.isArray(obj['@type']) ? obj['@type'][0] : obj['@type'];

            // The entity has metadata other than the entity type
            if (object) {
              for (const property in object) {
                if (object[property]) {
                  object[property] = Array.isArray(object[property]) &&
                            object[property].length === 1 ? object[property][0] : object[property];
                  object[property] = object[property].termtype &&
                            object[property].termtype === 'Literal' ? fromRdf(object[property]) : object[property];
                }
              }
              if (object["tree:remainingItems"] ) { object["tree:remainingItems"] = parseInt(object["tree:remainingItems"], 10); }
              mapping.set(id, object);
            }
          }
        }
        const treeProperties = {
          collections,
          context: defaultContext,
          nodes,
          relations,
        };
        resolve(treeProperties);
      });
    });
  }

  public async run(action: IActionRdfMetadataExtract): Promise<IActorRdfMetadataExtractOutput> {
    // return this.runWithoutRelationPruning(action);
    const metadata: {[id: string]: any} = {};
    const treeProperties = await this.getTreeProperties(action.metadata);
    // require('lodash.assign')(metadata, this.getLinks(action.url, treeProperties));
    require('lodash.assign')(metadata, { treeProperties } );
    return { metadata };
  }

  /**
   * Helper function to add data to an abject value in a map
   * @param {Map} map 
   * @param {any} subject
   * @param {any} predicate
   * @param {any} value
   */
  private addToObjectInMap(map: Map<any, any>, subject: any, predicate: any, object: any) {
    const obj = map.get(subject);
    if (!obj) {
      map.set(subject, {[predicate]: [object]});
    } else {
      obj[predicate] = obj[predicate] ? obj[predicate].concat(object) : [object];
    }
  }
}

function convertBlanknodeTerm(subject: N3.Term) {
  // differentiate between blank nodes and non-blank nodes
  return subject.termType === 'BlankNode' ? '_:' + subject.value : subject.value;
}

class Collection {
  public "@type": string;
  public "tree:view": string[] | undefined;
  public "rdfs:label": string | undefined;
}

class Node {
  public "@type": string;
  public "tree:relation": string | undefined;
  public "tree:remainingItems": string | number | undefined;
}

class Relation {
  public "@type": string;
  public "tree:value": string | number | undefined;
  public "tree:path": string | undefined;
  public "tree:node": string | undefined;
}
