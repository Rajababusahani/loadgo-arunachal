import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

const checks = [
  {
    name: "Backend env file",
    type: "file",
    path: path.join(root, "apps", "api", ".env")
  },
  {
    name: "Customer app env file",
    type: "file",
    path: path.join(root, "apps", "customer-mobile", ".env")
  },
  {
    name: "Driver app env file",
    type: "file",
    path: path.join(root, "apps", "driver-mobile", ".env")
  },
  {
    name: "Customer Firebase config",
    type: "file",
    path: path.join(root, "apps", "customer-mobile", "google-services.json")
  },
  {
    name: "Driver Firebase config",
    type: "file",
    path: path.join(root, "apps", "driver-mobile", "google-services.json")
  }
];

const requiredApiEnv = [
  "MONGODB_URI",
  "FIREBASE_PROJECT_ID",
  "FIREBASE_CLIENT_EMAIL",
  "FIREBASE_PRIVATE_KEY",
  "FIREBASE_DATABASE_URL",
  "GOOGLE_MAPS_API_KEY",
  "RAZORPAY_KEY_ID",
  "RAZORPAY_KEY_SECRET",
  "CLOUDINARY_CLOUD_NAME",
  "CLOUDINARY_API_KEY",
  "CLOUDINARY_API_SECRET"
];

const requiredCustomerEnv = ["EXPO_PUBLIC_API_URL"];
const requiredDriverEnv = ["EXPO_PUBLIC_API_URL"];
const requiredAdminEnv = ["VITE_API_URL", "VITE_ADMIN_TOKEN"];

function parseEnv(filePath) {
  if (!fs.existsSync(filePath)) {
    return {};
  }

  return Object.fromEntries(
    fs
      .readFileSync(filePath, "utf8")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#") && line.includes("="))
      .map((line) => {
        const index = line.indexOf("=");
        return [line.slice(0, index), line.slice(index + 1)];
      })
  );
}

function missingKeys(values, keys) {
  return keys.filter((key) => {
    const value = values[key];
    return !value || value === "https://your-api.onrender.com";
  });
}

const results = [];
for (const check of checks) {
  results.push({
    label: check.name,
    ok: fs.existsSync(check.path),
    detail: check.path
  });
}

const apiEnv = parseEnv(path.join(root, "apps", "api", ".env"));
const customerEnv = parseEnv(path.join(root, "apps", "customer-mobile", ".env"));
const driverEnv = parseEnv(path.join(root, "apps", "driver-mobile", ".env"));
const adminEnv = parseEnv(path.join(root, "apps", "admin-web", ".env"));

for (const [label, values, keys] of [
  ["Backend env values", apiEnv, requiredApiEnv],
  ["Customer app env values", customerEnv, requiredCustomerEnv],
  ["Driver app env values", driverEnv, requiredDriverEnv],
  ["Admin web env values", adminEnv, requiredAdminEnv]
]) {
  const missing = missingKeys(values, keys);
  results.push({
    label,
    ok: missing.length === 0,
    detail: missing.length ? `Missing: ${missing.join(", ")}` : "Complete"
  });
}

const hasFailures = results.some((item) => !item.ok);
console.log("LoadGo Arunachal preflight check\n");
for (const item of results) {
  console.log(`${item.ok ? "[OK]" : "[MISSING]"} ${item.label}`);
  console.log(`  ${item.detail}`);
}

if (hasFailures) {
  console.log("\nProject is not ready for full production deployment yet.");
  process.exitCode = 1;
} else {
  console.log("\nProject is ready for production deployment.");
}
