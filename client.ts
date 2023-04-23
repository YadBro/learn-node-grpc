import path from "path";
import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";
import type { ProtoGrpcType } from "./protos/random";
import { RandomHandlers } from "./protos/randomPackage/Random";

const PORT = 8082;
const PROTOPATH = path.resolve(__dirname, "./protos/random.proto");

const packageDef = protoLoader.loadSync(PROTOPATH);
const grpcObj = grpc.loadPackageDefinition(
  packageDef
) as unknown as ProtoGrpcType;

const client = new grpcObj.randomPackage.Random(
  `0.0.0.0:${PORT}`,
  grpc.credentials.createInsecure()
);

const deadline = new Date();
deadline.setSeconds(deadline.getSeconds() + 5);
client.waitForReady(deadline, (err) => {
  if (err) {
    console.error(err);
    return;
  }
  onClientReady();
});

function onClientReady() {
  // client.PingPong({ message: "Ping" }, (err, result) => {
  //   if (err) {
  //     console.error(err);
  //   }
  //   console.log({ result });
  // });

  // const stream = client.RandomNumbers({ maxValue: 82 });
  // stream.on("data", (chunk) => {
  //   console.log("chunk", chunk);
  // });

  // stream.on("end", () => {
  //   console.log("Communication ended.");
  // });

  const stream = client.todoList((err, result) => {
    if (err) {
      console.error(err);
      return;
    }
    const todos = result?.todos;

    console.log(todos);
  });

  stream.write({ todo: "walk the wife", status: "Never" });
  stream.write({ todo: "walk the dog", status: "Doing" });
  stream.write({ todo: "get a real job", status: "Impossible" });
  stream.write({ todo: "feed the dog", status: "Done" });
  stream.end();
}
