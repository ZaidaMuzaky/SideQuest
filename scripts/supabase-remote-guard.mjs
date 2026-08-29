import { spawnSync } from 'node:child_process';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';

export const cli = process.execPath;
const cliEntrypoint = resolve(process.cwd(), 'node_modules/supabase/dist/supabase.js');

const required = (name) => {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required remote verification variable: ${name}`);
  }
  return value;
};

export const runCli = (args, options = {}) => {
  const result = spawnSync(cli, [cliEntrypoint, ...args], {
    cwd: process.cwd(),
    encoding: 'utf8',
    stdio: options.capture ? 'pipe' : 'inherit',
  });

  if (result.error) throw result.error;
  if (result.status !== 0) {
    if (options.capture) process.stderr.write(result.stderr ?? '');
    throw new Error(`Supabase CLI command failed: supabase ${args.join(' ')}`);
  }
  return result.stdout ?? '';
};

const isRecord = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);

export const parseProjectList = (value) => {
  const projects = Array.isArray(value)
    ? value
    : isRecord(value) && Array.isArray(value.projects)
      ? value.projects
      : null;

  if (!projects) {
    throw new Error('Supabase CLI returned an unsupported project-list response; target identity was not verified.');
  }

  const seenRefs = new Set();
  return projects.map((candidate) => {
    if (!isRecord(candidate) || typeof candidate.name !== 'string' || candidate.name.length === 0) {
      throw new Error('Supabase CLI returned a malformed project entry; target identity was not verified.');
    }
    if ((candidate.id !== undefined && typeof candidate.id !== 'string')
      || (candidate.ref !== undefined && typeof candidate.ref !== 'string')) {
      throw new Error('Supabase CLI returned a malformed project identifier; target identity was not verified.');
    }

    const projectRef = candidate.ref ?? candidate.id;
    if (typeof projectRef !== 'string' || !/^[a-z]{20}$/.test(projectRef)) {
      throw new Error('Supabase CLI returned a malformed project ref; target identity was not verified.');
    }
    if (seenRefs.has(projectRef)) {
      throw new Error('Supabase CLI returned duplicate project refs; target identity was not verified.');
    }
    seenRefs.add(projectRef);
    return { name: candidate.name, ref: projectRef };
  });
};

export const findVerifiedProject = (value, expectedRef, expectedName) => {
  const projects = parseProjectList(value);
  const project = projects.find((candidate) => candidate.ref === expectedRef);
  if (!project) {
    throw new Error('The expected project ref is not accessible to the authenticated Supabase account.');
  }
  if (project.name !== expectedName) {
    throw new Error('Remote target name does not exactly match SIDEQUEST_SUPABASE_EXPECTED_PROJECT_NAME.');
  }
  return project;
};

export const verifyRemoteTarget = ({ requireLinked = true, requirePushApproval = false } = {}) => {
  const environment = required('SIDEQUEST_SUPABASE_ENVIRONMENT');
  const projectRef = required('SIDEQUEST_SUPABASE_PROJECT_REF');
  const expectedName = required('SIDEQUEST_SUPABASE_EXPECTED_PROJECT_NAME');
  const confirmedRef = required('SIDEQUEST_SUPABASE_CONFIRM_PROJECT_REF');

  required('SUPABASE_ACCESS_TOKEN');
  required('SUPABASE_DB_PASSWORD');

  if (environment !== 'development') {
    throw new Error('Remote verification is restricted to SIDEQUEST_SUPABASE_ENVIRONMENT=development.');
  }
  if (!/^[a-z]{20}$/.test(projectRef)) {
    throw new Error('SIDEQUEST_SUPABASE_PROJECT_REF is not a valid Supabase project ref.');
  }
  if (confirmedRef !== projectRef) {
    throw new Error('SIDEQUEST_SUPABASE_CONFIRM_PROJECT_REF must exactly match the dedicated development project ref.');
  }
  if (!/sidequest/i.test(expectedName) || !/(?:^|[\s_-])dev(?:elopment)?(?:$|[\s_-])/i.test(expectedName)) {
    throw new Error('The verified project name must explicitly identify SideQuest and dev/development.');
  }
  if (/(?:prod(?:uction)?|live|staging)/i.test(expectedName)) {
    throw new Error('Production, live, and staging project names are forbidden for this workflow.');
  }
  if (requirePushApproval && process.env.SIDEQUEST_SUPABASE_ALLOW_MIGRATION_PUSH !== 'YES_DEDICATED_SIDEQUEST_DEVELOPMENT') {
    throw new Error('Remote migration push requires the dedicated-development acknowledgement.');
  }

  const projectsOutput = runCli(['projects', 'list', '--output-format', 'json'], { capture: true });
  let projectsResponse;
  try {
    projectsResponse = JSON.parse(projectsOutput);
  } catch {
    throw new Error('Supabase CLI returned an unreadable project list; target identity was not verified.');
  }

  const project = findVerifiedProject(projectsResponse, projectRef, expectedName);

  if (requireLinked) {
    let linkedRef;
    try {
      linkedRef = readFileSync(resolve(process.cwd(), 'supabase/.temp/project-ref'), 'utf8').trim();
    } catch {
      throw new Error('No linked Supabase project. Run npm run supabase:remote:link first.');
    }
    if (linkedRef !== projectRef) {
      throw new Error('Linked Supabase project does not match SIDEQUEST_SUPABASE_PROJECT_REF.');
    }
  }

  process.stdout.write(`Verified dedicated development target: ${project.name} (${projectRef}).\n`);
  return { projectRef };
};

export const localMigrationVersions = () => readdirSync(resolve(process.cwd(), 'supabase/migrations'))
  .filter((name) => /^\d+_.+\.sql$/.test(name))
  .map((name) => name.slice(0, name.indexOf('_')))
  .sort();

const assertUniqueVersions = (versions, source) => {
  if (new Set(versions).size !== versions.length) {
    throw new Error(`${source} migration history contains duplicate versions.`);
  }
  return versions;
};

const remoteVersionsFromList = (value) => {
  const rows = Array.isArray(value) ? value : value?.migrations;
  if (!Array.isArray(rows)) {
    throw new Error('Supabase CLI returned an unreadable migration list; remote history was not verified.');
  }
  const versions = [];
  for (const row of rows) {
    const value = row?.remote ?? row?.remote_version;
    if (value === null || value === undefined || value === '') continue;
    const version = typeof value === 'number' && Number.isSafeInteger(value)
      ? String(value)
      : value;
    if (typeof version !== 'string' || !/^\d+$/.test(version)) {
      throw new Error('Supabase CLI returned an unsupported remote migration version.');
    }
    versions.push(version);
  }
  return assertUniqueVersions(versions.sort(), 'Remote');
};

export const verifyMigrationHistory = ({ requireExact = false } = {}) => {
  const output = runCli(['migration', 'list', '--linked', '--output-format', 'json'], { capture: true });
  let parsed;
  try {
    parsed = JSON.parse(output);
  } catch {
    throw new Error('Supabase CLI returned non-JSON migration history; refusing remote migration operations.');
  }

  const local = assertUniqueVersions(localMigrationVersions(), 'Local');
  const remote = remoteVersionsFromList(parsed);
  const expected = local.slice(0, remote.length);
  if (remote.length > local.length || remote.some((version, index) => version !== expected[index])) {
    throw new Error('Remote migration history is not an exact prefix of repository history.');
  }
  if (requireExact && remote.length !== local.length) {
    throw new Error('Remote migration history does not exactly match repository history after push.');
  }
  process.stdout.write(`Verified remote migration history: ${remote.length}/${local.length} repository migrations.\n`);
};
