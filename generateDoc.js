const fs = require("fs");
const path = require("path");

const INPUT_FILE = "qubix_rtd_docs.md";
const DOCS_DIR = path.join(__dirname, "docs");
const MKDOCS_FILE = path.join(__dirname, "mkdocs.yml");

function slugify(str) {
  return str
    .toLowerCase()
    .replace(/[^\w]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function generateDocs() {
  if (!fs.existsSync(INPUT_FILE)) {
    console.error(`❌ Input file ${INPUT_FILE} not found`);
    process.exit(1);
  }

  if (!fs.existsSync(DOCS_DIR)) {
    fs.mkdirSync(DOCS_DIR);
  }

  const content = fs.readFileSync(INPUT_FILE, "utf-8");

  // Split into sections by top-level heading
  const parts = content.split(/^# /gm).filter(Boolean);

  if (parts.length === 0) {
    console.error("❌ No top-level (#) headings found in the markdown file");
    process.exit(1);
  }

  let navEntries = [];

  parts.forEach((part, i) => {
    const lines = part.split("\n");
    const title = lines[0].trim();
    const body = lines.slice(1).join("\n").trim();
    const slug = slugify(title);

    const filename = i === 0 ? "index.md" : `${slug}.md`;
    const finalContent = `# ${title}\n\n${body}\n`;

    fs.writeFileSync(path.join(DOCS_DIR, filename), finalContent, "utf-8");

    navEntries.push(`  - ${title}: ${filename}`);
  });

  const mkdocsConfig = `site_name: Qubix Documentation
site_url: https://qubix.readthedocs.io
theme:
  name: material
nav:
${navEntries.join("\n")}
`;

  fs.writeFileSync(MKDOCS_FILE, mkdocsConfig, "utf-8");

  console.log("✅ Done! Created", parts.length, "markdown files in /docs");
}

generateDocs();

