import {ActorRdfMetadataExtract, IActionRdfMetadataExtract, IActorRdfMetadataExtractOutput} from "@comunica/bus-rdf-metadata-extract";
import {IActorArgs, IActorTest} from "@comunica/core";
import * as RDF from 'rdf-js';
import * as N3 from 'n3'
import {
  fromRdf,
} from "rdf-literal";

/**
 * A comunica actor to extract the tree metadata from RDF sources
 */
export class ActorRdfMetadataExtractTreeRelations extends ActorRdfMetadataExtract {

  public static readonly TREE: string = 'w3id.org/tree#';
  public static readonly SHACL: string = 'w3.org/ns/shacl#';
  public static readonly HYDRA: string = 'w3.org/ns/hydra/core#';
  public static readonly RDF: string = 'w3.org/1999/02/22-rdf-syntax-ns#';
  public static readonly RDFS: string = 'w3.org/2000/01/rdf-schema#';
  public static readonly VOID: string = 'rdfs.org/ns/void#';
  public static readonly DCTERMS: string = 'purl.org/dc/terms/';

  public static readonly TYPE: string = 'w3.org/1999/02/22-rdf-syntax-ns#type';

  protected readonly JSONLDContext = {
      "rdf": "https://www.w3.org/1999/02/22-rdf-syntax-ns#",
      "rdfs": "https://www.w3.org/2000/01/rdf-schema#",
      "hydra": "https://www.w3.org/ns/hydra/core#",
      "tree": "https://w3id.org/tree#",
      "shacl": "https://www.w3.org/ns/shacl#",
  }                                     

  protected readonly predicate_mapping: Map<string, string> = 
    new Map([
      [ActorRdfMetadataExtractTreeRelations.TREE + "node", "tree:node"],

      [ActorRdfMetadataExtractTreeRelations.TREE + "relation", "tree:relation"],

      [ActorRdfMetadataExtractTreeRelations.TREE + "view", "tree:view"],
      [ActorRdfMetadataExtractTreeRelations.HYDRA + "view", "tree:view"],
      [ActorRdfMetadataExtractTreeRelations.VOID + "subset", "tree:view"],
      [ActorRdfMetadataExtractTreeRelations.HYDRA + "entrypoint", "tree:view"],

      [ActorRdfMetadataExtractTreeRelations.TREE + "path", "tree:path"],
      [ActorRdfMetadataExtractTreeRelations.SHACL + "path", "tree:path"],

      [ActorRdfMetadataExtractTreeRelations.TREE + "value", "tree:value"],
      [ActorRdfMetadataExtractTreeRelations.HYDRA + "value", "tree:value"],

      [ActorRdfMetadataExtractTreeRelations.TREE + "remainingItems", "tree:remainingItems"],
      [ActorRdfMetadataExtractTreeRelations.HYDRA + "totalItems", "tree:remainingItems"],

      [ActorRdfMetadataExtractTreeRelations.RDFS + "schema", "rdfs:schema"],
    ])


  protected readonly reverse_predicate_mapping: Map<string, string> = 
  new Map([
    [ActorRdfMetadataExtractTreeRelations.DCTERMS + "isPartOf", "tree:view"],
  ])

  protected readonly type_mapping: Map<string, string> = 
    new Map([
      [ActorRdfMetadataExtractTreeRelations.TREE + "Collection", "hydra:Collection"],
      [ActorRdfMetadataExtractTreeRelations.HYDRA + "Collection", "hydra:Collection"],

      [ActorRdfMetadataExtractTreeRelations.TREE + "Node", "tree:Node"],

      [ActorRdfMetadataExtractTreeRelations.TREE + "Relation", "tree:Relation"],
      [ActorRdfMetadataExtractTreeRelations.TREE + "PrefixRelation", "tree:PrefixRelation"],
      [ActorRdfMetadataExtractTreeRelations.TREE + "SubstringRelation", "tree:SubstringRelation"],
      [ActorRdfMetadataExtractTreeRelations.TREE + "GreaterThanRelation", "tree:GreaterThanRelation"],
      [ActorRdfMetadataExtractTreeRelations.TREE + "GreaterOrEqualThanRelation", "tree:GreaterOrEqualThanRelation"],
      [ActorRdfMetadataExtractTreeRelations.TREE + "LessThanRelation", "tree:LessThanRelation"],
      [ActorRdfMetadataExtractTreeRelations.TREE + "LesserThanRelation", "tree:LessThanRelation"],
      [ActorRdfMetadataExtractTreeRelations.TREE + "LessOrEqualThanRelation", "tree:LessOrEqualThanRelation"],
      [ActorRdfMetadataExtractTreeRelations.TREE + "LesserOrEqualThanRelation", "tree:LessOrEqualThanRelation"],
      [ActorRdfMetadataExtractTreeRelations.TREE + "EqualThanRelation", "tree:EqualThanRelation"],
      [ActorRdfMetadataExtractTreeRelations.TREE + "GeospatiallyContainsRelation", "tree:GeospatiallyContainsRelation"],
      [ActorRdfMetadataExtractTreeRelations.TREE + "InBetweenRelation", "tree:InBetweenRelation"],
    ])
    
  constructor(args: IActorArgs<IActionRdfMetadataExtract, IActorTest, IActorRdfMetadataExtractOutput>) {
    super(args);
  }

  public async test(action: IActionRdfMetadataExtract): Promise<IActorTest> {
    return true;
  }



  /**
   * Collect all TREE node links from the given TREE properties object.
   * @param pageUrl The URL in which the TREE properties are defined.
   * @param treeProperties The collected TREE properties.
   * @return The TREE links
   */
  public getLinks(pageUrl: string, treeProperties: { "collections": Map<string, Collection>, "nodes": Map<string, Node>, "relations": Map<string, Relation> }) : {[id: string]: any} {
    let metadata : {[id: string]: any} = {}
    metadata["collections"] = treeProperties.collections;
    metadata["nodes"] = treeProperties.nodes;
    metadata["relations"] = treeProperties.relations;
    console.log("Metadata created")
    return metadata
  }

  /**
   * Helper function to add data to an abject value in a map
   * @param {Map} map 
   * @param {any} subject
   * @param {any} predicate
   * @param {any} value
   */
  private addToObjectInMap(map: Map<any, any>, subject: any, predicate: any, object: any){
    let obj = map.get(subject);
    if (!obj){
      map.set(subject, {[predicate]: [object]})
    } else {
      obj[predicate] = obj[predicate] ? obj[predicate].concat(object) : [object]
    }
  }

  /**
   * Helper function to clean starting http:// | https:// | http://www. | https://www.
   * @param {string} url 
   * @param {any} subject
   * @param {any} predicate
   * @param {any} value
   */
  private cleanURL(url: string){
    return url.replace(/^http(s)*:\/\/(www\.)*/, '') || url
  }

  /**
   * Collect all tree properties from a given metadata stream
   * in a nice convenient nested hash (property / subject / objects).
   * @param {RDF.Stream} metadata
   * @return The collected tree properties.
   */
  public getTreeProperties(metadata: RDF.Stream): Promise<{ "collections": Map<string, Collection>, "nodes": Map<string, Node>, "relations": Map<string, Relation> }> {

    return new Promise((resolve, reject) => {

      let data = []
      
      let collections: Map<string, Collection> = new Map();
      let nodes: Map<string, Node> = new Map();
      let relations: Map<string, Relation> = new Map();
      let treeMetadata: Map<string, any> = new Map();

      metadata.on('error', reject);

      // Collect all tree properties in a nice convenient nested hash (property / subject / objects).
      metadata.on('data', (quad : N3.Quad) => {

        data.push(quad)
        if (this.cleanURL(quad.predicate.value) === ActorRdfMetadataExtractTreeRelations.TYPE) {
          // Check for relation type 
          let resultingType = this.type_mapping.get(this.cleanURL(quad.object.value))
          if (resultingType === "hydra:Collection") { this.addToObjectInMap(collections, convertBlanknodeTerm(quad.subject), "@type", resultingType) }
          else if (resultingType === "tree:Node") { this.addToObjectInMap(nodes, convertBlanknodeTerm(quad.subject), "@type", resultingType) }
          else if (resultingType) { this.addToObjectInMap(relations, convertBlanknodeTerm(quad.subject), "@type", resultingType) }
        } else {
          // Check for predicates used in TREE specification
          let normalizedPredicateValue = this.predicate_mapping.get(this.cleanURL(quad.predicate.value));
          if (normalizedPredicateValue !== undefined) { 
            this.addToObjectInMap(treeMetadata, convertBlanknodeTerm(quad.subject), normalizedPredicateValue, convertBlanknodeTerm(quad.object)) 
          }
          normalizedPredicateValue = this.reverse_predicate_mapping.get(this.cleanURL(quad.predicate.value));
          if (normalizedPredicateValue !== undefined) { this.addToObjectInMap(treeMetadata, convertBlanknodeTerm(quad.object), normalizedPredicateValue, convertBlanknodeTerm(quad.subject)) }
        }
      });

      metadata.on('end', () => {
        for (let mapping of [collections, nodes, relations]){
          for (let entry of mapping.entries()){
            let id : string = entry[0]
            let obj : any = entry[1]
            // get object containing all metadata for given identifier !!! this has to be adapted if arguments of a depth > 1 have to be supported (!! PATHS)
            let object = treeMetadata.get(id)
            if(!object) object = obj;
            object['@id'] = id
            object['@type'] = Array.isArray(obj['@type']) ? obj['@type'][0] : obj['@type']

            // The entity has metadata other than the entity type
            if(object){
              for (let property in object){
                if(object[property]){
                  object[property] = Array.isArray(object[property]) && object[property].length === 1 ? object[property][0] : object[property]
                  object[property] = object[property].termtype && object[property].termtype === 'Literal' ? fromRdf(object[property]) : object[property]
                }
              }
              // fix datatypes
              if (object["tree:remainingItems"] ) object["tree:remainingItems"] = parseInt(object["tree:remainingItems"])
              mapping.set(id, object)
            }
          }
        }

        let treeProperties = {
          'context': this.JSONLDContext,
          'collections': collections,
          'nodes': nodes,
          'relations': relations
        }
        resolve(treeProperties)
      });
    });
  }

  public async run(action: IActionRdfMetadataExtract): Promise<IActorRdfMetadataExtractOutput> {
    const metadata: {[id: string]: any} = {};
    const treeProperties = await this.getTreeProperties(action.metadata);
    require('lodash.assign')(metadata, this.getLinks(action.url, treeProperties));
    return { metadata };
  }

}

function convertBlanknodeTerm (subject: N3.Term) {
  // differentiate between blank nodes and non-blank nodes
  return subject.termType === 'BlankNode' ? '_:' + subject.value : subject.value
}

class Collection {
  "@type": string;
  "tree:view": string[] | undefined;
  "rdfs:label": string | undefined;
}

class Node {
  "@type": string;
  "tree:relation": string | undefined;
  "tree:remainingItems": string | number | undefined;
}

class Relation {
  "@type": string;
  "tree:value": string | number | undefined; 
  "tree:path": string | undefined;
  "tree:node": string | undefined;
}