const assert: typeof import("node:assert/strict") = require("node:assert/strict");
const test: typeof import("node:test").test = require("node:test");
const {
  parsePrivateDedicationSlug,
}: typeof import("./private-dedication-slug") = require("./private-dedication-slug.ts");

test("parses a valid private dedication slug", () => {
  assert.deepEqual(
    parsePrivateDedicationSlug("para-luis--editorial--AbCdEf0123_ghIJK"),
    {
      shareToken: "AbCdEf0123_ghIJK",
      storyStyle: "editorial",
    },
  );
});

test("preserves a share token that starts with a hyphen", () => {
  assert.deepEqual(
    parsePrivateDedicationSlug("para-luis--noche---AbCdEf0123_ghIJ"),
    {
      shareToken: "-AbCdEf0123_ghIJ",
      storyStyle: "noche",
    },
  );
});

test("rejects an invalid private dedication slug", () => {
  assert.equal(
    parsePrivateDedicationSlug("para-luis--tinta--token-invalido"),
    null,
  );
});
