#!/usr/bin/env node
// tslint:disable:no-var-requires
import {runArgsInProcessStatic} from "@comunica/runner-cli";
import { Algebra } from "sparqlalgebrajs";
const initActorSPARQL = require('../engine-default.js');
let queryFunction = initActorSPARQL.query;
queryFunction = queryFunction.bind(initActorSPARQL)
const newQueryFunction = async (query: string | Algebra.Operation, context?: any) => {
  context['@query'] = query;
  return queryFunction(query, context);
};
initActorSPARQL.query = newQueryFunction;
runArgsInProcessStatic(initActorSPARQL);
