import { OpenLogApiClient } from "./api-client.js";
import { openBrowser } from "./browser.js";
import { writeAuthFile } from "./auth-store.js";
import {
  banner,
  box,
  createSpinner,
  dim,
  heading,
  kv,
  success,
} from "./cli-ui.js";

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
      refreshToken: string;
      refreshExpiresIn: number;
    };

export async function login(
  options: { showBanner?: boolean } = {},
): Promise<void> {
  const apiClient = new OpenLogApiClient();
  const deviceLogin = await apiClient.post<DeviceStartResponse>(
    "/auth/device/start",
  );
  const opened = openBrowser(deviceLogin.verificationUriComplete);

  if (options.showBanner !== false) {
    console.log(banner());
    console.log("");
  }
  console.log(heading("Authorize this terminal"));
  console.log("");
  console.log(dim("Approval code"));
  console.log(box(deviceLogin.userCode));
  console.log("");
  console.log(kv("URL", deviceLogin.verificationUriComplete));
  console.log("");
  console.log(
    opened
      ? dim("Opened the approval page in your browser.")
      : dim("Open the URL above in your browser."),
  );

  const spinner = createSpinner("Waiting for approval...");

  try {
    const tokens = await pollForTokens(apiClient, deviceLogin);
    await writeAuthFile(tokens);
    spinner.stop(success("Login successful. You can return to the terminal."));
  } catch (error) {
    spinner.stop();
    throw error;
  }
}

async function pollForTokens(
  apiClient: OpenLogApiClient,
  deviceLogin: DeviceStartResponse,
): Promise<Extract<DeviceTokenResponse, { status: "APPROVED" }>> {
  const deadline = Date.now() + deviceLogin.expiresIn * 1000;
  let interval = deviceLogin.interval;

  while (Date.now() < deadline) {
    await sleep(interval * 1000);

    const response = await apiClient.post<DeviceTokenResponse>(
      "/auth/device/token",
      { deviceCode: deviceLogin.deviceCode },
    );

    if (response.status === "APPROVED") {
      return response;
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
