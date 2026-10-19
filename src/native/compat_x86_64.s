// ============================================================
//  Handbook — x86_64 Swift Compatibility Shim for macOS Backdeploy
//  Allows compilation targeting macOS 10.15 Catalina and macOS 11 Big Sur
//  on Apple Silicon build hosts without missing library symbol errors.
// ============================================================

.globl __swift_FORCE_LOAD_$_swiftCompatibility50
.globl __swift_FORCE_LOAD_$_swiftCompatibility51
.globl __swift_FORCE_LOAD_$_swiftCompatibility56
.globl __swift_FORCE_LOAD_$_swiftCompatibilityConcurrency
.globl __swift_FORCE_LOAD_$_swiftCompatibilityPacks
.globl __swift_FORCE_LOAD_$_swiftCompatibilityDynamicReplacements

.data
.p2align 2
__swift_FORCE_LOAD_$_swiftCompatibility50: .long 0
__swift_FORCE_LOAD_$_swiftCompatibility51: .long 0
__swift_FORCE_LOAD_$_swiftCompatibility56: .long 0
__swift_FORCE_LOAD_$_swiftCompatibilityConcurrency: .long 0
__swift_FORCE_LOAD_$_swiftCompatibilityPacks: .long 0
__swift_FORCE_LOAD_$_swiftCompatibilityDynamicReplacements: .long 0
