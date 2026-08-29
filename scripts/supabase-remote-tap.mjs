const assertionNames = new Set(['is', 'lives_ok', 'throws_ok', 'hasnt_column', 'results_eq']);
const beginMarker = '__SIDEQUEST_TAP_BEGIN__';
const endMarker = '__SIDEQUEST_TAP_END__';

const splitSqlStatements = (source) => {
  const statements = [];
  let start = 0;
  let index = 0;
  let parentheses = 0;
  let state = 'normal';
  let dollarTag = '';

  while (index < source.length) {
    const char = source[index];
    const next = source[index + 1];
    if (state === 'single') {
      if (char === "'" && next === "'") index += 2;
      else if (char === "'") { state = 'normal'; index += 1; }
      else index += 1;
      continue;
    }
    if (state === 'double') {
      if (char === '"' && next === '"') index += 2;
      else if (char === '"') { state = 'normal'; index += 1; }
      else index += 1;
      continue;
    }
    if (state === 'line-comment') {
      if (char === '\n') state = 'normal';
      index += 1;
      continue;
    }
    if (state === 'block-comment') {
      if (char === '*' && next === '/') { state = 'normal'; index += 2; }
      else index += 1;
      continue;
    }
    if (state === 'dollar') {
      if (source.startsWith(dollarTag, index)) { state = 'normal'; index += dollarTag.length; }
      else index += 1;
      continue;
    }

    if (char === "'") { state = 'single'; index += 1; continue; }
    if (char === '"') { state = 'double'; index += 1; continue; }
    if (char === '-' && next === '-') { state = 'line-comment'; index += 2; continue; }
    if (char === '/' && next === '*') { state = 'block-comment'; index += 2; continue; }
    if (char === '$') {
      const tag = source.slice(index).match(/^\$[A-Za-z_][A-Za-z0-9_]*\$|^\$\$/)?.[0];
      if (tag) { state = 'dollar'; dollarTag = tag; index += tag.length; continue; }
    }
    if (char === '(') parentheses += 1;
    else if (char === ')') parentheses -= 1;
    else if (char === ';' && parentheses === 0) {
      statements.push(source.slice(start, index + 1));
      start = index + 1;
    }
    index += 1;
  }
  if (state !== 'normal' && state !== 'line-comment') throw new Error('SQL test contains an unterminated quoted value or comment.');
  if (parentheses !== 0) throw new Error('SQL test contains unbalanced parentheses.');
  if (source.slice(start).trim()) statements.push(source.slice(start));
  return statements;
};

const leadingTriviaPattern = /^((?:\s|--[^\r\n]*(?:\r?\n|$)|\/\*[\s\S]*?\*\/)*)/;
const withoutLeadingTrivia = (statement) => statement.slice(statement.match(leadingTriviaPattern)?.[0].length ?? 0);
const withLeadingTrivia = (statement, replacement) => `${statement.match(leadingTriviaPattern)?.[0] ?? ''}${replacement}`;

const matchingParen = (source, opening) => {
  let depth = 0;
  let index = opening;
  let quote = null;
  let dollarTag = '';
  while (index < source.length) {
    const char = source[index];
    const next = source[index + 1];
    if (quote === "'") {
      if (char === "'" && next === "'") index += 2;
      else if (char === "'") { quote = null; index += 1; }
      else index += 1;
      continue;
    }
    if (quote === '"') {
      if (char === '"' && next === '"') index += 2;
      else if (char === '"') { quote = null; index += 1; }
      else index += 1;
      continue;
    }
    if (quote === 'dollar') {
      if (source.startsWith(dollarTag, index)) { quote = null; index += dollarTag.length; }
      else index += 1;
      continue;
    }
    if (char === "'") { quote = "'"; index += 1; continue; }
    if (char === '"') { quote = '"'; index += 1; continue; }
    if (char === '$') {
      const tag = source.slice(index).match(/^\$[A-Za-z_][A-Za-z0-9_]*\$|^\$\$/)?.[0];
      if (tag) { quote = 'dollar'; dollarTag = tag; index += tag.length; continue; }
    }
    if (char === '(') depth += 1;
    else if (char === ')' && --depth === 0) return index;
    index += 1;
  }
  return -1;
};

const splitWithQuery = (source) => {
  let depth = 0;
  let index = 0;
  let quote = null;
  let dollarTag = '';
  while (index < source.length) {
    const char = source[index];
    const next = source[index + 1];
    if (quote === "'") {
      if (char === "'" && next === "'") index += 2;
      else if (char === "'") { quote = null; index += 1; }
      else index += 1;
      continue;
    }
    if (quote === 'dollar') {
      if (source.startsWith(dollarTag, index)) { quote = null; index += dollarTag.length; }
      else index += 1;
      continue;
    }
    if (char === "'") { quote = "'"; index += 1; continue; }
    if (char === '$') {
      const tag = source.slice(index).match(/^\$[A-Za-z_][A-Za-z0-9_]*\$|^\$\$/)?.[0];
      if (tag) { quote = 'dollar'; dollarTag = tag; index += tag.length; continue; }
    }
    if (char === '(') depth += 1;
    else if (char === ')') depth -= 1;
    else if (depth === 0 && /^select\b/i.test(source.slice(index))) {
      return [source.slice(0, index).trim(), source.slice(index).trim()];
    }
    index += 1;
  }
  return null;
};

const rewriteDataModifyingCteAssertion = (body, ordinal) => {
  const match = body.match(/^select\s+(is|lives_ok|throws_ok|hasnt_column|results_eq)\s*\(/i);
  if (!match) return null;
  const call = body.replace(/^select\s+/i, '').replace(/;\s*$/, '');
  const opening = call.indexOf('(');
  let first = opening + 1;
  while (/\s/.test(call[first] ?? '')) first += 1;
  if (call[first] !== '(') return null;
  const closing = matchingParen(call, first);
  if (closing < 0) throw new Error('Unable to parse the first pgTAP assertion argument.');
  const inner = call.slice(first + 1, closing).trim();
  if (!/^with\b/i.test(inner) || !/\b(?:insert|update|delete)\b/i.test(inner)) return null;
  const split = splitWithQuery(inner);
  if (!split) throw new Error('Data-modifying pgTAP CTE must contain a top-level query.');
  const [withClause, query] = split;
  const rewrittenCall = `${call.slice(0, first)}(${query})${call.slice(closing + 1)}`;
  return `with ${withClause.slice(4).trim()}\ninsert into pg_temp.sidequest_tap_output (sequence, line)\nselect ${ordinal}, ${rewrittenCall};`;
};

export const prepareRemoteTapSql = (source, testFile) => {
  const statements = splitSqlStatements(source);
  let beginCount = 0;
  let rollbackCount = 0;
  let finishCount = 0;
  let plan;
  let assertionCount = 0;
  const capturedAssertions = [];

  const transformed = statements.map((statement) => {
    const body = withoutLeadingTrivia(statement).trim();
    if (/^begin\s*;$/i.test(body)) {
      beginCount += 1;
      return withLeadingTrivia(statement, `begin;\n\ncreate temporary table pg_temp.sidequest_tap_output (\n  sequence integer not null,\n  line text not null\n) on commit drop;\ngrant insert on table pg_temp.sidequest_tap_output to authenticated, anon;`);
    }
    if (/^rollback\s*;$/i.test(body)) {
      rollbackCount += 1;
      return statement;
    }
    if (/^commit\s*;/i.test(body)) throw new Error(`${testFile} must not commit remote test fixtures.`);

    const selectMatch = body.match(/^select\s+([a-z_][a-z0-9_]*)\s*\(/i);
    if (selectMatch?.[1].toLowerCase() === 'plan') {
      if (plan !== undefined) throw new Error(`${testFile} declares more than one pgTAP plan.`);
      const planMatch = body.match(/^select\s+plan\((\d+)\)\s*;$/i);
      if (!planMatch) throw new Error(`${testFile} has an unsupported pgTAP plan statement.`);
      plan = Number(planMatch[1]);
      return withLeadingTrivia(statement, `insert into pg_temp.sidequest_tap_output (sequence, line)\nselect 0, plan(${plan});`);
    }

    const assertionName = selectMatch?.[1].toLowerCase();
    if (assertionName && assertionNames.has(assertionName)) {
      assertionCount += 1;
      capturedAssertions.push({ name: assertionName, ordinal: assertionCount });
      const cteRewrite = rewriteDataModifyingCteAssertion(body, assertionCount);
      if (cteRewrite) return withLeadingTrivia(statement, cteRewrite);
      const expression = body.replace(/^select\s+/i, '').replace(/;\s*$/, '');
      return withLeadingTrivia(statement, `insert into pg_temp.sidequest_tap_output (sequence, line)\nselect ${assertionCount}, ${expression};`);
    }

    if (/^select\s+\*\s+from\s+finish\(\)\s*;$/i.test(body)) {
      finishCount += 1;
      return withLeadingTrivia(statement, `insert into pg_temp.sidequest_tap_output (sequence, line)\nselect ${assertionCount + 1}, line from finish() as line;\n\nreset role;\nselect '${beginMarker}' || E'\\n'\n  || coalesce(string_agg(line, E'\\n' order by sequence), '')\n  || E'\\n${endMarker}' as tap\nfrom pg_temp.sidequest_tap_output;`);
    }

    if (/^select\s+/i.test(body) && !/^select\s+set_config\s*\(/i.test(body)) {
      throw new Error(`${testFile} contains an unsupported top-level SELECT that cannot be proven remotely.`);
    }
    return statement;
  });

  if (beginCount !== 1 || rollbackCount !== 1 || !/^\s*begin\s*;/i.test(source) || !/rollback\s*;\s*$/i.test(source)) {
    throw new Error(`${testFile} must contain one initial begin and one terminal rollback.`);
  }
  if (plan === undefined) throw new Error(`${testFile} does not declare a pgTAP plan.`);
  if (finishCount !== 1) throw new Error(`${testFile} must call finish() exactly once.`);
  if (assertionCount !== plan) {
    throw new Error(`${testFile} declares ${plan} pgTAP assertions but contains ${assertionCount}.`);
  }
  return { capturedAssertions, plan, sql: transformed.join('') };
};

export const validateRemoteTapOutput = (output, plan, testFile) => {
  const beginCount = output.split(beginMarker).length - 1;
  const endCount = output.split(endMarker).length - 1;
  if (beginCount !== 1 || endCount !== 1) {
    throw new Error(`Remote pgTAP output markers are missing or ambiguous: ${testFile}`);
  }
  const tap = output.slice(output.indexOf(beginMarker) + beginMarker.length, output.indexOf(endMarker));
  if (/(?:not ok|looks like|failed test|bail out!)/i.test(tap)) {
    throw new Error(`Remote pgTAP assertions failed: ${testFile}`);
  }
  const plans = tap.match(new RegExp(`(?:^|[^0-9])1\\.\\.${plan}(?:[^0-9]|$)`, 'g')) ?? [];
  const assertionNumbers = [...tap.matchAll(/\bok\s+(\d+)\s*-/gi)].map((match) => Number(match[1]));
  if (plans.length !== 1 || assertionNumbers.length !== plan
    || assertionNumbers.some((value, index) => value !== index + 1)) {
    throw new Error(`Remote pgTAP assertions failed or returned incomplete TAP output: ${testFile}`);
  }
};
