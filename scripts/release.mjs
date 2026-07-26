#!/usr/bin/env node

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import {
	assertNextVersion,
	prepareVersionMetadata,
	promoteUnreleased,
} from './release-utils.mjs';

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
const METADATA_FILES = [
	'package.json',
	'package-lock.json',
	'manifest.json',
	'versions.json',
	'CHANGELOG.md',
];
const REQUIRED_ASSETS = ['main.js', 'manifest.json', 'styles.css'];
const POLL_INTERVAL_MS = 3000;
const RUN_DISCOVERY_ATTEMPTS = 40;
const RELEASE_DISCOVERY_ATTEMPTS = 20;
const NPM_COMMAND = process.platform === 'win32' ? 'npm.cmd' : 'npm';

function fail(message) {
	throw new Error(`Release failed: ${message}`);
}

function run(command, args, { capture = false, allowFailure = false } = {}) {
	const result = spawnSync(command, args, {
		cwd: ROOT,
		encoding: 'utf8',
		stdio: capture ? ['ignore', 'pipe', 'pipe'] : 'inherit',
	});
	if (result.error) throw result.error;
	if (result.status !== 0 && !allowFailure) {
		const detail = capture
			? `: ${(result.stderr || result.stdout || '').trim()}`
			: '';
		fail(`${command} ${args.join(' ')} exited with ${result.status}${detail}`);
	}
	return {
		status: result.status ?? 1,
		stdout: result.stdout?.trim() ?? '',
		stderr: result.stderr?.trim() ?? '',
	};
}

function git(args, options) {
	return run('git', args, options);
}

function gh(args, options) {
	return run('gh', args, options);
}

function npm(args, options) {
	return run(NPM_COMMAND, args, options);
}

function sleep(milliseconds) {
	return new Promise((resolvePromise) => {
		setTimeout(resolvePromise, milliseconds);
	});
}

function read(path) {
	return readFileSync(resolve(ROOT, path), 'utf8');
}

function write(path, content) {
	writeFileSync(resolve(ROOT, path), content, 'utf8');
}

function getRepository() {
	const remote = git(['remote', 'get-url', 'origin'], { capture: true }).stdout;
	const match = /github\.com[/:]([^/]+\/[^/]+?)(?:\.git)?$/.exec(remote);
	if (!match) fail(`origin is not a GitHub repository URL: ${remote}`);
	return match[1];
}

function getDefaultBranch() {
	const symbolicRef = git(
		['symbolic-ref', 'refs/remotes/origin/HEAD', '--short'],
		{ capture: true },
	).stdout;
	const prefix = 'origin/';
	if (!symbolicRef.startsWith(prefix)) {
		fail(`Cannot determine origin's default branch from ${symbolicRef}.`);
	}
	return symbolicRef.slice(prefix.length);
}

function getCurrentBranch() {
	const branch = git(['branch', '--show-current'], { capture: true }).stdout;
	if (!branch) fail('Releases must run from a named branch, not detached HEAD.');
	return branch;
}

function checkCleanWorktree() {
	const status = git(['status', '--porcelain=v1'], { capture: true }).stdout;
	if (status) {
		fail('Working tree is not clean. Commit, stash, or discard changes first.');
	}
}

function checkRemoteReleaseDoesNotExist(version, repository) {
	const tag = git(
		['ls-remote', '--tags', 'origin', `refs/tags/${version}`],
		{ capture: true },
	).stdout;
	if (tag) fail(`Remote tag ${version} already exists.`);

	const release = gh(
		['release', 'view', version, '--repo', repository],
		{ capture: true, allowFailure: true },
	);
	if (release.status === 0) fail(`GitHub Release ${version} already exists.`);
}

function readReleaseSources() {
	return {
		packageJson: read('package.json'),
		packageLock: read('package-lock.json'),
		manifest: read('manifest.json'),
		versions: read('versions.json'),
	};
}

function readReleaseSourcesAt(ref) {
	return {
		packageJson: git(['show', `${ref}:package.json`], { capture: true }).stdout,
		packageLock: git(['show', `${ref}:package-lock.json`], { capture: true }).stdout,
		manifest: git(['show', `${ref}:manifest.json`], { capture: true }).stdout,
		versions: git(['show', `${ref}:versions.json`], { capture: true }).stdout,
	};
}

function assertReleasedMetadata(version, sources, changelog, location) {
	let packageJson;
	let packageLock;
	let manifest;
	let versions;
	try {
		packageJson = JSON.parse(sources.packageJson);
		packageLock = JSON.parse(sources.packageLock);
		manifest = JSON.parse(sources.manifest);
		versions = JSON.parse(sources.versions);
	} catch (error) {
		fail(`Cannot parse release metadata at ${location}: ${error.message}`);
	}

	if (
		packageJson.version !== version ||
		packageLock.version !== version ||
		packageLock.packages?.['']?.version !== version ||
		manifest.version !== version ||
		versions[version] !== manifest.minAppVersion
	) {
		fail(`Release metadata at ${location} is not synchronized for ${version}.`);
	}

	const heading = new RegExp(`^## \\[${version.replaceAll('.', '\\.')}\\] - \\d{4}-\\d{2}-\\d{2}$`, 'm');
	if (!heading.test(changelog)) {
		fail(`CHANGELOG.md at ${location} has no dated ${version} entry.`);
	}
}

function isAncestor(ancestor, descendant) {
	return git(
		['merge-base', '--is-ancestor', ancestor, descendant],
		{ capture: true, allowFailure: true },
	).status === 0;
}

function checkSharedPreflight() {
	checkCleanWorktree();
	gh(['auth', 'status']);
	git(['fetch', 'origin', '--prune']);

	const defaultBranch = getDefaultBranch();
	const currentBranch = getCurrentBranch();
	if (currentBranch !== defaultBranch) {
		fail(`Release must run from ${defaultBranch}, not ${currentBranch}.`);
	}

	return { defaultBranch };
}

function checkPreflight(version) {
	const { defaultBranch } = checkSharedPreflight();

	const localHead = git(['rev-parse', 'HEAD'], { capture: true }).stdout;
	const remoteHead = git(
		['rev-parse', `origin/${defaultBranch}`],
		{ capture: true },
	).stdout;
	if (localHead !== remoteHead) {
		fail(`${defaultBranch} is not exactly synchronized with origin/${defaultBranch}.`);
	}

	const sources = readReleaseSources();
	const packageVersion = JSON.parse(sources.packageJson).version;
	assertNextVersion(packageVersion, version);
	const metadata = prepareVersionMetadata(sources, version);
	const changelog = promoteUnreleased(
		read('CHANGELOG.md'),
		version,
		new Date().toISOString().slice(0, 10),
	);
	const repository = getRepository();
	checkRemoteReleaseDoesNotExist(version, repository);

	return { defaultBranch, metadata, changelog, repository };
}

function checkResumePreflight(version) {
	const { defaultBranch } = checkSharedPreflight();
	if (!isAncestor(`origin/${defaultBranch}`, 'HEAD')) {
		fail(`${defaultBranch} cannot be fast-forwarded from origin/${defaultBranch}.`);
	}

	assertReleasedMetadata(version, readReleaseSources(), read('CHANGELOG.md'), 'HEAD');

	const tagType = git(['cat-file', '-t', version], {
		capture: true,
		allowFailure: true,
	});
	if (tagType.status !== 0 || tagType.stdout !== 'tag') {
		fail(`Resume requires an existing annotated local tag ${version}.`);
	}
	const tagCommit = git(['rev-list', '-n', '1', version], { capture: true }).stdout;
	if (!isAncestor(tagCommit, 'HEAD')) {
		fail(`Tag ${version} must point to a commit reachable from ${defaultBranch}.`);
	}

	assertReleasedMetadata(
		version,
		readReleaseSourcesAt(version),
		git(['show', `${version}:CHANGELOG.md`], { capture: true }).stdout,
		`tag ${version}`,
	);

	const repository = getRepository();
	checkRemoteReleaseDoesNotExist(version, repository);
	return { defaultBranch, repository, tagCommit };
}

function applyReleaseMetadata(metadata, changelog) {
	write('package.json', metadata.packageJson);
	write('package-lock.json', metadata.packageLock);
	write('manifest.json', metadata.manifest);
	write('versions.json', metadata.versions);
	write('CHANGELOG.md', changelog);
}

async function getRunId(repository, headSha) {
	for (let attempt = 0; attempt < RUN_DISCOVERY_ATTEMPTS; attempt += 1) {
		const result = gh(
			[
				'run',
				'list',
				'--repo',
				repository,
				'--workflow',
				'Release',
				'--limit',
				'20',
				'--json',
				'databaseId,headSha',
			],
			{ capture: true },
		);
		const runs = JSON.parse(result.stdout);
		const releaseRun = runs.find((candidate) => candidate.headSha === headSha);
		if (releaseRun) return String(releaseRun.databaseId);
		await sleep(POLL_INTERVAL_MS);
	}

	fail('Timed out waiting for the GitHub Actions Release workflow to start.');
}

async function verifyRelease(version, repository) {
	for (let attempt = 0; attempt < RELEASE_DISCOVERY_ATTEMPTS; attempt += 1) {
		const result = gh(
			[
				'release',
				'view',
				version,
				'--repo',
				repository,
				'--json',
				'tagName,isDraft,isPrerelease,assets,url',
			],
			{ capture: true, allowFailure: true },
		);
		if (result.status === 0) {
			const release = JSON.parse(result.stdout);
			const assets = new Set(release.assets.map((asset) => asset.name));
			const missing = REQUIRED_ASSETS.filter((asset) => !assets.has(asset));
			if (
				release.tagName !== version ||
				release.isDraft ||
				release.isPrerelease ||
				missing.length > 0
			) {
				fail(
					`Release verification failed (tag=${release.tagName}, draft=${release.isDraft}, prerelease=${release.isPrerelease}, missing=${missing.join(', ') || 'none'}).`,
				);
			}
			console.log(`Release verified: ${release.url}`);
			return;
		}
		await sleep(POLL_INTERVAL_MS);
	}

	fail(`Timed out waiting for GitHub Release ${version}.`);
}

function parseArguments(args) {
	if (args.includes('--help') || args.includes('-h')) {
		console.log('Usage: npm run release -- <major.minor.patch>');
		console.log('       npm run release:dry-run -- <major.minor.patch>');
		process.exit(0);
	}
	const dryRun = args.includes('--dry-run');
	const resume = args.includes('--resume');
	const positional = args.filter((arg) => arg !== '--dry-run' && arg !== '--resume');
	if (positional.length !== 1) {
		fail('Pass exactly one numeric SemVer version, for example: 0.3.0.');
	}
	return { dryRun, resume, version: positional[0] };
}

async function main() {
	const { dryRun, resume, version } = parseArguments(process.argv.slice(2));
	const preflight = resume
		? checkResumePreflight(version)
		: checkPreflight(version);
	if (dryRun) {
		const mode = resume ? 'Resume dry run' : 'Dry run';
		console.log(
			`${mode} passed. ${version} can be released from ${preflight.defaultBranch}; no files, commits, tags, or remote state were changed.`,
		);
		return;
	}
	if (resume) {
		npm(['run', 'check']);
		git([
			'push',
			'--atomic',
			'origin',
			`HEAD:refs/heads/${preflight.defaultBranch}`,
			`refs/tags/${version}`,
		]);

		const runId = await getRunId(preflight.repository, preflight.tagCommit);
		gh(['run', 'watch', runId, '--repo', preflight.repository, '--exit-status']);
		await verifyRelease(version, preflight.repository);
		return;
	}

	applyReleaseMetadata(preflight.metadata, preflight.changelog);
	npm(['run', 'check']);
	git(['add', ...METADATA_FILES]);
	git(['commit', '-m', `build: ${version}`]);
	git(['tag', '-a', version, '-m', `Release ${version}`]);

	const headSha = git(['rev-parse', 'HEAD'], { capture: true }).stdout;
	git([
		'push',
		'--atomic',
		'origin',
		`HEAD:refs/heads/${preflight.defaultBranch}`,
		`refs/tags/${version}`,
	]);

	const runId = await getRunId(preflight.repository, headSha);
	gh(['run', 'watch', runId, '--repo', preflight.repository, '--exit-status']);
	await verifyRelease(version, preflight.repository);
}

const isDirectExecution = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isDirectExecution) {
	main().catch((error) => {
		console.error(error.message);
		process.exitCode = 1;
	});
}
