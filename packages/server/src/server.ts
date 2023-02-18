import fastify from "fastify";
import QRCodeNode from "@qrcode-js/node";

import type { Options } from "@qrcode-js/core";

const server = fastify();

server.get("/health", async (_, rep) => {
  rep.status(200).send({
    version: process.env.npm_package_version,
  });
});

server.post<{
  Body: Options;
}>("/", async (req, rep) => {
  const body = req.body;
  if (!body) return rep.status(400).send("No body provided");
  console.log(body);
  const QR = QRCodeNode();
  QR.setOptions(body);
  return await QR.draw();
});

server.listen({ port: 8000 }, (err, address) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(`Server listening at ${address}`);
});
