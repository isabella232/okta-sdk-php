const _ = require('lodash');
_.mixin(require('lodash-inflection'));

const php = module.exports;

function getType(obj, model) {
    switch (obj.commonType) {
        case 'dateTime':
            return String.raw`\Carbon\Carbon|null`;
        case 'object':
            switch (obj.model) {
                case 'CallFactorProfile':
                case 'EmailFactorProfile':
                case 'HardwareFactorProfile':
                case 'PushFactorProfile':
                case 'SecurityQuestionFactorProfile':
                case 'SmsFactorProfile':
                case 'TokenFactorProfile':
                case 'TotpFactorProfile':
                case 'WebFactorProfile':
                case 'FactorProfile':
                    return '\\Okta\\Contracts\\FactorProfile';
                default:
                    return `\\${model}\\${obj.model}`;
            }
        case 'hash':
            return String.raw`\stdClass`;
        case 'boolean':
            return String.raw`bool`;
        case 'integer':
            return String.raw`int`;
        case 'enum':
            return String.raw`string`;
        default:
            return obj.commonType;
    }
}

function getSafeType(obj, model) {
    switch (obj.commonType) {
        case 'dateTime':
            return ``;
        case 'object':
            switch (obj.model) {
                case 'CallFactorProfile':
                case 'EmailFactorProfile':
                case 'HardwareFactorProfile':
                case 'PushFactorProfile':
                case 'SecurityQuestionFactorProfile':
                case 'SmsFactorProfile':
                case 'TokenFactorProfile':
                case 'TotpFactorProfile':
                case 'WebFactorProfile':
                case 'FactorProfile':
                    return ': \\Okta\\Contracts\\FactorProfile';
                default:
                    return `: \\${model}\\${obj.model}`;
            }
        case 'hash':
            return String.raw`: \stdClass`;
        case 'boolean':
            return String.raw`: bool`;
        case 'integer':
            return String.raw`: int`;
        case 'enum':
            return String.raw`: string`;
        default:
            if(obj.commonType) {
                return `: ${obj.commonType}`;
            }
            return;
    }
}

function getTypeHint(model) {
    switch(model) {
        case 'CallFactorProfile':
        case 'EmailFactorProfile':
        case 'HardwareFactorProfile':
        case 'PushFactorProfile':
        case 'SecurityQuestionFactorProfile':
        case 'SmsFactorProfile':
        case 'TokenFactorProfile':
        case 'TotpFactorProfile':
        case 'WebFactorProfile':
        case 'FactorProfile':
            return '\\Okta\\Contracts\\FactorProfile';
        default:
            return model;
    }
}

function getExtends(modelName) {
    switch (modelName) {
        case 'CallFactor':
        case 'EmailFactor':
        case 'HardwareFactor':
        case 'PushFactor':
        case 'SecurityQuestionFactor':
        case 'SmsFactor':
        case 'TokenFactor':
        case 'TotpFactor':
        case 'WebFactor':
            return '\\Okta\\UserFactors\\Factor';
        case 'CallFactorProfile':
        case 'EmailFactorProfile':
        case 'HardwareFactorProfile':
        case 'PushFactorProfile':
        case 'SecurityQuestionFactorProfile':
        case 'SmsFactorProfile':
        case 'TokenFactorProfile':
        case 'TotpFactorProfile':
        case 'WebFactorProfile':
            return '\\Okta\\UserFactors\\FactorProfile';
        default:
            return '\\Okta\\Resource\\AbstractResource';
    }
}

function getInterfaces(modelName) {
    switch (modelName) {
        case 'CallFactorProfile':
        case 'EmailFactorProfile':
        case 'HardwareFactorProfile':
        case 'PushFactorProfile':
        case 'SecurityQuestionFactorProfile':
        case 'SmsFactorProfile':
        case 'TokenFactorProfile':
        case 'TotpFactorProfile':
        case 'WebFactorProfile':
            return 'implements \\Okta\\Contracts\\FactorProfile';
    }
}

function getAccessMethodType(obj) {
  switch (obj.commonType) {
    case 'dateTime':
      return 'getDateProperty';
    default:
      return 'getProperty';
  }
}

function getMethodPath(method) {
  let path = method.operation.path;

  const requiredArgs = [];
  const suppliedArgs = new Set();
  for (let argPair of method.arguments) {
    const ref = `$this->get${_.upperFirst(_.camelCase(argPair.src))}()`;
    path = path.replace(`{${argPair.dest}}`, `{${ref}}`);
    suppliedArgs.add(argPair.dest);
  }

  for (let param of method.operation.pathParams) {
    if (!suppliedArgs.has(param.name)) {
      path = path.replace(`{${param.name}}`, `{$${param.name}}`);
    }
  }

  return path;
}

// Generic helper to retrieve method parameters as a hash
function getParams(method) {
  const params = {};

  // Get path params that aren't specified
  const definedParams = _.map(method.arguments, arg => arg.dest);
  params.requiredPathParams = _.filter(method.operation.pathParams, param => !definedParams.includes(param.name));

  // Get all query params with defaults
  const defaultQueryParams = method.operation.queryParams.filter(param => !!param.default || param.default == false);
  params.defaultQueryParams = _.sortBy(defaultQueryParams, 'name');

  // Get the body param with type
  const isSelfBody = !!_.find(method.arguments, arg => arg.dest == 'body' && arg.src !== 'self');
  if (!isSelfBody && method.operation.bodyModel) {
    params.bodyModel = method.operation.bodyModel;
  }

  return params;
}

function getMethodParams(method) {
  const params = getParams(method);
  const pathParams = params.requiredPathParams.map(param => `$${param.name}`);
  const queryParams = params.defaultQueryParams.map(param => `$${param.name} = ` + (param.default !== '' ? `${param.default}` : `''`));

  let methodParams = [].concat(pathParams);
  if (params.bodyModel) {
    const modelName = params.bodyModel;
    const varName = _.camelCase(modelName);
    methodParams.push(`${modelName} $${varName}`);
  }
  methodParams = methodParams.concat(queryParams);

  return methodParams.join(', ');
}

function getCollectionMethodParams(method) {
  const params = getParams(method);
  const pathParams = params.requiredPathParams.map(param => `$${param.name}`);
  const methodParams = [].concat(pathParams);
  methodParams.push('array $options = []')
  return methodParams.join(', ');
}

function getMethodParamsComment(method) {
  // Get all query params with defaults
  let defaultQueryParams = method.operation.queryParams.filter(param => !!param.default);
  defaultQueryParams = _.sortBy(defaultQueryParams, 'name');

  if (_.size(defaultQueryParams) > 0) {
    const queryParamsCommentStr = defaultQueryParams.reduce((acc, curr) => {
      let comment = '';

      switch (curr.default) {
        case true:
        case false:
          comment = `* @param bool $${curr.name} Sets the ${curr.name} flag.`;
      }

      return comment;
    }, '');

    return queryParamsCommentStr;
  }

  return '*';
}

function getMethodRequestParams(method) {
  const params = getParams(method);

  const path = method.operation.method.toUpperCase();
  const httpMethod = `'${path}'`;
  const methodParams = [httpMethod, '$uri'];

  // Add a body argument if we have a body
  if (params.bodyModel) {
    const modelName = params.bodyModel;
    const varName = _.camelCase(modelName);
    methodParams.push(`$${varName}`);
  }

  const queryParams = params.defaultQueryParams.map(param => `$${param.name} => ${param.default}`);


  // Add a query params argument if we have query params
  if (queryParams.length) {
    // If we have queryParams and no body, we should put something in it's place
    if (!params.bodyModel) {
      methodParams.push(`''`);
    }

    const queryOptions = params.defaultQueryParams.map(param => `'${param.name}' => $${param.name}`);

    methodParams.push(`['query' => [${queryOptions}]]`);
  }

  return methodParams.join(', ');
}

function getMethodArrayName(str) {
  return str.replace('list', 'get');
}

function getOperationReturnType(model) {
  if (model.operation.responseModel) {
    return model.operation.responseModel;
  }

  return 'void';
}

function getCrudMethodName(alias) {
  switch (alias) {
    case 'create':
      return 'create';
    case 'read':
      return 'find';
    case 'update':
      return 'save';
    case 'delete':
      return 'delete';
  }
}

function getClassNameForCollection(obj) {
  switch(obj.operation.operationId) {
      case 'listUserGroups':
      case 'listGroupTargetsForRole':
        return '\\Okta\\Groups\\Group';
      case 'listGroupUsers':
          return '\\Okta\\Users\\User';
      case 'listFactors':
      case 'listSupportedFactors':
          return '\\Okta\\UserFactors\\Factor';
      default:
          return `\\${obj.baseClass}\\${obj.operation.responseModel}`;
  }

}

function getCollectionName(obj) {
  switch(obj.operation.operationId) {
      case 'listUserGroups':
      case 'listGroupTargetsForRole':
          return '\\Okta\\Groups\\Collection';
      case 'listGroupUsers':
          return '\\Okta\\Users\\Collection';
      case 'listFactors':
      case 'listSupportedFactors':
          return '\\Okta\\UserFactors\\Collection';
      default:
          return `\\${obj.baseClass}\\Collection`;
  }
}

function getCrudOperationPath(method) {
  let parts = _.split(method.operation.path, '/');
  if(method.operation.operationId === 'getFactor') {
      return '/' + parts[3] + '/{$userId}/' + parts[5] + '/{$factorId}';
  }
  return '/' + parts[3];
}

function pluralize(string) {
    return _.pluralize(string);
}

function customLog(toLog) {
  console.log(toLog);
}
php.process = ({ spec, operations, models, handlebars }) => {
  const templates = [];

  const modelMap = {};
  const namespaces = [];

  for (let model of models) {
    // Order the properties by length
    model.properties = _.sortBy(model.properties, [p => p.propertyName.length]);

    if (model.tags[0]) {
      model.namespace = _.pluralize(model.tags[0]);
      namespaces.push(model.namespace);
    }

    for (let property of model.properties) {
        property.baseClass = `Okta\\${model.namespace}`;
    }

    if (model.methods) {
      for(let method of model.methods) {
        method.baseClass = `Okta\\${model.namespace}`;
      }
    }

    // Build modelMap
    modelMap[model.modelName] = model;
  }

  for (let model of models) {

    model.namespacedModels = [];
    model.crudOperations = [];



    if (model.methods) {
      for (let method of model.methods) {
        const responseModel = method.operation.responseModel;
        if (modelMap[responseModel] && model.namespace !== modelMap[responseModel].namespace) {
          model.namespacedModels.push(modelMap[responseModel]);
        }

        const bodyModel = method.operation.bodyModel;
        if (modelMap[bodyModel] && model.namespace !== modelMap[bodyModel].namespace) {
          model.namespacedModels.push(modelMap[bodyModel]);
        }
      }
    }

    model.namespacedModels = _.uniq(model.namespacedModels);

    if (model.crud) {
      for (let crud of model.crud) {
          crud.defaultReturnType = `Okta\\${model.namespace}\\${model.modelName}`
        model.crudOperations.push(crud);
      }
    }

    if(model.enum) {
        model.enum = _.sortBy(model.enum);
        templates.push({
            src: 'templates/enum.php.hbs',
            dest: `${model.namespace}/${model.modelName}.php`,
            context: model
        });
    } else {
        templates.push({
            src: 'templates/model.php.hbs',
            dest: `${model.namespace}/${model.modelName}.php`,
            context: model
        });
    }
  }

  for (let namespace of _.uniqBy(namespaces)) {
    templates.push({
      src: 'templates/collection.php.hbs',
      dest: `${namespace}/Collection.php`,
      context: { namespace: `${namespace}` }
    });
  }

  handlebars.registerHelper({
    getType,
    getSafeType,
    getTypeHint,
    getAccessMethodType,
    getMethodPath,
    getMethodParams,
    getExtends,
    getInterfaces,
    getCollectionMethodParams,
    getMethodRequestParams,
    getMethodArrayName,
    getOperationReturnType,
    getMethodParamsComment,
    getCrudMethodName,
    getCrudOperationPath,
    pluralize,
    customLog,
    getClassNameForCollection,
    getCollectionName
  });

  return templates;
};
