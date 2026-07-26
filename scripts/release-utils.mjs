export const VERSION_PATTERN = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;

export function parseVersion(version) {
	const match = VERSION_PATTERN.exec(version);
	if (!match) {
		throw new Error(
			`Expected a numeric SemVer version such as 1.2.3, received "${version}".`,
		);
	}

	return match.slice(1).map(Number);
}

export function compareVersions(left, right) {
	const leftParts = parseVersion(left);
	const rightParts = parseVersion(right);
	for (let index = 0; index < leftParts.length; index += 1) {
		if (leftParts[index] !== rightParts[index]) {
			return leftParts[index] - rightParts[index];
		}
	}

	return 0;
}

export function assertNextVersion(currentVersion, nextVersion) {
	parseVersion(currentVersion);
	parseVersion(nextVersion);
	if (compareVersions(nextVersion, currentVersion) <= 0) {
		throw new Error(
			`Release version ${nextVersion} must be greater than the current ${currentVersion}.`,
		);
	}
}

function parseJson(source, label) {
	try {
		return JSON.parse(source);
	} catch (error) {
		throw new Error(`Cannot parse ${label}: ${error.message}`);
	}
}

function serializeJson(value) {
	return `${JSON.stringify(value, null, 2)}\n`;
}

/**
 * Returns synchronized package, lockfile, manifest, and compatibility data
 * without writing to disk. Keeping this pure makes the release invariant
 * directly testable before the orchestration script mutates a checkout.
 */
export function prepareVersionMetadata(sources, nextVersion) {
	parseVersion(nextVersion);
	const packageJson = parseJson(sources.packageJson, 'package.json');
	const packageLock = parseJson(sources.packageLock, 'package-lock.json');
	const manifest = parseJson(sources.manifest, 'manifest.json');
	const versions = parseJson(sources.versions, 'versions.json');

	if (!packageLock.packages?.['']) {
		throw new Error('package-lock.json has no root package entry.');
	}
	if (typeof manifest.minAppVersion !== 'string' || !manifest.minAppVersion) {
		throw new Error('manifest.json must define a non-empty minAppVersion.');
	}
	if (versions[nextVersion] !== undefined) {
		throw new Error(
			`versions.json already contains a mapping for ${nextVersion}.`,
		);
	}

	packageJson.version = nextVersion;
	packageLock.version = nextVersion;
	packageLock.packages[''].version = nextVersion;
	manifest.version = nextVersion;
	versions[nextVersion] = manifest.minAppVersion;

	return {
		packageJson: serializeJson(packageJson),
		packageLock: serializeJson(packageLock),
		manifest: serializeJson(manifest),
		versions: serializeJson(versions),
	};
}

/** Promotes the required Unreleased section to a dated release heading. */
export function promoteUnreleased(changelog, version, date) {
	parseVersion(version);
	if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
		throw new Error(`Expected an ISO date (YYYY-MM-DD), received "${date}".`);
	}

	const heading = /^## \[Unreleased\]\s*$/m;
	const match = heading.exec(changelog);
	if (!match || match.index === undefined) {
		throw new Error('CHANGELOG.md must contain a ## [Unreleased] section.');
	}

	const contentStart = match.index + match[0].length;
	const sectionEnd = changelog.indexOf('\n---', contentStart);
	const body = changelog.slice(
		contentStart,
		sectionEnd === -1 ? changelog.length : sectionEnd,
	).trim();
	if (!body) {
		throw new Error('The ## [Unreleased] section has no release notes.');
	}

	return `${changelog.slice(0, match.index)}## [${version}] - ${date}${changelog.slice(contentStart)}`;
}
