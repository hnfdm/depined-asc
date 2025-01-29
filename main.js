const fs = require("fs");
const displayBanner = require("./config/banner");
const colors = require("./config/colors");
const logger = require("./config/logger");
const https = require("https");
const { HttpsProxyAgent } = require("https-proxy-agent");

const CONSTANTS = {
  API: {
    BASE_URL: "https://api.depined.org/api",
    ENDPOINTS: {
      USER_DETAILS: "/user/details",
      WIDGET_CONNECT: "/user/widget-connect",
      EPOCH_EARNINGS: "/stats/epoch-earnings",
    },
  },
  FILES: {
    JWT_PATH: "./data.txt",
    PROXY_PATH: "./proxies.txt", // Path for the proxy list
  },
  DELAYS: {
    MIN: 300,
    MAX: 2700,
  },
  MESSAGES: {
    ERRORS: {
      FILE_READ: "Error reading file",
      NO_JWT: "No JWT found in data.txt",
      NO_PROXY: "No proxies found in proxies.txt",
      INITIAL_SETUP: "Initial setup failed",
      UNCAUGHT: "Uncaught Exception",
      UNHANDLED: "Unhandled Rejection",
    },
    INFO: {
      CONNECTED: "Connected",
      FOUND_ACCOUNTS: "Found",
      ACCOUNTS: "accounts",
    },
    LOG_FORMAT: {
      EARNINGS: "Earnings",
      EPOCH: "Epoch",
      ERROR: "Error",
    },
  },
};

const formatNumber = (number) => {
  const num = typeof number === "string" ? parseFloat(number) : number;

  if (num >= 1_000_000_000) {
    return (num / 1_000_000_000).toFixed(2) + "B";
  } else if (num >= 1_000_000) {
    return (num / 1_000_000).toFixed(2) + "M";
  } else if (num >= 1_000) {
    return (num / 1_000).toFixed(2) + "K";
  }

  return num.toFixed(2);
};

const getRandomDelay = () => {
  return Math.floor(
    Math.random() * (CONSTANTS.DELAYS.MAX - CONSTANTS.DELAYS.MIN + 1) +
      CONSTANTS.DELAYS.MIN
  );
};

const readFile = (path) => {
  try {
    const data = fs.readFileSync(path, "utf8");
    return data.split("\n").filter((line) => line.trim() !== "");
  } catch (error) {
    logger.error(`${CONSTANTS.MESSAGES.ERRORS.FILE_READ}: ${error.message}`);
    return [];
  }
};

const getProxyAgent = (proxy) => {
  return new HttpsProxyAgent(`http://${proxy}`);
};

const runAccountFlow = async (jwt, proxy) => {
  const createHeaders = () => ({
    Authorization: `Bearer ${jwt}`,
    "Content-Type": "application/json",
    Origin: "chrome-extension://pjlappmodaidbdjhmhifbnnmmkkicjoc",
    "Content-Length": 18,
  });

  const apiEndpoint = CONSTANTS.API.ENDPOINTS;
  let username = jwt.substr(0, 10) + "...";

  // Function to extract the IP from the proxy string
  const extractProxyIP = (proxy) => {
    const match = proxy.match(/^https?:\/\/(?:.*@)?([^:]+):\d+/);
    if (match) {
      return match[1]; // Return the IP part
    }
    return proxy; // If it's not in the expected format, return the proxy as is
  };

  try {
    const agent = getProxyAgent(proxy);
    const proxyIP = extractProxyIP(proxy); // Get the IP of the proxy

    const userDetailsResponse = await fetch(
      CONSTANTS.API.BASE_URL + apiEndpoint.USER_DETAILS,
      {
        method: "GET",
        headers: createHeaders(),
        agent,
      }
    );

    if (!userDetailsResponse.ok) {
      throw new Error(
        `Failed to fetch user details: ${userDetailsResponse.status}`
      );
    }

    const userDetails = await userDetailsResponse.json();

    username = userDetails.data.username;
    logger.info(
      `${colors.accountName}[${username}]${colors.reset} ${CONSTANTS.MESSAGES.INFO.CONNECTED}`
    );

    while (true) {
      try {
        const delay = getRandomDelay();
        await new Promise((resolve) => setTimeout(resolve, delay));

        const widgetConnectResponse = await fetch(
          CONSTANTS.API.BASE_URL + apiEndpoint.WIDGET_CONNECT,
          {
            method: "POST",
            headers: createHeaders(),
            body: JSON.stringify({ connected: true }),
            agent,
          }
        );

        if (!widgetConnectResponse.ok) {
          throw new Error(
            `Failed to post widget connect: ${widgetConnectResponse.status}`
          );
        }

        const earningsResponse = await fetch(
          CONSTANTS.API.BASE_URL + apiEndpoint.EPOCH_EARNINGS,
          {
            method: "GET",
            headers: createHeaders(),
            agent,
          }
        );

        if (!earningsResponse.ok) {
          throw new Error(
            `Failed to fetch earnings: ${earningsResponse.status}`
          );
        }

        const earningsData = await earningsResponse.json();
        const formattedEarnings = formatNumber(earningsData.data.earnings);

        logger.success(
          `${colors.accountName}[${username}]${colors.reset} ${CONSTANTS.MESSAGES.INFO.CONNECTED} | ${colors.taskComplete}${CONSTANTS.MESSAGES.LOG_FORMAT.EARNINGS}: ${formattedEarnings}${colors.reset} (${colors.accountInfo}${CONSTANTS.MESSAGES.LOG_FORMAT.EPOCH}: ${earningsData.data.epoch}${colors.reset}) | Proxy: ${colors.accountWarning}[${proxyIP}]${colors.reset}`
        );
      } catch (error) {
        logger.error(
          `${colors.accountName}[${username}]${colors.reset} ${colors.taskFailed}${CONSTANTS.MESSAGES.LOG_FORMAT.ERROR}: ${error.message}${colors.reset}`
        );
        await new Promise((resolve) =>
          setTimeout(resolve, CONSTANTS.DELAYS.MIN)
        );
      }
    }
  } catch (error) {
    logger.error(
      `${colors.accountName}[${username}]${colors.reset} ${colors.taskFailed}${CONSTANTS.MESSAGES.ERRORS.INITIAL_SETUP}: ${error.message}${colors.reset}`
    );
    await new Promise((resolve) => setTimeout(resolve, CONSTANTS.DELAYS.MAX));
    return runAccountFlow(jwt, proxy);
  }
};

/*const runAccountFlow = async (jwt, proxy) => {
  const createHeaders = () => ({
    Authorization: `Bearer ${jwt}`,
    "Content-Type": "application/json",
    Origin: "chrome-extension://pjlappmodaidbdjhmhifbnnmmkkicjoc",
    "Content-Length": 18,
  });

  const apiEndpoint = CONSTANTS.API.ENDPOINTS;
  let username = jwt.substr(0, 10) + "...";

  // Function to extract the IP from the proxy string
  const extractProxyIP = (proxy) => {
    const match = proxy.match(/^https?:\/\/(?:.*@)?([^:]+):\d+/);
    if (match) {
      return match[1]; // Return the IP part
    }
    return proxy; // If it's not in the expected format, return the proxy as is
  };

  try {
    const agent = getProxyAgent(proxy);
    const proxyIP = extractProxyIP(proxy); // Get the IP of the proxy

    // Adding color to the proxy IP (you can customize this color code)
    const coloredProxyIP = `${colors.proxy}${proxyIP}${colors.reset}`;

    const userDetailsResponse = await fetch(
      CONSTANTS.API.BASE_URL + apiEndpoint.USER_DETAILS,
      {
        method: "GET",
        headers: createHeaders(),
        agent,
      }
    );

    if (!userDetailsResponse.ok) {
      throw new Error(
        `Failed to fetch user details: ${userDetailsResponse.status}`
      );
    }

    const userDetails = await userDetailsResponse.json();

    username = userDetails.data.username;
    logger.info(
      `${colors.accountName}[${username}]${colors.reset} ${CONSTANTS.MESSAGES.INFO.CONNECTED}`
    );

    while (true) {
      try {
        const delay = getRandomDelay();
        await new Promise((resolve) => setTimeout(resolve, delay));

        const widgetConnectResponse = await fetch(
          CONSTANTS.API.BASE_URL + apiEndpoint.WIDGET_CONNECT,
          {
            method: "POST",
            headers: createHeaders(),
            body: JSON.stringify({ connected: true }),
            agent,
          }
        );

        if (!widgetConnectResponse.ok) {
          throw new Error(
            `Failed to post widget connect: ${widgetConnectResponse.status}`
          );
        }

        const earningsResponse = await fetch(
          CONSTANTS.API.BASE_URL + apiEndpoint.EPOCH_EARNINGS,
          {
            method: "GET",
            headers: createHeaders(),
            agent,
          }
        );

        if (!earningsResponse.ok) {
          throw new Error(
            `Failed to fetch earnings: ${earningsResponse.status}`
          );
        }

        const earningsData = await earningsResponse.json();
        const formattedEarnings = formatNumber(earningsData.data.earnings);

        logger.success(
          `${colors.accountName}[${username}]${colors.reset} ${CONSTANTS.MESSAGES.INFO.CONNECTED} | ${colors.taskComplete}${CONSTANTS.MESSAGES.LOG_FORMAT.EARNINGS}: ${formattedEarnings}${colors.reset} (${colors.accountInfo}${CONSTANTS.MESSAGES.LOG_FORMAT.EPOCH}: ${earningsData.data.epoch}${colors.reset}) | Proxy: ${colors.accountInfo}${ProxyIP}`
        );
      } catch (error) {
        logger.error(
          `${colors.accountName}[${username}]${colors.reset} ${colors.taskFailed}${CONSTANTS.MESSAGES.LOG_FORMAT.ERROR}: ${error.message}${colors.reset}`
        );
        await new Promise((resolve) =>
          setTimeout(resolve, CONSTANTS.DELAYS.MIN)
        );
      }
    }
  } catch (error) {
    logger.error(
      `${colors.accountName}[${username}]${colors.reset} ${colors.taskFailed}${CONSTANTS.MESSAGES.ERRORS.INITIAL_SETUP}: ${error.message}${colors.reset}`
    );
    await new Promise((resolve) => setTimeout(resolve, CONSTANTS.DELAYS.MAX));
    return runAccountFlow(jwt, proxy);
  }
};*/


const main = async () => {
  displayBanner();

  const jwts = readFile(CONSTANTS.FILES.JWT_PATH);
  const proxies = readFile(CONSTANTS.FILES.PROXY_PATH);

  logger.info(
    `${CONSTANTS.MESSAGES.INFO.FOUND_ACCOUNTS} ${colors.accountInfo}${jwts.length}${colors.reset} ${CONSTANTS.MESSAGES.INFO.ACCOUNTS}`
  );

  if (jwts.length === 0) {
    logger.error(CONSTANTS.MESSAGES.ERRORS.NO_JWT);
    process.exit(1);
  }

  if (proxies.length === 0) {
    logger.error(CONSTANTS.MESSAGES.ERRORS.NO_PROXY);
    process.exit(1);
  }

  const accountPromises = jwts.map((jwt, index) => {
    const proxy = proxies[index % proxies.length]; // Rotate proxies
    return runAccountFlow(jwt, proxy);
  });

  await Promise.all(accountPromises);
};

process.on("uncaughtException", (error) => {
  logger.error(`${CONSTANTS.MESSAGES.ERRORS.UNCAUGHT}: ${error.message}`);
});

process.on("unhandledRejection", (error) => {
  logger.error(`${CONSTANTS.MESSAGES.ERRORS.UNHANDLED}: ${error.message}`);
});

main().catch((error) => logger.error(error.message));
