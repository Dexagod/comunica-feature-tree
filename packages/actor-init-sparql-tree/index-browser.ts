import {ActorInitSparql} from '@comunica/actor-init-sparql/lib/ActorInitSparql-browser';
import { Algebra } from 'sparqlalgebrajs';

/**
 * Create a new comunica engine from the default config.
 * @return {ActorInitSparql} A comunica engine.
 */
export function newEngine(): ActorInitSparql {
  const initActorSPARQL = require('./engine-default.js');
  let queryFunction = initActorSPARQL.query;
  queryFunction = queryFunction.bind(initActorSPARQL)
  const newQueryFunction = async (query: string | Algebra.Operation, context?: any) => {
    context['@query'] = query;
    return queryFunction(query, context);
  };
  initActorSPARQL.query = newQueryFunction;
  return initActorSPARQL
}