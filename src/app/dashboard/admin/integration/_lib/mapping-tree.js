/**
 * @typedef {{ id: string, label: string, expression?: string, children?: TreeNode[] }} TreeNode
 */

/**
 * @param {Record<string, unknown>} obj
 * @param {string} prefix e.g. instance.variables
 */
function variableObjectToNodes(obj, prefix) {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return [];

  return Object.entries(obj).map(([key, value]) => {
    const path = `${prefix}.${key}`;
    const hasNested =
      value != null && typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length > 0;

    /** @type {TreeNode} */
    const node = {
      id: path,
      label: key,
      expression: path,
    };

    if (hasNested) {
      node.children = variableObjectToNodes(value, path);
    }
    return node;
  });
}

/**
 * @param {Record<string, unknown>} sampleVariables
 * @param {Record<string, string>} [env]
 */
export function buildProcessVariableTree(sampleVariables = {}, env = {}) {
  /** @type {TreeNode[]} */
  const roots = [
    {
      id: 'instance',
      label: 'instance',
      children: [
        { id: 'instance.id', label: 'id', expression: 'instance.id' },
        { id: 'instance.process_key', label: 'process_key', expression: 'instance.process_key' },
        {
          id: 'instance.variables',
          label: 'variables',
          children: variableObjectToNodes(sampleVariables, 'instance.variables'),
        },
      ],
    },
    {
      id: 'step_id',
      label: 'step_id',
      expression: 'step_id',
    },
  ];

  const envKeys = Object.keys(env ?? {});
  if (envKeys.length) {
    roots.push({
      id: 'env',
      label: 'env',
      children: envKeys.map((key) => ({
        id: `env.${key}`,
        label: key,
        expression: `env.${key}`,
      })),
    });
  } else {
    roots.push({
      id: 'env',
      label: 'env',
      children: [
        {
          id: 'env.example',
          label: '(نمونه) REGISTRY_URL',
          expression: 'env.REGISTRY_URL',
        },
      ],
    });
  }

  return roots;
}

/**
 * @param {Record<string, unknown>|null|undefined} schema
 * @param {string} [prefix]
 */
export function buildInputSchemaTree(schema, prefix = '') {
  if (!schema || typeof schema !== 'object') return [];

  const properties = schema.properties ?? {};
  /** @type {TreeNode[]} */
  const nodes = [];

  Object.entries(properties).forEach(([key, spec]) => {
    const fieldPath = prefix ? `${prefix}.${key}` : key;
    const specObj = spec && typeof spec === 'object' ? spec : {};
    const type = String(specObj.type ?? 'any');
    const nestedProps = specObj.properties;

    /** @type {TreeNode} */
    const node = {
      id: fieldPath,
      label: `${key} (${type})`,
    };

    if (nestedProps && typeof nestedProps === 'object') {
      node.children = buildInputSchemaTree(specObj, fieldPath);
    } else {
      node.expression = fieldPath;
    }

    nodes.push(node);
  });

  return nodes;
}

/** @param {TreeNode[]} nodes @returns {TreeNode[]} */
export function flattenMappableNodes(nodes) {
  /** @type {TreeNode[]} */
  const out = [];
  const walk = (list) => {
    list.forEach((node) => {
      if (node.expression) out.push(node);
      if (node.children?.length) walk(node.children);
    });
  };
  walk(nodes);
  return out;
}
