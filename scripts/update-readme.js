import ts from "typescript";
import { promises as fs } from "fs";

const doNotEditMessage =
  "<!-- Auto-generated README. Do not edit directly -->\n";

async function main() {
  var [APIText, nodeDocs, browserDocs, coreDocTemplate, rootDocTemplate] =
    await Promise.all([
      generateAPIDocs(),
      fs.readFile("./packages/node/README.md", {
        encoding: "utf-8",
      }),
      fs.readFile("./packages/browser/README.md", {
        encoding: "utf-8",
      }),
      fs.readFile("./doctemplate/core.md", {
        encoding: "utf-8",
      }),
      fs.readFile("./doctemplate/root.md", {
        encoding: "utf-8",
      }),
    ]);
  coreDocTemplate = coreDocTemplate.replace("##API", "## API\n\n" + APIText);
  rootDocTemplate = rootDocTemplate
    .replace("##Core", coreDocTemplate)
    .replace("##Node", "<br />\n\n" + nodeDocs)
    .replace("##Browser", "<br />\n\n" + browserDocs);
  await Promise.all([
    fs.writeFile(
      "./packages/core/README.md",
      doNotEditMessage + "\n" + coreDocTemplate,
    ),
    fs.writeFile("./README.md", doNotEditMessage + "\n" + rootDocTemplate),
  ]);
}

async function generateAPIDocs() {
  const sourceCode = await fs.readFile("./packages/core/src/types.ts", {
    encoding: "utf-8",
  });
  const parser = ts.createSourceFile(
    "parser.ts",
    sourceCode,
    ts.ScriptTarget.ES2021,
  );
  var code = "";
  var text = "";
  code += "```typescript\n";
  parser.forEachChild((n) => {
    const [_code, _text] = handleParserChild(n, sourceCode);
    if (_code === null || _text === null) return;
    code += _code + "\n";
    text += _text;
  });
  // Strip last newline character
  code = code.slice(0, code.length - 1);
  code += "```\n\n";
  text = text.slice(0, text.length - 2);
  return code + text;
}

function handleParserChild(child, sourceCode) {
  if (child.kind !== ts.SyntaxKind.TypeAliasDeclaration) return [null, null];
  const name = child.name.escapedText;
  var code = `type ${name} =`;
  var text = "";
  if (child.type.kind === ts.SyntaxKind.TypeLiteral) {
    const [_code, _text] = handleTypeLiteral(child, sourceCode);
    code += " " + _code + ";";
    if (name == "Options") text += _text;
  } else if (child.type.kind === ts.SyntaxKind.UnionType) {
    code += sourceCode.substring(child.type.pos, child.type.end) + ";\n";
    // No text
  }
  return [code, text];
}

function handleTypeLiteral(child, sourceCode, prefix, indent = 0) {
  const code = ["{"];
  var text = "";
  const members = [...child.type.members];
  members.sort((a, b) => {
    // First required arguments
    // Last deprecated arguments
    // and then alphabetically
    if (a.questionToken && !b.questionToken) return 1;
    if (!a.questionToken && b.questionToken) return -1;
    const AisDeprecated = a.jsDoc?.[0].tags?.some(
      (t) => t.tagName.escapedText == "deprecated",
    );
    const BisDeprecated = b.jsDoc?.[0].tags?.some(
      (t) => t.tagName.escapedText == "deprecated",
    );
    if (AisDeprecated && !BisDeprecated) return 1;
    if (!AisDeprecated && BisDeprecated) return -1;
    return a.name.escapedText.localeCompare(b.name.escapedText);
  });
  members.forEach((m) => {
    var codeType = "";
    var textType = "";
    if (m.type.kind === ts.SyntaxKind.TypeLiteral) {
      text += createText(m, "Object", sourceCode, prefix);
      const [_code, _text] = handleTypeLiteral(
        m,
        sourceCode,
        m.name.escapedText,
        indent + 2,
      );
      codeType = _code;
      text += _text;
    } else {
      textType = sourceCode.substring(m.type.pos, m.type.end).trim();
      switch (m.type.kind) {
        case ts.SyntaxKind.UnionType:
          codeType = "Union";
          break;
        case ts.SyntaxKind.FunctionType:
          codeType = "Function";
          break;
      }
      text += createText(m, textType, sourceCode, prefix);
    }
    code.push(createCode(m, codeType || textType, indent));
  });
  code.push("}");
  return [code.join("\n" + " ".repeat(indent)), text];
}

function createCode(member, type, indent) {
  var code = [];
  const deprecated = member.jsDoc?.[0].tags?.some(
    (t) => t.tagName.escapedText == "deprecated",
  );
  code.push(
    `  ${member.name.escapedText}${member.questionToken ? "?" : ""}: ${type};${
      deprecated ? "  // DEPRECATED" : ""
    }`,
  );
  return code.join(" ".repeat(indent) + "\n");
}

function createText(obj, type, sourceCode, prefix) {
  if (type.startsWith("| ")) {
    type = type.slice(2);
  }
  var text = "";
  text += "### ";
  if (prefix) text += prefix + ".";
  text += obj.name.escapedText + "\n\n";
  text += "**Type** `" + type + "`\n\n";
  if (!obj.questionToken) text += "**Required**\n\n";
  text += handleJsDoc(obj, sourceCode);
  text += "<hr />\n\n";
  return text;
}

function handleJsDoc(obj) {
  if (!obj.jsDoc) return "";
  var text = "";
  const jsDoc = obj.jsDoc[0];
  jsDoc.tags?.forEach((t) => {
    text += "**" + t.tagName.escapedText + "**";
    if (t.comment) text += " `" + t.comment + "`";
    text += "\n\n";
  });
  text += jsDoc.comment + "\n\n";
  return text;
}

main().catch(console.error);
