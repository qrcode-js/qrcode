import ts from "typescript";
import { promises as fs } from "fs";

async function main() {
  const sourceCode = await fs.readFile("./packages/core/src/types.ts", {
    encoding: "utf-8",
  });
  const parser = ts.createSourceFile(
    "parser.ts",
    sourceCode,
    ts.ScriptTarget.ES2021
  );
  var code = "";
  var text = "";
  code += "```typescript\n";
  parser.forEachChild((n) => {
    if (n.kind !== ts.SyntaxKind.TypeAliasDeclaration) return;
    const name = n.name.escapedText;
    if (n.type.kind === ts.SyntaxKind.TypeLiteral) {
      code += "type " + name + " = {\n";
      const members = [...n.type.members];
      members.sort((a, b) => {
        // Before required arguments and then alphabetically
        if (a.questionToken && !b.questionToken) return 1;
        if (!a.questionToken && b.questionToken) return -1;
        return a.name.escapedText.localeCompare(b.name.escapedText);
      });
      members.forEach((m) => {
        var type;
        switch (m.type.kind) {
          case ts.SyntaxKind.TypeLiteral:
            type = codeTypeLiteral(m.type.members, sourceCode);
            break;
          case ts.SyntaxKind.UnionType:
            type = "Union";
            break;
          case ts.SyntaxKind.FunctionType:
            type = "Function";
            break;
          default:
            type = sourceCode.substring(m.type.pos, m.type.end).trim();
            break;
        }
        code += `  ${m.name.escapedText}${
          m.questionToken ? "?" : ""
        }: ${type};\n`;
      });
      members.forEach((m) => {
        text += handleTypeLiteral(m, sourceCode);
        if (m.type.kind === ts.SyntaxKind.TypeLiteral) {
          m.type.members.forEach(
            (k) =>
              (text += handleTypeLiteral(k, sourceCode, m.name.escapedText))
          );
        }
      });
      code += "}\n";
    } else if (n.type.kind === ts.SyntaxKind.UnionType) {
      code += "type" + sourceCode.substring(n.name.pos, n.end) + "\n";
    }
  });
  code += "```\n";
  await fs.writeFile("prova.md", code + text);
}

function codeTypeLiteral(members, sourceCode) {
  var text = "{\n";
  members.forEach((m) => {
    var type;
    switch (m.type.kind) {
      case ts.SyntaxKind.UnionType:
        type = "Union";
        break;
      case ts.SyntaxKind.FunctionType:
        type = "Function";
        break;
      default:
        type = sourceCode.substring(m.type.pos, m.type.end).trim();
        break;
    }
    text += `    ${m.name.escapedText}${
      m.questionToken ? "?" : ""
    }: ${type};\n`;
  });
  text += "  }";
  return text;
}

function handleTypeLiteral(obj, sourceCode, prefix) {
  var type;
  switch (obj.type.kind) {
    case ts.SyntaxKind.TypeLiteral:
      type = "object";
      break;
    default:
      type = sourceCode.substring(obj.type.pos, obj.type.end).trim();
      break;
  }
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
    text += " `" + t.comment + "`";
    text += "\n\n";
  });
  text += jsDoc.comment + "\n\n";
  return text;
}

main().catch(console.error);
