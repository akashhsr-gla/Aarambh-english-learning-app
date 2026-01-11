# 16 KB Page Size Support - Fix Guide

## ⚠️ Status: NOT FIXED YET

Your app targets Android 15 (API 35), which **requires** 16 KB page size support starting November 1, 2025.

## What This Means

- **Deadline**: November 1, 2025 (enforced)
- **Impact**: You **cannot release app updates** without 16 KB support
- **Extension Available**: You can request extension until May 31, 2026

## Why This Matters

Newer Android devices use 16 KB memory page sizes instead of the traditional 4 KB. Your app's native libraries (`.so` files) must be compatible with this.

## Solution Steps

### Step 1: Update Build Configuration

Add 16 KB page size support to your `android/app/build.gradle`:

```groovy
android {
    // ... existing config ...
    
    defaultConfig {
        // ... existing config ...
        
        // Add 16 KB page size support
        ndk {
            abiFilters 'armeabi-v7a', 'arm64-v8a', 'x86', 'x86_64'
        }
    }
    
    // Ensure proper alignment for 16 KB pages
    packagingOptions {
        jniLibs {
            useLegacyPackaging false
        }
    }
}
```

### Step 2: Verify Native Dependencies

Your app uses these native libraries that need 16 KB support:
- **Hermes** (JavaScript engine) - React Native 0.79.5 should support this
- **React Native** native modules
- **Expo** native modules
- **react-native-webrtc** - May need update
- **react-native-razorpay** - Check for 16 KB compatible version

### Step 3: Update Dependencies

1. **Ensure you're on latest Expo SDK 53** (you are ✅)
2. **Check React Native version**: You're on 0.79.5 - verify 16 KB support
3. **Update native dependencies**:
   ```bash
   npm update react-native-webrtc
   npm update react-native-razorpay
   ```

### Step 4: Build with 16 KB Support

When building your app bundle:

1. **Using EAS Build** (recommended):
   ```bash
   eas build --platform android --profile production
   ```
   EAS should handle 16 KB support automatically with latest Expo SDK.

2. **Local Build**:
   ```bash
   cd android
   ./gradlew bundleRelease
   ```

### Step 5: Test on 16 KB Device/Emulator

**Option A: Android Emulator (Recommended)**
1. Create Android 15 emulator with 16 KB page size
2. Install and test your app
3. Verify no crashes or memory issues

**Option B: Samsung Remote Test Lab**
- Use Samsung's Remote Test Lab for real device testing
- Configure for 16 KB page size

### Step 6: Verify in Google Play Console

After uploading your app bundle:
1. Go to **Release** → **Production** (or your track)
2. Click on your app bundle
3. Check **App Bundle Explorer**
4. Look for **"16 KB page size support"** indicator
5. Should show: ✅ **Supported**

## Quick Fix (If Using EAS Build)

If you're using EAS Build, the latest Expo SDK 53 should handle this automatically. Just:

1. **Update to latest Expo SDK 53**:
   ```bash
   npx expo install expo@latest
   ```

2. **Rebuild your app**:
   ```bash
   eas build --platform android --profile production
   ```

3. **Upload to Play Console** and verify 16 KB support

## Manual Configuration (If Needed)

If automatic support doesn't work, add to `android/app/build.gradle`:

```groovy
android {
    defaultConfig {
        // ... existing config ...
        
        // Force 16 KB page size alignment
        externalNativeBuild {
            cmake {
                arguments "-DANDROID_PAGE_SIZE=16384"
            }
        }
    }
}
```

## Verification Checklist

- [ ] Updated to latest Expo SDK 53
- [ ] Updated React Native to latest 0.79.x
- [ ] Updated native dependencies (webrtc, razorpay)
- [ ] Built new app bundle with 16 KB support
- [ ] Tested on 16 KB emulator/device
- [ ] Verified in Play Console App Bundle Explorer
- [ ] Uploaded new release to Play Console

## Important Notes

1. **Expo SDK 53** should have 16 KB support, but verify with latest patch version
2. **React Native 0.79.5** - Check if 0.79.6+ has better 16 KB support
3. **Third-party native libraries** may need updates
4. **Test thoroughly** - 16 KB issues can cause crashes

## If You Need More Time

You can request an extension:
1. Go to Google Play Console
2. Find the 16 KB page size warning
3. Click "Request Extension"
4. You'll have until **May 31, 2026** to comply

## Next Steps

1. **Immediate**: Update Expo SDK and rebuild
2. **Test**: Verify on 16 KB emulator
3. **Upload**: Submit new bundle to Play Console
4. **Verify**: Check App Bundle Explorer for 16 KB support

---

**Last Updated**: Based on November 1, 2025 enforcement date

