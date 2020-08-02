export {newEngine} from './index-browser';

import {ActorInitSparql} from '@comunica/actor-init-sparql/lib/ActorInitSparql-browser';
import {IQueryOptions, newEngineDynamicArged} from "@comunica/actor-init-sparql/lib/QueryDynamic";
import { Algebra } from 'sparqlalgebrajs';

/**
 * Create a new dynamic comunica engine from a given config file.
 * @param {IQueryOptions} options Optional options on how to instantiate the query evaluator.
 * @return {Promise<QueryEngine>} A promise that resolves to a fully wired comunica engine.
 */
export function newEngineDynamic(options?: IQueryOptions): Promise<ActorInitSparql> {
  return new Promise( (resolve, reject) => {
    newEngineDynamicArged(options || {}, __dirname, __dirname + '/config/config-default.json').then((initActorSPARQL => {
      let queryFunction = initActorSPARQL.query;
      queryFunction = queryFunction.bind(initActorSPARQL)
      const newQueryFunction = async (query: string | Algebra.Operation, context?: any) => {
        context['@query'] = query;
        return queryFunction(query, context);
      };
      initActorSPARQL.query = newQueryFunction;
      resolve(initActorSPARQL)
    }))
  })
  // return newEngineDynamicArged(options || {}, __dirname, __dirname + '/config/config-default.json');
}