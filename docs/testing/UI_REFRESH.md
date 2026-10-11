# Deposit experience refresh — 11 October 2026

## Bank directory

The offline catalog in `src/data/banks.ts` was checked against [RBI Banks in India](https://www.rbi.org.in/commonman/English/Scripts/BanksInIndia.aspx) and the [DFS regional rural bank directory](https://financialservices.gov.in/list-rrbs-functioning-country) on 11 October 2026. It contains 12 public-sector, 21 private-sector, 11 small-finance, 28 regional rural, and 44 foreign banks. RBI's current named small-finance entries include slice; the former North East name is a search alias. Legal suffixes are omitted from display names.

The catalog identifies institutions, not available products, rates, or deposit recommendations. Payments banks are excluded. Cooperative and other unlisted banks can be entered manually. No network lookup, bank artwork, bank branding fonts, or new permissions are required by the picker.

When updating the directory, retain stable IDs, verify names against the linked official sources, update `verifiedOn`, and reconcile category-count tests. Never rewrite saved deposit bank names as part of a directory update. Previously used names remain selectable even when absent from the catalog.

## Automated validation

- Full Jest suite: 426 tests in 24 suites passed.
- TypeScript and ESLint: no errors.
- Directory tests cover uniqueness, category coverage, aliases, abbreviations, custom names, and previously-used ordering.
- Picker tests cover both themes, search, selection, manual validation, trimming, cancellation, and reuse.
- Screen/provider tests cover FD/RD picker integration, add actions, heading icons, Back/notifications, filter reset, and separate incoming/outgoing activity.
- Selector tests cover active-only summaries independent of filters, abbreviation searches, tenure/installment progress, and inactive-date wording.
- Real SQLite plus backup round-trip test preserves custom and legacy bank names for both FD and RD.

## Android review

Reviewed on the connected 720 × 1520 Android device (360 dp wide), using the existing saved portfolio without saving test deposits. Checks include dark-mode Portfolio and Add FD headers, text bank badges, previously-used bank ordering, ICICI abbreviation search with the keyboard open, and Portfolio at 1.3 font scale in light and dark themes. The review prompted safe-area padding in the bank picker and bounded single-line bottom-navigation labels. Screenshots are local artifacts under the ignored `build/ui-refresh/` directory.

Changing the Android system font scale exposed a native fragment-restoration crash. The main activity now installs `RNScreensFragmentFactory` before `super.onCreate`, following the installed react-native-screens setup instructions. The debug Android build passes; the rebuilt APK opens with saved portfolio data after changing the system font scale. See BUG-009 in BUG_REPORT.md.

iOS device testing and store submission are outside this verification run.
