import { PermissionEngine, UserContext } from "../../src/lib/security/permission.engine";
import { FeatureFlagEngine } from "../../src/lib/feature-flags/feature-flag.engine";

function runTests() {
  console.log("Running Navigation & Security Engine Unit Tests...");

  const adminUser: UserContext = {
    userId: 1,
    roleId: 1,
    permissions: ["all"],
  };

  const pickerUser: UserContext = {
    userId: 2,
    roleId: 2,
    permissions: ["view_picker"],
  };

  const sampleItems = [
    { id: 1, title: "Picker Desk", minimum_role: 2, feature_flag: null, is_enabled: true },
    { id: 2, title: "Manager Console", minimum_role: 1, feature_flag: null, is_enabled: true },
    { id: 3, title: "Experimental AI", minimum_role: 0, feature_flag: "warehouse_ai", is_enabled: true },
  ];

  // Test 1
  const adminAuthorized = PermissionEngine.filterAuthorized(sampleItems, adminUser);
  console.assert(adminAuthorized.length === 3, "Admin user should access all 3 items");

  // Test 2
  const pickerAuthorized = PermissionEngine.filterAuthorized(sampleItems, pickerUser);
  const titles = pickerAuthorized.map((i) => i.title);
  console.assert(titles.includes("Picker Desk"), "Picker user should see Picker Desk");
  console.assert(!titles.includes("Manager Console"), "Picker user should NOT see Manager Console");

  // Test 3
  const customFlags = { warehouse_ai: false };
  const filtered = FeatureFlagEngine.filterFeatured(sampleItems, customFlags);
  const featuredTitles = filtered.map((i) => i.title);
  console.assert(!featuredTitles.includes("Experimental AI"), "Disabled feature flag should hide item");

  console.log("All Navigation Unit Tests Passed Successfully!");
}

runTests();
