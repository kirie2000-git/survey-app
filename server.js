const http = require("http");
const fs = require("fs");

const server = http.createServer((req, res) => {
  if (req.method === "GET") {
    const html = fs.readFileSync("index.html");
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(html);
  }

  if (req.method === "POST" && req.url === "/submit") {
    let body = "";

    req.on("data", chunk => {
      body += chunk;
    });

    req.on("end", () => {
      const data = JSON.parse(body);

      const file = JSON.parse(fs.readFileSync("data.json"));
      file.push(data);

      fs.writeFileSync("data.json", JSON.stringify(file, null, 2));

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ message: "送信完了！" }));
    });
  }
});

server.listen(3000, () => {
  console.log("http://localhost:3000 で起動中");
});