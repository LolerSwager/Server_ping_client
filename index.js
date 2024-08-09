import express from "express"
import ping from "net-ping"

// Create an Express application
const app = express()
const PORT = process.env.PORT || 5555

// Create a new ping session
const session = ping.createSession()

app.get("/test", async (req, res) => {
    res.json("hey")
})

// Define a route to handle ping requests
app.get("/", async (req, res) => {
    try {
        const {
            headers: { "x-forwarded-for": forwardedFor },
            connection: { remoteAddress },
        } = req

        // Use the 'forwardedFor' value if it exists, otherwise use the 'remoteAddress' value.
        const clientIpAddress = forwardedFor || remoteAddress

        if (!clientIpAddress) {
            return res.status(400).json({ error: 'Missing IP address in query parameter "ip"' })
        }

        // Validate the IP address format
        const isValidIp = /^(\d{1,3}\.){3}\d{1,3}$|^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/.test(clientIpAddress)
        if (!isValidIp) {
            return res.status(400).json({ error: "Invalid IP address format" })
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
            time: pingResult.ms,
            status: `Client is reachable (ms=${pingResult.ms})`,
        }

        console.log(chalk.bgYellow(`${clientIpAddress} connected with ${pingResult.ms} ms`))

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
