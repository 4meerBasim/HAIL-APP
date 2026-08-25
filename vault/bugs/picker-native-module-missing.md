# Native pickers are not in Expo Go

Status: fixed
Found: `src/components/TimePicker.tsx`
Summary: `@react-native-picker/picker` rendered three unresolved-native-component error boxes — one per wheel — because Expo Go for SDK 57 does not carry it.

## Details
It appears in `node_modules/expo/bundledNativeModules.json` at 2.11.4, and `@react-native-community/datetimepicker` at 9.1.0. That file is Expo's **version pinning** list, not a guarantee the module is compiled into the Expo Go binary — trusting it was the mistake.

Reverted to the JS wheel and uninstalled the package. `expo-haptics` stays: it is a first-party Expo module and is in Expo Go.

Rule written into `docs/never-do.md`.

## Related
- Page: [[plan-builder]]
- Feature: [[time-picker]]
