const net = require("net"); // Importing the net module to create the server

const clients = []; // Array to store connected clients

// Create the TCP server
const server = net.createServer((socket) => {
  console.log("A new client has connected");

  const clientId = clients.length + 1; // Assign a unique client ID based on the number of clients
  socket.write(`id-${clientId}`); // Send the client ID to the newly connected client

  // Add the new client to the clients array
  clients.push({ id: clientId.toString(), socket });

  // Event listener for incoming data from the client
  socket.on("data", (data) => {
    console.log(`Encrypted data from Client ${clientId}: ${data.toString("hex")}`);

    // Broadcast the data to all other connected clients
    clients.forEach((client) => {
      if (client.socket !== socket) {
        client.socket.write(data); // Send the data to other clients
      }
    });
  });

  // Event listener for when the client disconnects
  socket.on("end", () => {
    console.log(`Client ${clientId} disconnected`);
    // Remove the client from the clients array
    const index = clients.findIndex((client) => client.socket === socket);
    if (index !== -1) clients.splice(index, 1);
  });
});

// Start the server and listen on port 3008
server.listen(3008, "127.0.0.1", () => {
  console.log("Server is listening on port 3008");
});
