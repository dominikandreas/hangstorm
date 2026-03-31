const PORT = process.env.PORT || 3000;

Bun.serve({
  port: PORT,
  fetch(req) {
    let url = new URL(req.url);
    let path = url.pathname;
    
    if (path === "/") {
      path = "/index.html";
    }

    const file = Bun.file("." + path);
    return new Response(file);
  },
  error() {
    return new Response("404 Not Found", { status: 404 });
  },
});

console.log(`Development server running at http://localhost:${PORT}`);
console.log(`Ensure you are on the same local network to access from Quest 3`);
