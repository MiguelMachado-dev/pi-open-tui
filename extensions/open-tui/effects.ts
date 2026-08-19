import type { IconMode } from "./icons.ts";
import { resolveIconMode } from "./icons.ts";

/** 256-color rainbow ramp: red → orange → yellow → green → cyan → blue → violet → magenta. */
const RAINBOW_256 = [196, 202, 220, 226, 46, 48, 51, 39, 21, 57, 129, 201] as const;

const SPARKLES = ["✦", "✧", "✶", "✷", "✸", "✹", "✸", "✷"] as const;
const ASCII_SPARKLES = ["*", "+", "#", "x", "#", "+"] as const;

/** Animation cadence shared by the render timer and the frame counter. */
export const MAX_EFFORT_FRAME_MS = 120;

export function maxEffortFrame(now: number = Date.now()): number {
	return Math.floor(now / MAX_EFFORT_FRAME_MS);
}

function paint(phase: number, text: string): string {
	const paletteLength = RAINBOW_256.length;
	const color = RAINBOW_256[((phase % paletteLength) + paletteLength) % paletteLength]!;
	return `\x1b[38;5;${color}m${text}`;
}

function paintEachChar(startPhase: number, text: string): string {
	let out = "";
	for (let i = 0; i < text.length; i++) {
		out += paint(startPhase + i, text[i]!);
	}
	return out;
}

/**
 * Animated footer segment for the `max` thinking level: the effort glyph and
 * word march through a rainbow ramp while twin sparkles twinkle around it.
 * Visible width is identical on every frame, so the footer never jitters.
 */
export function renderMaxEffortSegment(
	thinkingGlyph: string,
	frame: number,
	iconMode: IconMode,
): string {
	const sparkles = resolveIconMode(iconMode) === "ascii" ? ASCII_SPARKLES : SPARKLES;
	const leftSparkle = sparkles[Math.abs(frame) % sparkles.length]!;
	const rightSparkle = sparkles[Math.abs(frame + 3) % sparkles.length]!;
	return (
		`\x1b[1m` +
		paint(frame, thinkingGlyph) +
		` ` +
		paint(frame + 1, leftSparkle) +
		` ` +
		paintEachChar(frame + 2, "max") +
		` ` +
		paint(frame + 5, rightSparkle) +
		`\x1b[39m\x1b[22m`
	);
}
