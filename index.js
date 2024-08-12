import express from "express"
import ping from "net-ping"

// Create an Express application
const app = express()
const PORT = process.env.PORT || 5555

// Create a new ping session
const session = ping.createSession({
    retries: 1, // Only one retry
    timeout: 1000, // Timeout of 1 second
})


app.get("/alive", async (req, res) => {
    res.send("im alive")
})

app.get("/gui", async (req, res) => {
    res.send("ebola")
})

// Define a route to handle ping requests
app.get("/", async (req, res) => {
    try {
        const {
            headers: { "x-forwarded-for": forwardedFor },
            connection: { remoteAddress },
        } = req

        // Use the 'forwardedFor' value if it exists, otherwise use the 'remoteAddress' value.
        let clientIpAddress = forwardedFor || remoteAddress

        if (!clientIpAddress) {
            return res.status(400).json({ error: 'Missing IP address in query parameter "ip"' })
        }

        // If the address is in the IPv6-mapped IPv4 format, extract the IPv4 part
        if (clientIpAddress.startsWith("::ffff:")) {
            clientIpAddress = clientIpAddress.split(":").pop()
        }

        // Prepare a promise-based ping request
        const pingPromise = new Promise((resolve, reject) => {
            session.pingHost(clientIpAddress, (error, target, sent, rcvd) => {
                if (error) {
                    console.error(`Ping error for ${clientIpAddress}:`, error)
                    reject(error)
                } else {
                    const ms = rcvd - sent
                    resolve({ target, ms })
                }
            })
        })

        const pingResult = await pingPromise

        // Prepare response in JSON format
        const response = {
            ip: clientIpAddress,
            host: pingResult.target,
            alive: true,
            ping: pingResult.ms,
            status: `Client is reachable (ms=${pingResult.ms})`,
        }

        console.log(`${clientIpAddress} connected with ${pingResult.ms} ms`)

        // Send JSON response
        res.json(response)
    } catch (error) {
        console.error("Error occurred:", error)
        res.status(500).json({ error: "Internal server error" })
    }
})

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`)
})

server.timeout = 300000; // Set timeout to 5 minutes