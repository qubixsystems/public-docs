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

function extractSections(content) {
  // Split by ## headings (main sections) while preserving the heading
  const sections = [];
  const lines = content.split('\n');
  let currentSection = null;
  let inTableOfContents = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Skip table of contents section
    if (line.includes('## Table of Contents') || line.includes('## Table Of Contents')) {
      inTableOfContents = true;
      continue;
    }
    
    // End of table of contents
    if (inTableOfContents && line.startsWith('##') && !line.includes('Table of Contents')) {
      inTableOfContents = false;
    }
    
    if (inTableOfContents) {
      continue;
    }
    
    // Main document title (single #)
    if (line.startsWith('# ') && !currentSection) {
      currentSection = {
        title: line.substring(2).trim(),
        content: [line],
        isIntro: true
      };
      continue;
    }
    
    // Section headings (##)
    if (line.startsWith('## ')) {
      // Save previous section
      if (currentSection) {
        sections.push(currentSection);
      }
      
      // Start new section
      currentSection = {
        title: line.substring(3).trim(),
        content: [line],
        isIntro: false
      };
      continue;
    }
    
    // Add content to current section
    if (currentSection) {
      currentSection.content.push(line);
    }
  }
  
  // Don't forget the last section
  if (currentSection) {
    sections.push(currentSection);
  }
  
  return sections;
}

function generateDocs() {
  if (!fs.existsSync(INPUT_FILE)) {
    console.error(`❌ Input file ${INPUT_FILE} not found`);
    process.exit(1);
  }
  
  // Clean and recreate docs directory
  if (fs.existsSync(DOCS_DIR)) {
    fs.rmSync(DOCS_DIR, { recursive: true, force: true });
  }
  fs.mkdirSync(DOCS_DIR);
  
  const content = fs.readFileSync(INPUT_FILE, "utf-8");
  const sections = extractSections(content);
  
  if (sections.length === 0) {
    console.error("❌ No sections found in the markdown file");
    process.exit(1);
  }
  
  let navEntries = [];
  
  sections.forEach((section, i) => {
    let filename;
    let navTitle = section.title;
    
    // Handle the intro/main page
    if (section.isIntro) {
      filename = "index.md";
      // Add overview content after the main title
      const overviewContent = `
Welcome to QUBIX, the decentralized application layer for robots that solves the fundamental infrastructure problems facing modern robotics development.

## Quick Navigation

- [Problem Statement](problem-statement.md) - Understanding the robotics integration crisis
- [Solution Overview](solution-overview.md) - How QUBIX solves these problems  
- [Technology Architecture](technology-architecture.md) - Technical deep dive
- [Use Cases](use-cases.md) - Real-world applications
- [Tokenomics](tokenomics.md) - Economic model and token utility
- [Team](team.md) - Meet the QUBIX team
- [Getting Started](getting-started.md) - Start building with QUBIX

## What is QUBIX?

${section.content.slice(1).join('\n')}`;
      
      fs.writeFileSync(path.join(DOCS_DIR, filename), overviewContent, "utf-8");
      navEntries.push(`  - Home: ${filename}`);
    } else {
      // Generate filename from section title
      filename = `${slugify(section.title)}.md`;
      
      // Write section content
      const sectionContent = section.content.join('\n');
      fs.writeFileSync(path.join(DOCS_DIR, filename), sectionContent, "utf-8");
      navEntries.push(`  - ${navTitle}: ${filename}`);
    }
  });
  
  // Generate mkdocs.yml with proper RTD structure
  const mkdocsConfig = `site_name: QUBIX Documentation
site_description: The Decentralized Application Layer for Robots
site_url: https://qubix.readthedocs.io
repo_url: https://github.com/qubix/qubix-docs

theme:
  name: material
  palette:
    - scheme: default
      primary: blue
      accent: blue
  features:
    - navigation.tabs
    - navigation.sections
    - navigation.expand
    - navigation.top
    - search.highlight
    - search.share

nav:
${navEntries.join("\n")}

markdown_extensions:
  - admonition
  - codehilite
  - pymdownx.superfences
  - pymdownx.tabbed
  - toc:
      permalink: true

plugins:
  - search
  - mkdocs-simple-hooks:
      hooks:
        on_pre_build: "docs.hooks:copy_changelog"

extra:
  social:
    - icon: fontawesome/brands/github
      link: https://github.com/qubix
    - icon: fontawesome/brands/twitter  
      link: https://twitter.com/qubix
`;
  
  fs.writeFileSync(MKDOCS_FILE, mkdocsConfig, "utf-8");
  
  console.log(`✅ Success! Created ${sections.length} documentation files:`);
  sections.forEach((section, i) => {
    const filename = section.isIntro ? "index.md" : `${slugify(section.title)}.md`;
    console.log(`   📄 ${filename} - ${section.title}`);
  });
  console.log(`   ⚙️  mkdocs.yml - Configuration file`);
  console.log(`\n🚀 Ready for Read the Docs! Run 'mkdocs serve' to preview locally.`);
}

generateDocs();
