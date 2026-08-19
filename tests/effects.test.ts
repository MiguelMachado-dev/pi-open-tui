import assert from "node:assert/strict";
import test from "node:test";
import {
	MAX_EFFORT_FRAME_MS,
	maxEffortFrame,
	renderMaxEffortSegment,
} from "../extensions/open-tui/effects.ts";
import { resolveGlyphs } from "../extensions/open-tui/icons.ts";
import { stripAnsi, visibleWidth } from "../extensions/open-tui/utils.ts";

test("max effort frame derives from wall-clock time", () => {
	assert.equal(maxEffortFrame(0), 0);
	assert.equal(maxEffortFrame(MAX_EFFORT_FRAME_MS - 1), 0);
	assert.equal(maxEffortFrame(MAX_EFFORT_FRAME_MS), 1);
	assert.equal(maxEffortFrame(MAX_EFFORT_FRAME_MS * 7 + 1), 7);
});

test("max effort segment paints the word with rainbow colors and bold", () => {
	const segment = renderMaxEffortSegment(resolveGlyphs("nerd").thinking, 0, "nerd");
	assert.ok(segment.startsWith("\x1b[1m"), `missing bold prefix\n${segment}`);
	assert.match(segment, /\x1b\[38;5;\d+m/);
	assert.ok(stripAnsi(segment).includes("max"), `word missing\n${segment}`);
	assert.ok(segment.includes(resolveGlyphs("nerd").thinking), `thinking glyph missing\n${segment}`);
	assert.ok(segment.endsWith("\x1b[39m\x1b[22m"), `missing resets\n${segment}`);
});

test("max effort segment keeps a constant visible width while animating", () => {
	const widths = new Set<number>();
	for (let frame = 0; frame < MAX_EFFORT_FRAME_MS; frame++) {
		widths.add(visibleWidth(renderMaxEffortSegment(resolveGlyphs("nerd").thinking, frame, "nerd")));
	}
	assert.equal(widths.size, 1, `width must not jitter, saw ${[...widths].join(", ")}`);
});

test("max effort segment animates between frames", () => {
	const glyph = resolveGlyphs("nerd").thinking;
	const first = renderMaxEffortSegment(glyph, 0, "nerd");
	const second = renderMaxEffortSegment(glyph, 1, "nerd");
	assert.notEqual(first, second);
	assert.equal(stripAnsi(first), `${glyph} ✦ max ✷`);
	assert.equal(stripAnsi(second), `${glyph} ✧ max ✸`);
});

test("max effort segment cycles the full rainbow palette", () => {
	const paletteMatches = (frame: number) =>
		renderMaxEffortSegment(resolveGlyphs("ascii").thinking, frame, "ascii").match(/\x1b\[38;5;(\d+)m/g) ?? [];
	const colors = new Set<string>();
	for (let frame = 0; frame < 12; frame++) {
		for (const code of paletteMatches(frame)) colors.add(code);
	}
	assert.ok(colors.size >= 8, `expected a wide rainbow, got ${colors.size} colors`);
});

test("ascii mode twinkles with ascii sparkles only", () => {
	const segment = renderMaxEffortSegment(resolveGlyphs("ascii").thinking, 0, "ascii");
	assert.ok(segment.includes(resolveGlyphs("ascii").thinking), `ascii thinking glyph missing\n${segment}`);
	assert.match(segment, /[*+#x]/);
	assert.ok(!/[✦✧✶✷✸✹]/.test(segment), `unicode sparkles leaked into ascii mode\n${segment}`);
});

test("max effort segment wraps negative and huge frames safely", () => {
	const tiny = renderMaxEffortSegment("~", -1, "ascii");
	const huge = renderMaxEffortSegment("~", Number.MAX_SAFE_INTEGER / 2, "ascii");
	assert.ok(stripAnsi(tiny).includes("max"));
	assert.ok(stripAnsi(huge).includes("max"));
});
