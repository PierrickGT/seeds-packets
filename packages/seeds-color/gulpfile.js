const fs = require('fs');
const del = require('del');
const exec = require('child_process').exec;
const gulp = require('gulp');
const theo = require('theo');
const pascalCase = require('pascal-case');
const camelCase = require('lodash.camelcase');
const snakeCase = require('lodash.snakecase');
const upperFirst = require('lodash.upperfirst');
const tinycolor = require('tinycolor2');
const ase = require('ase-utils');
const makeDir = require('make-dir');

const versions = require('../seeds-util/versions');
const sassVar = require('../seeds-util/sassvar').sassVar;
const getGulpTask = require('../seeds-util/getgulptask');
const constantCase = require('../seeds-util/constantcase').constantCase;
const javascriptConst = require('../seeds-util/constantcase').javascriptConst;
const getPercentageRGB = require('../seeds-util/getpercentagergb');

const colorTokensPath = './tokens.yml';
require('../seeds-util/theo');

// TODO: Consider eliminating a lot of the duplication in this file

function getGulpColorTask(transform, format, opts = {}) {
  return getGulpTask('seeds-color', transform, format, opts);
}

gulp.task('clean', () => {
  return del(['docs/downloads/*']);
});

gulp.task('color-scss', getGulpColorTask('web', 'scss'));

gulp.task('color-js', getGulpColorTask('js', 'common.js'));

gulp.task(
  'color-swift',
  getGulpColorTask('swift', 'swift', {
    filename: `UIColor+${pascalCase('seeds-color')}`,
    dest: 'docs/downloads',
    prependFile: `// seeds-color\n// version ${versions['seeds-color']}`
  })
);

gulp.task(
  'color-android',
  getGulpColorTask('android', 'android.xml', {
    filename: snakeCase('seeds-color'),
    dest: 'docs/downloads'
  })
);

gulp.task(
  'color-python',
  getGulpColorTask('web', 'python.py', {
    filename: snakeCase('seeds-color'),
    dest: 'docs/downloads',
    prependFile: `# seeds-color\n# version ${versions['seeds-color']}`
  })
);

gulp.task(
  'color-sketch',
  getGulpColorTask('sketch', 'sketch.sketchpalette', {
    appendVersion: true,
    dest: 'docs/downloads'
  })
);

gulp.task('color-ase', done => {
  return gulp.src(colorTokensPath).pipe(theo.plugins.transform('designapp')).pipe(theo.plugins.format('ase')).pipe(
    theo.plugins.getResult(result => {
      makeDir('docs/_includes/').then(() => {
        fs.writeFileSync(`docs/downloads/seeds-color.${versions['seeds-color']}.ase`, ase.encode(JSON.parse(result)));
        done();
      });
    })
  );
});

gulp.task('color-clr', done => {
  const downloadDir = `${process.cwd()}/docs/downloads`;
  exec(
    `${process.cwd()}/node_modules/ase-util/bin/ase2clr ${downloadDir}/seeds-color.${versions[
      'seeds-color'
    ]}.ase ${downloadDir}/seeds-color.${versions['seeds-color']}.clr`,
    err => {
      done(err);
    }
  );
});

gulp.task('color-docs', done => {
  theo.plugins.file(colorTokensPath).pipe(theo.plugins.transform('web')).pipe(
    theo.plugins.getResult(result => {
      const tokens = JSON.parse(result);
      const colors = tokens.propKeys.map(key => {
        const prop = tokens.props[key];
        const {category, value} = prop;

        return {
          category,
          value,
          palette: upperFirst(prop.name),
          sass: sassVar(prop.package, prop.name),
          javascript: javascriptConst(prop.package, prop.name),
          swift: `UIColor().${camelCase(prop.name)}()`,
          android: constantCase(prop.name),
          python: camelCase(prop.name),
          rgb: tinycolor(value).toRgbString(value)
        };
      });

      makeDir('docs/_includes/').then(() => {
        fs.writeFileSync(
          'docs/_includes/colors.html',
          `<!-- GENERATED BY GULP - DO NOT EDIT -->\n\n<script>window.seedsColors = ${JSON.stringify(colors)};</script>`
        );
        done();
      });
    })
  );
});

gulp.task(
  'default',
  gulp.series([
    'clean',
    gulp.parallel([
      'color-scss',
      'color-js',
      'color-swift',
      'color-android',
      'color-python',
      'color-sketch',
      gulp.series(['color-ase', 'color-clr'])
    ]),
    'color-docs'
  ])
);