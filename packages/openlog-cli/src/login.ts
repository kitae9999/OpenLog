import { OpenLogApiClient } from "./api-client.js";
import { openBrowser } from "./browser.js";
import { writeAuthFile } from "./auth-store.js";

type DeviceStartResponse = {
  deviceCode: string;
  userCode: string;
  verificationUri: string;
  verificationUriComplete: string;
  expiresIn: number;
  interval: number;
};

type DeviceTokenResponse =
  | {
      status: "PENDING";
      interval?: number;
    }
  | {
      status: "APPROVED";
      accessToken: string;
      expiresIn: number;
    };

export async function login(): Promise<void> {
  const apiClient = new OpenLogApiClient();
  const deviceLogin = await apiClient.post<DeviceStartResponse>(
    "/auth/device/start",
  );
  const opened = openBrowser(deviceLogin.verificationUriComplete);

  console.log("OpenLog CLI login");
  console.log("");
  console.log(`Code: ${deviceLogin.userCode}`);
  console.log(`URL:  ${deviceLogin.verificationUriComplete}`);
  console.log("");
  console.log(
    opened
      ? "The approval page was opened in your browser."
      : "Open the URL above in your browser.",
  );
  console.log("Waiting for approval...");

  const accessToken = await pollForAccessToken(apiClient, deviceLogin);
  await writeAuthFile(accessToken);

  console.log("Login successful.");
}

async function pollForAccessToken(
  apiClient: OpenLogApiClient,
  deviceLogin: DeviceStartResponse,
): Promise<string> {
  const deadline = Date.now() + deviceLogin.expiresIn * 1000;
  let interval = deviceLogin.interval;

  while (Date.now() < deadline) {
    await sleep(interval * 1000);

    const response = await apiClient.post<DeviceTokenResponse>(
      "/auth/device/token",
      { deviceCode: deviceLogin.deviceCode },
    );

    if (response.status === "APPROVED") {
      return response.accessToken;
    }

    interval = response.interval ?? interval;
  }

  throw new Error("CLI login expired before approval completed.");
}

function sleep(milliseconds: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}

