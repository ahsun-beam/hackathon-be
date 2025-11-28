const express = require("express");
const cors = require("cors");
const axios = require("axios");
const dotenv = require("dotenv");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const FORWARD_URL = process.env.FORWARD_URL || "http://localhost:4000/receiver";

const API_ENDPOINT_BEAM = "https://api.beamstudio.ai";

app.use(cors());
app.use(express.json({ limit: "1mb" }));

app.get("/health", (_req, res) => {
  console.log(_req.query);
  res.json({ status: "ok", forwardUrl: FORWARD_URL });
});

app.post("/forward", async (req, res) => {
  const payload = req.body;

  try {
    const upstreamResponse = await axios.post(
      `${API_ENDPOINT_BEAM}/agent-tasks/30be3bae-61b4-44e5-9f18-85ac61eb7ba0/webhook/cf40a37e-5b73-4d21-bbad-86618bb29834?userAccessToken=b10a9442-2266-4dce-8baf-a7d37aae3a54`,
      payload,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    res.status(upstreamResponse.status).json({
      message: "Payload forwarded successfully",
      forwardedTo: FORWARD_URL,
      upstreamStatus: upstreamResponse.status,
      upstreamResponse: upstreamResponse.data,
    });
  } catch (error) {
    const status = error.response?.status || 502;
    res.status(status).json({
      message: "Failed to forward payload",
      forwardedTo: FORWARD_URL,
      error: error.message,
      upstreamResponse: error.response?.data,
    });
  }
});

app.get("/forward-task", async (req, res) => {
  const taskId = req.query.taskId;

  try {
    const authRes = await axios.post(`${API_ENDPOINT_BEAM}/auth/access-token`, {
      apiKey: "b10a9442-2266-4dce-8baf-a7d37aae3a54",
    });
    const res1 = await axios.get(
      `${API_ENDPOINT_BEAM}/agent-tasks/${taskId}`,
      {
        headers: {
          "Content-Type": "application/json",
          "current-workspace-id": "c3896c44-7117-4010-a656-c4dde4ee811f",
          "Authorization": `Bearer ${authRes.data.idToken}`
        },
      }
    );

    res.json(res1.data);
  } catch (error) {
    const status = error.response?.status || 502;
    res.status(status).json({
      message: "Failed to forward payload",
      forwardedTo: FORWARD_URL,
      error: error.message,
      upstreamResponse: error.response?.data,
    });
  }
});

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Forwarding service listening on http://localhost:${PORT}`);
});
