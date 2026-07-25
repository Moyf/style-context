import type { TFile } from 'obsidian';
import { IMAGE_EXTENSIONS } from '../constants';

/**
 * Returns true if the given file has an image extension recognized by
 * the resource preview system.
 */
export function isImageFile(file: TFile): boolean {
	return IMAGE_EXTENSIONS.has(file.extension.toLowerCase());
}
