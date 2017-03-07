import theo from 'theo';

import { sassVar, suitCssName } from '../../util/sassvar';

theo.registerFormat('scss', (json) =>
  json.propKeys.map((key) => {
    const prop = json.props[key];

    if (typeof prop.value === 'object') {
      let result;
      if (prop.value.variable) {
        result = `${sassVar(prop.package, prop.name)}: ${prop.value.variable};`;
      };
      const rules = Object.keys(prop.value.mixin).map((rule) => `  ${rule}: ${prop.value.mixin[rule]};`).join('\n');
      return result + `\n@mixin ${suitCssName(prop.package, prop.name)} {\n${rules}\n}`;
    }

    return `${sassVar(prop.package, prop.name)}: ${prop.value};`;
  }).join('\n')
);
