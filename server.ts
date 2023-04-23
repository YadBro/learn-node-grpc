import path from "path";
import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";
import type { ProtoGrpcType } from "./protos/random";
import { RandomHandlers } from "./protos/randomPackage/Random";
import type { TodoResponse } from "./protos/randomPackage/TodoResponse";

const PORT = 8082;
const PROTOPATH = path.resolve(__dirname, "./protos/random.proto");

const packageDef = protoLoader.loadSync(PROTOPATH);
const grpcObj = grpc.loadPackageDefinition(
  packageDef
) as unknown as ProtoGrpcType;

const randomPackage = grpcObj.randomPackage;

async function main() {
  const server = getServer();

  server.bindAsync(
    `0.0.0.0:${PORT}`,
    grpc.ServerCredentials.createInsecure(),
    (err, port) => {
      if (err) {
        console.error(err);
        return;
      }

      console.log(`Listening on port ${port}`);
      server.start();
    }
  );
}

const todoList: TodoResponse = { todos: [] };

function getServer() {
  const server = new grpc.Server();
  server.addService(randomPackage.Random.service, {
    PingPong: (req, res) => {
      console.log(req.request);
      res(null, { message: "Pong" });
    },
    RandomNumbers: (call) => {
      const { maxValue = 10 } = call.request;
      console.log({ maxValue });

      let runCount = 0;

      const id = setInterval(() => {
        runCount = ++runCount;
        call.write({ num: Math.floor(Math.random() * maxValue) });
        if (runCount >= 10) {
          clearInterval(id);
          call.end();
        }
      }, 500);
    },
    TodoList: (call, callback) => {
      call.on("data", (chunk) => {
        console.log(chunk);
        todoList.todos?.push(chunk);
      });

      call.on("end", () => {
        callback(null, { todos: todoList.todos });
      });
    },
  } as RandomHandlers);

  return server;
}
main();
