# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: production/battlefield.spec.ts >> built battlefield loads its exact approved battle page and preserves real manual abilities and saved outcomes without development hooks
- Location: tests/production/battlefield.spec.ts:9:1

# Error details

```
Error: locator.screenshot: Target crashed 
Call log:
  - taking element screenshot
  - waiting for fonts to load...
  - fonts loaded
  - attempting scroll into view action
    - waiting for element to be stable

```

```
Error: browserContext.close: Test ended.
Browser logs:

<launching> /home/telephoneheater/.cache/ms-playwright/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell --disable-field-trial-config --disable-background-networking --disable-background-timer-throttling --disable-backgrounding-occluded-windows --disable-back-forward-cache --disable-breakpad --disable-client-side-phishing-detection --disable-component-extensions-with-background-pages --disable-component-update --no-default-browser-check --disable-default-apps --disable-dev-shm-usage --disable-edgeupdater --disable-extensions --disable-features=AvoidUnnecessaryBeforeUnloadCheckSync,DestroyProfileOnBrowserClose,DialMediaRouteProvider,GlobalMediaControls,HttpsUpgrades,LensOverlay,MediaRouter,PaintHolding,ThirdPartyStoragePartitioning,BlockOriginHeaderModificationOnRedirect,Translate,AutoDeElevate,OptimizationHints,msForceBrowserSignIn,msEdgeUpdateLaunchServicesPreferredVersion --enable-features=CDPScreenshotNewSurface --allow-pre-commit-input --disable-hang-monitor --disable-ipc-flooding-protection --disable-popup-blocking --disable-prompt-on-repost --disable-renderer-backgrounding --disable-updater-scheduler --force-color-profile=srgb --metrics-recording-only --no-first-run --password-store=basic --use-mock-keychain --no-service-autorun --export-tagged-pdf --disable-search-engine-choice-screen --unsafely-disable-devtools-self-xss-warnings --edge-skip-compat-layer-relaunch --disable-infobars --disable-search-engine-choice-screen --disable-sync --enable-unsafe-swiftshader --headless --hide-scrollbars --mute-audio --blink-settings=primaryHoverType=2,availableHoverTypes=2,primaryPointerType=4,availablePointerTypes=4 --no-sandbox --enable-unsafe-swiftshader --user-data-dir=/tmp/playwright_chromiumdev_profile-0OAd8W --remote-debugging-pipe --no-startup-window
<launched> pid=2142034
[pid=2142034][err] [1029/144707.870092:WARNING:components/dbus/xdg/portal.cc:126] Failed to register with org.freedesktop.host.portal.Registry
[pid=2142034][err] [1029/144707.952768:WARNING:sandbox/policy/linux/sandbox_linux.cc:405] InitializeSandbox() called with multiple threads in process gpu-process.
[pid=2142034][err] [1029/144708.774380:ERROR:gpu/command_buffer/service/gl_utils.cc:427] [.WebGL-0x1bc404679400]GL Driver Message (OpenGL, Performance, GL_CLOSE_PATH_NV, High): GPU stall due to ReadPixels
[pid=2142034][err] [1029/144708.855199:INFO:CONSOLE:0] "[.WebGL-0x1bc404679400]GL Driver Message (OpenGL, Performance, GL_CLOSE_PATH_NV, High): GPU stall due to ReadPixels", source: https://erikburdett.github.io/Theandril/ (0)
[pid=2142034][err] [1029/144708.857855:ERROR:gpu/command_buffer/service/gl_utils.cc:427] [.WebGL-0x1bc404679400]GL Driver Message (OpenGL, Performance, GL_CLOSE_PATH_NV, High): GPU stall due to ReadPixels
[pid=2142034][err] [1029/144708.888960:INFO:CONSOLE:0] "[.WebGL-0x1bc404679400]GL Driver Message (OpenGL, Performance, GL_CLOSE_PATH_NV, High): GPU stall due to ReadPixels", source: https://erikburdett.github.io/Theandril/ (0)
[pid=2142034][err] [1029/144708.892805:ERROR:gpu/command_buffer/service/gl_utils.cc:427] [.WebGL-0x1bc404679400]GL Driver Message (OpenGL, Performance, GL_CLOSE_PATH_NV, High): GPU stall due to ReadPixels
[pid=2142034][err] [1029/144708.920690:ERROR:gpu/command_buffer/service/gl_utils.cc:427] [.WebGL-0x1bc404679400]GL Driver Message (OpenGL, Performance, GL_CLOSE_PATH_NV, High): GPU stall due to ReadPixels (this message will no longer repeat)
[pid=2142034][err] [1029/144708.928728:INFO:CONSOLE:0] "[.WebGL-0x1bc404679400]GL Driver Message (OpenGL, Performance, GL_CLOSE_PATH_NV, High): GPU stall due to ReadPixels", source: https://erikburdett.github.io/Theandril/ (0)
[pid=2142034][err] [1029/144708.928818:INFO:CONSOLE:0] "[.WebGL-0x1bc404679400]GL Driver Message (OpenGL, Performance, GL_CLOSE_PATH_NV, High): GPU stall due to ReadPixels (this message will no longer repeat)", source: https://erikburdett.github.io/Theandril/ (0)
[pid=2142034][err] Received signal 11 SEGV_MAPERR 000000000000
[pid=2142034][err] #0 0x55ab20388a03 (/home/telephoneheater/.cache/ms-playwright/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell+0x46d1a02)
[pid=2142034][err] #1 0x55ab2317a6d4 (/home/telephoneheater/.cache/ms-playwright/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell+0x74c36d3)
[pid=2142034][err] #2 0x7f3411e3e6f0 (/usr/lib/libc.so.6+0x3e6ef)
[pid=2142034][err] #3 0x55ab22d0cc4b (/home/telephoneheater/.cache/ms-playwright/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell+0x7055c4a)
[pid=2142034][err] #4 0x55ab225000c4 (/home/telephoneheater/.cache/ms-playwright/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell+0x68490c3)
[pid=2142034][err] #5 0x55ab1db68c3e (/home/telephoneheater/.cache/ms-playwright/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell+0x1eb1c3d)
[pid=2142034][err] #6 0x55ab1db6d3cd (/home/telephoneheater/.cache/ms-playwright/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell+0x1eb63cc)
[pid=2142034][err] #7 0x55ab1efbe449 (/home/telephoneheater/.cache/ms-playwright/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell+0x3307448)
[pid=2142034][err] #8 0x55ab1efbdb76 (/home/telephoneheater/.cache/ms-playwright/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell+0x3306b75)
[pid=2142034][err] #9 0x55ab200ff2af (/home/telephoneheater/.cache/ms-playwright/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell+0x44482ae)
[pid=2142034][err] #10 0x55ab1ff1a1d6 (/home/telephoneheater/.cache/ms-playwright/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell+0x42631d5)
[pid=2142034][err] #11 0x55ab1ff1a35a (/home/telephoneheater/.cache/ms-playwright/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell+0x4263359)
[pid=2142034][err] #12 0x55ab1ff1e1c3 (/home/telephoneheater/.cache/ms-playwright/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell+0x42671c2)
[pid=2142034][err] #13 0x55ab1ff1a6e6 (/home/telephoneheater/.cache/ms-playwright/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell+0x42636e5)
[pid=2142034][err] #14 0x55ab1ff19c59 (/home/telephoneheater/.cache/ms-playwright/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell+0x4262c58)
[pid=2142034][err] #15 0x55ab20aa8009 (/home/telephoneheater/.cache/ms-playwright/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell+0x4df1008)
[pid=2142034][err] #16 0x55ab20aa9072 (/home/telephoneheater/.cache/ms-playwright/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell+0x4df2071)
[pid=2142034][err] #17 0x7f3411e27781 (/usr/lib/libc.so.6+0x27780)
[pid=2142034][err] #18 0x7f3411e278b9 (/usr/lib/libc.so.6+0x278b8)
[pid=2142034][err] #19 0x55ab20604c3a (/home/telephoneheater/.cache/ms-playwright/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell+0x494dc39)
[pid=2142034][err]   r8: 0000000000000004  r9: 0000000000000001 r10: 000038e400848fd0 r11: 000038e4003c4800
[pid=2142034][err]  r12: 0000000000000000 r13: 000038e4004ee6a0 r14: 000038e4003c6000 r15: 0000000000000001
[pid=2142034][err]   di: 0000000000000000  si: 000055ab27951a80  bp: 00007ffe0dec1310  bx: 0000000000000001
[pid=2142034][err]   dx: 70175b0000000000  ax: 000038e4005b1720  cx: 000055ab22b2db50  sp: 00007ffe0dec12c0
[pid=2142034][err]   ip: 000055ab22b2dc9c efl: 0000000000010206 cgf: 002b000000000033 erf: 0000000000000004
[pid=2142034][err]  trp: 000000000000000e msk: 0000000000000000 cr2: 0000000000000000
[pid=2142034][err] [end of stack trace]
```