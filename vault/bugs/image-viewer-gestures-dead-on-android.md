# Photo viewer gestures dead on Android

Status: fixed
Found: `src/components/ImageViewer.tsx`
Summary: The viewer's pinch, pan and double-tap handlers sat in an RN `Modal`, which on Android is a separate native root outside the app's `GestureHandlerRootView`.

## Details
The modal content is wrapped in its own `GestureHandlerRootView`. The same root also sets `direction` from the language, as `Dialog` does, so the close button follows a mid-session switch. Unverified on an Android device.

## Related
- Page: [[dish-detail]], [[box-detail]]
