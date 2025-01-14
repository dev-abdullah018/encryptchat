const net = require("net"); // Import the net module for TCP connection
const readline = require("readline/promises"); // Import readline to read user input
const { Transform } = require("stream"); // Import Transform class to manipulate data streams

// Encryption class to modify data before sending
class Encrypt extends Transform {
  constructor() {
    super();
    this.oddNumbers = 13; // Odd index increment
    this.evenNumbers = 22; // Even index increment
  }

  // Modify data on transformation
  _transform(chunk, encoding, callback) {
    for (let i = 0; i < chunk.length; ++i) {
      if (chunk[i] !== 255) { // Skip 255 values
        if (i % 2 === 0) {
          chunk[i] += this.oddNumbers;
          this.oddNumbers += 2; // Increment for odd positions
        } else {
          chunk[i] += this.evenNumbers;
          this.evenNumbers += 2; // Increment for even positions
        }
      }
    }
    callback(null, chunk); // Pass transformed chunk
  }
}

// Decryption class to reverse the encryption process
class Dencrypt extends Transform {
  constructor() {
    super();
    this.oddNumbers = 13;
    this.evenNumbers = 22;
  }

  // Reverse the transformation for decryption
  _transform(chunk, encoding, callback) {
    for (let i = 0; i < chunk.length; ++i) {
      if (chunk[i] !== 255) { // Skip 255 values
        if (i % 2 === 0) {
          chunk[i] -= this.oddNumbers;
          this.oddNumbers += 2;
        } else {
          chunk[i] -= this.evenNumbers;
          this.evenNumbers += 2;
        }
      }
    }
    callback(null, chunk); // Pass decrypted chunk
  }
}

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

let id; // To store the client's ID

// Function to send encrypted messages
const sendMessage = (socket, message) => {
  const encryptStream = new Encrypt(); // Create an encryption stream
  encryptStream.end(Buffer.from(message, "utf-8")); // Encrypt the message
  encryptStream.on("data", (chunk) => {
    socket.write(chunk); // Send the encrypted message to the server
  });
};

// Create a connection to the server
const socket = net.createConnection(
  { host: "127.0.0.1", port: 3008 },
  async () => {
    console.log("Connected to the server!");

    // Function to continuously prompt for user input
    const promptInput = async () => {
      while (true) {
        const message = await rl.question("Enter a message > "); // Prompt user for a message
        if (id) {
          // Send encrypted message if the client ID is set
          sendMessage(socket, `Client ${id} message: ${message}`);
        }
      }
    };

    // Handle incoming data from the server
    socket.on("data", (data) => {
      const dataString = data.toString("utf-8");

      if (dataString.startsWith("id-")) {
        console.log()
        // If the server sends the client ID
        id = dataString.substring(3); // Extract the ID from the message
        console.log(`Your Client ID is ${id}`);
      } else {
        console.log()
        // Decrypt and display the received message
        const decryptStream = new Dencrypt();
        decryptStream.end(data); // Decrypt the incoming data
        decryptStream.on("data", (chunk) => {
          const message = chunk.toString("utf-8");
          console.log(`Message received: ${message}`);
        });
      }
    });

    // Start the input loop for the client
    promptInput();
  }
);

// Handle server disconnection
socket.on("end", () => {
  console.log("Disconnected from the server");
});
