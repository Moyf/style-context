import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const VERSION_PATTERN = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;

function fail(message) {
	console.error(`Release notes error: ${message}`);
	process.exit(1);
}

function parseVersion(version) {
	const match = VERSION_PATTERN.exec(version);
	if (!match) {
		fail(`expected a numeric SemVer tag such as 1.2.3, received "${version}".`);
	}

	return match.slice(1).map(Number);
}

function compareVersions(left, right) {
	for (let index = 0; index < left.length; index += 1) {
		if (left[index] !== right[index]) {
			return left[index] - right[index];
		}
	}

	return 0;
}

function releaseHeading(version, trailingText) {
	const date = trailingText.replace(/^\s*-\s*/, '').trim();
	return date ? `## [${version}] ${date}` : `## [${version}]`;
}

const tag = process.argv[2];
if (!tag) {
	fail('pass the release tag as the first argument.');
}

const [major, minor, patch] = parseVersion(tag);
const changelogPath = resolve(process.cwd(), 'CHANGELOG.md');
const changelog = readFileSync(changelogPath, 'utf8');
const headingPattern = /^## \[(\d+\.\d+\.\d+)\](?:\([^\n)]*\))?(.*)$/gm;
const headings = [...changelog.matchAll(headingPattern)];

const blocks = headings.map((heading, index) => {
	const nextHeading = headings[index + 1];
	const rawBlock = changelog.slice(
		heading.index,
		nextHeading?.index ?? changelog.length,
	);

	return {
		version: heading[1],
		trailingText: heading[2],
		rawBlock,
	};
});

if (!blocks.some((block) => block.version === tag)) {
	fail(`no CHANGELOG entry was found for tag ${tag}.`);
}

const targetVersion = [major, minor, patch];
const notes = blocks
	.filter((block) => {
		const [blockMajor, blockMinor] = parseVersion(block.version);
		return (
			blockMajor === major &&
			blockMinor === minor &&
			compareVersions(parseVersion(block.version), targetVersion) <= 0
		);
	})
	.map((block) => {
		const withoutSeparator = block.rawBlock
			.trim()
			.replace(/\n---\s*$/, '');
		return withoutSeparator.replace(
			headingPattern,
			releaseHeading(block.version, block.trailingText),
		);
	})
	.join('\n\n');

if (!notes) {
	fail(`no ${major}.${minor}.x entries could be extracted from CHANGELOG.md.`);
}

process.stdout.write(`${notes}\n`);
